import os
import random

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .roles import ROLES, suggest_roles, has_special_roles
from .rooms import manager, gen_id

app = FastAPI(title="Le Village Maudit")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # resserre à ton domaine une fois en prod si besoin
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateRoomBody(BaseModel):
    role_pool: list[str]


class JoinBody(BaseModel):
    pseudo: str


@app.get("/api/roles")
def get_roles():
    return {"roles": ROLES}


@app.get("/api/suggest/{n}")
def get_suggestion(n: int):
    return {"rolePool": suggest_roles(n)}


@app.post("/api/rooms")
def create_room(body: CreateRoomBody):
    if not body.role_pool or len(body.role_pool) < 3:
        raise HTTPException(400, "Il faut au moins 3 cartes.")
    for rid in body.role_pool:
        if rid not in ROLES:
            raise HTTPException(400, f"Rôle inconnu: {rid}")
    room = manager.create_room(body.role_pool)
    return {"code": room.code, "hostToken": room.host_token}


@app.get("/api/rooms/{code}")
def get_room(code: str):
    room = manager.get(code)
    if not room:
        raise HTTPException(404, "Salle introuvable.")
    return room.to_state()


@app.post("/api/rooms/{code}/join")
def join_room(code: str, body: JoinBody):
    room = manager.get(code)
    if not room:
        raise HTTPException(404, "Salle introuvable.")
    pseudo = body.pseudo.strip()
    if not pseudo:
        raise HTTPException(400, "Pseudo requis.")
    existing = room.find_player(pseudo)
    if existing:
        return {"playerId": existing["id"], "room": room.to_state()}
    if room.status != "lobby":
        raise HTTPException(409, "La partie a déjà commencé.")
    player = {"id": gen_id(), "pseudo": pseudo, "role_id": None, "alive": True}
    room.players.append(player)
    return {"playerId": player["id"], "room": room.to_state()}


@app.websocket("/ws/{code}")
async def ws_room(websocket: WebSocket, code: str):
    room = manager.get(code)
    if not room:
        await websocket.close(code=4404)
        return
    await websocket.accept()
    await manager.register(code, websocket)
    await websocket.send_json({"type": "state", "room": room.to_state()})

    try:
        while True:
            msg = await websocket.receive_json()
            action = msg.get("type")

            if action == "launch":
                if msg.get("hostToken") != room.host_token:
                    continue
                if not room.players or room.status != "lobby":
                    continue
                shuffled = room.role_pool[:]
                random.shuffle(shuffled)
                for i, p in enumerate(room.players):
                    p["role_id"] = shuffled[i] if i < len(shuffled) else None
                    p["alive"] = True
                room.status = "playing"
                room.winner = None

            elif action == "declare_death":
                player = room.find_player_by_id(msg.get("playerId", ""))
                if player:
                    player["alive"] = False
                    room.compute_winner()

            elif action == "toggle_alive":
                if msg.get("hostToken") != room.host_token:
                    continue
                player = room.find_player_by_id(msg.get("playerId", ""))
                if player:
                    player["alive"] = not player["alive"]
                    room.compute_winner()

            elif action == "kick":
                if msg.get("hostToken") != room.host_token:
                    continue
                room.players = [p for p in room.players if p["id"] != msg.get("playerId")]

            elif action == "manual_win":
                if msg.get("hostToken") != room.host_token:
                    continue
                if msg.get("camp") in ("vampires", "villageois", "maudits"):
                    room.winner = msg["camp"]
                    room.status = "ended"

            elif action == "reset":
                if msg.get("hostToken") != room.host_token:
                    continue
                room.status = "lobby"
                room.winner = None
                for p in room.players:
                    p["role_id"] = None
                    p["alive"] = True

            elif action == "has_special":
                await websocket.send_json({"type": "special", "value": has_special_roles(room.role_pool)})
                continue

            await manager.broadcast(code)

    except WebSocketDisconnect:
        manager.unregister(code, websocket)


# --- Service du frontend buildé (dossier frontend/dist copié ici au build) ---
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
