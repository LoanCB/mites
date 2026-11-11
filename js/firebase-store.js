// Store Firebase Realtime Database : /colocs/<token>/kills/<pushId> = { who, weapon, at }
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getDatabase, ref, push, set, remove, onValue, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { firebaseConfig } from "./config.js";

export function createStore(token) {
  const db = getDatabase(initializeApp(firebaseConfig));
  const listRef = ref(db, `colocs/${token}/kills`);

  return {
    subscribe(onKills, onDenied) {
      return onValue(
        listRef,
        (snap) => {
          const kills = [];
          snap.forEach((child) => {
            kills.push({ id: child.key, ...child.val() });
          });
          onKills(kills);
        },
        (err) => {
          console.error(err);
          onDenied();
        },
      );
    },
    add(who, weapon) {
      const r = push(listRef);
      set(r, { who, weapon, at: serverTimestamp() }).catch((err) => console.error("Écriture refusée", err));
      return { id: r.key, at: Date.now() };
    },
    remove(id) {
      return remove(ref(db, `colocs/${token}/kills/${id}`));
    },
  };
}
