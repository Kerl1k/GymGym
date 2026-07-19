let flushImpl: (() => Promise<void>) | null = null;

export function registerFlushHandler(handler: () => Promise<void>): void {
  flushImpl = handler;
}

export function requestFlush(): void {
  if (!flushImpl) return;
  void flushImpl();
}
