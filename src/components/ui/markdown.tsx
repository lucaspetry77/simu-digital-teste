import type { Element, Root } from "hast";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/cn";
import { assetUrl } from "@/lib/data";

const components: Components = {
  img: ({ src, alt }) => (
    // Imagens das provas têm tamanhos variados e vêm da origem do SIMU.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={assetUrl(typeof src === "string" ? src : "")} alt={alt || "Figura da questão"} loading="lazy" decoding="async" />
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};

/* As provas escrevem milhar com espaço ("R$ 1 000 000,00"), e a quebra de linha partia o número ao
   meio. Esse espaço (e o depois de "R$") vira não-separável. Fórmulas (code/pre) ficam de fora. */
const NUMBER_SPACE = /(\d) (?=\d{3}(?!\d))|(R\$) (?=\d)/g;
function keepNumbersTogether() {
  const walk = (node: Root | Element) => {
    for (const child of node.children) {
      if (child.type === "text") child.value = child.value.replace(NUMBER_SPACE, "$1$2\u00a0");
      else if (child.type === "element" && child.tagName !== "code" && child.tagName !== "pre") walk(child);
    }
  };
  return walk;
}

/* Alternativa que é só uma fórmula ("$\frac1{12}$", às vezes com ponto final): no modo de texto o KaTeX
   encolhe numerador e denominador para 70%, e a resposta fica menor que o resto da prova. */
const MATH_ONLY = /^\s*\$([^$]+)\$\s*([.;,]?)\s*$/;
export const isMathOnly = (text: string) => MATH_ONLY.test(text);
const asDisplayMath = (text: string) =>
  text.replace(MATH_ONLY, (_, tex: string, punct: string) => `$\\displaystyle ${tex.trim()}$${punct}`);

/**
 * Texto de uma alternativa. Fórmula sozinha sai em tamanho de destaque. Riscada, ela ganha um traço
 * diagonal próprio: o `line-through` não atravessa os blocos do KaTeX e, numa fração, um traço reto
 * sumiria em cima da barra. Fórmulas no meio do texto recebem o risco em cada pedaço.
 */
export function OptionText({ text, struck }: { text: string; struck?: boolean }) {
  if (isMathOnly(text)) {
    return (
      <span
        className={cn(
          "relative inline-block",
          struck &&
            "after:absolute after:inset-x-[-4px] after:top-1/2 after:h-[1.5px] after:-rotate-12 after:rounded-full after:bg-current",
        )}
      >
        <Markdown>{asDisplayMath(text)}</Markdown>
      </span>
    );
  }
  return (
    <span className={cn(struck && "[&_.katex_*]:line-through")}>
      <Markdown>{text}</Markdown>
    </span>
  );
}

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [keepNumbersTogether, rehypeKatex];

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
}
