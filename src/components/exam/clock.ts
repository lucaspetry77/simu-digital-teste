/** Relógio da prova: um pequeno store para só o cronômetro re-renderizar a cada segundo. */
export type Clock = ReturnType<typeof createClock>;

export function createClock(initial: number) {
  let elapsed = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => elapsed,
    tick() {
      elapsed += 1;
      for (const l of listeners) l();
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}
