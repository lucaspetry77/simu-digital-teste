# Layout e responsivo

Quebras de linha que sobram e elementos fixos que cobrem conteúdo.

---

## 1. Legenda do cartão-resposta com "Revisar" sozinho numa linha (e sumindo em provas longas)

- **Onde**: prova, cartão-resposta lateral e o do celular.
  [answer-sheet.tsx:78](../../src/components/exam/answer-sheet.tsx:78),
  [exam-screen.tsx:351](../../src/components/exam/exam-screen.tsx:351)
- **O que a pessoa via**: no print original, "Respondida" e "Em branco" numa linha e "Revisar" sozinho na
  seguinte. Além disso, a legenda ficava *dentro* da área com rolagem: numa prova de 90 questões ela só
  aparecia depois de rolar o cartão até o fim.
- **Causa**: os três itens somavam 231 px num espaço de 230 px (`gap-x-4`). E a legenda era renderizada pelo
  próprio `AnswerSheet`, que fica dentro do contêiner `overflow-y-auto`.
- **Correção**: a legenda virou o componente `AnswerSheetLegend`, renderizado fora da área de rolagem (na
  lateral e no modal do celular), com `gap-x-2.5` e `whitespace-nowrap` para caber numa linha (207 px de itens
  + 20 px de espaço).
- **Para não repetir**: legendas, totais e ações de uma lista com rolagem ficam fora da rolagem.

## 2. No celular, a barra "Começar" cobria o fim da página

> **Atualização**: depois desta correção, o `/novo` foi redesenhado em outra sessão (uma pergunta por tela,
> barra de progresso e uma barra de navegação única). A barra antiga não existe mais. A nova barra de
> navegação seguiu a mesma regra: `sticky bottom-0` dentro do formulário, sem cobrir o rodapé.

- **Onde**: Montar simulado (`/novo`), telas menores que 1024 px. `src/components/home/builder.tsx`
- **O que a pessoa via**: a barra com "Começar, 15 questões" era `fixed`. Rolando até o fim, ela ficava por
  cima do rodapé do site, cobrindo os links e o aviso "As notas são estimativas educacionais…".
- **Correção**: a barra virou `sticky bottom-0` no fim do próprio formulário: fica presa no pé da tela
  enquanto o formulário está à vista e para antes do rodapé (conferido: no fim da página a barra termina 64 px
  acima do rodapé). O `pb-28` que existia só para abrir espaço para a barra fixa caiu para `pb-16`.
- **Para não repetir**: prefira `sticky` dentro da seção a que o botão pertence; `fixed` atravessa a página
  inteira e precisa de compensação em todos os elementos de baixo.

## 3. A faixa "Prova em andamento" empurrava a página inicial para baixo (2ª rodada)

- **Onde**: página inicial, para quem tem uma prova pausada.
  [hero-badge.tsx:17](../../src/components/home/hero-badge.tsx:17)
- **O que a pessoa via**: o hero aparecia e, um instante depois, uma faixa de ~95 px surgia em cima dele e
  empurrava título, botões e prévia para baixo, no meio da leitura (e às vezes debaixo do cursor).
- **Causa**: a prova em andamento fica no `localStorage`, que só é lido no navegador. O HTML do servidor vinha
  sem a faixa, e ela era inserida depois da hidratação.
- **Correção**: a faixa saiu. O selo acima do título ("Gratuito, sem cadastro…") vira, quando há prova em
  andamento, o atalho "Continuar a prova: Matemática · edições variadas · 3/15 →", na mesma pílula e com a
  mesma altura. Conferido com `PerformanceObserver`: nenhum *layout shift* no carregamento.
- **Para não repetir**: conteúdo que depende do navegador entra num espaço que já existe no HTML do servidor
  (troca de conteúdo de mesmo tamanho), nunca como um bloco novo acima do conteúdo.

## 4. "Começar agora" pulava quando o banco de questões terminava de carregar

- **Onde**: Montar simulado (`/novo`), cartão de resumo.
- **O que a pessoa via**: o resumo aparecia com "Banco disponível …". Quando o catálogo chegava, surgia a linha
  "660 delas têm parâmetros TRI…" (~65 px) e o botão "Começar agora" descia ~50 px, bem onde a pessoa ia clicar.
- **Correção**: feita pela sessão que redesenhou o `/novo` (o arquivo estava com ela). O estado de carregamento
  passou a desenhar a mesma linha como esqueleto, com o mesmo texto e as mesmas classes, e a altura ficou
  idêntica antes e depois (84,9 px nos dois casos, medido em 320 px).

## 5. Nomes das modalidades de cota cortados com reticências

- **Onde**: Minha meta → detalhe do curso → Modalidade de concorrência.
  [goal-setup.tsx:378](../../src/components/goal/goal-setup.tsx:378),
  [radio-cards.module.css:67](../../src/components/arc/radio-cards/radio-cards.module.css:67)
- **O que a pessoa via**: várias opções iguais, "Escola pública · renda até 1 salário …". O que diferencia uma
  da outra (pretos, pardos ou indígenas; pessoa com deficiência; quilombolas…) fica justamente no fim do nome.
- **Correção**: o `RadioCards` do Arc ganhou a opção `wrapLabels`, que deixa o rótulo quebrar linha em vez de
  cortar. Ela é usada nessa lista. A área com rolagem da lista passou de `p-0.5` para `p-1`, para o anel de
  seleção e o contorno de foco não serem cortados
  ([goal-setup.tsx:373](../../src/components/goal/goal-setup.tsx:373)).

## 6. O caderno de erros tinha outra largura de página

- **Onde**: Caderno de erros. [notebook.tsx:71](../../src/components/home/notebook.tsx:71)
- **O que a pessoa via**: ao trocar de aba no menu, o título do caderno começava ~40 px mais à direita que em
  todas as outras páginas e não se alinhava com o logo.
- **Causa**: `max-w-5xl` no caderno (e no esqueleto dele); todas as outras páginas usam `max-w-6xl`.
- **Correção**: `max-w-6xl`, aplicado pela sessão de revisão do celular, que estava com esse arquivo.

## 7. No celular, a lateral da revisão era desenhada por cima da questão

- **Onde**: resultado → modal de revisão, telas menores que 1024 px.
  [review.tsx:247](../../src/components/results/review.tsx:247)
- **O que a pessoa via**: o quadro "Você marcou B, a resposta é E", a dificuldade e a resolução apareciam sobre
  o enunciado e a figura.
- **Causa**: a coluna da questão tinha `min-h-0` dentro de uma grade com altura fixa e rolagem; no celular a
  linha automática dela encolhia.
- **Correção**: `min-h-0` só no `lg` (`lg:min-h-0`), onde as duas colunas rolam separadas. Conferido em 375 px:
  a lateral começa exatamente onde a questão termina. Apontado pela sessão de revisão do celular.

## 8. Minha meta no celular: detalhes que quebravam em telas estreitas

Apontados pela sessão de revisão do celular, em [goal-setup.tsx](../../src/components/goal/goal-setup.tsx):

- Ao salvar a meta, a tela encolhe para o cartão da meta e o celular ficava olhando o rodapé. Agora volta ao
  topo ([goal-setup.tsx:257](../../src/components/goal/goal-setup.tsx:257)).
- O esqueleto de carregamento tinha `w-96` fixo e vazava em 320 px: agora é `w-full max-w-96`.
- O texto de exemplo do campo de busca era cortado em "ex.: medicina". Ficou "Curso, universidade ou cidade";
  os exemplos continuam nos atalhos "Buscas comuns" logo abaixo.
- Na lista de pesos, rótulo (`w-24`) + valor (`w-20`) quase não deixavam espaço para a barra em 320 px. No
  celular o rótulo usa `w-20` e o valor tem a largura do próprio texto.
