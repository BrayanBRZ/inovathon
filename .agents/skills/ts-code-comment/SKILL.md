---
name: ts-code-comment
description: 'Crie ou revise comentários estruturados em TypeScript, com cobertura integral da API pública e formato explícito com @summary. Use para comentar classes, modelos, atributos e métodos; documentação externa e alterações de lógica ficam fora deste fluxo.'
---

# ts-code-comment

Documente o contrato real de código TypeScript com cobertura verificável e comentários no formato JSDoc. O foco desta skill é TypeScript, com as convenções de cobertura e apresentação definidas abaixo. Modifique apenas comentários; não altere lógica, assinaturas, tipos ou configurações para acomodá-los. Não crie documentação externa sem solicitação.

## Escopo e precedência

- Identifique os arquivos e símbolos abrangidos pelo pedido antes de editar. A cobertura integral vale para esse escopo, sem ampliar automaticamente o trabalho para todo o repositório.
- Use o idioma solicitado; na ausência de indicação, preserve o idioma predominante dos comentários do projeto.
- O formato e a cobertura desta skill prevalecem sobre comentários antigos mais sucintos. Não dispense comentários por considerar um membro público trivial, evidente ou suficientemente tipado.
- Use blocos JSDoc `/** ... */` e as tags definidas abaixo para descrever contratos TypeScript sem repetir sua tipagem nativa.
- Não instale ferramentas nem altere sua configuração apenas para aceitar as tags. Confira compatibilidade com verificadores existentes sem presumir que esta convenção seja TSDoc estrito.

## Referência e escolha de tags

Use a [referência oficial de JSDoc do TypeScript](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) para consultar a semântica e o suporte das tags quando necessário. Incentive outras tags e construções relevantes da referência, além das obrigatórias desta skill:

- `@deprecated`: identifique uma API efetivamente obsoleta e indique a alternativa, quando conhecida.
- `@see` e `{@link ...}`: conecte contratos relacionados e referências úteis, com destinos válidos e resolvíveis.
- `@example` e `@defaultValue`: acrescente exemplos ou padrões quando esclarecerem o uso, respeitando o suporte das ferramentas do projeto; estas convenções complementam a referência.

Diferencie suporte do compilador, apresentação no editor e convenções desta skill. A referência informa que, em arquivos TypeScript, o suporte se limita às tags de documentação; anotações para fornecer tipos em JavaScript, como `@type`, `@typedef`, `@template` e `@satisfies`, não substituem declarações TypeScript. Preserve os tipos e modificadores existentes no código.

O `@summary` explícito, o inventário com `@property` e o uso de `@remarks` e `@typeParam` são convenções de documentação desta skill; não presuma que todas sejam interpretadas ou verificadas pelo compilador. Use tags adicionais quando trouxerem informação útil ao contrato, sem preencher blocos artificialmente nem alterar código ou ferramentas para acomodá-las.

## Cobertura obrigatória

| Elemento no escopo | Exigência |
|---|---|
| Classes e modelos, incluindo interfaces, aliases de tipos e enums | Bloco inicial com `@summary`, mesmo quando não exportados. |
| Atributos públicos | Inventário completo no bloco inicial da classe/modelo, usando `@property`. |
| Métodos públicos e protegidos | Bloco completo antes de cada declaração, incluindo construtores, métodos estáticos, getters e setters. |
| Funções exportadas e assinaturas de métodos em interfaces | Mesmo contrato de documentação exigido dos métodos públicos. |
| Métodos, atributos privados, funções internas e variáveis locais | Comente quando houver regras, invariantes, efeitos ou decisões que precisem de explicação. |

Considere a visibilidade efetiva: em TypeScript, a ausência de modificador não torna um método privado. Parâmetros do construtor que também declaram atributos públicos entram tanto no inventário de atributos quanto em `@param`.

Não redeclare membros herdados apenas para comentá-los. Para sobrescritas e sobrecargas, torne o contrato de cada assinatura pública acessível; reutilize documentação apenas quando a referência for resolvível e registre diferenças reais.

## Classes, modelos e atributos

- Coloque um único bloco imediatamente antes da declaração, começando com `@summary` e a descrição na linha seguinte.
- Liste todos os atributos públicos com `@property nome - descrição`, incluindo acessores públicos e propriedades estáticas declaradas. Descreva propriedades aninhadas relevantes com caminhos como `behaviors.maintenance`.
- Explique significado, unidades, ausência, padrões, mutabilidade e duração dos dados quando aplicáveis. Não repita apenas o nome ou o tipo.
- Não inclua atributos privados no inventário obrigatório. Quando necessário, comente-os perto da declaração.
- O inventário centralizado não dispensa o contrato próprio de getters e setters. Não duplique o inventário inteiro junto de cada campo.
- Use `@remarks` para invariantes e relações entre atributos que não caibam nas descrições individuais.

```typescript
/**
 * @summary
 * Defines navigation preferences shared across worlds.
 *
 * @property followDistance - Positive horizontal arrival radius for idle follow navigation, in blocks.
 * @property enabled - Whether idle navigation is enabled; false leaves it inactive.
 */
export interface NavigationPreferences
{
    readonly followDistance: number;
    readonly enabled: boolean;
}
```

## Métodos, funções e tags

Todo método público ou protegido deve ter seu contrato integralmente documentado. Use blocos multilinha, com uma linha vazia entre seções. A ordem é `@summary`, `@remarks`, `@typeParam`, `@param`, `@returns`, `@throws` e demais tags aplicáveis; omita somente seções que não se apliquem.

- **`@summary` obrigatório:** escreva a responsabilidade na linha seguinte à tag. Não substitua por descrição sem tag nem por comentário de uma linha.
- **`@param nome - descrição` para cada parâmetro:** inclua opcionais, valores padrão e restrições. Explique os dois casos de booleanos e as unidades quando aplicáveis. No construtor, documente todos os parâmetros, inclusive os que criam campos privados.
- **`@typeParam`:** explique os parâmetros genéricos das APIs públicas e suas restrições relevantes.
- **`@returns`:** obrigatório quando houver resultado, incluindo getters e `Promise<void>`. Explique o significado do valor, a ausência, o caso booleano ou o momento em que a promise resolve. Omitir em construtores, setters sem resultado e métodos síncronos `void`; não preencher com “não retorna nada”.
- **`@remarks`:** use para pré-condições, efeitos colaterais, mudanças de estado, concorrência, cancelamento ou detalhes necessários além do resumo.
- **`@throws`:** descreva exceções e rejeições que realmente escapam ao chamador, incluindo falhas propagadas pertinentes. Não atribua uma rejeição a uma falha capturada e comunicada por callback, log ou estado.
- **Outras tags:** siga a seção de referência e escolha de tags; acrescente somente informação necessária, verdadeira e compatível com as ferramentas existentes.

Não duplique tipos já declarados na assinatura, salvo exigência da linguagem ou de uma ferramenta existente. Documentação integral significa cobrir o contrato, não preencher todas as tags artificialmente. Quando um método privado precisar de um bloco estruturado, aplique o mesmo formato; comentários locais podem usar `//` para explicar a decisão.

```typescript
/**
 * @summary
 * Loads memory for the identified world.
 *
 * @remarks
 * Failures close task admission and are reported through onFatal.
 * Promise completion alone does not imply application readiness.
 *
 * @param world - Identified world snapshot used to select the memory.
 * @returns A promise that settles after the snapshot has been processed.
 */
observe(world: WorldSnapshot): Promise<void>
```

O exemplo ilustra um contrato com falhas tratadas por callback. Confira o comportamento do símbolo real antes de reutilizar o texto. Não invente garantias de persistência, atomicidade, cancelamento ou prontidão.

## Auditoria antes de concluir

1. Inventarie classes/modelos, atributos públicos, métodos públicos/protegidos e funções exportadas do escopo, incluindo declarações aninhadas.
2. Confira `@summary` em cada classe/modelo e método exigido, e compare cada inventário `@property` com os atributos públicos reais.
3. Confira todos os parâmetros e genéricos, além de retornos, erros e observações aplicáveis. Revise acessores e parâmetros-propriedade do construtor para evitar omissões.
4. Confronte os comentários com implementação e consumidores. Remova descrições obsoletas, referências quebradas e explicações de privados sem informação útil.
5. Releia o diff para confirmar que somente comentários mudaram. Use verificadores existentes quando pertinentes; typecheck e lint aprovados não comprovam cobertura documental.

Informe o escopo comentado e as verificações realmente executadas. Não declare cobertura integral se ainda houver símbolos obrigatórios sem documentação; identifique qualquer pendência concreta.
