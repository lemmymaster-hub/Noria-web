"use client";

import { useSyncExternalStore } from "react";

export type Language = "bhs" | "en";
export const LANGUAGE_KEY = "noria-language";
type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

export function createLanguageStore(getStorage: () => PreferenceStorage | undefined) {
  const listeners = new Set<() => void>();
  let currentLanguage: Language | undefined;

  function getSnapshot(): Language {
    if (currentLanguage) return currentLanguage;
    try {
      return getStorage()?.getItem(LANGUAGE_KEY) === "en" ? "en" : "bhs";
    } catch {
      return "bhs";
    }
  }

  function setLanguage(language: Language) {
    currentLanguage = language;
    try {
      getStorage()?.setItem(LANGUAGE_KEY, language);
    } catch {
      // Language switching still works when browser storage is unavailable.
    }
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot,
    getServerSnapshot: (): Language => "bhs",
    setLanguage,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    refresh() {
      currentLanguage = undefined;
      listeners.forEach((listener) => listener());
    },
  };
}

const languageStore = createLanguageStore(() =>
  typeof window === "undefined" ? undefined : window.localStorage,
);

function subscribeLanguage(listener: () => void) {
  const unsubscribe = languageStore.subscribe(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === LANGUAGE_KEY || event.key === null) languageStore.refresh();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    unsubscribe();
    window.removeEventListener("storage", onStorage);
  };
}

export function useLanguage() {
  const language = useSyncExternalStore(
    subscribeLanguage,
    languageStore.getSnapshot,
    languageStore.getServerSnapshot,
  );
  return [language, languageStore.setLanguage] as const;
}

const subscribeHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribeHydration, getHydratedSnapshot, getServerHydratedSnapshot);
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const getReducedMotionSnapshot = () => window.matchMedia(reducedMotionQuery).matches;
const getServerReducedMotionSnapshot = () => false;

function subscribeReducedMotion(listener: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}
