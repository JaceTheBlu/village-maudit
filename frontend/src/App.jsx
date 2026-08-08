import React, { useState, useEffect } from "react";
import { ROLES, suggestRoles, hasSpecialRoles } from "./roles";
import { useHostRoom } from "./useHostRoom";
import { usePlayerConnection } from "./usePlayerConnection";

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
          max-width: 480px; margin-left: auto; margin-right: auto;
        }
        .lg-card-wide { max-width: none; }
        .narrow { max-width: 480px; margin-left: auto; margin-right: auto; }
        .flip-outer { perspective: 1200px; margin-bottom: 16px; max-width: 480px; margin-left: auto; margin-right: auto; }
        .flip-inner {
          position: relative; min-height: 300px; width: 100%;
          transform-style: preserve-3d; cursor: pointer; touch-action: manipulation;
          transition: transform .55s cubic-bezier(.4,.2,.2,1);
        }
        .flip-inner.is-flipped { transform: rotateY(180deg); }
        .flip-face {
          position: absolute; inset: 0; box-sizing: border-box;
          background: #1D1116; border: 1px solid #33202A; border-radius: 16px;
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 28px 20px; text-align: center;
        }
        .flip-face.back {
          transform: rotateY(180deg);
          align-items: flex-start; justify-content: flex-start; text-align: left;
          overflow-y: auto;
        }
        ::selection { background: #8C1F3B55; }
        button, input { -webkit-appearance: none; appearance: none; }
        [style*="overflowY"] { -webkit-overflow-scrolling: touch; }
        .lg-shell-inner { width: 100%; max-width: 480px; }
        .list-grid {
          display: flex; flex-direction: column; gap: 8px;
          max-height: 340px; overflow-y: auto;
        }
        .grid-flow { display: flex; flex-direction: column; gap: 8px; }
        @media (min-width: 700px) {
          .lg-shell-inner { max-width: 760px; }
          .list-grid, .grid-flow {
            display: grid; grid-template-columns: repeat(2, 1fr);
            align-content: start;
          }
          .list-grid { max-height: 460px; }
        }
        @media (min-width: 1100px) {
          .lg-shell-inner { max-width: 1040px; }
          .list-grid, .grid-flow { grid-template-columns: repeat(3, 1fr); }
          .list-grid { max-height: 560px; }
        }
      `}</style>
      <div className="lg-shell-inner">{children}</div>
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

/* ============================= JAUGE D'ÉQUILIBRAGE ============================= */

function BalanceGauge({ ratio, hasPool }) {
  const pct = hasPool ? Math.min(100, Math.max(0, ratio * 100)) : 50;
  let status = "Compose ton tirage…";
  let color = "#9A8088";
  if (hasPool) {
    if (ratio < 0.2) { status = "Penche côté villageois — pas assez de vampires"; color = "#6FA0D6"; }
    else if (ratio > 0.4) { status = "Penche côté vampires — trop de vampires"; color = "#E0654F"; }
    else { status = "Équilibré"; color = "#7BBF6A"; }
  }

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7A6068", marginBottom: 6 }}>
        <span>🌾 villageois</span>
        <span>🦇 vampires</span>
      </div>
      <div style={{
        position: "relative", height: 10, borderRadius: 999,
        background: "linear-gradient(90deg, #4A6FA5 0%, #7BBF6A 20%, #7BBF6A 40%, #B23A3A 100%)",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          width: 20, height: 20, borderRadius: "50%",
          background: "#EDE0D8", border: "3px solid #170d14",
          transform: "translate(-50%, -50%)",
          transition: "left .35s cubic-bezier(.4,.2,.2,1)",
        }} />
      </div>
      <div style={{ fontSize: 12, color, marginTop: 10, textAlign: "center", fontWeight: 600 }}>{status}</div>
    </div>
  );
}

/* ============================= ACCUEIL ============================= */

function Home({ goHost, goJoin }) {
  return (
    <Shell>
      <MoonHeader subtitle="Distribution de cartes pour votre partie" />
      <div className="narrow" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button className="lg-btn lg-btn-primary" onClick={goHost}>🕯️ Créer une partie (Meneur de Jeu)</button>
        <button className="lg-btn lg-btn-secondary" onClick={goJoin}>🚪 Rejoindre une partie</button>
      </div>
    </Shell>
  );
}

/* ============================= CRÉATION MJ ============================= */

function HostSetup({ roles, hostRoom, onCreated }) {
  const [count, setCount] = useState(9);
  const [pool, setPool] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [customRoles, setCustomRoles] = useState({});
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customNom, setCustomNom] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");
  const [customCamp, setCustomCamp] = useState("villageois");
  const [customDesc, setCustomDesc] = useState("");
  const [customError, setCustomError] = useState("");

  const allRoles = { ...roles, ...customRoles };

  useEffect(() => { applySuggestion(9); }, []); // eslint-disable-line

  const applySuggestion = (n) => {
    setCount(n);
    setPool(suggestRoles(n));
  };

  const changeQty = (id, delta) => {
    setPool(prev => {
      if (delta > 0) return [...prev, id];
      const idx = prev.indexOf(id);
      if (delta < 0 && idx !== -1) { const c = [...prev]; c.splice(idx, 1); return c; }
      return prev;
    });
  };

  const addCustomRole = () => {
    const nom = customNom.trim();
    const desc = customDesc.trim();
    if (!nom || !desc) { setCustomError("Nom et description requis."); return; }
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setCustomRoles(prev => ({
      ...prev,
      [id]: { nom, emoji: customEmoji.trim() || "🎴", camp: customCamp, desc },
    }));
    setCustomNom(""); setCustomEmoji(""); setCustomCamp("villageois"); setCustomDesc("");
    setCustomError(""); setShowCustomForm(false);
  };

  const removeCustomRole = (id) => {
    setCustomRoles(prev => { const c = { ...prev }; delete c[id]; return c; });
    setPool(prev => prev.filter(r => r !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const loupsCount = pool.filter(id => allRoles[id]?.camp === "vampires").length;
  const villageCount = pool.length - loupsCount;
  const ratio = pool.length ? loupsCount / pool.length : 0;

  const create = async () => {
    setCreating(true);
    setError("");
    try {
      const code = await hostRoom.create(pool, customRoles);
      onCreated(code);
    } catch (e) {
      setError(e.message || "Impossible de créer la salle.");
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

      <div className="lg-card lg-card-wide" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
          <span>🦇 Vampires : {loupsCount}</span>
          <span>🌾 Village : {villageCount}</span>
          <span style={{ color: "#9A8088" }}>Total : {pool.length}</span>
        </div>
        <BalanceGauge ratio={ratio} hasPool={pool.length >= 4} />
        <div style={{ fontSize: 11, color: "#7A6068", marginTop: 14, marginBottom: 6 }}>
          Touche un rôle pour voir son pouvoir.
        </div>
        <div className="list-grid">
          {Object.entries(allRoles).map(([id, role]) => {
            const cnt = pool.filter(r => r === id).length;
            const isExpanded = expandedId === id;
            const isCustom = id in customRoles;
            return (
              <div key={id} style={{ borderRadius: 10, background: cnt > 0 ? "#241318" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, cursor: "pointer" }}
                    onClick={() => setExpandedId(isExpanded ? null : id)}>
                    <span>{role.emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{role.nom}</div>
                      <div style={{ fontSize: 11, color: "#7A6068" }}>{role.camp}{isCustom && " · perso"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => changeQty(id, -1)} disabled={cnt === 0} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #4A2A34", background: "#170d14", color: "#EDE0D8" }}>−</button>
                    <span style={{ minWidth: 14, textAlign: "center" }}>{cnt}</span>
                    <button onClick={() => changeQty(id, 1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #4A2A34", background: "#170d14", color: "#EDE0D8" }}>+</button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: "0 10px 12px 34px", fontSize: 12, color: "#C9BDC2", lineHeight: 1.5 }}>
                    {role.desc}
                    {role.special && <div style={{ marginTop: 6, fontSize: 11, color: "#D89A4E" }}>ℹ️ {role.special}</div>}
                    {isCustom && (
                      <button onClick={() => removeCustomRole(id)}
                        style={{ marginTop: 8, background: "none", border: "none", color: "#8C1F3B", fontSize: 11, padding: 0 }}>
                        supprimer ce rôle personnalisé
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showCustomForm ? (
          <div className="narrow" style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#170d14", border: "1px solid #4A2A34" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input className="lg-input" placeholder="Emoji" value={customEmoji}
                onChange={e => setCustomEmoji(e.target.value)} maxLength={4} style={{ width: 60, textAlign: "center" }} />
              <input className="lg-input" placeholder="Nom du rôle" value={customNom}
                onChange={e => setCustomNom(e.target.value)} maxLength={30} style={{ flex: 1 }} />
            </div>
            <select value={customCamp} onChange={e => setCustomCamp(e.target.value)}
              className="lg-input" style={{ marginBottom: 8 }}>
              <option value="villageois">🌾 Villageois</option>
              <option value="vampires">🦇 Vampires</option>
              <option value="maudits">🐾 Maudits</option>
            </select>
            <textarea placeholder="Description du pouvoir" value={customDesc}
              onChange={e => setCustomDesc(e.target.value)} maxLength={400} rows={3}
              className="lg-input" style={{ marginBottom: 8, resize: "vertical", fontFamily: "inherit" }} />
            {customError && <div style={{ color: "#E6A5A5", fontSize: 12, marginBottom: 8 }}>{customError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="lg-btn lg-btn-primary" style={{ flex: 1 }} onClick={addCustomRole}>Ajouter</button>
              <button className="lg-btn lg-btn-secondary" style={{ flex: 1 }} onClick={() => { setShowCustomForm(false); setCustomError(""); }}>Annuler</button>
            </div>
          </div>
        ) : (
          <button className="lg-btn lg-btn-secondary" style={{ width: "100%", marginTop: 14 }}
            onClick={() => setShowCustomForm(true)}>
            ➕ Créer un rôle personnalisé
          </button>
        )}
      </div>

      <div className="narrow">
        {error && <div style={{ color: "#E6A5A5", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button className="lg-btn lg-btn-primary" style={{ width: "100%" }} disabled={pool.length < 3 || creating} onClick={create}>
          {creating ? "Création…" : `Créer la salle (${pool.length} cartes)`}
        </button>
      </div>
    </Shell>
  );
}

/* ============================= LOBBY MJ ============================= */

function HostLobby({ code, hostRoom, onLaunched }) {
  const room = hostRoom.room;

  useEffect(() => {
    if (room?.status === "playing") onLaunched();
  }, [room?.status]); // eslint-disable-line

  if (!room) return <Shell><MoonHeader /><div>Préparation de la salle…</div></Shell>;

  const canLaunch = room.players.length > 0 && room.players.length <= room.rolePool.length;
  const shortage = room.rolePool.length - room.players.length;

  return (
    <Shell>
      <MoonHeader subtitle="Salle d'attente" />
      <div className="lg-card" style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#9A8088" }}>CODE DE LA SALLE</div>
        <div className="lg-title" style={{ fontSize: code.length > 7 ? 28 : 36, letterSpacing: "0.1em", color: "#D89A4E", wordBreak: "break-word" }}>{code}</div>
        <div style={{ fontSize: 12, color: "#7A6068", marginTop: 4 }}>{room.rolePool.length} cartes préparées</div>
      </div>

      <div className="lg-card lg-card-wide" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#9A8088", marginBottom: 10 }}>
          JOUEURS CONNECTÉS ({room.players.length}/{room.rolePool.length})
        </div>
        {room.players.length === 0 && <div style={{ color: "#7A6068", fontSize: 14 }}>En attente de joueurs…</div>}
        <div className="grid-flow">
          {room.players.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#241318", borderRadius: 10, padding: "9px 12px" }}>
              <span>{p.pseudo}</span>
              <button onClick={() => hostRoom.kick(p.id)}
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

      <div className="narrow">
        <button className="lg-btn lg-btn-primary" style={{ width: "100%" }} disabled={!canLaunch}
          onClick={hostRoom.launch}>
          🌙 Lancer la partie
        </button>
      </div>
    </Shell>
  );
}

/* ============================= REJOINDRE ============================= */

function Join({ playerRoom, onJoined }) {
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
      await playerRoom.join(c, p);
      onJoined();
    } catch (e) {
      setError(e.message || "Connexion impossible.");
    }
    setBusy(false);
  };

  return (
    <Shell>
      <MoonHeader subtitle="Rejoindre une salle" />
      <div className="lg-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="lg-input" placeholder="Code de la salle" value={code}
          onChange={e => setCode(e.target.value.toUpperCase())} maxLength={12} style={{ letterSpacing: "0.1em", textAlign: "center" }} />
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

function PlayerGame({ playerRoom, roles }) {
  const { room, playerId, kicked, send } = playerRoom;
  const [flipped, setFlipped] = useState(false);

  if (kicked) return <Shell><MoonHeader /><div>Tu as été expulsé de la partie par le Meneur de Jeu.</div></Shell>;

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

  const effectiveRoles = { ...roles, ...(room.customRoles || {}) };
  const role = effectiveRoles[me.roleId];

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
          <div className="flip-outer">
            <div className={`flip-inner${flipped ? " is-flipped" : ""}`} onClick={() => setFlipped(f => !f)}>
              <div className="flip-face">
                <div style={{ fontSize: 28, marginBottom: 8 }}>🦇</div>
                <div style={{ fontSize: 50 }}>{role?.emoji}</div>
                <div className="lg-title" style={{ fontSize: 24, marginTop: 8, color: "#D89A4E" }}>{role?.nom}</div>
                <div style={{ fontSize: 11, color: "#7A6068", marginTop: 14 }}>touche pour voir ton pouvoir</div>
              </div>
              <div className="flip-face back">
                <div style={{ fontSize: 12, color: "#9A8088", marginBottom: 8 }}>{role?.emoji} {role?.nom}</div>
                <div style={{ fontSize: 14, color: "#C9BDC2", lineHeight: 1.5 }}>{role?.desc}</div>
                {role?.special && <div style={{ marginTop: 10, fontSize: 12, color: "#D89A4E" }}>ℹ️ {role.special}</div>}
                <div style={{ fontSize: 11, color: "#7A6068", marginTop: 14 }}>touche pour retourner</div>
              </div>
            </div>
          </div>
          <div className="narrow">
            <button className="lg-btn" style={{ width: "100%", background: "#33141A", color: "#E6A5A5", border: "1px solid #6B1F30" }}
              onClick={() => send({ type: "declare_death", playerId })}>💀 Je suis mort</button>
          </div>
        </>
      )}
    </Shell>
  );
}

/* ============================= VUE MJ EN JEU ============================= */

function HostGame({ code, hostRoom, roles }) {
  const room = hostRoom.room;

  if (!room) return <Shell><MoonHeader /><div>Connexion à la salle…</div></Shell>;

  const effectiveRoles = { ...roles, ...(room.customRoles || {}) };
  const special = hasSpecialRoles(room.rolePool, effectiveRoles);

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

      <div className="lg-card lg-card-wide" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#9A8088", marginBottom: 10 }}>JOUEURS</div>
        <div className="grid-flow">
          {room.players.map(p => {
            const role = effectiveRoles[p.roleId];
            return (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#241318", borderRadius: 10, padding: "9px 12px", opacity: p.alive ? 1 : 0.5 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.pseudo} {!p.alive && "💀"}</div>
                  <div style={{ fontSize: 11, color: "#7A6068" }}>{role ? `${role.emoji} ${role.nom}` : "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => hostRoom.toggleAlive(p.id)}
                    style={{ fontSize: 12, background: "none", border: "1px solid #4A2A34", borderRadius: 8, color: "#EDE0D8", padding: "6px 10px" }}>
                    {p.alive ? "marquer mort" : "ressusciter"}
                  </button>
                  <button onClick={() => hostRoom.kick(p.id)}
                    style={{ fontSize: 12, background: "none", border: "none", color: "#8C1F3B", padding: "6px 4px" }}>
                    expulser
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#9A8088", marginBottom: 10 }}>DÉCLARATION MANUELLE</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="lg-btn lg-btn-secondary" style={{ flex: 1 }} onClick={() => hostRoom.manualWin("vampires")}>🦇 Vampires</button>
          <button className="lg-btn lg-btn-secondary" style={{ flex: 1 }} onClick={() => hostRoom.manualWin("villageois")}>🌾 Village</button>
          <button className="lg-btn lg-btn-secondary" style={{ flex: 1 }} onClick={() => hostRoom.manualWin("maudits")}>🐾 Maudits</button>
        </div>
      </div>

      <div className="narrow">
        <button className="lg-btn" style={{ width: "100%", background: "#241318", color: "#9A8088", border: "1px solid #4A2A34" }}
          onClick={hostRoom.reset}>↺ Réinitialiser (retour au lobby)</button>
      </div>
    </Shell>
  );
}

/* ============================= APP ============================= */

export default function App() {
  const [view, setView] = useState("home");
  const [code, setCode] = useState(null);
  const hostRoom = useHostRoom();
  const playerRoom = usePlayerConnection();

  if (view === "home") {
    return <Home goHost={() => setView("host-setup")} goJoin={() => setView("join")} />;
  }
  if (view === "host-setup") {
    return <HostSetup roles={ROLES} hostRoom={hostRoom} onCreated={(c) => { setCode(c); setView("host-lobby"); }} />;
  }
  if (view === "host-lobby") {
    return <HostLobby code={code} hostRoom={hostRoom} onLaunched={() => setView("host-game")} />;
  }
  if (view === "host-game") {
    return <HostGame code={code} hostRoom={hostRoom} roles={ROLES} />;
  }
  if (view === "join") {
    return <Join playerRoom={playerRoom} onJoined={() => setView("player-game")} />;
  }
  if (view === "player-game") {
    return <PlayerGame playerRoom={playerRoom} roles={ROLES} />;
  }
  return null;
}
