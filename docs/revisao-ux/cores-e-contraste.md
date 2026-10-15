# Cores e contraste

Texto de apoio claro demais e elementos que somem no tema escuro.

---

## 1. Texto de apoio abaixo do contraste mínimo

- **Onde**: o app inteiro: o token `--ink-3` (tema claro). [globals.css:28](../../src/app/globals.css:28)
- **O que a pessoa via**: legendas, datas, dicas e metadados em 11,5–13 px (por exemplo, "Salvo
  automaticamente neste navegador…", "Matemática · ENEM 2020 · questão 142", a dica de atalhos do rodapé da
  prova) em cinza claro sobre o papel. Liam-se com esforço, principalmente em tela com brilho baixo.
- **Causa**: `#7b7985` tem contraste de 3,9:1 sobre o fundo `--bg`, 4,3:1 sobre o branco e 3,7:1 sobre
  `--bg-sunken`. O mínimo para texto pequeno (WCAG AA) é 4,5:1.
- **Correção**: `--ink-3: #6b6975`, com 4,9:1 sobre `--bg`, 5,4:1 sobre o branco e 4,6:1 sobre `--bg-sunken`. O
  tom continua um cinza quente e a hierarquia (ink › ink-2 › ink-3) se mantém. O tema escuro já passava (5,2:1)
  e não mudou.
- **Como foi encontrado**: um script no navegador comparou a cor de cada texto com o primeiro fundo opaco atrás
  dele e listou o que ficava abaixo de 4,5:1.
- **Para não repetir**: todo token de texto precisa passar 4,5:1 sobre todos os fundos onde ele é usado
  (`bg`, `bg-elev`, `bg-sunken`), não só sobre o branco.

## 2. A distribuição nacional sumia no tema escuro

- **Onde**: resultado, gráfico de distribuição abaixo da nota.
  [score-hero.tsx:64](../../src/components/results/score-hero.tsx:64)
- **O que a pessoa via**: no tema escuro, só as barras até a sua nota apareciam. As de cima (em geral a maior
  parte da curva, inclusive o pico da média) eram quase da cor do cartão.
- **Causa**: as barras acima da nota usavam `bg-sunken`, que no escuro é `#0a0b0e` sobre um cartão `#15161c`.
- **Correção**: `dark:bg-line-strong` (`#353843`) nessas barras. No tema claro nada muda.
- **Para não repetir**: cor de dado (barra, linha, ponto) não pode ser um token de *superfície*: superfícies são
  feitas para quase não contrastar umas com as outras.
