export const COLOCS = [
  "Lallie", "Pascale", "Camille", "Clara", "Eurydice",
  "Katja", "Alexandre", "Edouard", "Guy", "Loan",
];

export const WEAPONS = [
  { id: "main", emoji: "✋", label: "Main nue" },
  { id: "chausson", emoji: "🩴", label: "Chausson" },
  { id: "livre", emoji: "📕", label: "Livre" },
  { id: "journal", emoji: "🗞️", label: "Journal" },
  { id: "balai", emoji: "🧹", label: "Balai" },
  { id: "autre", emoji: "❓", label: "Autre" },
];

export const DEFAULT_WEAPON = "main";

/** Durée pendant laquelle on peut annuler sa dernière mite (doit correspondre à database.rules.json). */
export const UNDO_WINDOW_MS = 600000;

/** Config web de ton projet Firebase (console Firebase → Paramètres du projet → Tes applications). Elle est publique par nature. */
export const firebaseConfig = {
  apiKey: "A_REMPLIR",
  authDomain: "A_REMPLIR",
  databaseURL: "A_REMPLIR",
  projectId: "A_REMPLIR",
  appId: "A_REMPLIR",
};
