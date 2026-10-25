# Instruções para agentes

Estas regras se aplicam a toda a aplicação.

## Objetivo e escopo da implementação

- Implementar a aplicação do zero na raiz do repositório, sem reutilizar a implementação de `prototype-ex/`.
- Construir um protótipo de apresentação com dados mockados em arquivos JSON e interações simuladas.
- Nem todas as funcionalidades exibidas nas telas precisam funcionar nesta etapa; elas podem ser apenas ilustrativas.
- Priorizar a qualidade visual e a clareza da experiência para expressar o potencial da ideia aos avaliadores.

## Foco da interface

A interface deve priorizar design para dispositivos móveis.

## Estabilidade visual

- Não permitir "pops": saltos abruptos de posição, largura ou altura ao trocar filtros, abas ou estados de carregamento.
- Reservar espaço para ações condicionais, contagens e textos auxiliares, mantendo estáveis os controles e o início dos resultados. O aparecimento de "Limpar" ou uma descrição maior não pode empurrar a lista.
- Evitar deslocamentos horizontais quando a barra de rolagem aparece ou desaparece.
- Mudanças na quantidade de resultados podem alterar o tamanho da lista, mas não devem reposicionar os elementos anteriores nem causar rolagem inesperada.
- Verificar essa estabilidade em telas móveis, com e sem resultados e com a preferência de letra maior. Não mascarar saltos com animações ou transições.

## Stack obrigatória

- **React** para construir a aplicação e compor as telas.
- **TypeScript** para o código da aplicação, com tipos explícitos nas interfaces de dados e propriedades dos componentes.
- **shadcn/ui** para todos os componentes de interface.
- **Lucide Icons** para ícones, usando o pacote `lucide-react`.

## Uso obrigatório do shadcn/ui

- Consumir diretamente os componentes oficiais, importando-os de `@/components/ui/...`.
- Antes de implementar uma necessidade visual, verificar se existe um componente equivalente no catálogo oficial.
- Compor as telas com os componentes do shadcn/ui e suas variantes. Não recriar botões, campos, cartões, modais ou outros controles já disponíveis.
- Não criar wrappers visuais como `AppButton` ou `CustomCard` para substituir o uso direto dos componentes oficiais.
- Não introduzir outras bibliotecas de componentes de interface.
- Elementos HTML semânticos podem organizar o layout e o conteúdo, mas não devem substituir controles disponíveis no shadcn/ui.

## Exceções

Quando uma necessidade visual não tiver equivalente no shadcn/ui, explicar a necessidade e solicitar autorização explícita do usuário **antes de criar o componente**. Não tratar a ausência no catálogo como autorização automática.

## Referências oficiais

- [Componentes do shadcn/ui](https://ui.shadcn.com/docs/components)
- [Ícones do Lucide](https://lucide.dev/icons/)
