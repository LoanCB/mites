import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../js/memory-store.js";

const T = "abcdefghijklmnopqrstuvwx";

test("memory-store : add notifie, remove retire", async () => {
  const store = createStore(T);
  let last = [];
  store.subscribe((kills) => (last = kills), () => assert.fail("refusé"));
  const { id, at } = store.add("Loan", "livre");
  assert.equal(typeof id, "string");
  assert.equal(typeof at, "number");
  assert.deepEqual(last.map((k) => [k.who, k.weapon]), [["Loan", "livre"]]);
  await store.remove(id);
  assert.equal(last.length, 0);
});

test("memory-store : le token de démo « refuse… » appelle onDenied", () => {
  let denied = false;
  createStore("refuse".padEnd(24, "x")).subscribe(() => {}, () => (denied = true));
  assert.equal(denied, true);
});

test("memory-store : addNest notifie la liste des nids, remove(id, \"nests\") la retire", async () => {
  const store = createStore(T);
  let kills = null, nests = [];
  store.subscribe((k) => (kills = k), () => assert.fail("refusé"), (n) => (nests = n));
  const last = store.addNest("Guy");
  assert.equal(last.list, "nests");
  assert.deepEqual(nests.map((n) => n.who), ["Guy"]);
  assert.equal(kills.length, 0);
  await store.remove(last.id, "nests");
  assert.equal(nests.length, 0);
});
