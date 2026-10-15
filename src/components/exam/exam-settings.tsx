"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { Switch } from "@/components/arc/switch/switch";
import { Kbd } from "@/components/ui/kbd";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { setPrefs, usePrefs } from "@/lib/store";

const SHORTCUTS: [string[], string][] = [
  [["A", "–", "E"], "Marcar alternativa"],
  [["⇧", "A–E"], "Riscar alternativa"],
  [["1", "2", "3"], "Certeza, dúvida ou chute"],
  [["←", "→"], "Questão anterior ou próxima"],
  [["R"], "Marcar para revisar"],
  [["M"], "Ligar ou desligar o marca-texto"],
];

export function ExamSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs();
  return (
    <Modal open={open} onClose={onClose} title="Ajustes da prova" description="Valem para todas as provas neste navegador." size="sm">
      <div className="space-y-6">
        <Field label="Tamanho do texto">
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-sunken p-1">
            <StepButton
              aria-label="Diminuir texto"
              disabled={prefs.readingSize <= 14}
              onClick={() => setPrefs({ readingSize: Math.max(14, prefs.readingSize - 1) })}
            >
              <Minus />
            </StepButton>
            <span className="w-11 text-center text-[13px] font-medium tabular">{prefs.readingSize}px</span>
            <StepButton
              aria-label="Aumentar texto"
              disabled={prefs.readingSize >= 24}
              onClick={() => setPrefs({ readingSize: Math.min(24, prefs.readingSize + 1) })}
            >
              <Plus />
            </StepButton>
          </div>
        </Field>
        <Field label="Tema">
          <Segmented
            label="Tema"
            value={prefs.theme}
            onChange={(v) => setPrefs({ theme: v })}
            options={[
              { value: "light", label: "Claro" },
              { value: "dark", label: "Escuro" },
              { value: "system", label: "Sistema" },
            ]}
          />
        </Field>
        <Toggle
          label="Perguntar minha confiança"
          detail="Depois de marcar, você indica certeza, dúvida ou chute. O resultado mostra o quanto sua intuição acerta."
          checked={prefs.askConfidence}
          onChange={(v) => setPrefs({ askConfidence: v })}
        />
        <Toggle
          label="Esconder cronômetro"
          detail="O tempo continua contando, mas some da tela."
          checked={prefs.hideTimer}
          onChange={(v) => setPrefs({ hideTimer: v })}
        />
        {/* atalhos só servem com teclado físico: no celular a lista só empurra o modal */}
        <div className="max-sm:hidden">
          <p className="text-[13px] font-medium text-ink">Atalhos de teclado</p>
          <ul className="mt-2.5 space-y-2">
            {SHORTCUTS.map(([keys, label]) => (
              <li key={label} className="flex items-center justify-between text-[13px] text-ink-2">
                {label}
                <span className="flex items-center gap-1">
                  {keys.map((k) => (k === "–" ? <span key={k} className="text-ink-3">–</span> : <Kbd key={k}>{k}</Kbd>))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[13px] font-medium text-ink">{label}</p>
      {children}
    </div>
  );
}

function StepButton(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="grid size-7 place-items-center rounded-full text-ink-2 transition-colors hover:bg-elev hover:text-ink disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-3.5"
      {...props}
    />
  );
}

function Toggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  // A prop `label` do Switch do Arc desenha o texto ao lado da chave; aqui o título já está à esquerda,
  // então ele só nomeia a chave (aria-labelledby). Clicar no texto também liga e desliga.
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer">
        <span id={`${id}-label`} className="block text-[13px] font-medium text-ink">
          {label}
        </span>
        <span id={`${id}-detail`} className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-3">
          {detail}
        </span>
      </label>
      <Switch
        id={id}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-detail`}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
