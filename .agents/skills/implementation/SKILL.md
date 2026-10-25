---
name: implementation
description: Implemente funcionalidades, corrija bugs e refatore código, do entendimento do comportamento solicitado à alteração e verificação do resultado. Use quando o pedido envolver executar mudanças de software; análises, planos e revisões sem implementação ficam fora deste fluxo.
---

# Implementação de software

Entregue a mudança solicitada funcionando dentro do escopo autorizado, com verificações proporcionais aos comportamentos afetados. Ajuste o trabalho ao tamanho e ao risco da tarefa; um pedido de implementação deve resultar em código e evidências do resultado, salvo impedimento concreto.

Leia [as instruções de design e arquitetura](../../instructions/software-design-instructions.md), resolvendo o caminho a partir desta skill. Use seus critérios nas decisões necessárias à implementação, sem produzir uma análise arquitetural separada por padrão.

## Comportamento e contexto

- Identifique o resultado esperado e os critérios que permitem reconhecer a conclusão. Em correções, determine a condição de ocorrência e o comportamento correto; em refatorações, explicite o comportamento a preservar e o objetivo da mudança estrutural.
- Localize o fluxo afetado, seus consumidores, contratos e verificações existentes. Consulte as instruções aplicáveis ao projeto e inspecione as alterações pendentes para preservar trabalho existente.
- Resolva dúvidas com as evidências disponíveis. Pergunte apenas quando uma lacuna impedir uma escolha relevante; prossiga nas partes independentes. Para incertezas não determinantes, adote uma hipótese razoável e informe-a quando afetar o resultado.

## Decisões e alteração

- Escolha uma abordagem que satisfaça os critérios de conclusão e respeite as garantias relevantes. Use as convenções existentes como contexto, verificando se atendem ao comportamento solicitado. Compare alternativas somente quando uma decisão material justificar isso.
- Para tarefas com dependências ou riscos relevantes, organize a execução em etapas que permitam verificar o resultado. Não transforme planejamento em uma entrega substituta da implementação nem crie uma etapa de aprovação sem necessidade.
- Implemente o fluxo necessário ao resultado, incluindo consumidores, configuração, migrações e documentação quando forem indispensáveis. Trate entradas, erros e efeitos parciais pertinentes; evite encerrar a tarefa com trechos desconectados, placeholders ou integração pendente.
- Avalie a necessidade de criar ou atualizar comentários no código afetado, lendo e aplicando a [skill ts-code-comment](../ts-code-comment/SKILL.md).
- Em correções, intervenha na causa demonstrada. Em refatorações, preserve os contratos e efeitos observáveis, exceto pelas mudanças solicitadas. Evite alterações incidentais; mudanças estruturais são adequadas quando necessárias ao objetivo e justificadas pelos critérios compartilhados.
- Identificar uma alternativa mais ampla não autoriza executá-la. Se a solução exigir ampliar materialmente o escopo ou uma ação ainda não autorizada, explique a necessidade e continue o trabalho independente.

## Verificação e conclusão

- Verifique o resultado pelos critérios de conclusão e pelos contratos afetados. Execute as verificações obrigatórias definidas pelo projeto e complemente-as com verificações proporcionais aos comportamentos afetados. Use testes existentes, análise estática, compilação ou reproduções pontuais conforme a stack e o risco. Acrescente ou ajuste testes quando protegerem comportamentos relevantes, especialmente a condição corrigida e regressões plausíveis.
- Ao encontrar falhas relacionadas à alteração, corrija a causa e repita as verificações afetadas. Diferencie falhas preexistentes ou de ambiente com base em evidências; quando a origem estiver incerta, compare com o estado anterior por um meio que preserve o trabalho existente. Sem evidência suficiente, registre a origem como indeterminada. Não amplie a tarefa para resolver falhas independentes sem necessidade. Se não houver como prosseguir, preserve o trabalho e informe o impedimento e o que falta concluir.
- Releia o diff final, incluindo arquivos novos, para conferir a cobertura do pedido, a integração entre as partes e a ausência de alterações incidentais. Confronte a implementação com o comportamento esperado; testes aprovados não substituem essa avaliação.
- Entregue uma síntese do comportamento alterado, das verificações executadas e de seus resultados, com limitações ou riscos relevantes. Não afirme que uma verificação foi executada quando ela foi apenas sugerida, nem declare conclusão quando houver uma parte essencial pendente.
