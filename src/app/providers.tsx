import { useEffect } from "react";

import { onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { registerOutboxSync } from "@/entities/offline/syncDrain";
import { persistDehydrateOptions, queryClient } from "@/entities/query-client";
import { queryPersister } from "@/entities/query-persister";

const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;
const PERSIST_BUSTER = "gym-v1";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return onlineManager.setEventListener((setOnline) => {
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener("online", on);
      window.addEventListener("offline", off);
      return () => {
        window.removeEventListener("online", on);
        window.removeEventListener("offline", off);
      };
    });
  }, []);

  useEffect(() => {
    return registerOutboxSync();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: PERSIST_BUSTER,
        dehydrateOptions: persistDehydrateOptions,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
