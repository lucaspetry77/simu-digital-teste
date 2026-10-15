"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

const CYCLE = 8; // 4s inspirando, 4s soltando
const ROUNDS = 3;

/** Pausa de respiração: 3 ciclos lentos para baixar a ansiedade no meio da prova. */
export function Breathe({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [t, setT] = useState(0);

  const [openedAt, setOpenedAt] = useState(open);
  if (open !== openedAt) {
    setOpenedAt(open);
    if (open) setT(0);
  }

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setT((v) => v + 1), 1000);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const done = t >= CYCLE * ROUNDS;
  const inhale = t % CYCLE < CYCLE / 2;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-bg/95 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Pausa para respirar"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar para a prova"
            className="absolute top-5 right-5 grid size-10 place-items-center rounded-full text-ink-3 hover:bg-hover hover:text-ink"
          >
            <X className="size-5" />
          </button>
          <div className="relative grid size-72 place-items-center">
            <motion.div
              className="absolute inset-0 rounded-full bg-brand/10"
              animate={{ scale: done ? 0.75 : inhale ? 1 : 0.55 }}
              transition={{ duration: CYCLE / 2, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-10 rounded-full bg-brand/15"
              animate={{ scale: done ? 0.7 : inhale ? 1 : 0.5 }}
              transition={{ duration: CYCLE / 2, ease: "easeInOut", delay: 0.15 }}
            />
            <div className="relative text-center">
              <p className="text-[44px] leading-none font-semibold tracking-[-0.04em] text-ink">
                {done ? "Pronto." : inhale ? "Inspire" : "Solte"}
              </p>
              <p className="mt-3 text-[13px] text-ink-3">
                {done ? "Volte com calma." : `${Math.min(ROUNDS, Math.floor(t / CYCLE) + 1)} de ${ROUNDS}`}
              </p>
            </div>
          </div>
          <p className="mt-10 max-w-xs text-center text-[13px] leading-relaxed text-ink-3">
            O cronômetro continua correndo, como no dia da prova. Trinta segundos de respiração costumam valer
            mais que trinta segundos encarando a mesma questão.
          </p>
          {done ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-6 h-11 rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover"
              autoFocus
            >
              Voltar para a prova
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
