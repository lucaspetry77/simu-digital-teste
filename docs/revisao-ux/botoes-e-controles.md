# Botões e controles

Botões que mudam de tamanho sozinhos, controles que aceitam clique quando não fazem nada, cliques que não dão
retorno e elementos que parecem clicáveis só em parte.

---

## 1. O cronômetro alargava no hover e empurrava o cabeçalho da prova

- **Onde**: prova, cronômetro no canto superior direito.
  [exam-timer.tsx:75](../../src/components/exam/exam-timer.tsx:75)
- **O que a pessoa via**: ao passar o mouse no cronômetro, um ícone de olho surgia ao lado dos números. O
  botão crescia ~18 px e os botões Marca-texto, Respirar e Ajustes andavam para a esquerda.
- **Causa**: o ícone extra era `hidden group-hover:block`, ou seja, entrava no fluxo só no hover.
- **Correção**: o ícone de relógio dá lugar ao "olho cortado" (a ação: esconder) no mesmo espaço de 16 px,
  trocando só a opacidade. A largura ficou igual com e sem hover (medido: 102 px nos dois casos).
- **Para não repetir**: nada que aparece no hover deve entrar no fluxo do layout. Troque opacidade, cor ou um
  ícone de mesmo tamanho; nunca `display`.

## 2. Tamanho do texto: os botões − e + não mostravam o limite

- **Onde**: prova → Ajustes → Tamanho do texto.
  [exam-settings.tsx:28](../../src/components/exam/exam-settings.tsx:28)
- **O que a pessoa via**: em 14 px o "−" continuava com cara de clicável e não fazia nada (o mesmo com "+"
  em 24 px).
- **Correção**: os botões ficam desabilitados nos limites, com opacidade reduzida e sem hover.

## 3. Treinos rápidos: o clique não mostrava qual cartão estava abrindo

- **Onde**: início e painel, cartões "Aquecimento", "Matemática", "2º dia completo".
  [quick-start.tsx:80](../../src/components/home/quick-start.tsx:80)
- **O que a pessoa via**: ao clicar, todos os cartões ficavam apagados (`opacity-60`) e nada indicava
  progresso. Na primeira visita o catálogo leva alguns segundos para carregar, e parecia que o clique tinha
  desligado os cartões.
- **Correção**: o cartão clicado troca o detalhe por "Abrindo a prova…" com um indicador girando e
  `aria-busy`; os outros continuam apagados e indisponíveis.
- **Para não repetir**: ação assíncrona disparada por um entre vários itens precisa marcar *qual* item está
  carregando, não só desligar todos.

## 4. Botão "Definir minha meta" sem hover no tema escuro

- **Onde**: início, bloco final ("Um simulado pode levar só 15 minutos").
  [page.tsx:280](../../src/app/(site)/page.tsx:280)
- **O que a pessoa via**: no tema escuro o bloco fica claro (ele usa `bg-ink`, que inverte com o tema), e o
  hover do botão fantasma, `bg-white/10`, sumia sobre o fundo claro.
- **Correção**: `hover:bg-inverse/10`, que acompanha a inversão do bloco nos dois temas.
- **Para não repetir**: em superfícies que invertem com o tema, use os tokens (`inverse`, `ink`), nunca
  `white`/`black` fixos.

## 5. Fontes da metodologia: o cartão subia no hover, mas só o título era link

- **Onde**: Como funciona → Fontes dos dados.
  [metodologia/page.tsx:185](../../src/app/(site)/metodologia/page.tsx:185)
- **O que a pessoa via**: o cartão inteiro reagia ao mouse (efeito `lift`), mas clicar na descrição não
  fazia nada.
- **Correção**: o `<a>` virou o próprio cartão; o título continua sublinhando no hover.
- **Para não repetir**: se o elemento inteiro reage ao hover, o elemento inteiro precisa ser clicável.

## 6. "Revisar depois" sem nome no celular

- **Onde**: prova, botão de marcar para revisar (ao lado do número da questão).
  [question-view.tsx:106](../../src/components/exam/question-view.tsx:106)
- **O que a pessoa via**: no celular o texto do botão é escondido e sobra só o ícone. O texto usava
  `hidden`, que tira o conteúdo também dos leitores de tela: o botão era anunciado só como "botão,
  pressionado".
- **Correção**: `sr-only sm:not-sr-only` (o texto some da tela, mas continua sendo o nome do botão) e um
  `title` com o atalho (R).
- **Para não repetir**: para esconder texto só visualmente, use `sr-only`, nunca `hidden`.

## 7. Busca de curso: dica de Esc quando ele não fazia nada, e o foco se perdia ao limpar

- **Onde**: Minha meta, campo de busca. [goal-setup.tsx:63](../../src/components/goal/goal-setup.tsx:63)
- **O que a pessoa via**: com o campo vazio aparecia a tecla "ESC", mas o Esc só limpa o texto, então ali
  não fazia nada. Com texto, o "×" limpava, mas o foco ia para o nada e era preciso clicar no campo de novo.
- **Correção**: a dica "ESC" saiu (o "×" agora diz "Limpar busca (Esc)" no rótulo e no `title`, tem área de
  clique de 32 px) e limpar devolve o foco ao campo.

## 8. "Ver no painel" piscava por menos de um segundo

- **Onde**: Minha meta, depois de "Definir como minha meta".
  [goal-setup.tsx:117](../../src/components/goal/goal-setup.tsx:117)
- **O que a pessoa via**: ao salvar, um link "Ver no painel" aparecia e 0,9 s depois a tela trocava para a
  meta atual, levando o link junto. Quem tentava clicar errava.
- **Correção**: o link saiu do estado transitório e virou a primeira ação da tela da meta atual, ao lado de
  "Trocar de curso" e "Remover meta".
- **Para não repetir**: não ofereça ações dentro de um estado que some sozinho.

## 9. Filtro de área do caderno ficava preso numa área que sumiu

- **Onde**: Caderno de erros, filtros por área. [notebook.tsx:55](../../src/components/home/notebook.tsx:55)
- **O que a pessoa via**: com "Matemática" filtrado, trocar para a aba "Dominadas" (ou resolver a última
  questão de Matemática) fazia o chip "Matemática" sumir, mas o filtro continuava valendo: lista vazia e
  nenhum chip marcado, nem "Todas".
- **Correção**: se a área escolhida não existe na aba atual, o filtro efetivo volta para "Todas" (e o chip
  "Todas" aparece marcado).
- **Para não repetir**: quando as opções de um filtro são derivadas dos dados, o valor selecionado também
  precisa ser validado contra elas.

## 10. Pausa para respirar: o botão final não recebia foco

- **Onde**: prova → Respirar, ao fim dos 3 ciclos. [breathe.tsx:83](../../src/components/exam/breathe.tsx:83)
- **O que a pessoa via**: o botão "Voltar para a prova" tinha `data-autofocus`, mas esse atributo só é lido
  pelo componente `Modal`, que a pausa não usa. Quem usa teclado precisava procurar o botão.
- **Correção**: `autoFocus` no botão, que recebe o foco quando aparece.

## 11. Ajustes da prova: o nome de cada interruptor aparecia duas vezes (2ª rodada)

- **Onde**: prova → Ajustes → "Perguntar minha confiança" e "Esconder cronômetro".
  [exam-settings.tsx:122](../../src/components/exam/exam-settings.tsx:122)
- **O que a pessoa via**: o título à esquerda e, de novo, o mesmo texto ao lado do interruptor, espremido em
  2–3 linhas.
- **Causa**: a prop `label` do `Switch` do Arc desenha o texto visível ao lado da chave, além de nomeá-la.
- **Correção**: o `Switch` passou a ser nomeado por `aria-labelledby` (título) e `aria-describedby`
  (descrição). O texto da esquerda virou `<label>`, então clicar nele também liga e desliga.
- **Para não repetir**: antes de usar a prop `label` de um componente de biblioteca, confira se ela é visível.

## 12. "Quão confiante você está?": opção cortada em "Fiquei em dú…"

- **Onde**: prova, painel que aparece depois de marcar uma alternativa.
  [question-view.tsx:159](../../src/components/exam/question-view.tsx:159)
- **O que a pessoa via**: no desktop, a pergunta quebrava em duas linhas e o botão do meio aparecia como
  "Fiquei em dú…". No celular os três botões ficavam cortados.
- **Causa**: os três botões ficavam em `grid-cols-3`, ou seja, três colunas iguais. "Fiquei em dúvida" com
  ícone e atalho não cabia num terço.
- **Correção**: do `sm` para cima, cada botão tem a largura do próprio texto (`sm:flex`) e a pergunta não
  quebra. No celular, as três colunas iguais ficam com rótulos curtos ("Certeza", "Dúvida", "Chute"), os
  mesmos da prévia da página inicial.

## 13. "Trocar de curso" não tinha volta

- **Onde**: Minha meta, com uma meta já definida. [goal-setup.tsx:122](../../src/components/goal/goal-setup.tsx:122)
- **O que a pessoa via**: depois de clicar em "Trocar de curso", a única saída era escolher outro curso (ou
  recarregar a página).
- **Correção**: o link "× Manter a meta atual (Curso · Sigla)" aparece abaixo do título enquanto a troca está
  aberta.

## 14. Ajustes para toque e teclado no celular

Itens apontados pela sessão de revisão do celular, em arquivos que estavam com esta sessão:

- **Botão de riscar com 32 px**: ganhou uma área de toque invisível de 44 px (`after:-inset-1.5`) sem mudar o
  desenho. [question-view.tsx:270](../../src/components/exam/question-view.tsx:270)
- **Lista de atalhos de teclado nos Ajustes**: escondida abaixo de 640 px (`max-sm:hidden`), onde não há teclado
  físico e a lista só alongava o modal. [exam-settings.tsx:69](../../src/components/exam/exam-settings.tsx:69)
