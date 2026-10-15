const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const fmtScore = (n: number) => nf1.format(n);
export const fmtInt = (n: number) => nf0.format(n);
export const fmtPct = (n: number) => `${nf0.format(n)}%`;

export function fmtDuration(totalSec: number, opts: { short?: boolean } = {}) {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h${m ? ` ${String(m).padStart(2, "0")}min` : ""}`;
  if (m > 0) return opts.short || sec === 0 ? `${m}min` : `${m}min ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

/** Relógio "01:23:45" / "23:45" */
export function fmtClock(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Hoje, ${time}`;
  if (diff === 1) return `Ontem, ${time}`;
  if (diff < 7) return `${d.toLocaleDateString("pt-BR", { weekday: "long" })}, ${time}`;
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function plural(n: number, one: string, many: string) {
  return `${fmtInt(n)} ${n === 1 ? one : many}`;
}
