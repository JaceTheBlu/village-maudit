import random
import secrets
import string
import time
from typing import Dict, List, Optional

from fastapi import WebSocket

from .roles import role_camp


def gen_code() -> str:
    chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(random.choice(chars) for _ in range(5))


def gen_id() -> str:
    return secrets.token_hex(6)


class Room:
    def __init__(self, role_pool: List[str]):
        self.code = gen_code()
        self.host_token = secrets.token_hex(16)
        self.status = "lobby"  # lobby | playing | ended
        self.role_pool = role_pool
        self.players: List[dict] = []  # {id, pseudo, role_id, alive}
        self.winner: Optional[str] = None
        self.created_at = time.time()

    def find_player(self, pseudo: str) -> Optional[dict]:
        for p in self.players:
            if p["pseudo"].lower() == pseudo.lower():
                return p
        return None

    def find_player_by_id(self, player_id: str) -> Optional[dict]:
        for p in self.players:
            if p["id"] == player_id:
                return p
        return None

    def compute_winner(self):
        if self.status != "playing":
            return
        alive = [p for p in self.players if p["alive"]]
        if not alive:
            return
        vampires_alive = sum(1 for p in alive if role_camp(p["role_id"]) == "vampires")
        others_alive = len(alive) - vampires_alive
        if vampires_alive == 0:
            self.winner = "villageois"
            self.status = "ended"
        elif vampires_alive >= others_alive:
            self.winner = "vampires"
            self.status = "ended"

    def to_state(self) -> dict:
        return {
            "code": self.code,
            "status": self.status,
            "rolePool": self.role_pool,
            "players": [
                {"id": p["id"], "pseudo": p["pseudo"], "roleId": p["role_id"], "alive": p["alive"]}
                for p in self.players
            ],
            "winner": self.winner,
        }


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.connections: Dict[str, List[WebSocket]] = {}

    def create_room(self, role_pool: List[str]) -> Room:
        room = Room(role_pool)
        # avoid rare code collision
        while room.code in self.rooms:
            room.code = gen_code()
        self.rooms[room.code] = room
        self.connections[room.code] = []
        return room

    def get(self, code: str) -> Optional[Room]:
        return self.rooms.get(code.upper())

    async def register(self, code: str, ws: WebSocket):
        self.connections.setdefault(code, []).append(ws)

    def unregister(self, code: str, ws: WebSocket):
        if code in self.connections and ws in self.connections[code]:
            self.connections[code].remove(ws)

    async def broadcast(self, code: str):
        room = self.get(code)
        if not room:
            return
        state = room.to_state()
        dead = []
        for ws in self.connections.get(code, []):
            try:
                await ws.send_json({"type": "state", "room": state})
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.unregister(code, ws)


manager = RoomManager()
