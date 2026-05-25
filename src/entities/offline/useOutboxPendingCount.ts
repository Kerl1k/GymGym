import { useCallback, useEffect, useState } from "react";

import { getOutboxPendingCount, OUTBOX_CHANGED_EVENT } from "./outboxOps";

export function useOutboxPendingCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    void getOutboxPendingCount().then(setCount);
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(OUTBOX_CHANGED_EVENT, on);
    return () => window.removeEventListener(OUTBOX_CHANGED_EVENT, on);
  }, [refresh]);

  return count;
}
