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
  { id: "serviette", emoji: "🧣", label: "Serviette / torchon" },
  { id: "autre", emoji: "❓", label: "Autre" },
];

export const DEFAULT_WEAPON = "main";

/** Durée pendant laquelle on peut annuler sa dernière mite (doit correspondre à database.rules.json). */
export const UNDO_WINDOW_MS = 600000;

/** Config web de ton projet Firebase (console Firebase → Paramètres du projet → Tes applications). Elle est publique par nature. */
export const firebaseConfig = {
  apiKey: "AIzaSyBXxCVHkYJD5hpKectu53HYNdoSUhv7tqk",
  authDomain: "mites-35f3a.firebaseapp.com",
  databaseURL: "https://mites-35f3a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mites-35f3a",
  appId: "1:469342770741:web:5491ad71732fd2722b037c",
};
