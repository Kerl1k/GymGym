import { useRef } from "react";

function createKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Stable React keys for a list whose items have no unique id
 * (e.g. the same exercise added twice). Call `remove` / `move` together
 * with the matching state update; appended items get new keys automatically.
 */
export function useListKeys(length: number) {
  const keysRef = useRef<string[]>([]);
  const keys = keysRef.current;

  while (keys.length < length) keys.push(createKey());
  if (keys.length > length) keys.length = length;

  const remove = (index: number) => {
    keys.splice(index, 1);
  };

  const move = (from: number, to: number) => {
    const [key] = keys.splice(from, 1);
    keys.splice(to, 0, key);
  };

  const reset = () => {
    keys.length = 0;
  };

  return { keys, remove, move, reset };
}
