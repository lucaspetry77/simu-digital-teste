# Gráficos e indicadores

Rótulos que se atropelam, pontos e balões que encostam nas bordas e indicadores que mostram progresso que
não existe.

---

## 1. "você" e "média" escritos um em cima do outro

- **Onde**: resultado, distribuição nacional abaixo da nota.
  [score-hero.tsx:41](../../src/components/results/score-hero.tsx:41)
- **O que a pessoa via**: com nota 546 e média nacional 527, a etiqueta "você · 546" cobria o "média 527" (só o
  "27" sobrava à vista). Como a maioria das notas fica perto da média, isso acontecia com frequência. Notas
  muito baixas ou muito altas também faziam a etiqueta "você" vazar para fora do cartão.
- **Causa**: o "média" ficava sempre à direita da linha tracejada e o "você" sempre centralizado na própria
  linha, na mesma altura.
- **Correção**:
  - o "média" vai para o lado oposto ao da sua nota (nota acima da média: o rótulo vai para a esquerda);
  - perto da média (menos de 12% da escala), o "você" se ancora na própria linha, abrindo para longe da média;
  - nas pontas (abaixo de 7% ou acima de 93%) o "você" abre para dentro do gráfico.
- **Para não repetir**: rótulos de marcadores que podem coincidir precisam de uma regra de desvio; teste os
  casos "igual à média", "0" e "1000".

## 2. Com um simulado só, o ponto ficava colado no eixo

- **Onde**: painel → Evolução da nota TRI.
  [evolution-chart.tsx:40](../../src/components/home/evolution-chart.tsx:40)
- **O que a pessoa via**: depois do primeiro simulado, o único ponto do gráfico aparecia grudado nos números
  do eixo, com o resto do gráfico vazio.
- **Causa**: a escala X dividia por `n - 1` com `n` forçado a 2, então o índice 0 caía sempre na borda esquerda.
- **Correção**: com menos de dois simulados o ponto fica no centro.

## 3. O balão do gráfico de evolução vazava nas pontas

- **Onde**: painel → Evolução da nota TRI, ao passar o mouse num ponto.
  [evolution-chart.tsx:90](../../src/components/home/evolution-chart.tsx:90)
- **O que a pessoa via**: no primeiro e no último simulado, metade do balão (área · nota · data) saía pela
  lateral do cartão.
- **Correção**: nos 15% de cada ponta o balão abre para dentro do gráfico; no meio, continua centralizado.
  Também ganhou `whitespace-nowrap` para não quebrar a data.

## 4. Anel de acertos mostrava um pontinho com 0%

- **Onde**: resultado, cartão "Acertos". [score-hero.tsx:133](../../src/components/results/score-hero.tsx:133)
- **O que a pessoa via**: com 0 acertos o anel exibia um pontinho verde no topo, como se houvesse um pouco
  de progresso.
- **Causa**: o arco usa `strokeLinecap="round"`; um traço de comprimento zero com ponta arredondada ainda
  desenha um círculo.
- **Correção**: com valor 0 o arco não é desenhado, só o trilho.

## 5. Legenda do ritmo sem a cor das questões em branco

- **Onde**: resultado → Ritmo por questão. [insights.tsx:254](../../src/components/results/insights.tsx:254)
- **O que a pessoa via**: as barras têm três cores (verde, vermelho e cinza), mas a legenda só explicava
  "acerto" e "erro".
- **Correção**: a legenda mostra "em branco" quando existe alguma barra cinza (em branco ou anulada).

## 6. Ícone de "marcada para revisar" diferente entre a prova e o resultado

- **Onde**: resultado → lista do gabarito. [review.tsx:117](../../src/components/results/review.tsx:117)
- **O que a pessoa via**: na prova, "Revisar depois" usa um marcador de página (Bookmark); no gabarito, a
  mesma marcação aparecia como uma bandeirinha (Flag).
- **Correção**: o gabarito usa o mesmo Bookmark, preenchido, na cor de aviso, com o rótulo "Marcada para
  revisar" para leitores de tela.
- **Para não repetir**: um conceito, um ícone, em todas as telas.

## 7. Eixo do gráfico de evolução com valores quebrados (2ª rodada)

- **Onde**: painel → Evolução da nota TRI. [evolution-chart.tsx:45](../../src/components/home/evolution-chart.tsx:45)
- **O que a pessoa via**: marcas do eixo como 500, 463, 425, 388, 350.
- **Causa**: o eixo dividia a faixa em quatro partes iguais e arredondava cada uma.
- **Correção**: o passo é escolhido entre 25, 50, 100 e 200 (no máximo cinco intervalos) e o eixo vai de um
  múltiplo do passo ao outro: 350, 400, 450, 500. Aplicado pela sessão de revisão do celular, que estava com
  esse arquivo.

## 8. Colunas desalinhadas quando só algumas linhas têm ícone

- **Onde**: resultado → lista do gabarito ([review.tsx:113](../../src/components/results/review.tsx:113)) e o
  cartão da meta ([goal-progress.tsx:139](../../src/components/goal/goal-progress.tsx:139)).
- **O que a pessoa via**: no gabarito, o ícone de confiança "andava" para a esquerda nas linhas que também
  tinham o marcador de revisão. Na meta, a nota da Redação (sem alerta de nota mínima) ficava mais à direita
  que as outras quatro.
- **Causa**: ícones opcionais renderizados ou não, dentro de linhas alinhadas à direita.
- **Correção**: cada ícone opcional tem um espaço de largura fixa em todas as linhas (vazio quando não se
  aplica). Conferido: as colunas caem na mesma posição em todas as linhas (gabarito: 1051/1083/1115 px; meta: a
  nota termina em 1128 px nas cinco linhas).
- **Para não repetir**: em listas com colunas, ícone opcional ocupa sempre o mesmo espaço.
