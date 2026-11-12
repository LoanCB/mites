import { COLOCS, WEAPONS, DEFAULT_WEAPON, UNDO_WINDOW_MS } from "./config.js";
import { resolveToken, countFor, leaderboard, weaponStats, canUndo, primesLabel, nestsLabel } from "./logic.js";

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
  nests: [],
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
  const last = storage.getJSON("mites.lastKill");
  $("undo").hidden = !canUndo(last, [...state.kills, ...state.nests], Date.now(), UNDO_WINDOW_MS);
  $("undo").textContent = last?.list === "nests" ? "↶ annuler le nid" : "↶ annuler la dernière";
}

function renderCounts() {
  $("count").textContent = primesLabel(countFor(state.kills, state.who));
  const myNests = countFor(state.nests, state.who);
  $("nest-count").textContent = `🔥 ${nestsLabel(myNests)} ${myNests > 1 ? "détruits" : "détruit"}`;

  $("ledger").replaceChildren(...leaderboard(state.kills, COLOCS, state.nests).map((row) => {
    const li = document.createElement("li");
    li.classList.toggle("me", row.who === state.who);
    li.classList.toggle("leader", row.leader);
    li.classList.toggle("zero", row.count === 0);
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = row.leader ? `🤠 ${row.who}` : row.who;
    if (row.nests > 0) {
      const nests = document.createElement("small");
      nests.className = "nests";
      nests.textContent = ` · 🔥 ${nestsLabel(row.nests)}`;
      name.append(nests);
    }
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

// --- Animation ---
// Retire .squash à la fin du tremblement de l'affiche, sinon les ailes de la mite restent figées.
document.addEventListener("animationend", (e) => {
  if (e.target.id === "poster" && e.animationName === "shake") e.target.classList.remove("squash");
});

export function playSquash() {
  const poster = $("poster");
  poster.classList.remove("squash");
  void poster.offsetWidth; // force le reflow pour relancer l'animation
  poster.classList.add("squash");
  navigator.vibrate?.(30);
}

// Nid détruit : la nuée jaillit du bouton, remplit l'écran puis s'envole par le haut.
const SWARM_MS = 2600;
let swarmTimer = null;

export function playSwarm(from) {
  const swarm = $("swarm");
  const template = $("moth").querySelector("svg");
  const w = window.innerWidth;
  const h = window.innerHeight;
  const origin = from.getBoundingClientRect();
  const ox = origin.left + origin.width / 2;
  const oy = origin.top + origin.height / 2;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // De quoi couvrir l'écran : environ une mite par carré de 55 px.
  const n = reduced ? 0 : Math.min(160, Math.max(40, Math.round((w * h) / (55 * 55))));
  const rnd = (a, b) => a + Math.random() * (b - a);

  const moths = Array.from({ length: n }, () => {
    const x = rnd(-20, w - 40);
    const y = rnd(-20, h - 30);
    const m = document.createElement("span");
    m.className = "swarm-moth";
    m.style.left = `${x}px`;
    m.style.top = `${y}px`;
    m.style.setProperty("--fx", `${ox - x - 30}px`);
    m.style.setProperty("--fy", `${oy - y - 22}px`);
    m.style.setProperty("--jx", `${rnd(-30, 30)}px`);
    m.style.setProperty("--jy", `${rnd(-30, 10)}px`);
    m.style.setProperty("--ex", `${rnd(-160, 160)}px`);
    m.style.setProperty("--ey", `${-(y + rnd(120, 400))}px`);
    m.style.setProperty("--s", rnd(0.35, 1.05).toFixed(2));
    m.style.setProperty("--r0", `${rnd(-40, 40).toFixed(0)}deg`);
    m.style.setProperty("--r", `${rnd(-25, 25).toFixed(0)}deg`);
    m.style.setProperty("--d", `${rnd(0, 0.35).toFixed(2)}s`);
    m.append(template.cloneNode(true));
    return m;
  });
  const stamp = document.createElement("span");
  stamp.className = "swarm-stamp";
  stamp.textContent = "Nid détruit !";

  clearTimeout(swarmTimer);
  swarm.replaceChildren(...moths, stamp);
  swarm.hidden = false;
  navigator.vibrate?.([40, 30, 40, 30, 90]);
  swarmTimer = setTimeout(() => {
    swarm.hidden = true;
    swarm.replaceChildren();
  }, SWARM_MS + 400);
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

  $("nest").addEventListener("click", (e) => {
    const last = state.store.addNest(state.who);
    storage.set("mites.lastKill", JSON.stringify(last));
    playSwarm(e.currentTarget);
    renderUndo();
  });

  $("undo").addEventListener("click", async () => {
    const last = storage.getJSON("mites.lastKill");
    storage.del("mites.lastKill");
    $("undo").hidden = true;
    if (last) {
      try { await state.store.remove(last.id, last.list ?? "kills"); } catch (err) { console.error("Annulation refusée", err); }
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
    (nests) => {
      state.nests = nests;
      if (state.who) renderCounts();
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

main().catch((err) => {
  // Module CDN injoignable, config Firebase pas remplie… : jamais de page blanche.
  console.error(err);
  $("closed-msg").textContent = "Le saloon n'arrive pas à ouvrir : la connexion a échoué. Réessaie dans un moment.";
  show("closed");
});
