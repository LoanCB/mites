// Store Firebase Realtime Database :
//   /colocs/<token>/kills/<pushId> = { who, weapon, at }
//   /colocs/<token>/nests/<pushId> = { who, at }
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getDatabase, ref, push, set, remove, onValue, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { firebaseConfig } from "./config.js";

export function createStore(token) {
  const db = getDatabase(initializeApp(firebaseConfig));
  const listRef = (list) => ref(db, `colocs/${token}/${list}`);

  function listen(list, onItems, onDenied) {
    return onValue(
      listRef(list),
      (snap) => {
        const items = [];
        snap.forEach((child) => {
          items.push({ id: child.key, ...child.val() });
        });
        onItems(items);
      },
      (err) => {
        console.error(err);
        onDenied();
      },
    );
  }

  function add(list, entry) {
    const r = push(listRef(list));
    set(r, { ...entry, at: serverTimestamp() }).catch((err) => console.error("Écriture refusée", err));
    return { id: r.key, at: Date.now(), list };
  }

  return {
    subscribe(onKills, onDenied, onNests = () => {}) {
      const offKills = listen("kills", onKills, onDenied);
      const offNests = listen("nests", onNests, onDenied);
      return () => { offKills(); offNests(); };
    },
    add(who, weapon) {
      return add("kills", { who, weapon });
    },
    addNest(who) {
      return add("nests", { who });
    },
    remove(id, list = "kills") {
      return remove(ref(db, `colocs/${token}/${list}/${id}`));
    },
  };
}
