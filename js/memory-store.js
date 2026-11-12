// Store en mémoire, même interface que firebase-store.js. Activé par ?demo=1.
const DENIED_TOKEN = "refuse".padEnd(24, "x");

export function createStore(token) {
  const lists = { kills: [], nests: [] };
  const subs = new Set();
  const notify = () => subs.forEach((fn) => fn(lists));
  let seq = 0;

  function push(list, entry) {
    const at = Date.now();
    const id = `demo-${at}-${seq++}`;
    lists[list] = [...lists[list], { id, ...entry, at }];
    notify();
    return { id, at, list };
  }

  return {
    subscribe(onKills, onDenied, onNests = () => {}) {
      if (token === DENIED_TOKEN) {
        onDenied();
        return () => {};
      }
      const fn = (l) => { onKills([...l.kills]); onNests([...l.nests]); };
      subs.add(fn);
      fn(lists);
      return () => subs.delete(fn);
    },
    add(who, weapon) {
      return push("kills", { who, weapon });
    },
    addNest(who) {
      return push("nests", { who });
    },
    async remove(id, list = "kills") {
      lists[list] = lists[list].filter((k) => k.id !== id);
      notify();
    },
  };
}
