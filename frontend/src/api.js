import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = ""; // même origine (le backend sert aussi le frontend)
const WS_BASE = (() => {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
})();

export async function fetchRoles() {
  const res = await fetch(`${API_BASE}/api/roles`);
  return (await res.json()).roles;
}

export async function fetchSuggestion(n) {
  const res = await fetch(`${API_BASE}/api/suggest/${n}`);
  return (await res.json()).rolePool;
}

export async function createRoom(rolePool) {
  const res = await fetch(`${API_BASE}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role_pool: rolePool }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Erreur");
  return res.json(); // { code, hostToken }
}

export async function joinRoom(code, pseudo) {
  const res = await fetch(`${API_BASE}/api/rooms/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pseudo }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Erreur");
  return res.json(); // { playerId, room }
}

/**
 * Hook maintenant une connexion WebSocket ouverte sur une salle.
 * Reconnecte automatiquement si la connexion tombe.
 */
export function useRoomSocket(code) {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(null);

  const connect = useCallback(() => {
    if (!code) return;
    const ws = new WebSocket(`${WS_BASE}/ws/${code}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      retryRef.current = setTimeout(connect, 1500);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === "state") setRoom(msg.room);
    };
  }, [code]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  return { room, connected, send };
}
