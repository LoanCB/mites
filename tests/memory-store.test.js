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
