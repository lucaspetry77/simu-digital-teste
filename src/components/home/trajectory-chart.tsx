"use client";

import { useCallback, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { fmtDate, fmtScore } from "@/lib/format";
import type { TrajectoryPoint } from "@/lib/simulado";

const short = (ts: number) => new Date(ts).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");

/**
 * A média (projetada para a meta, ou simples) depois de cada simulado, com a
 * nota de corte como linha de chegada. Uma linha só: a pergunta aqui é "estou
 * chegando?"; o detalhe por área fica nos cartões de área.
 */
export function TrajectoryChart({
  points,
  cutoff,
  reached,
}: {
  points: TrajectoryPoint[];
  cutoff: number | null;
  reached: boolean;
}) {
  const gid = useId();
  const [active, setActive] = useState<number | null>(null);
  const [W, setW] = useState(480);
  const measure = useCallback((node: HTMLDivElement) => {
    const observer = new ResizeObserver(([entry]) => setW(Math.max(240, Math.round(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const H = 188;
  const pad = { l: 34, r: 14, t: 18, b: 26 };
  const values = [...points.map((p) => p.mean), ...(cutoff != null ? [cutoff] : [])];
  const lo = Math.max(0, Math.min(...values) - 30);
  const hi = Math.min(1000, Math.max(...values) + 30);
  const step = [25, 50, 100, 200].find((s) => (hi - lo) / s <= 4) ?? 250;
  const yMin = Math.floor(lo / step) * step;
  const yMax = Math.ceil(hi / step) * step;
  const n = points.length;
  const x = (i: number) => (n < 2 ? (pad.l + W - pad.r) / 2 : pad.l + (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const ticks = Array.from({ length: Math.round((yMax - yMin) / step) + 1 }, (_, i) => yMin + i * step);
  const line = points.map((p, i) => `${x(i)},${y(p.mean)}`).join(" ");
  const area = n > 1 ? `M${x(0)},${H - pad.b} L${line.replaceAll(" ", " L")} L${x(n - 1)},${H - pad.b} Z` : "";
  const color = reached ? "var(--ok)" : "var(--brand)";
  const last = n - 1;
  const shown = active ?? last;
  const sp = points[shown];

  return (
    <div ref={measure} className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`Sua média em ${n} ${n === 1 ? "simulado" : "simulados"}: de ${fmtScore(points[0].mean)} para ${fmtScore(points[last].mean)}${cutoff != null ? `; nota de corte ${fmtScore(cutoff)}` : ""}.`}
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)" className="font-mono">
              {t}
            </text>
          </g>
        ))}
        {cutoff != null ? (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={y(cutoff)} y2={y(cutoff)} stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="5 4" />
            {/* rótulo acima da linha, a não ser que a linha esteja colada no topo */}
            <text
              x={W - pad.r}
              y={y(cutoff) < pad.t + 14 ? y(cutoff) + 15 : y(cutoff) - 7}
              textAnchor="end"
              fontSize="11.5"
              fontWeight="500"
              fill="var(--ink-2)"
            >
              corte {fmtScore(cutoff)}
            </text>
          </g>
        ) : null}
        {area ? <path d={area} fill={`url(#${gid})`} /> : null}
        {n > 1 ? (
          <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={line} />
        ) : null}
        {sp ? <line x1={x(shown)} x2={x(shown)} y1={y(sp.mean) + 7} y2={H - pad.b} stroke={color} strokeOpacity="0.35" /> : null}
        {points.map((p, i) => (
          <g key={p.attempt.id}>
            <circle
              cx={x(i)}
              cy={y(p.mean)}
              r={i === shown ? 6 : 3.5}
              fill={i === shown ? color : "var(--bg-elev)"}
              stroke={i === shown ? "var(--bg-elev)" : color}
              strokeWidth={i === shown ? 2.5 : 2}
              className="pointer-events-none transition-[r]"
            />
            {/* alvo maior para mouse, toque e teclado */}
            <circle
              cx={x(i)}
              cy={y(p.mean)}
              r={16}
              fill="transparent"
              tabIndex={0}
              aria-label={`${fmtDate(p.at)}: média ${fmtScore(p.mean)}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(i)}
              className="cursor-pointer outline-none"
            />
          </g>
        ))}
        <text x={pad.l} y={H - 6} fontSize="11" fill="var(--ink-3)">
          {short(points[0].at)}
        </text>
        {n > 1 ? (
          <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="11" fill="var(--ink-3)">
            {short(points[last].at)}
          </text>
        ) : null}
      </svg>
      {sp ? (
        <div
          className={cn(
            "pointer-events-none absolute z-10 -translate-y-full rounded-xl border border-line bg-elev px-3 py-2 text-[12px] whitespace-nowrap shadow-md transition-opacity",
            x(shown) < W * 0.2 ? "-translate-x-4" : x(shown) > W * 0.8 ? "-translate-x-[calc(100%-1rem)]" : "-translate-x-1/2",
            active == null && "opacity-0",
          )}
          style={{ left: x(shown), top: y(sp.mean), marginTop: -12 }}
          aria-hidden={active == null}
        >
          <p className="font-medium text-ink tabular">Média {fmtScore(sp.mean)}</p>
          <p className="max-w-56 truncate text-ink-3">
            {fmtDate(sp.at)} · {sp.attempt.title.split(" · ")[0]}
          </p>
        </div>
      ) : null}
    </div>
  );
}
