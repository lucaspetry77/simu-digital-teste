"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MenuIcon } from "@/components/arc/icon-morph/icon-morph";
import { motionTokens } from "@/components/arc/lib/motion-tokens";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { AnimIcon } from "@/components/ui/anim-icon";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/novo", label: "Simulado" },
  { href: "/painel", label: "Painel" },
  { href: "/caderno", label: "Caderno de erros" },
  { href: "/meta", label: "Minha meta" },
  { href: "/metodologia", label: "Como funciona" },
];

const { duration, ease, spring, stagger } = motionTokens;
const enter = [...ease.enter] as [number, number, number, number];
const standard = [...ease.standard] as [number, number, number, number];

type Hover = { href: string | null; left: number; right: number; glide: boolean };

export function SiteHeader() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<Hover>({ href: null, left: 0, right: 0, glide: false });
  const [menuPath, setMenuPath] = useState(pathname);
  // qualquer troca de página (logo, voltar do navegador, links do conteúdo) fecha o menu do celular
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const active = NAV.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))?.href ?? null;

  // A pílula do hover é uma só, recortada sobre o link da vez. Ao entrar no menu ela surge já no lugar
  // (sem deslizar de onde estava da última vez); entre links ela desliza; ao sair, apaga onde está.
  const hoverItem = (el: HTMLElement, href: string) => {
    const nav = navRef.current;
    if (!nav) return;
    const n = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setHover((h) => ({ href, left: r.left - n.left, right: n.right - r.right, glide: h.href !== null }));
  };
  const clearHover = () => setHover((h) => (h.href === null ? h : { ...h, href: null }));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="SIMU, início" className="shrink-0 rounded-lg">
            <Logo />
          </Link>
          <nav
            ref={navRef}
            aria-label="Principal"
            onPointerLeave={clearHover}
            // sem isto o destaque do Tab ficava preso no último link depois que o foco saía do menu
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) clearHover();
            }}
            className="relative hidden flex-1 items-center gap-0.5 lg:flex"
          >
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-hover"
              initial={false}
              animate={{
                clipPath: `inset(0px ${hover.right}px 0px ${hover.left}px round 999px)`,
                opacity: hover.href ? 1 : 0,
              }}
              transition={{
                clipPath: hover.glide && !reduce ? spring.snappy : { duration: 0 },
                opacity: { duration: duration.fast, ease: standard },
              }}
            />
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active === item.href ? "page" : undefined}
                // só mouse: no toque o "hover" disparava no tap e ficava preso
                onPointerEnter={(e) => e.pointerType === "mouse" && hoverItem(e.currentTarget, item.href)}
                onFocus={(e) => hoverItem(e.currentTarget, item.href)}
                className={cn(
                  "relative rounded-full px-3 py-2 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-200",
                  active === item.href || hover.href === item.href ? "text-ink" : "text-ink-3",
                )}
              >
                {active === item.href ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-elev shadow-sm ring-1 ring-line"
                    transition={spring.morph}
                  />
                ) : null}
                <span className="relative">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <ButtonLink href="/novo" size="sm" className="hidden sm:inline-flex">
              Começar simulado
              <AnimIcon icon={ArrowRightIcon} size={15} />
            </ButtonLink>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-hover lg:hidden"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              aria-controls="menu-celular"
              onClick={() => setOpen((v) => !v)}
            >
              <MenuIcon state={open} size={20} />
            </button>
          </div>
        </div>
        {/* O painel flutua sobre a página em vez de crescer o header: animar a altura do header sticky
            empurrava e recalculava a página inteira a cada quadro. */}
        <AnimatePresence initial={false}>
          {open ? (
            <motion.nav
              id="menu-celular"
              aria-label="Menu"
              initial={reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
              animate={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
              exit={
                reduce
                  ? { opacity: 0, transition: { duration: duration.exit } }
                  : { clipPath: "inset(0% 0% 100% 0%)", transition: { duration: duration.exit, ease: standard } }
              }
              transition={{ duration: duration.standard + 0.04, ease: enter }}
              className="absolute inset-x-0 top-full border-b border-line bg-bg lg:hidden"
            >
              <ul className="flex flex-col gap-1 px-4 py-3">
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }}
                    animate={{ opacity: 1, transform: "translateY(0px)" }}
                    transition={{ duration: duration.standard, ease: enter, delay: reduce ? 0 : 0.04 + i * stagger.item }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-xl px-3 py-3 text-[15px] font-medium transition-colors hover:bg-hover",
                        active === item.href ? "bg-hover text-ink" : "text-ink-2",
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
                <motion.li
                  className="pt-2"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  transition={{ duration: duration.standard, ease: enter, delay: reduce ? 0 : 0.04 + NAV.length * stagger.item }}
                >
                  <ButtonLink href="/novo" onClick={() => setOpen(false)} className="w-full">
                    Começar simulado
                  </ButtonLink>
                </motion.li>
              </ul>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </header>
      {/* Fora do header: o backdrop-filter dele prenderia um elemento fixed dentro da própria caixa. */}
      <AnimatePresence>
        {open ? (
          <motion.div
            aria-hidden="true"
            className="fixed inset-x-0 top-16 bottom-0 z-30 bg-ink/15 lg:hidden dark:bg-black/40"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: duration.standard, ease: standard } }}
            exit={{ opacity: 0, transition: { duration: duration.exit, ease: standard } }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
