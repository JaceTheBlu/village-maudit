import { ROLES } from "./roles";

export function createRoomState(rolePool, customRoles = {}) {
  return {
    status: "lobby", // lobby | playing | ended
    rolePool,
    customRoles, // rôles créés par le MJ, à transmettre aux joueurs
    players: [], // {id, pseudo, roleId, alive}
    winner: null,
  };
}

function campOf(state, roleId) {
  return (state.customRoles[roleId] || ROLES[roleId])?.camp ?? null;
}

export function computeWinner(state) {
  if (state.status !== "playing") return;
  const alive = state.players.filter((p) => p.alive);
  if (!alive.length) return;
  const vampiresAlive = alive.filter((p) => campOf(state, p.roleId) === "vampires").length;
  const othersAlive = alive.length - vampiresAlive;
  if (vampiresAlive === 0) {
    state.winner = "villageois";
    state.status = "ended";
  } else if (vampiresAlive >= othersAlive) {
    state.winner = "vampires";
    state.status = "ended";
  }
}

export function toPublicState(state, code) {
  return {
    code,
    status: state.status,
    rolePool: state.rolePool,
    customRoles: state.customRoles,
    players: state.players.map((p) => ({
      id: p.id, pseudo: p.pseudo, roleId: p.roleId, alive: p.alive,
    })),
    winner: state.winner,
  };
}
