# Recortes e foco

Elementos que desenham fora da própria caixa (anéis de `ring-offset`, contorno de foco do teclado,
bolinhas posicionadas com `-top-1 -right-1`) são cortados por qualquer ancestral com `overflow` diferente de
`visible`. E `overflow-y: auto` sozinho já corta também na horizontal: o navegador transforma o `overflow-x`
em `auto`.

---

## 1. Anel da questão atual e bolinha de "revisar" cortados no cartão-resposta

- **Onde**: prova, cartão-resposta lateral (desktop).
  [exam-screen.tsx:348](../../src/components/exam/exam-screen.tsx:348),
  [answer-sheet.tsx](../../src/components/exam/answer-sheet.tsx)
- **O que a pessoa via**: o anel azul da questão 1 aparecia cortado no topo e à esquerda (o print que
  originou esta revisão). A bolinha laranja de "revisar" das questões da primeira linha também perdia a
  metade de cima. O contorno de foco do teclado (2 px + 2 px de afastamento) sofria do mesmo jeito.
- **Causa**: a grade fica dentro de `max-h-[52vh] overflow-y-auto` sem respiro em cima nem à esquerda. O
  anel (`ring-2 ring-offset-2`) ocupa 4 px fora do botão e a bolinha sai 4 px pelo canto, então tudo o que
  estava nessa faixa era cortado pela área de rolagem.
- **Correção**: a área de rolagem ganhou `p-1.5` (6 px, mais que os 4 px do anel) e `-mx-1.5` para os
  números continuarem alinhados com o título "Cartão-resposta".
- **Para não repetir**: todo contêiner com `overflow-*` que tenha filhos com `ring-offset`, contorno de
  foco ou selos posicionados para fora precisa de um *padding* interno pelo menos do tamanho desse excesso.
  Se o padding mudar o alinhamento, compense com margem negativa.

## 2. Anel da bolinha atual cortado na revisão de questões

- **Onde**: resultado → "Revise questão por questão" → modal de revisão, faixa de bolinhas no topo.
  [review.tsx:209](../../src/components/results/review.tsx:209)
- **O que a pessoa via**: ao abrir a questão 1 (ou a última), o anel preto em volta da bolinha atual
  aparecia cortado na lateral.
- **Causa**: a faixa é `overflow-x-auto` com `py-1` mas sem padding lateral; o anel (`ring-offset-2`)
  passava da borda na primeira e na última bolinha.
- **Correção**: `px-1.5 py-1.5` na faixa.
- **Para não repetir**: mesma regra do item 1.

## 3. Ao rolar até a questão atual, o anel ficava colado (e cortado) na borda

- **Onde**: prova, cartão-resposta. [answer-sheet.tsx:55](../../src/components/exam/answer-sheet.tsx:55)
- **O que a pessoa via**: depois da correção de rolagem automática (ver
  [rolagem-e-navegacao.md](rolagem-e-navegacao.md#2-o-cartão-resposta-não-acompanhava-a-questão-atual)),
  voltar com ← até a primeira questão de uma área deixava o botão encostado no topo da área de rolagem: o anel
  e a bolinha cortados de novo e o nome da área ("Linguagens") escondido acima.
- **Causa**: `scrollIntoView` alinha a borda do próprio elemento com a borda da área visível. Ele ignora o
  padding do contêiner e não sabe do anel, que fica fora da caixa.
- **Correção**: `scroll-mt-8 scroll-mb-2` nos botões. A margem de rolagem de cima (32 px) deixa à vista o anel
  e o rótulo da área; a de baixo, o anel.
- **Para não repetir**: ao usar `scrollIntoView`, considere `scroll-margin` no alvo para tudo o que precisa
  ficar visível em volta dele.

## 4. Contorno de seleção da lista de modalidades encostado na borda (2ª rodada)

- **Onde**: Minha meta → Modalidade de concorrência (lista com rolagem própria).
  [goal-setup.tsx:373](../../src/components/goal/goal-setup.tsx:373)
- **O que a pessoa via**: o anel de seleção do cartão escolhido e o contorno de foco do teclado (2 px + 2 px
  de afastamento) eram cortados nas bordas da lista.
- **Causa**: o mesmo padrão do item 1: `overflow-y-auto` com só `p-0.5` (2 px) de respiro.
- **Correção**: `p-1`.
