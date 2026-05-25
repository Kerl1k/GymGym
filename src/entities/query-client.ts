import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      networkMode: "offlineFirst",
    },
  },
});

export const persistDehydrateOptions = {
  shouldDehydrateQuery: (query: Parameters<typeof defaultShouldDehydrateQuery>[0]) =>
    defaultShouldDehydrateQuery(query),
};
