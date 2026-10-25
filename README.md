# Freguês – app (React + TypeScript + shadcn/ui)

Front-end do Freguês com dados de exemplo no navegador. Ainda não tem servidor e não envia mensagens de verdade.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor de recorrência
npm run build    # gera dist/ (PWA, funciona em qualquer hospedagem estática)
```

## Formatação e lint

```bash
npm run format        # formata JavaScript e TypeScript, incluindo JSX e TSX
npm run format:check  # verifica as regras do ESLint sem alterar arquivos
npm run lint          # executa Oxlint e ESLint
npm run lint:fix      # aplica as correções automáticas dos dois linters
```

O `eslint.config.js` define o estilo do código: quatro espaços, aspas simples, ponto e vírgula e chaves Allman. O ESLint Stylistic aplica a formatação; o Oxlint mantém as verificações de React e de correção existentes.

O `.editorconfig` define UTF-8, finais de linha LF e uma linha final. JavaScript, TypeScript e CSS usam quatro espaços; os demais arquivos usam dois. Espaços no fim das linhas são removidos, exceto em Markdown. O `.gitattributes` preserva LF ao utilizar Git.

No VS Code, instale as extensões recomendadas pelo projeto. A configuração compartilhada usa o ESLint para formatar JavaScript e TypeScript ao salvar. Não habilite outro formatador para esses arquivos, pois ele pode contrariar o estilo Allman. Os comandos de formatação não processam CSS, JSON ou Markdown; nesses arquivos, use o formatador do editor respeitando o EditorConfig.

Arquivos gerados (`dist/` e `coverage/`), instruções em `.agents/`, documentos em `.docs/` e o protótipo de referência ficam fora do lint da aplicação.

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `src/domain/` | Regras puras, sem React: estados do cliente (`recorrencia.ts`), textos e cobrança (`mensagens.ts`), fila e limite semanal (`fila.ts`), vendas e respostas (`operacoes.ts`), indicadores e gráfico derivados das compras (`resultados.ts`) |
| `src/data/lojas.json` | As 3 lojas de exemplo (gás, ferramentas, tecidos): produtos, regras e clientes com as compras em "dias atrás" |
| `src/data/seed.ts` | Monta as lojas do JSON com datas relativas a hoje e histórico de mensagens; não acrescenta totais artificiais |
| `src/data/migracao.ts` | Atualiza dados locais antigos preservando clientes, compras e configurações |
| `src/lib/estados.ts` | Mapa único de estado → tom (neutro, atenção, positivo, problema): variante de `Badge`, classes de superfície e texto; iniciais do `Avatar`; situação dos clientes |
| `src/store/useFregues.ts` | Estado (zustand), salvo no `localStorage`. É aqui que entra a API C# na versão real |
| `src/pages/` | Hoje, Clientes (+ ficha), Mensagens (+ conversa), Recompensas, Nova venda, Ajustes (+ produto). Sem janelas sobrepostas: cada ação abre uma página, e as confirmações aparecem como avisos (toasts) |
| `src/components/ui/` | Componentes oficiais do shadcn/ui com ajustes de tema nas classes base: superfícies sólidas, bordas discretas, sombras leves e variantes `warning`/`success` em `Badge` e `Alert`. As telas usam apenas eles (regra do `AGENTS.md`) |
| `src/index.css` | Tema claro e escuro: creme, marinho e verde das referências de marca; verde escurecido para ações no tema claro; tokens de estado, sombras e menu. Os aliases `glass-*` mantêm compatibilidade com telas ainda não migradas |

## Regras do motor

- **Novo** (uma compra): pós-venda no dia seguinte, dica com 1 semana quando cadastrada, convite para a 2ª compra perto do prazo do produto ou nos 5 dias anteriores ao vencimento do benefício (a partir do segundo dia).
- O intervalo é aprendido entre compras em dias diferentes. Compras no mesmo dia não geram um ciclo de zero dias.
- **Hora de lembrar**: faltam 5 dias ou menos para o intervalo médio.
- **Atrasado**: passou de 1,25 vez o intervalo médio.
- **Sumido**: atingiu os dias da regra e ultrapassou a margem de atraso do próprio ritmo; recebe a recompensa e, 30 dias depois, uma última tentativa.
- Lembretes e convites: no máximo um a cada 7 dias por cliente, inclusive em envios diretos e após uma nova compra. Mensagens livres são atendimento e não entram na atribuição comercial.
- Problemas abertos pausam a régua até a resolução, que permanece acessível na conversa.
- Compra até 14 dias depois de um convite elegível do ciclo atual conta como **venda recuperada**. Cada compra encerra os convites anteriores; um convite antigo não pode recuperar outra venda.
- A recompensa da segunda compra é exclusiva dessa compra, mesmo quando o lojista opta por não utilizá-la. Os termos concedidos não mudam com alterações posteriores da regra.
- Cashback e desconto reduzem a cobrança. O histórico preserva os valores bruto e cobrado; os resultados de recuperação usam o valor cobrado.
- Receita recuperada e clientes distintos que voltaram consideram o mês exibido até o dia da demonstração. A taxa de segunda compra considera toda a base cadastrada até esse dia. O gráfico mostra as compras recuperadas dos últimos 7 dias, inclusive quando atravessam meses.

## Demonstração

Em **Ajustes → Modo demonstração** (avatar no canto superior direito): trocar a loja de exemplo, avançar 1 dia e restaurar os dados.

Roteiro do pitch: Hoje → Marcos "Ver lembrete" → Enviar agora → simular "Pode trazer!" → Registrar nova compra → Registrar venda (venda recuperada). Lucas: Ver mensagem → Enviar agora → "Tive um problema" → alerta em Hoje → Marcar como resolvido.
