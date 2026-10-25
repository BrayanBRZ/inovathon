---
name: architecture-analysis
description: Avalie arquitetura e design de software, compare alternativas e recomende uma direção com base em requisitos e evidências. Use para análises ou propostas sem implementação; revisão de mudanças usa code-review e execução de mudanças usa implementation.
---

# Análise de arquitetura e design

Responda à decisão ou avaliação solicitada, com profundidade proporcional ao impacto. Uma análise pode concluir que a solução atual atende aos requisitos; não proponha uma reorganização apenas para produzir uma recomendação.

Leia [as instruções de design e arquitetura](../../instructions/software-design-instructions.md) e use seus critérios conforme o problema. Este fluxo entrega análise; não autoriza modificar código, configuração ou histórico.

## Contexto e investigação

- Delimite a pergunta, os requisitos determinantes e as restrições conhecidas. Para uma avaliação ampla, identifique os limites do sistema e os fluxos relevantes antes de selecionar o que aprofundar.
- Quando houver um sistema existente, acompanhe os fluxos necessários para sustentar a conclusão e cite arquivos, símbolos ou configurações verificáveis. Para uma proposta nova, derive os contratos dos requisitos e explicite hipóteses que ainda precisam de confirmação.
- Resolva lacunas com as evidências disponíveis. Pergunte quando uma informação ausente puder mudar a decisão e não houver como obtê-la; prossiga nas partes independentes.

## Comparação e recomendação

- Compare alternativas materialmente diferentes somente quando houver uma escolha relevante. Inclua manter a solução atual ou fazer uma intervenção localizada quando forem opções viáveis.
- Use os mesmos critérios para comparar as opções. Relacione benefícios e custos às mudanças concretas de responsabilidades, contratos, dados e operação; diferencie consequências demonstradas de projeções.
- Recomende uma direção com justificativa, condições de validade e riscos relevantes. Quando envolver transição, explique compatibilidade, reversibilidade e a forma de verificar as garantias determinantes.

## Entrega

Apresente a conclusão, as evidências e os compromissos que explicam a escolha, com as limitações capazes de alterá-la. Use um diagrama ou uma tabela quando esclarecer relações ou alternativas. Adapte o formato à pergunta; não imponha um relatório ou arquivo fixo. Se a evidência for insuficiente, identifique a menor verificação necessária para decidir.
