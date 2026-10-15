# SIMU · redesign

Redesign completo do [simu.digital](https://www.simu.digital), o site gratuito de simulados do ENEM (sem cadastro e sem coleta de dados) que um irmão criou para ajudar a irmã a estudar.

## Rodar

Requer Node.js 20.9 ou mais recente.

```bash
npm install
npm run dev       # http://localhost:3000
```

Os pacotes de `public/data` já vêm gerados. Só rode `npm run data` para atualizá-los.

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build de produção e servidor dela |
| `npm run lint` | ESLint |
| `npm run typecheck` | checagem de tipos do TypeScript |
| `npm run data` | baixa os dados públicos para `data/raw/` e gera os pacotes em `public/data/` |
| `npm run ui:add` | adiciona componentes do Arc UI e ícones animados |

## O que mudou

### Experiência de estudo
- **Prova em modo foco**: barra superior enxuta, cartão-resposta no formato da folha do ENEM e atalhos de teclado (`A`–`E` respondem, `⇧`+letra risca, `1`/`2`/`3` marcam a confiança, `←`/`→` navegam, `R` marca para revisar).
- **Ferramentas de papel**: marca-texto (CSS Custom Highlight API, sem mexer no DOM) e riscar alternativas.
- **Termômetro de confiança**: certeza, dúvida ou chute em cada resposta. O resultado mostra a calibração.
- **Ritmo, sem pânico**: aviso gentil de ritmo (3 min por questão), relógio que pode ser escondido e pausa guiada de respiração.
- **Resultado que ensina**: nota TRI (3PL, EAP) com faixa provável, posição na distribuição nacional (INEP 2024), coerência por dificuldade, calibração da confiança, ritmo por questão, competências da Matriz de Referência e gabarito comentado.
- **Meta no SISU**: escolha um curso entre 7.390 ofertas. A cada simulado aparece a média ponderada projetada, a distância até o corte e onde cada ponto vale mais.
- **Caderno de erros**: erros, brancos e acertos no chute viram uma lista para refazer até dominar.
- **Painel**: histórico, evolução por área, backup para levar o progresso a outro aparelho.

### Interface
- Identidade do SIMU: papel quente, tinta e azul de caneta, com cor própria para cada área.
- Inter em toda a interface.
- Componentes da biblioteca **Arc UI** (`src/components/arc`), com as cores do SIMU: Button, MorphSelect, RadioCards, SegmentedControl, Switch, Tooltip, ConfirmMorph, ChipGroup, EmptyState, IconMorph, InViewTitle e TextMorph. Os tokens deles são apontados para a paleta do SIMU em `src/app/globals.css`.
- **Ícones animados** (lucide-animated, `src/components/icons`) que reagem ao hover do botão ou cartão onde estão (`src/components/ui/anim-icon.tsx`).
- Para adicionar mais componentes: `npm run ui:add arc:<nome> icon:<nome>`.

### Desempenho
O site antigo baixava cerca de 20 MB de JSON ao abrir. Agora cada tela busca só o que precisa:
- um índice de 50 KB (gzip);
- um arquivo por questão;
- a busca do SISU com 190 KB (gzip);
- os detalhes de cada instituição sob demanda.

## Documentação
- [`docs/referencias-mobbin.md`](docs/referencias-mobbin.md): referências de UI pesquisadas no Mobbin e o que cada uma influenciou.
- [`docs/revisao-ux/`](docs/revisao-ux/README.md): revisão de detalhes de UX em todas as telas, separada por assunto.

## Dados
- Questões: [enem-api](https://github.com/yunger7/enem-api) via simu.digital
- Parâmetros TRI: microdados do ENEM (INEP)
- Distribuição de notas: Sinopse Estatística do ENEM 2024 (INEP)
- Notas de corte: SISU 2026 (MEC)

As imagens das questões continuam servidas pela origem do SIMU (`NEXT_PUBLIC_ASSET_BASE`, padrão `https://www.simu.digital`).

## Estrutura
```
src/app/(site)/   páginas com cabeçalho e rodapé (início, novo, resultado, painel, caderno, meta, metodologia)
src/app/prova/    a prova em modo foco
src/components/   arc/ (Arc UI), icons/ (ícones animados), exam/, results/, goal/, home/, ui/, shell/
src/lib/          dados, TRI, montagem do simulado, armazenamento local
public/data/      pacotes de dados gerados (índice, uma questão por arquivo, SISU, TRI)
scripts/          sync e build dos dados, instalador de componentes
docs/             referências de UI e revisão de UX
```

`data/raw/` guarda os dados brutos baixados por `npm run data:sync` e fica fora do Git.
