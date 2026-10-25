# Design e arquitetura de software

Estas instruções fornecem critérios compartilhados para implementar, revisar e discutir soluções de software. Aplique apenas o que puder afetar a tarefa, com profundidade proporcional ao impacto e às incertezas. Considere domínio, stack, restrições, convenções do repositório e ambiente operacional, sem impor um estilo arquitetural ou transformar uma mudança local em auditoria do sistema.

## Contexto e garantias

- Diferencie requisitos de preferências, fatos observados de informações fornecidas e hipóteses de conclusões. Não presuma volume, disponibilidade, orçamento, capacidade de engenharia ou maturidade da equipe.
- Quando a decisão depender do sistema existente, acompanhe um fluxo representativo da entrada aos efeitos, consumidores e falhas pertinentes. Identifique quem decide, executa, possui ou modifica o estado e os contratos entre esses participantes. Examine outras variantes quando puderem mudar a conclusão.
- Identifique as garantias relevantes: entradas, resultados, erros, propriedade e duração dos dados e, quando pertinentes, limites transacionais, consistência e efeitos parciais. Em componentes novos, derive o comportamento e as garantias dos requisitos; diferencie-os do comportamento já implementado.
- Trate regras espalhadas, mudanças coordenadas, detalhes internos expostos, dependências cíclicas e sequências frágeis como sinais a investigar. Fundamente conclusões em código, configurações, documentação ou medições; não infira desempenho ou escala apenas pela estrutura.

## Responsabilidades e contratos

- Avalie coesão, acoplamento e motivos de mudança. Reúna decisões que precisam preservar regras em conjunto e separe responsabilidades que evoluem independentemente.
- Ao encontrar comportamentos semelhantes, compare regras, consumidores e motivos de mudança. Centralize conhecimento compartilhado quando isso evitar divergências ou garantir invariantes conjuntas; preserve diferenças legítimas quando houver apenas semelhança de implementação.
- Ao transferir uma responsabilidade, verifique se o destino possui contexto, dados e autoridade para cumprir suas garantias, inclusive diante de falhas e resultados desconhecidos. Avalie os contratos e a coordenação necessários e se a mudança reduz o acoplamento ou apenas o desloca, concentra decisões demais ou distribui complexidade entre consumidores.
- Justifique abstrações e pontos de extensão por variações e consumidores concretos. Prefira contratos que expressem operações necessárias, encapsulem garantias e ocultem detalhes internos. Não introduza interfaces, herança, camadas ou configuração por simetria ou flexibilidade hipotética.

## Escolhas de design

- Prefira a solução mais simples que satisfaça os requisitos determinantes, considerando implementação, manutenção e operação. Relacione cada mudança proposta ao comportamento ou requisito que a justifica e à consequência que pretende resolver.
- Quando houver uma decisão relevante em aberto, compare alternativas materialmente diferentes pelos mesmos critérios, incluindo manter a solução atual ou fazer uma mudança localizada quando viáveis. Considere apenas atributos pertinentes; não exija uma comparação formal para toda alteração.
- Explique o mecanismo e o custo dos benefícios: qual dependência, fluxo, contrato ou responsabilidade muda e por que isso melhora o resultado. Procure evidências contrárias, como regras divergentes, garantias existentes e novos acoplamentos. Rótulos como “desacoplado” ou “escalável” não bastam; considere limitações da stack e justifique desvios das convenções do repositório.
- Uma organização alternativa não demonstra um defeito. Relacione problemas de design a consequências concretas ou requisitos verificáveis e diferencie evidências de projeções.

## Operação e evolução

- Examine consequências operacionais pertinentes, como modos de falha, comportamento sob carga, consistência, implantação, observabilidade e recuperação. Indique como mitigar ou verificar riscos determinantes, sem presumir exigências não informadas.
- Considere migrações, substituições e redesenhos quando relevantes. Para recomendá-los, explique por que mudanças menores são insuficientes ou menos vantajosas. Avalie compatibilidade, reversibilidade, continuidade operacional e custo e risco da transição; escolha entre transição incremental e atômica conforme essas condições.
- Quando uma lacuna puder mudar a decisão, faça a menor verificação útil disponível. Explicite hipóteses e condições de validade quando não puder resolvê-la. Encerre a investigação quando novas verificações não se justificarem pelo impacto esperado.

Esses critérios orientam as decisões dentro da tarefa solicitada. Não exigem um relatório fixo nem autorizam implementar alternativas fora do escopo.
