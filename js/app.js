import { COLOCS, WEAPONS, DEFAULT_WEAPON, UNDO_WINDOW_MS } from "./config.js";
import { resolveToken, countFor, leaderboard, weaponStats, canUndo, primesLabel } from "./logic.js";

const $ = (id) => document.getElementById(id);

// --- localStorage, toujours protégé (navigation privée, stockage bloqué…) ---
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* sans mémoire, tant pis */ } },
  del(key) { try { localStorage.removeItem(key); } catch { /* idem */ } },
  getJSON(key) { try { return JSON.parse(storage.get(key)); } catch { return null; } },
};

const SCREENS = ["closed", "who", "main"];
function show(id) {
  SCREENS.forEach((s) => { $(s).hidden = s !== id; });
}

const state = {
  store: null,
  who: null,
  weapon: DEFAULT_WEAPON,
  kills: [],
  unsubscribe: null,
};

// --- Rendu ---
function weaponById(id) {
  return WEAPONS.find((w) => w.id === id) ?? WEAPONS[0];
}

function renderWeapons() {
  const box = $("weapons");
  box.replaceChildren(...WEAPONS.map((w) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "weapon";
    b.dataset.weapon = w.id;
    b.textContent = w.emoji;
    b.title = w.label;
    b.setAttribute("aria-label", w.label);
    b.setAttribute("aria-pressed", String(w.id === state.weapon));
    return b;
  }));
  $("smasher").textContent = state.weapon === "main" ? "🖐️" : weaponById(state.weapon).emoji;
}

function renderUndo() {
  $("undo").hidden = !canUndo(storage.getJSON("mites.lastKill"), state.kills, Date.now(), UNDO_WINDOW_MS);
}

function renderCounts() {
  $("count").textContent = primesLabel(countFor(state.kills, state.who));

  $("ledger").replaceChildren(...leaderboard(state.kills, COLOCS).map((row) => {
    const li = document.createElement("li");
    li.classList.toggle("me", row.who === state.who);
    li.classList.toggle("leader", row.leader);
    li.classList.toggle("zero", row.count === 0);
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = row.leader ? `🤠 ${row.who}` : row.who;
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = row.count;
    li.append(name, num);
    return li;
  }));

  const stats = weaponStats(state.kills, WEAPONS);
  $("weapons-empty").hidden = stats.length > 0;
  $("weapon-stats").replaceChildren(...stats.map((w) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = `${w.emoji} ${w.label}`;
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = `${w.pct} %`;
    li.append(name, num);
    return li;
  }));

  renderUndo();
}

// --- Animation (enrichie à la tâche 4) ---
export function playSquash() {
  const poster = $("poster");
  poster.classList.remove("squash");
  void poster.offsetWidth; // force le reflow pour relancer l'animation
  poster.classList.add("squash");
  navigator.vibrate?.(30);
}

// --- Écrans ---
function renderWho() {
  $("who-grid").replaceChildren(...COLOCS.map((name) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "who-btn";
    b.dataset.who = name;
    const small = document.createElement("small");
    small.textContent = "WANTED";
    const span = document.createElement("span");
    span.textContent = name;
    b.append(small, span);
    return b;
  }));
  show("who");
}

function enterMain() {
  $("hunter-name").textContent = state.who;
  const savedWeapon = storage.get("mites.weapon");
  state.weapon = WEAPONS.some((w) => w.id === savedWeapon) ? savedWeapon : DEFAULT_WEAPON;
  renderWeapons();
  renderCounts();
  show("main");
}

// --- Événements ---
function bindEvents() {
  $("who-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-who]");
    if (!btn) return;
    state.who = btn.dataset.who;
    storage.set("mites.who", state.who);
    enterMain();
  });

  $("not-me").addEventListener("click", () => {
    storage.del("mites.who");
    storage.del("mites.lastKill");
    state.who = null;
    renderWho();
  });

  $("weapons").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-weapon]");
    if (!btn) return;
    state.weapon = btn.dataset.weapon;
    storage.set("mites.weapon", state.weapon);
    renderWeapons();
  });

  $("stage").addEventListener("click", () => {
    const last = state.store.add(state.who, state.weapon);
    storage.set("mites.lastKill", JSON.stringify(last));
    playSquash();
    renderUndo();
  });

  $("undo").addEventListener("click", async () => {
    const last = storage.getJSON("mites.lastKill");
    storage.del("mites.lastKill");
    $("undo").hidden = true;
    if (last) {
      try { await state.store.remove(last.id); } catch (err) { console.error("Annulation refusée", err); }
    }
  });

  // L'annulation expire au bout de 10 min, même sans nouvel événement.
  setInterval(renderUndo, 30000);
}

// --- Démarrage ---
async function main() {
  const params = new URLSearchParams(location.search);
  const token = resolveToken(location.search, storage.get("mites.token"));
  if (!token) return show("closed");
  storage.set("mites.token", token);

  const { createStore } = params.has("demo")
    ? await import("./memory-store.js")
    : await import("./firebase-store.js");
  state.store = createStore(token);

  bindEvents();

  state.unsubscribe = state.store.subscribe(
    (kills) => {
      state.kills = kills;
      if (state.who) renderCounts();
    },
    () => {
      state.unsubscribe?.();
      show("closed");
    },
  );
  if ($("closed").hidden === false) return; // refusé tout de suite

  const savedWho = storage.get("mites.who");
  if (COLOCS.includes(savedWho)) {
    state.who = savedWho;
    enterMain();
  } else {
    renderWho();
  }
}

main();
