# Revisão de detalhes de UX

Revisão feita em 14/10/2026 em todas as telas do SIMU (início, montar simulado, prova, resultado, painel,
caderno de erros, meta e metodologia), procurando detalhes pequenos que pioram a experiência: coisas
cortadas, que pulam, que piscam, que mentem um pouco ou que somem quando a pessoa mais precisa delas.

O ponto de partida foi o cartão-resposta da prova: o anel azul da questão atual aparecia cortado no topo e
à esquerda. A causa (um contêiner com rolagem cortando o que passa da borda dos filhos) se repetia em outros
lugares, e a busca por esse tipo de detalhe levou aos demais itens.

São 52 itens, todos corrigidos no código, em duas rodadas:

- **1ª rodada (35 itens)**: varredura do comportamento (o que corta, pula, pisca ou mente).
- **2ª rodada (17 itens, dois deles agrupando ajustes menores, e uma correção da 1ª rodada revista)**:
  varredura visual, que começou pelas frações quase invisíveis nas alternativas.
  Além do olho, um script no navegador procurou automaticamente texto sobreposto, texto cortado, elementos
  vazando da tela e contraste abaixo de 4,5:1. As telas foram verificadas em larguras de 375 a 1280 px e no
  tema escuro. Em cada documento, a 2ª rodada começa na entrada marcada "(2ª rodada)";
  [cores-e-contraste.md](cores-e-contraste.md) é inteiro dela.

Durante a 2ª rodada, duas outras sessões editavam o mesmo projeto ("revisão do celular" e "fluxo do /novo").
Os arquivos foram divididos entre as sessões para ninguém sobrescrever ninguém. Por isso alguns itens daqui
foram aplicados por elas, e isso está dito em cada um.

Os documentos estão separados por assunto:

| Documento | Assunto | Itens |
| --- | --- | --- |
| [recortes-e-foco.md](recortes-e-foco.md) | Anéis, bolinhas e contornos cortados por áreas com rolagem | 4 |
| [rolagem-e-navegacao.md](rolagem-e-navegacao.md) | Rolagem que não acompanha, menus que não fecham, destaque preso | 6 |
| [botoes-e-controles.md](botoes-e-controles.md) | Botões que mudam de tamanho, rótulos duplicados ou cortados, cliques sem retorno, filtros | 14 (+2 subitens) |
| [mensagens-e-textos.md](mensagens-e-textos.md) | Mensagens com a cor errada, números arredondados para baixo, promessas que não batem | 6 |
| [graficos-e-indicadores.md](graficos-e-indicadores.md) | Rótulos sobrepostos, eixos tortos, colunas desalinhadas, anel de 0%, ícones | 8 |
| [cores-e-contraste.md](cores-e-contraste.md) | Texto de apoio abaixo de 4,5:1 e dados que somem no tema escuro | 2 |
| [leitura-de-questoes.md](leitura-de-questoes.md) | Números partidos, figuras que empurram as alternativas, frações ilegíveis, risco que não risca | 4 |
| [layout-responsivo.md](layout-responsivo.md) | Conteúdo que empurra a página ao carregar, textos cortados, larguras e sobreposições no celular | 8 (+4 subitens) |

## Formato de cada item

- **Onde**: tela e arquivo.
- **O que a pessoa via**: o problema do ponto de vista de quem usa.
- **Causa**: o motivo técnico.
- **Correção**: o que mudou.
- **Para não repetir**: a regra que evita o mesmo erro em outro lugar.

## Como foi verificado

- `npx tsc --noEmit` e `npx eslint src` sem erros.
- Cada correção visível foi conferida no navegador (dev server em `localhost:3217`), em desktop (1280×800),
  celular (375 px) e tema escuro quando fazia diferença: medindo posições com `getBoundingClientRect`,
  disparando atalhos de teclado e comparando capturas de tela antes e depois.

## O que ficou de fora (para uma próxima rodada)

Achados que pedem uma mudança maior ou uma decisão de design, por isso não foram mexidos agora:

- **Modais sem trava de foco.** `Modal` e a revisão de questões focam o primeiro botão, mas o Tab ainda sai
  do modal para a página de trás. Vale um *focus trap* (ou o `<dialog>` nativo).
- **Alvos de toque pequenos no celular.** O botão de riscar já ganhou 44 px. Continuam pequenos as
  bolinhas da revisão (12 px) e os botões de "dominada" do caderno (32 px); o caderno é da sessão de revisão
  do celular.
- **Cartões que sobem no hover sem serem clicáveis.** Na página inicial, os cartões de recursos e os passos
  "Como a nota é calculada" usam o efeito `lift`, que sugere clique. É uma escolha visual da landing; se
  incomodar, basta tirar a classe `lift` desses elementos.
- **Gráfico de evolução só com mouse.** Os pontos mostram o balão no hover, mas não no toque nem no teclado.
- **Erros ao abrir um treino rápido.** Se o catálogo não carregar (sem internet), o erro do `useTransition`
  sobe para a página de erro do Next em vez de virar uma mensagem no próprio cartão.
