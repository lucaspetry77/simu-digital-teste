# Referências do Mobbin usadas no redesign

Pesquisa feita pelo MCP do Mobbin antes de desenhar as telas. Cada referência abaixo virou uma decisão concreta no SIMU.

## Tela de prova (`src/app/prova`, `src/components/exam`)

| Referência | O que aproveitamos |
| --- | --- |
| [Uxcel · questão com timer](https://mobbin.com/screens/55d35782-1f23-4609-a59d-6c0fce819924) | Modo foco: barra superior mínima com fechar, progresso e cronômetro; alternativas como cartões grandes com atalho numérico à direita. |
| [Duolingo · selecionar significado](https://mobbin.com/screens/d063716e-502e-45cc-9df9-1f8bd384b919) | Barra inferior fixa com ação secundária à esquerda e principal à direita (Anterior / Próxima). |
| [Babbel · exercício](https://mobbin.com/screens/9607627c-d29f-4ed9-a0af-fdc65e80d670) | Atalhos de teclado visíveis nas alternativas e contador de questão no topo. |
| [Coursera · prova com prazo](https://mobbin.com/screens/668297ec-2f33-4b3b-b75c-5062c721315a) | Tempo restante sempre visível e aviso de envio automático ao fim do tempo. |
| [Codecademy · quiz](https://mobbin.com/screens/e61d8095-818e-4ed6-9e67-9e7c1cad0c30) | Progresso “1 / 16” discreto no rodapé, conteúdo centralizado e respirado. |

## Resultado (`src/components/results`)

| Referência | O que aproveitamos |
| --- | --- |
| [Uxcel · relatório de avaliação](https://mobbin.com/screens/470d90c2-3137-4efb-9798-7dea10710d64) | Distribuição em barras com a posição “você” destacada e a frase “melhor que X% dos participantes”; forças e lacunas por competência. |
| [Optimal Workshop · visão geral](https://mobbin.com/screens/279bdc28-4597-4a84-a512-0c9c901b46d2) | Cartões de métrica com rótulo curto e número grande (acertos, tempo). |
| [Uxcel · revisar respostas](https://mobbin.com/screens/5a88fac6-3870-458f-a24a-77d082f9aaad) | Revisão em modal com navegação por bolinhas verde/vermelha e painel lateral “sobre a questão” (dificuldade, habilidade). |
| [Codecademy · revise suas respostas](https://mobbin.com/screens/f3bd03d2-37ca-4c3c-bf0e-b2a307559fd2) | Blocos “sua resposta” x “resposta correta” e explicação logo abaixo. |
| [Babbel · fim da lição](https://mobbin.com/screens/d8896ff2-ac14-40cd-8439-b9567a989262) | Ação “corrigir meus erros” logo no resultado → botão “Refazer N questões”. |

## Painel, meta e caderno (`src/components/home`, `src/components/goal`)

| Referência | O que aproveitamos |
| --- | --- |
| [Coursera · continue aprendendo](https://mobbin.com/screens/18683325-d982-4756-b06e-4ed52c933b06) | Cartão “continuar de onde parou” e a meta de carreira com “editar meta” → cartão “Sua meta” no painel e no resultado. |
| [Duolingo · revisão](https://mobbin.com/screens/781f3022-614e-4eab-96ae-d9f305925ff5) | Coleção de “erros” para praticar → Caderno de erros. |
| [Uxcel · início](https://mobbin.com/screens/68933767-f763-41a5-94ed-967cadaac831) | Curso em andamento com barra de progresso e botão de retomar. |
| [Duolingo · onboarding](https://mobbin.com/flows/849942d8-918e-4bb8-8a73-591eb2859d5f) | Escolhas em cartões grandes, uma decisão por vez, sem cadastro → montador de simulado e definição de meta. |
| [Mintlify · busca](https://mobbin.com/screens/7c7ad31f-9dfe-4be7-83d7-6002fe31d4d0) | Busca em estilo paleta de comandos, com navegação por setas e Esc → busca de cursos do SISU. |

## Página inicial (`src/app/(site)/page.tsx`)

| Referência | O que aproveitamos |
| --- | --- |
| [Loom · educação](https://mobbin.com/sites/sections/67f35ee3-38df-4f85-9e74-2b655986588a) | Hero centralizado com selo de gratuidade, um CTA principal e a prévia do produto logo abaixo. |
| [Canva · educação](https://mobbin.com/sites/sections/be9d5304-c893-476f-9947-f3fe71a49e08) | Atalhos de entrada lado a lado logo após o hero. |

## Diferenciação sem gamificação

Nenhuma das referências tinha estas funções; elas foram desenhadas para o contexto do ENEM a partir dos padrões acima:

- termômetro de confiança (certeza, dúvida, chute) com calibração no resultado;
- marca-texto e riscar alternativas, como na prova em papel;
- coerência na TRI (acertos por dificuldade);
- meta no SISU com “onde cada ponto vale mais”, usando os pesos reais de cada curso;
- aviso gentil de ritmo e pausa de respiração.
