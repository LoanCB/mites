/** @typedef {{id: string, who: string, weapon: string, at: number}} Kill */

const TOKEN_RE = /^[A-Za-z0-9_-]{24,}$/;
const isValidToken = (t) => typeof t === "string" && TOKEN_RE.test(t);

/** Token de l'URL (?t=) s'il est valide, sinon celui mémorisé, sinon null. */
export function resolveToken(search, stored) {
  const fromUrl = new URLSearchParams(search).get("t");
  if (isValidToken(fromUrl)) return fromUrl;
  return isValidToken(stored) ? stored : null;
}

/** @param {Kill[]} kills */
export function countFor(kills, who) {
  return kills.filter((k) => k.who === who).length;
}

/** Classement par mites ; les nids sont affichés à côté mais ne départagent pas. @param {Kill[]} kills @param {string[]} colocs */
export function leaderboard(kills, colocs, nests = []) {
  const rows = colocs.map((who, i) => ({ who, count: countFor(kills, who), nests: countFor(nests, who), i }));
  rows.sort((a, b) => b.count - a.count || a.i - b.i);
  return rows.map(({ who, count, nests }, idx) => ({ who, count, nests, leader: idx === 0 && count > 0 }));
}

/** @param {Kill[]} kills */
export function weaponStats(kills, weapons) {
  const total = kills.length;
  return weapons
    .map((w) => ({ ...w, count: kills.filter((k) => k.weapon === w.id).length }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((w) => ({ ...w, pct: Math.round((w.count / total) * 100) }));
}

/** @param {{id: string, at: number}|null} lastKill @param {Kill[]} kills */
export function canUndo(lastKill, kills, now, windowMs) {
  if (!lastKill) return false;
  if (now - lastKill.at >= windowMs) return false;
  return kills.some((k) => k.id === lastKill.id);
}

export function primesLabel(n) {
  return `${n} ${n > 1 ? "primes" : "prime"}`;
}

export function nestsLabel(n) {
  return `${n} ${n > 1 ? "nids" : "nid"}`;
}
