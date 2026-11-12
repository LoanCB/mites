import test from "node:test";
import assert from "node:assert/strict";
import { COLOCS, WEAPONS, UNDO_WINDOW_MS } from "../js/config.js";
import { resolveToken, countFor, leaderboard, weaponStats, canUndo, primesLabel, nestsLabel } from "../js/logic.js";

const T = "abcdefghijklmnopqrstuvwx"; // 24 caractères

test("resolveToken prend t dans l'URL", () => assert.equal(resolveToken(`?t=${T}`, null), T));
test("resolveToken : l'URL remplace le token mémorisé", () => assert.equal(resolveToken(`?t=${T}`, "y".repeat(30)), T));
test("resolveToken retombe sur le token mémorisé", () => assert.equal(resolveToken("", T), T));
test("resolveToken refuse un token trop court ou invalide", () => {
  assert.equal(resolveToken("?t=court", null), null);
  assert.equal(resolveToken(`?t=${T}<script>`, null), null);
});
test("resolveToken : un t invalide dans l'URL n'écrase pas un token mémorisé valide", () =>
  assert.equal(resolveToken("?t=court", T), T));

const K = (who, weapon = "main", at = 0, id = Math.random() + "") => ({ id, who, weapon, at });

test("countFor compte les mites d'une personne", () =>
  assert.equal(countFor([K("Guy"), K("Loan"), K("Guy")], "Guy"), 2));

test("leaderboard liste les 10 colocs, triés, égalités dans l'ordre de COLOCS", () => {
  const lb = leaderboard([K("Guy"), K("Guy"), K("Clara"), K("Loan")], COLOCS);
  assert.equal(lb.length, 10);
  assert.deepEqual(lb.slice(0, 3).map(r => r.who), ["Guy", "Clara", "Loan"]);
  assert.equal(lb[0].leader, true);
  assert.equal(lb[1].leader, false);
});
test("leaderboard : pas de chapeau si personne n'a tué", () => assert.equal(leaderboard([], COLOCS)[0].leader, false));

test("weaponStats en pourcentages entiers, armes vides exclues", () => {
  const s = weaponStats([K("Guy", "main"), K("Guy", "main"), K("Guy", "livre")], WEAPONS);
  assert.deepEqual(s.map(w => [w.id, w.pct]), [["main", 67], ["livre", 33]]);
});

test("canUndo : seulement si la mite existe encore et a moins de 10 min", () => {
  const kills = [K("Loan", "main", 1000, "a")];
  assert.equal(canUndo({ id: "a", at: 1000 }, kills, 1000 + 599999, UNDO_WINDOW_MS), true);
  assert.equal(canUndo({ id: "a", at: 1000 }, kills, 1000 + 600001, UNDO_WINDOW_MS), false);
  assert.equal(canUndo({ id: "b", at: 1000 }, kills, 2000, UNDO_WINDOW_MS), false);
  assert.equal(canUndo(null, kills, 2000, UNDO_WINDOW_MS), false);
});

test("primesLabel accorde au singulier", () => {
  assert.equal(primesLabel(1), "1 prime");
  assert.equal(primesLabel(0), "0 prime");
  assert.equal(primesLabel(42), "42 primes");
});

test("nestsLabel accorde au singulier", () => {
  assert.equal(nestsLabel(0), "0 nid");
  assert.equal(nestsLabel(1), "1 nid");
  assert.equal(nestsLabel(3), "3 nids");
});

test("leaderboard compte les nids de chacun, sans changer le classement", () => {
  const nests = [{ id: "n1", who: "Loan", at: 0 }, { id: "n2", who: "Loan", at: 0 }];
  const lb = leaderboard([K("Guy")], COLOCS, nests);
  assert.equal(lb[0].who, "Guy");
  assert.equal(lb.find((r) => r.who === "Loan").nests, 2);
  assert.equal(lb[0].nests, 0);
});
