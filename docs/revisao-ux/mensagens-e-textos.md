# Mensagens e textos

Mensagens com o tom errado, números que arredondam contra a pessoa e textos que prometem algo diferente do
que a tela entrega.

---

## 1. Erro ao importar backup aparecia em verde (e em inglês)

- **Onde**: painel → "Seus dados, suas regras" → Importar.
  [dashboard.tsx:306](../../src/components/home/dashboard.tsx:306)
- **O que a pessoa via**: escolher um arquivo errado mostrava a mensagem de erro na cor de sucesso
  (`text-ok`). Se o arquivo nem fosse JSON, a mensagem era a do navegador: *Unexpected token 'i', "…" is not
  valid JSON*.
- **Causa**: a mensagem era só um texto, sem tom; todas saíam verdes.
- **Correção**: a mensagem guarda `{ text, tone }`; erros saem em vermelho, com `role="status"` para leitores
  de tela. Arquivo que não é JSON vira "Esse arquivo não é um backup do SIMU.".
- **Junto disso**: o "Exportar" revogava a URL do arquivo logo depois do clique, o que em alguns navegadores
  cancela o download. Agora ela é revogada 1 s depois
  ([dashboard.tsx:295](../../src/components/home/dashboard.tsx:295)). E o erro de "Começar agora" na montagem
  do simulado ganhou `role="alert"` ([builder.tsx:274](../../src/components/home/builder.tsx:274)).
- **Para não repetir**: toda mensagem de retorno carrega o próprio tom; não reaproveite o mesmo `<p>` colorido
  para sucesso e erro. Mensagens de exceção técnicas nunca chegam cruas para quem usa.

## 2. "Nenhum curso encontrado" piscava enquanto a pessoa digitava

- **Onde**: Minha meta, busca. [goal-setup.tsx:169](../../src/components/goal/goal-setup.tsx:169)
- **O que a pessoa via**: ao digitar a primeira letra, aparecia por um instante "Nenhum curso encontrado"
  antes dos resultados.
- **Causa**: a lista usa `useDeferredValue`. No primeiro quadro o texto digitado já existe, mas a busca
  ainda roda com o valor antigo (vazio), que não tem resultados.
- **Correção**: o aviso só aparece quando a busca já alcançou o texto digitado (`deferred === query`).

## 3. Ritmo "2min/questão" com 2min59s disponíveis

- **Onde**: prova, aviso de ritmo ao lado do cronômetro (telas largas).
  [exam-timer.tsx:56](../../src/components/exam/exam-timer.tsx:56)
- **O que a pessoa via**: com 44:46 para 15 questões (2min59s cada), o aviso dizia "No ritmo · 2min/questão".
  Com 4min51s dizia "4min". O número sempre parecia mais apertado que o real.
- **Causa**: `fmtDuration` corta os segundos no formato curto, ou seja, arredonda para baixo.
- **Correção (2ª rodada)**: a primeira correção arredondava para o minuto mais próximo, o que criou o erro
  oposto: com 2min37s por questão o aviso dizia "Ritmo apertado · 3min/questão", e 3 min é justamente o ritmo
  do ENEM. Agora o aviso mostra minutos e segundos, de 5 em 5 s ("2min 35s/questão"; "3min" só quando é 3 min
  mesmo), sempre coerente com o rótulo "No ritmo / Ritmo apertado".
- **Para não repetir**: um número que acompanha um rótulo qualitativo precisa ter precisão suficiente para
  nunca contradizer o rótulo.

## 4. "Média de 10s por questão, dentro do ritmo"

- **Onde**: resultado → Ritmo por questão. [insights.tsx:194](../../src/components/results/insights.tsx:194)
- **O que a pessoa via**: entregando a prova com 9 de 15 questões nunca abertas, o cartão dizia "Média de 10s
  por questão, dentro do ritmo do ENEM", com o fundo verde de elogio.
- **Causa**: a média dividia o tempo total por todas as questões, incluindo as que ficaram com 0 s.
- **Correção**: a média considera só as questões que a pessoa abriu (no mesmo caso, 1min13s). Se nenhuma
  tem tempo, o cartão não mostra mensagem.

## 5. "Seu próximo simulado leva 15 minutos"

- **Onde**: início, bloco final. [page.tsx:268](../../src/app/(site)/page.tsx:268)
- **O que a pessoa via**: o botão ao lado leva para "Monte o seu treino", que já abre com 15 questões e
  45 min. A promessa só vale para o menor simulado (5 questões).
- **Correção**: "Um simulado pode levar só 15 minutos.", que combina com o "Comece pequeno" logo abaixo.

## 6. As teclas 1, 2 e 3 gravavam uma confiança invisível

- **Onde**: prova, atalhos de teclado. [exam-screen.tsx:231](../../src/components/exam/exam-screen.tsx:231)
- **O que a pessoa via**: com "Perguntar minha confiança" desligado, a pergunta não aparece, mas apertar 1, 2
  ou 3 (por exemplo, tentando digitar algo) ainda gravava "certeza/dúvida/chute". Isso aparecia depois no
  resultado e mandava questões para o caderno como "acertou no chute" sem a pessoa saber.
- **Correção**: os atalhos 1–3 só funcionam quando a pergunta de confiança está ligada.
- **Para não repetir**: atalho de teclado só age sobre controles visíveis.
