import Peer from "peerjs";

// Espace de nommage pour éviter les collisions avec d'autres apps sur le
// serveur de signalisation public PeerJS (les identifiants sont globaux).
const APP_PREFIX = "vilmaudit-";
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genCode() {
  let s = "";
  for (let i = 0; i < 5; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

export function genId() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

function attachAutoReconnect(peer) {
  peer.on("disconnected", () => {
    if (!peer.destroyed) peer.reconnect();
  });
}

// Crée un peer hôte avec un identifiant court basé sur un code de salle.
// Réessaie avec un nouveau code en cas de collision d'identifiant.
export function createHostPeer() {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryOnce = () => {
      attempts += 1;
      const code = genCode();
      const peer = new Peer(APP_PREFIX + code);

      const onOpen = () => {
        cleanup();
        attachAutoReconnect(peer);
        resolve({ peer, code });
      };
      const onError = (err) => {
        if (err?.type === "unavailable-id" && attempts < 8) {
          cleanup();
          peer.destroy();
          tryOnce();
        } else {
          cleanup();
          reject(err);
        }
      };
      const cleanup = () => {
        peer.off("open", onOpen);
        peer.off("error", onError);
      };

      peer.on("open", onOpen);
      peer.on("error", onError);
    };

    tryOnce();
  });
}

// Ouvre une connexion peer-to-peer directe vers l'hôte d'une salle.
export function connectToHost(code) {
  return new Promise((resolve, reject) => {
    const peer = new Peer();
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      peer.destroy();
      reject(err);
    };

    const timeout = setTimeout(
      () => fail(new Error("Connexion au serveur d'appairage impossible.")),
      10000
    );

    peer.on("open", () => {
      attachAutoReconnect(peer);
      const conn = peer.connect(APP_PREFIX + code.trim().toUpperCase(), { reliable: true });
      conn.on("open", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ peer, conn });
      });
      conn.on("error", fail);
    });

    peer.on("error", (err) => {
      if (err?.type === "peer-unavailable") {
        fail(new Error("Salle introuvable."));
      } else {
        fail(err);
      }
    });
  });
}
