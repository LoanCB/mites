// Store en mémoire, même interface que firebase-store.js. Activé par ?demo=1.
const DENIED_TOKEN = "refuse".padEnd(24, "x");

export function createStore(token) {
  let kills = [];
  const subs = new Set();
  const notify = () => subs.forEach((fn) => fn([...kills]));
  let seq = 0;

  return {
    subscribe(onKills, onDenied) {
      if (token === DENIED_TOKEN) {
        onDenied();
        return () => {};
      }
      subs.add(onKills);
      onKills([...kills]);
      return () => subs.delete(onKills);
    },
    add(who, weapon) {
      const at = Date.now();
      const id = `demo-${at}-${seq++}`;
      kills.push({ id, who, weapon, at });
      notify();
      return { id, at };
    },
    async remove(id) {
      kills = kills.filter((k) => k.id !== id);
      notify();
    },
  };
}
