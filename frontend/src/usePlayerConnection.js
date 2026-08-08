import { useCallback, useRef, useState } from "react";
import { connectToHost } from "./peer";

const RETRY_DELAY_MS = 2000;
const JOIN_TIMEOUT_MS = 8000;

// Connexion d'un joueur vers l'hôte de la salle, avec reconnexion
// automatique (même pseudo) si la liaison WebRTC tombe en cours de partie.
export function usePlayerConnection() {
  const connRef = useRef(null);
  const sessionRef = useRef({ code: null, pseudo: null, joined: false });
  const retryTimerRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [connected, setConnected] = useState(false);

  const doConnect = useCallback((code, pseudo, handlers) => {
    connectToHost(code)
      .then(({ conn }) => {
        connRef.current = conn;
        conn.send({ type: "join", pseudo });

        conn.on("data", (msg) => {
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "joined") {
            sessionRef.current = { code, pseudo, joined: true };
            setPlayerId(msg.playerId);
            setRoom(msg.room);
            setConnected(true);
            handlers?.resolve?.(msg.playerId);
          } else if (msg.type === "state") {
            setRoom(msg.room);
          } else if (msg.type === "error") {
            handlers?.reject?.(new Error(msg.message));
          }
        });

        conn.on("close", () => {
          setConnected(false);
          if (sessionRef.current.joined) {
            retryTimerRef.current = setTimeout(
              () => doConnect(sessionRef.current.code, sessionRef.current.pseudo),
              RETRY_DELAY_MS
            );
          }
        });
      })
      .catch((err) => {
        if (handlers?.reject) {
          handlers.reject(err);
        } else {
          retryTimerRef.current = setTimeout(() => doConnect(code, pseudo), RETRY_DELAY_MS);
        }
      });
  }, []);

  const join = useCallback((code, pseudo) => {
    clearTimeout(retryTimerRef.current);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Le meneur de jeu ne répond pas.")),
        JOIN_TIMEOUT_MS
      );
      doConnect(code, pseudo, {
        resolve: (pid) => { clearTimeout(timeout); resolve(pid); },
        reject: (err) => { clearTimeout(timeout); reject(err); },
      });
    });
  }, [doConnect]);

  const send = useCallback((payload) => {
    if (connRef.current?.open) connRef.current.send(payload);
  }, []);

  return { room, playerId, connected, join, send };
}
