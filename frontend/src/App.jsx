import React, { useState, useEffect, useCallback } from "react";
import { fetchRoles, fetchSuggestion, createRoom, joinRoom, useRoomSocket } from "./api";

/* ============================= UI HELPERS ============================= */

function Shell({ children }) {
  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      background: "radial-gradient(circle at 50% -10%, #2a1620 0%, #170d14 45%, #0b0608 100%)",
      color: "#EDE0D8", fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "calc(env(safe-area-inset-top) + 28px) calc(env(safe-area-inset-right) + 18px) calc(env(safe-area-inset-bottom) + 40px) calc(env(safe-area-inset-left) + 18px)",
      boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body {
          margin: 0; height: 100%; overscroll-behavior-y: none;
          -webkit-text-size-adjust: 100%;
        }
        .lg-title { font-family: 'Cinzel', serif; letter-spacing: 0.03em; }
        .lg-btn {
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px;
          border: none; border-radius: 12px; padding: 14px 20px; cursor: pointer;
          transition: transform .12s ease, filter .12s ease;
          touch-action: manipulation; user-select: none;
          min-height: 48px;
        }
        .lg-btn:active { transform: scale(0.97); }
        .lg-btn-primary { background: linear-gradient(135deg,#8C1F3B,#4E0F20); color: #FBE6E0; }
        .lg-btn-secondary { background: #241318; color: #EDE0D8; border: 1px solid #4A2A34; }
        .lg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lg-input {
          font-family: 'Inter', sans-serif; font-size: 16px; padding: 13px 14px;
          border-radius: 10px; border: 1px solid #4A2A34; background: #170d14; color: #EDE0D8;
          width: 100%; outline: none; touch-action: manipulation;
        }
        .lg-input:focus { border-color: #8C1F3B; }
        .lg-card {
          background: #1D1116; border: 1px solid #33202A; border-radius: 16px;
          padding: 18px; touch-action: manipulation;
        }
        ::selection { background: #8C1F3B55; }
        button, input { -webkit-appearance: none; appearance: none; }
        [style*="overflowY"] { -webkit-overflow-scrolling: touch; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 480 }}>{children}</div>
    </div>
  );
}

function MoonHeader({ subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 26 }}>
      <div style={{ fontSize: 40, marginBottom: 4 }}>🦇</div>
      <div className="lg-title" style={{ fontSize: 28, color: "#D89A4E" }}>Le Village Maudit</div>
      {subtitle && <div style={{ fontSize: 13, color: "#9A8088", marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

const CAMP_LABEL = { vampires: "🦇 Vampires", villageois: "🌾 Villageois", maudits: "🐾 Maudits" };

/* ============================= ACCUEIL ============================= */

function Home({ goHost, goJoin }) {
  return (
    <Shell>
      <MoonHeader subtitle="Distribution de cartes pour votre partie" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button className="lg-btn lg-btn-primary" onClick={goHost}>🕯️ Créer une partie (Meneur de Jeu)</button>
        <button className="lg-btn lg-btn-secondary" onClick={goJoin}>🚪 Rejoindre une partie</button>
      </div>
    </Shell>
  );
}

/* ============================= CRÉATION MJ ============================= */

function HostSetup({ roles, onCreated }) {
  const [count, setCount] = useState(9);
  const [pool, setPool] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { applySuggestion(9); }, []); // eslint-disable-line

  const applySuggestion = async (n) => {
    setCount(n);
    const suggestion = await fetchSuggestion(n);
    setPool(suggestion);
  };

  const changeQty = (id, delta) => {
    setPool(prev => {
      if (delta > 0) return [...prev, id];
      const idx = prev.indexOf(id);
      if (delta < 0 && idx !== -1) { const c = [...prev]; c.splice(idx, 1); return c; }
      return prev;
    });
  };

  const loupsCount = pool.filter(id => roles[id]?.camp === "vampires").length;
  const villageCount = pool.length - loupsCount;
  const ratio = pool.length ? loupsCount / pool.length : 0;
  const ratioWarning = pool.length >= 4 && (ratio < 0.2 || ratio > 0.4);

  const create = async () => {
    setCreating(true);
    setError("");
    try {
      const { code, hostToken } = await createRoom(pool);
      onCreated(code, hostToken);
    } catch (e) {
      setError(e.message);
    }
    setCreating(false);
  };

  return (
    <Shell>
      <MoonHeader subtitle="Composez le tirage de cartes" />

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#9A8088", marginBottom: 10 }}>GUIDE D'ÉQUILIBRAGE — nombre de joueurs attendu</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[6, 8, 9, 12, 15, 18].map(n => (
            <button key={n} onClick={() => applySuggestion(n)} className="lg-btn"
              style={{ padding: "8px 14px", fontSize: 14, background: count === n ? "#8C1F3B" : "#241318", border: "1px solid #4A2A34" }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#7A6068", marginTop: 10, lineHeight: 1.5 }}>
          Règle classique : environ 1 vampire pour 3 joueurs, minimum 6 joueurs conseillé.
        </div>
      </div>

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
          <span>🦇 Vampires : {loupsCount}</span>
          <span>🌾 Village : {villageCount}</span>
          <span style={{ color: "#9A8088" }}>Total : {pool.length}</span>
        </div>
        {ratioWarning && (
          <div style={{ fontSize: 12, color: "#D89A4E", marginBottom: 10 }}>
            ⚠️ Ratio de vampires inhabituel — vérifiez l'équilibrage avant de lancer.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
          {Object.entries(roles).map(([id, role]) => {
            const cnt = pool.filter(r => r === id).length;
            return (
              <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: cnt > 0 ? "#241318" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span>{role.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{role.nom}</div>
                    <div style={{ fontSize: 11, color: "#7A6068" }}>{role.camp}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => changeQty(id, -1)} disabled={cnt === 0} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #4A2A34", background: "#170d14", color: "#EDE0D8" }}>−</button>
                  <span style={{ minWidth: 14, textAlign: "center" }}>{cnt}</span>
                  <button onClick={() => changeQty(id, 1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #4A2A34", background: "#170d14", color: "#EDE0D8" }}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && <div style={{ color: "#E6A5A5", fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <button className="lg-btn lg-btn-primary" disabled={pool.length < 3 || creating} onClick={create}>
        {creating ? "Création…" : `Créer la salle (${pool.length} cartes)`}
      </button>
    </Shell>
  );
}

/* ============================= LOBBY MJ ============================= */

function HostLobby({ code, hostToken, roles, onLaunched }) {
  const { room, connected, send } = useRoomSocket(code);

  useEffect(() => {
    if (room?.status === "playing") onLaunched();
  }, [room?.status]); // eslint-disable-line

  if (!room) return <Shell><MoonHeader /><div>Connexion à la salle…</div></Shell>;

  const canLaunch = room.players.length > 0 && room.players.length <= room.rolePool.length;
  const shortage = room.rolePool.length - room.players.length;

  return (
    <Shell>
      <MoonHeader subtitle={connected ? "Salle d'attente" : "Reconnexion…"} />
      <div className="lg-card" style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#9A8088" }}>CODE DE LA SALLE</div>
        <div className="lg-title" style={{ fontSize: 40, letterSpacing: "0.15em", color: "#D89A4E" }}>{code}</div>
        <div style={{ fontSize: 12, color: "#7A6068", marginTop: 4 }}>{room.rolePool.length} cartes préparées</div>
      </div>

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#9A8088", marginBottom: 10 }}>
          JOUEURS CONNECTÉS ({room.players.length}/{room.rolePool.length})
        </div>
        {room.players.length === 0 && <div style={{ color: "#7A6068", fontSize: 14 }}>En attente de joueurs…</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {room.players.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#241318", borderRadius: 10, padding: "9px 12px" }}>
              <span>{p.pseudo}</span>
              <button onClick={() => send({ type: "kick", playerId: p.id, hostToken })}
                style={{ background: "none", border: "none", color: "#8C1F3B", fontSize: 12 }}>retirer</button>
            </div>
          ))}
        </div>
      </div>

      {shortage > 0 && room.players.length > 0 && (
        <div style={{ fontSize: 12, color: "#D89A4E", marginBottom: 12, textAlign: "center" }}>
          {shortage} carte(s) ne seront pas distribuées ce tour-ci.
        </div>
      )}

      <button className="lg-btn lg-btn-primary" disabled={!canLaunch}
        onClick={() => send({ type: "launch", hostToken })}>
        🌙 Lancer la partie
      </button>
    </Shell>
  );
}

/* ============================= REJOINDRE ============================= */

function Join({ onJoined }) {
  const [code, setCode] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const join = async () => {
    setError("");
    const c = code.trim().toUpperCase();
    const p = pseudo.trim();
    if (!c || !p) { setError("Code et pseudo requis."); return; }
    setBusy(true);
    try {
      const { playerId } = await joinRoom(c, p);
      onJoined(c, playerId);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <Shell>
      <MoonHeader subtitle="Rejoindre une salle" />
      <div className="lg-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="lg-input" placeholder="Code de la salle" value={code}
          onChange={e => setCode(e.target.value.toUpperCase())} maxLength={5} style={{ letterSpacing: "0.2em", textAlign: "center" }} />
        <input className="lg-input" placeholder="Ton pseudo" value={pseudo}
          onChange={e => setPseudo(e.target.value)} maxLength={20} />
        {error && <div style={{ color: "#E6A5A5", fontSize: 13 }}>{error}</div>}
        <button className="lg-btn lg-btn-primary" disabled={busy} onClick={join}>
          {busy ? "…" : "Entrer dans le village"}
        </button>
        <div style={{ fontSize: 11, color: "#7A6068", textAlign: "center" }}>
          En cas de rechargement de page, ressaisis le même pseudo pour retrouver ta carte.
        </div>
      </div>
    </Shell>
  );
}

/* ============================= VUE JOUEUR ============================= */

function PlayerGame({ code, playerId, roles }) {
  const { room, send } = useRoomSocket(code);
  const [flipped, setFlipped] = useState(false);

  if (!room) return <Shell><MoonHeader /><div>Connexion à la salle…</div></Shell>;

  const me = room.players.find(p => p.id === playerId);
  if (!me) return <Shell><MoonHeader /><div>Tu n'es plus dans cette partie.</div></Shell>;

  if (room.status === "lobby") {
    return (
      <Shell>
        <MoonHeader subtitle="En attente du Meneur de Jeu" />
        <div className="lg-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🕯️</div>
          <div>Bienvenue, <b>{me.pseudo}</b>.</div>
          <div style={{ color: "#9A8088", fontSize: 13, marginTop: 8 }}>La partie va bientôt commencer…</div>
        </div>
      </Shell>
    );
  }

  const role = roles[me.roleId];

  return (
    <Shell>
      <MoonHeader subtitle={me.pseudo} />

      {room.winner && (
        <div className="lg-card" style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 20 }}>{CAMP_LABEL[room.winner]} — Victoire</div>
        </div>
      )}

      {!me.alive ? (
        <div className="lg-card" style={{ textAlign: "center", opacity: 0.7 }}>
          <div style={{ fontSize: 34 }}>💀</div>
          <div style={{ marginTop: 8 }}>Tu es éliminé. Ton rôle était :</div>
          <div className="lg-title" style={{ fontSize: 22, marginTop: 6, color: "#D89A4E" }}>{role?.emoji} {role?.nom}</div>
        </div>
      ) : (
        <>
          <div className="lg-card" onClick={() => setFlipped(f => !f)}
            style={{ textAlign: "center", cursor: "pointer", padding: "34px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 54 }}>{role?.emoji}</div>
            <div className="lg-title" style={{ fontSize: 26, marginTop: 10, color: "#D89A4E" }}>{role?.nom}</div>
            <div style={{ fontSize: 11, color: "#7A6068", marginTop: 10 }}>
              {flipped ? "touche pour cacher" : "touche pour voir ton pouvoir"}
            </div>
            {flipped && (
              <div style={{ marginTop: 14, fontSize: 14, color: "#C9BDC2", lineHeight: 1.5, textAlign: "left" }}>
                {role?.desc}
                {role?.special && <div style={{ marginTop: 8, fontSize: 12, color: "#D89A4E" }}>ℹ️ {role.special}</div>}
              </div>
            )}
          </div>
          <button className="lg-btn" style={{ width: "100%", background: "#33141A", color: "#E6A5A5", border: "1px solid #6B1F30" }}
            onClick={() => send({ type: "declare_death", playerId })}>💀 Je suis mort</button>
        </>
      )}
    </Shell>
  );
}

/* ============================= VUE MJ EN JEU ============================= */

function HostGame({ code, hostToken, roles }) {
  const { room, send } = useRoomSocket(code);

  if (!room) return <Shell><MoonHeader /><div>Connexion à la salle…</div></Shell>;

  const special = room.rolePool.some(id => roles[id]?.special);

  return (
    <Shell>
      <MoonHeader subtitle={`Salle ${code} — vue Meneur de Jeu`} />

      {room.winner && (
        <div className="lg-card" style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 20 }}>{CAMP_LABEL[room.winner]} — Victoire</div>
        </div>
      )}

      {special && !room.winner && (
        <div style={{ fontSize: 12, color: "#D89A4E", marginBottom: 12, textAlign: "center" }}>
          ⚠️ Cette partie contient un rôle à victoire spéciale (Lieur de Sang, Enfant Trouvé, Ménestrel…).
          La détection automatique ne couvre que Vampires vs Village — déclare la victoire manuellement si besoin.
        </div>
      )}

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#9A8088", marginBottom: 10 }}>JOUEURS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {room.players.map(p => {
            const role = roles[p.roleId];
            return (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#241318", borderRadius: 10, padding: "9px 12px", opacity: p.alive ? 1 : 0.5 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.pseudo} {!p.alive && "💀"}</div>
                  <div style={{ fontSize: 11, color: "#7A6068" }}>{role ? `${role.emoji} ${role.nom}` : "—"}</div>
                </div>
                <button onClick={() => send({ type: "toggle_alive", playerId: p.id, hostToken })}
                  style={{ fontSize: 12, background: "none", border: "1px solid #4A2A34", borderRadius: 8, color: "#EDE0D8", padding: "6px 10px" }}>
                  {p.alive ? "marquer mort" : "ressusciter"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#9A8088", marginBottom: 10 }}>DÉCLARATION MANUELLE</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="lg-btn lg-btn-secondary" style={{ flex: 1 }} onClick={() => send({ type: "manual_win", camp: "vampires", hostToken })}>🦇 Vampires</button>
          <button className="lg-btn lg-btn-secondary" style={{ flex: 1 }} onClick={() => send({ type: "manual_win", camp: "villageois", hostToken })}>🌾 Village</button>
          <button className="lg-btn lg-btn-secondary" style={{ flex: 1 }} onClick={() => send({ type: "manual_win", camp: "maudits", hostToken })}>🐾 Maudits</button>
        </div>
      </div>

      <button className="lg-btn" style={{ width: "100%", background: "#241318", color: "#9A8088", border: "1px solid #4A2A34" }}
        onClick={() => send({ type: "reset", hostToken })}>↺ Réinitialiser (retour au lobby)</button>
    </Shell>
  );
}

/* ============================= APP ============================= */

export default function App() {
  const [view, setView] = useState("home");
  const [code, setCode] = useState(null);
  const [hostToken, setHostToken] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [roles, setRoles] = useState(null);

  useEffect(() => { fetchRoles().then(setRoles); }, []);

  if (!roles) return <Shell><MoonHeader subtitle="Chargement…" /></Shell>;

  if (view === "home") {
    return <Home goHost={() => setView("host-setup")} goJoin={() => setView("join")} />;
  }
  if (view === "host-setup") {
    return <HostSetup roles={roles} onCreated={(c, t) => { setCode(c); setHostToken(t); setView("host-lobby"); }} />;
  }
  if (view === "host-lobby") {
    return <HostLobby code={code} hostToken={hostToken} roles={roles} onLaunched={() => setView("host-game")} />;
  }
  if (view === "host-game") {
    return <HostGame code={code} hostToken={hostToken} roles={roles} />;
  }
  if (view === "join") {
    return <Join onJoined={(c, id) => { setCode(c); setPlayerId(id); setView("player-game"); }} />;
  }
  if (view === "player-game") {
    return <PlayerGame code={code} playerId={playerId} roles={roles} />;
  }
  return null;
}
