"use client";

import { Suspense, use } from "react";
import { browser } from "react-dom";

/**
 * Renderiza os filhos só no navegador (dados do localStorage). No HTML
 * pré-renderizado aparece o `fallback` — normalmente um esqueleto.
 */
function Gate({ children, reason }: { children: React.ReactNode; reason: string }) {
  use(browser(reason));
  return <>{children}</>;
}

export function BrowserOnly({
  children,
  fallback = null,
  reason = "Lê dados salvos neste navegador.",
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  reason?: string;
}) {
  return (
    <Suspense fallback={fallback}>
      <Gate reason={reason}>{children}</Gate>
    </Suspense>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-sunken ${className ?? ""}`} />;
}
