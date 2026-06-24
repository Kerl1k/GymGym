import { useRef, useSyncExternalStore } from "react";

import { comparer, reaction } from "mobx";

export function useMobxSelector<T>(selector: () => T): T {
  const snapshotRef = useRef<T>(selector());

  const getSnapshot = () => {
    const next = selector();
    if (!comparer.structural(snapshotRef.current, next)) {
      snapshotRef.current = next;
    }
    return snapshotRef.current;
  };

  return useSyncExternalStore(
    (onStoreChange) => {
      const dispose = reaction(
        selector,
        (next) => {
          if (!comparer.structural(snapshotRef.current, next)) {
            snapshotRef.current = next;
            onStoreChange();
          }
        },
        { equals: comparer.structural },
      );

      return dispose;
    },
    getSnapshot,
    getSnapshot,
  );
}
