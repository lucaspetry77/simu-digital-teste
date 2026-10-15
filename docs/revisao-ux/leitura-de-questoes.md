# Leitura das questões

Detalhes do texto da prova, que é onde a pessoa passa mais tempo.

---

## 1. Valores como "R$ 1 000 000,00" partidos na quebra de linha

- **Onde**: todo texto de questão, alternativa e resolução (componente `Markdown`).
  [markdown.tsx:23](../../src/components/ui/markdown.tsx:23)
- **O que a pessoa via**: as provas escrevem o milhar com espaço. No fim da linha o número se partia: "R$ 1 000"
  numa linha e "000,00" na seguinte, o que numa questão de matemática pode virar outra conta. Há cerca de
  700 ocorrências desse padrão nas 2.770 questões.
- **Correção**: um plugin rehype pequeno (`keepNumbersTogether`) troca, nos nós de texto, o espaço entre
  grupos de 3 dígitos e o espaço depois de "R$" por espaço não-separável (U+00A0). Blocos `code`/`pre`
  (onde ficam as fórmulas antes do KaTeX) não são tocados. Conferido no navegador: os três valores da
  questão 151 do ENEM 2019 agora quebram inteiros.
- **Para não repetir**: dados de prova vêm de fontes com convenções próprias; normalize a apresentação no
  componente que renderiza, não no dado.

## 2. Figuras empurravam as alternativas para baixo ao carregar

- **Onde**: prova, questões com figura ou tabela.
  [exam-screen.tsx:210](../../src/components/exam/exam-screen.tsx:210)
- **O que a pessoa via**: ao avançar para uma questão com imagem, o texto e as alternativas apareciam
  primeiro e, quando a imagem chegava, tudo descia de uma vez (na questão 140 do ENEM 2013, a tabela empurrou
  as alternativas cerca de 145 px), às vezes no momento em que a pessoa ia clicar.
- **Causa**: as imagens vêm do Markdown, sem largura e altura conhecidas, então o navegador não reserva o
  espaço antes de baixá-las.
- **Correção**: enquanto a pessoa lê uma questão, as figuras da próxima (enunciado, comando e alternativas)
  já são baixadas em segundo plano. Ao avançar, elas vêm do cache e aparecem junto com o texto.
- **Limite**: a primeira questão da prova e saltos diretos pelo cartão-resposta ainda podem "pular". A
  solução completa é gravar largura e altura de cada figura no `scripts/build-data.mjs` e passá-las para o
  `<img>`.

## 3. Frações nas alternativas com traço invisível e números miúdos (2ª rodada)

- **Onde**: prova e revisão, alternativas que são só uma fórmula (ex.: ENEM 2020, questão 142: 1/12, 7/12…).
  [globals.css:298](../../src/app/globals.css:298), [markdown.tsx:37](../../src/components/ui/markdown.tsx:37)
- **O que a pessoa via**: o print que abriu a 2ª rodada. O traço da fração quase não aparecia, e "1/12" parecia
  "1 12". Numerador e denominador saíam bem menores que o texto da prova.
- **Causa**: duas coisas do KaTeX.
  - O traço da fração tem `border-bottom-width: 0.04em`. Numa fração de texto (~14 px) isso dá 0,5 px, que
    em tela retina vira um único pixel físico, cinza claro.
  - Fórmula escrita como `$\frac1{12}$` (modo de texto) reduz numerador e denominador para 70%.
- **Correção**:
  - `.reading .katex .frac-line` (e as linhas de `\overline`/`\underline`) com `max(1px, 0.04em)`.
  - Alternativa que é só uma fórmula (com ou sem ponto final: 409 das 13.850 alternativas) é renderizada com
    `\displaystyle`, em tamanho cheio. A letra e o botão de riscar ficam centralizados com a fórmula, que é
    mais alta que uma linha.
- **Para não repetir**: espessura de traço em `em` precisa de piso em `px`; e conteúdo que é *a resposta*
  não pode sair menor que o enunciado.

## 4. Riscar uma alternativa com fórmula não riscava nada

- **Onde**: prova (Shift + letra ou botão de riscar) e o "Você riscou" da revisão.
  [markdown.tsx:47](../../src/components/ui/markdown.tsx:47)
- **O que a pessoa via**: a alternativa ficava só mais clara, sem o risco. Em fração, nem dava para saber se
  estava riscada ou desabilitada.
- **Causa**: `text-decoration: line-through` não atravessa elementos `inline-block`, e o KaTeX monta cada
  fórmula com eles. Numa fração, um traço reto no meio ainda cairia exatamente sobre a barra da fração.
- **Correção**: o novo componente `OptionText` desenha, na fórmula sozinha, um traço diagonal próprio (como
  quem risca a caneta no papel). Fórmula no meio de texto recebe `line-through` em cada pedaço do KaTeX. O mesmo
  componente é usado na prova e na revisão.
