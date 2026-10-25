"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { SavedPagesClient } from "@/lib/saved-pages-client";
import type { ReadingPage } from "@/lib/saved-page-catalog";

const Context = createContext<SavedPagesClient | null>(null);
export function SavedPagesProvider({ catalog, children }: { catalog: ReadingPage[]; children: ReactNode }) {
  const [store] = useState(() => new SavedPagesClient(catalog));
  useEffect(() => store.start(), [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useSavedPages() {
  const store = useContext(Context);
  if (!store) throw new Error("Saved pages provider is missing");
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { store, ...snapshot };
}
