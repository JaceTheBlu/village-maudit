import { roleCamp } from "./roles";

export function createRoomState(rolePool) {
  return {
    status: "lobby", // lobby | playing | ended
    rolePool,
    players: [], // {id, pseudo, roleId, alive}
    winner: null,
  };
}

export function computeWinner(state) {
  if (state.status !== "playing") return;
  const alive = state.players.filter((p) => p.alive);
  if (!alive.length) return;
  const vampiresAlive = alive.filter((p) => roleCamp(p.roleId) === "vampires").length;
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
    players: state.players.map((p) => ({
      id: p.id, pseudo: p.pseudo, roleId: p.roleId, alive: p.alive,
    })),
    winner: state.winner,
  };
}
