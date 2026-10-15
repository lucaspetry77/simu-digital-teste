# Rolagem e navegação

Detalhes de "onde a pessoa está" e "para onde ela vai": posição de rolagem que não acompanha a ação,
destaque que fica para trás e menus que continuam abertos depois que a tela mudou.

---

## 1. A revisão de questões não voltava ao topo ao trocar de questão

- **Onde**: resultado → modal de revisão. [review.tsx:240](../../src/components/results/review.tsx:240)
- **O que a pessoa via**: lia a resolução até o fim, clicava em "Próxima" (ou →) e a questão seguinte já
  abria no meio, com o enunciado escondido acima.
- **Causa**: as colunas com rolagem eram os mesmos elementos de uma questão para a outra; só o conteúdo de
  dentro mudava, então o `scrollTop` ficava.
- **Correção**: `key={row.id}` no contêiner das colunas. Cada questão monta colunas novas, que começam do topo.
- **Para não repetir**: quando um painel com rolagem própria troca de "documento" (outra questão, outro item),
  ou zere o `scrollTop`, ou dê ao painel uma `key` ligada ao item.

## 2. O cartão-resposta não acompanhava a questão atual

- **Onde**: prova, cartão-resposta lateral e o do celular (modal).
  [answer-sheet.tsx:27](../../src/components/exam/answer-sheet.tsx:27)
- **O que a pessoa via**: numa prova de 90 questões o cartão tem rolagem própria. Avançando com → até a
  questão 61, o destaque da questão atual ficava fora da área visível. No celular, abrir o cartão na questão
  70 mostrava sempre o começo da lista.
- **Correção**: a cada troca de questão, o botão atual chama `scrollIntoView({ block: "nearest" })`, que só
  rola o necessário e não mexe na página (conferido: `window.scrollY` continua 0).
- **Para não repetir**: listas com rolagem interna que têm um "item atual" precisam trazê-lo à vista quando
  ele muda por outro caminho (teclado, botões, abrir o modal).

## 3. As bolinhas da revisão não acompanhavam a questão aberta

- **Onde**: resultado → modal de revisão. [review.tsx:160](../../src/components/results/review.tsx:160)
- **O que a pessoa via**: o mesmo do item 2, na faixa horizontal de bolinhas do topo do modal.
- **Correção**: a bolinha atual chama `scrollIntoView({ block: "nearest", inline: "nearest" })` quando o
  índice muda.

## 4. No celular, escolher um curso da meta não mostrava nada

- **Onde**: Minha meta, busca de cursos (telas menores que 1024 px).
  [goal-setup.tsx:58](../../src/components/goal/goal-setup.tsx:58)
- **O que a pessoa via**: no celular o detalhe do curso fica abaixo da lista de resultados (que pode ter
  440 px). Tocar num curso não dava sinal nenhum: o detalhe aparecia fora da tela.
- **Correção**: ao escolher um curso em telas menores que `lg`, a página rola até o detalhe (suave, ou
  instantâneo com "reduzir movimento" ligado). O contêiner do detalhe tem `scroll-mt-20` para não ficar
  embaixo do cabeçalho fixo.
- **Para não repetir**: em layouts de duas colunas que viram uma só no celular, toda ação na coluna de cima
  que muda a de baixo precisa levar a pessoa até lá.

## 5. O menu do celular continuava aberto depois de trocar de página

- **Onde**: cabeçalho do site, menu do celular. [site-header.tsx:30](../../src/components/shell/site-header.tsx:30)
- **O que a pessoa via**: com o menu aberto, tocar no logo ou usar o "voltar" do navegador trocava a página,
  mas o menu continuava aberto por cima do conteúdo novo. O Esc também não fechava o menu.
- **Causa**: só os links de dentro do menu chamavam `setOpen(false)`.
- **Correção**: o menu fecha sempre que o `pathname` muda (estado ajustado durante a renderização, sem
  efeito) e com a tecla Esc.

## 6. O destaque do menu ficava preso no último link depois do Tab

- **Onde**: cabeçalho do site, menu do desktop. [site-header.tsx:54](../../src/components/shell/site-header.tsx:54)
- **O que a pessoa via**: navegando com Tab pelo menu, o fundo de destaque seguia o foco. Ao sair do menu
  (Tab para o botão de tema), o destaque ficava parado no último link visitado, como se ele estivesse ativo.
- **Causa**: os links acendiam o destaque no `onFocus`, mas nada apagava no `blur` (só no `mouseleave`).
- **Correção**: `onBlur` no `<nav>` limpa o destaque quando o foco vai para fora dele (`relatedTarget` fora
  do menu).
- **Para não repetir**: todo estado ligado em `onFocus`/`onMouseEnter` precisa de um par em
  `onBlur`/`onMouseLeave`.
