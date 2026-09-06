import assert from "node:assert/strict";
import test from "node:test";
import { createLanguageStore, LANGUAGE_KEY } from "../app/preferences.ts";

function memoryStorage(initialValue = null) {
  const values = new Map(initialValue === null ? [] : [[LANGUAGE_KEY, initialValue]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

test("restores English on a fresh visit without overwriting the saved preference", () => {
  const storage = memoryStorage("en");
  const firstVisit = createLanguageStore(() => storage);

  assert.equal(firstVisit.getServerSnapshot(), "bhs");
  assert.equal(storage.getItem(LANGUAGE_KEY), "en");
  assert.equal(firstVisit.getSnapshot(), "en");

  firstVisit.setLanguage("bhs");
  assert.equal(createLanguageStore(() => storage).getSnapshot(), "bhs");
  firstVisit.setLanguage("en");
  assert.equal(createLanguageStore(() => storage).getSnapshot(), "en");
});

test("missing and invalid preferences fall back to BHS", () => {
  for (const value of [null, "", "fr", "EN"]) {
    const store = createLanguageStore(() => memoryStorage(value));
    assert.equal(store.getSnapshot(), "bhs");
  }
});

test("language switching works when storage access, reads, or writes are blocked", () => {
  const blocked = () => { throw new Error("Storage access denied"); };
  for (const getStorage of [
    () => undefined,
    blocked,
    () => ({ getItem: blocked, setItem: blocked }),
    () => ({ getItem: () => "bhs", setItem: blocked }),
  ]) {
    const store = createLanguageStore(getStorage);
    assert.equal(store.getSnapshot(), "bhs");
    store.setLanguage("en");
    assert.equal(store.getSnapshot(), "en");
    store.setLanguage("bhs");
    assert.equal(store.getSnapshot(), "bhs");
  }
});

test("notifies subscribers and refreshes changes from another tab", () => {
  const storage = memoryStorage();
  const store = createLanguageStore(() => storage);
  const changes = [];
  const unsubscribe = store.subscribe(() => changes.push(store.getSnapshot()));

  store.setLanguage("en");
  storage.setItem(LANGUAGE_KEY, "bhs");
  store.refresh();
  assert.deepEqual(changes, ["en", "bhs"]);
  assert.equal(store.getSnapshot(), "bhs");

  unsubscribe();
  store.setLanguage("en");
  assert.deepEqual(changes, ["en", "bhs"]);
});
