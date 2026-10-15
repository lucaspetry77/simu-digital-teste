"use client";

import { useSyncExternalStore } from "react";
import { SunMoonIcon } from "@/components/arc/icon-morph/icon-morph";
import { cn } from "@/lib/cn";
import { setPrefs } from "@/lib/store";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const isDark = () => document.documentElement.dataset.theme === "dark";

/** Sol ↔ lua com o ícone que morfa do Arc. */
export function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return (
    <button
      type="button"
      onClick={() => setPrefs({ theme: dark ? "light" : "dark" })}
      aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
      className={cn(
        "grid size-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-hover hover:text-ink",
        className,
      )}
    >
      <SunMoonIcon state={dark} size={18} />
    </button>
  );
}
