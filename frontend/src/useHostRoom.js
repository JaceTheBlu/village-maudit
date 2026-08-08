import { useCallback, useRef, useState } from "react";
import { createHostPeer, genId } from "./peer";
import { createRoomState, computeWinner, toPublicState } from "./hostRoom";

// Fait tourner l'hôte comme "serveur" : la salle vit en mémoire dans son
// navigateur, les autres joueurs s'y connectent directement en WebRTC.
export function useHostRoom() {
  const stateRef = useRef(null);
  const codeRef = useRef(null);
  const connsRef = useRef(new Map()); // playerId -> DataConnection
  const [room, setRoom] = useState(null);

  const broadcast = useCallback(() => {
    const pub = toPublicState(stateRef.current, codeRef.current);
    setRoom(pub);
    for (const conn of connsRef.current.values()) {
      if (conn.open) conn.send({ type: "state", room: pub });
    }
  }, []);

  const handleJoin = useCallback((conn, pseudo) => {
    const state = stateRef.current;
    pseudo = (pseudo || "").trim();
    if (!pseudo) return;

    let player = state.players.find((p) => p.pseudo.toLowerCase() === pseudo.toLowerCase());
    if (!player) {
      if (state.status !== "lobby") {
        conn.send({ type: "error", message: "La partie a déjà commencé." });
        return;
      }
      player = { id: genId(), pseudo, roleId: null, alive: true };
      state.players.push(player);
    }

    connsRef.current.set(player.id, conn);
    conn.send({ type: "joined", playerId: player.id, room: toPublicState(state, codeRef.current) });
    broadcast();
  }, [broadcast]);

  const wireConn = useCallback((conn) => {
    conn.on("data", (msg) => {
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "join") {
        handleJoin(conn, msg.pseudo);
      } else if (msg.type === "declare_death") {
        const player = stateRef.current.players.find((p) => p.id === msg.playerId);
        if (player) {
          player.alive = false;
          computeWinner(stateRef.current);
          broadcast();
        }
      }
    });
    conn.on("close", () => {
      for (const [playerId, c] of connsRef.current) {
        if (c === conn) connsRef.current.delete(playerId);
      }
    });
  }, [handleJoin, broadcast]);

  const create = useCallback((rolePool, customRoles = {}, campLabels) => {
    return createHostPeer().then(({ peer, code }) => {
      codeRef.current = code;
      stateRef.current = createRoomState(rolePool, customRoles, campLabels);
      peer.on("connection", wireConn);
      broadcast();
      return code;
    });
  }, [wireConn, broadcast]);

  const launch = useCallback(() => {
    const state = stateRef.current;
    if (!state.players.length || state.status !== "lobby") return;
    const shuffled = [...state.rolePool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    state.players.forEach((p, i) => {
      p.roleId = i < shuffled.length ? shuffled[i] : null;
      p.alive = true;
    });
    state.status = "playing";
    state.winner = null;
    broadcast();
  }, [broadcast]);

  const toggleAlive = useCallback((playerId) => {
    const player = stateRef.current.players.find((p) => p.id === playerId);
    if (player) {
      player.alive = !player.alive;
      computeWinner(stateRef.current);
      broadcast();
    }
  }, [broadcast]);

  const kick = useCallback((playerId) => {
    const state = stateRef.current;
    state.players = state.players.filter((p) => p.id !== playerId);
    const conn = connsRef.current.get(playerId);
    if (conn) {
      if (conn.open) conn.send({ type: "kicked" });
      connsRef.current.delete(playerId);
      conn.close();
    }
    broadcast();
  }, [broadcast]);

  const manualWin = useCallback((camp) => {
    const state = stateRef.current;
    state.winner = camp;
    state.status = "ended";
    broadcast();
  }, [broadcast]);

  const reset = useCallback(() => {
    const state = stateRef.current;
    state.status = "lobby";
    state.winner = null;
    state.players.forEach((p) => { p.roleId = null; p.alive = true; });
    broadcast();
  }, [broadcast]);

  return { room, create, launch, toggleAlive, kick, manualWin, reset };
}
