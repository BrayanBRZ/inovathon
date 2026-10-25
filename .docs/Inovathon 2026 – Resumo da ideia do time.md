# **Inovathon 2026 – Resumo da ideia do time**

Oct 24, 2026 · @Luis

## **O desafio**

Pergunta do Inovathon: como reinventar a experiência de comprar e vender para fortalecer o comércio local de Paranavaí. O ponto central é gerar valor e fazer o cliente voltar, sem competir só por preço nem copiar os grandes marketplaces.

A banca avalia cinco critérios: inovação, usabilidade, impacto, aplicabilidade no comércio real e apresentação. O pitch é de 5 minutos no dia 25, a partir das 14h, e a ordem é por sorteio. Prêmios por equipe: R\$ 5 mil, R\$ 3 mil e R\$ 2 mil.

O que a banca quer ver: a dor comprovada com dados e depoimentos, a solução funcionando num protótipo clicável e como ela se vende.

## **A ideia: copiloto de recorrência no WhatsApp**

O pequeno comerciante não sabe quando o cliente parou de comprar, e só descobre quando ele volta, se voltar. Nossa solução, com nome provisório **Freguês**, registra cada venda, aprende de quanto em quanto tempo cada cliente compra e avisa a hora certa de chamá-lo pelo WhatsApp.

Exemplos de mensagem:

* Gás: "Seu gás deve acabar essa semana, quer que leve? Tem carvão e kit churrasco pro fim de semana."  
* Reparo: "Sua furadeira está perto da revisão. Quer agendar?"  
* Cliente sumido: "Faz tempo que você não aparece\! Na próxima compra você ganha um saco de carvão."

Por que essa ideia: temos quatro comerciantes para entrevistar hoje, todos da família de membros do time.

| Comerciante | Encaixe com a ideia |
| :---- | :---- |
| Venda de gás \+ loja de churrasco | Forte: compra previsível e recorrente |
| Reparo de ferramentas elétricas | Bom: revisão periódica e aviso de serviço pronto |
| Tecidos por metro | Bom: cliente volta a cada novo projeto |
| Garagista (carros usados) | Fraco: ninguém compra carro todo mês. Usar como contraponto e perguntar qual é a dor real dele |

Usa o que o comércio online não tem: o lojista conhece o cliente e entrega rápido.

## **Como funciona**

O núcleo é um cálculo simples com datas, sem IA. A IA entra como diferencial, não como requisito. O sistema não lê as conversas pessoais do lojista: ele só recebe o que é registrado nele.

**1\. Registro da venda (3 portas de entrada)**

* Tela no celular: escolhe cliente, produto e confirma. Abre por link, sem instalar nada.  
* WhatsApp com botões: o copiloto pergunta "Qual cliente?" e "Qual produto?", o lojista só toca.  
* Com IA: texto livre ou áudio, como "vendi um P13 pra Dona Maria".

**2\. Motor de recorrência**

Para cada cliente, guarda as datas de compra e calcula o intervalo médio. Se ainda só tem uma compra, usa o tempo padrão do produto, definido pelo lojista.

**3\. Estados do cliente**

1. Em dia: nada a fazer.  
2. Hora de lembrar: perto do intervalo médio. Recebe lembrete.  
3. Atrasado: passou do intervalo com folga. Provavelmente comprou em outro lugar.  
4. Sumido: passou dos dias definidos pelo lojista. Recebe uma recompensa para voltar, e depois de uma última tentativa paramos de mandar mensagem para não virar spam.

**4\. Recompensas**

O lojista não monta campanha do zero. Ele preenche uma regra pronta: "cliente sem comprar há \[60\] dias ganha \[brinde / desconto / entrega grátis\]". A equipe pode configurar para os primeiros clientes, mas isso não escala como modelo principal.

Preferir brinde ou entrega grátis a desconto: o desafio pede para não competir só por preço, e desconto toda hora ensina o cliente a esperar cupom. Cada recompensa é rastreável, o que gera a taxa de reativação para o pitch.

**5\. Acessibilidade**

Nosso público inclui donos mais velhos e com menos escolaridade, justamente os de menor maturidade digital. Por isso: letra e botões grandes, alto contraste (WCAG AA), linguagem do lojista em vez de "CRM" ou "campanha", ícone sempre com texto, poucos passos, opção de falar em vez de digitar.

**6\. Foco no cliente que compra uma vez e some (validado com o Wellington, ACIAP)**

O motor aprende pelo intervalo entre compras, e quem compra uma vez não tem intervalo. Por isso o cliente novo tem uma régua própria, com objetivo de chegar à segunda compra:

1. Na venda: pegar o contato oferecendo o comprovante pelo WhatsApp (já serve como permissão, pela LGPD) e entregar a recompensa da segunda compra, com prazo.  
2. Dia seguinte: "Deu tudo certo?" com os botões Gostei e Tive um problema. Problema gera alerta imediato para o lojista resolver antes de perder o cliente.  
3. Uma semana depois: dica útil sobre o produto. Não é venda, é cuidado.  
4. No prazo do produto: lembrete normal, lembrando que a recompensa da segunda compra está para vencer.

Métrica principal: taxa de segunda compra (de cada 10 clientes novos, quantos voltaram).

**7\. Diferença para um CRM**

| CRM | Freguês |
| :---- | :---- |
| Guarda os dados; o dono precisa analisar e agir | Diz quem chamar hoje, com a mensagem pronta |
| Exige cadastro, configurar funil e treinamento | Funciona no WhatsApp que o lojista já usa |
| Feito para empresas com equipe de vendas | Feito para o MEI e o pequeno lojista |
| O lojista define quando contatar | Aprende o ciclo de cada cliente e avisa sozinho |
| Mede contatos e oportunidades | Mede clientes que voltaram e vendas recuperadas |
| Cada empresa isolada | Rede local: as lojas da cidade se indicam |

Frase para o pitch: "Um CRM guarda quem é seu cliente. O Freguês traz ele de volta."

## **Dados para o pitch**

Frase-base do pitch:

*"Metade dos pequenos negócios não registra dados dos clientes, e 44% não usam o histórico de compras para vender de novo. Mas 77% já têm internet. O que falta não é tecnologia, é uma ferramenta simples o bastante para o pequeno lojista usar."*

Fonte: Sebrae/META, Maturidade Digital dos Pequenos Negócios, ago/2026, 7.182 entrevistas. A banca é do Sebrae, então citar a pesquisa deles pesa a favor.

| Dado | Número |
| :---- | :---- |
| Não usam histórico de compras para oferecer algo personalizado (item 2\) | 44% |
| Não têm sistema de gestão de clientes (item 7\) | 50% |
| Não usam atendimento automatizado no WhatsApp (item 3\) | 48% |
| Já têm internet de alta velocidade (item 16\) | 77,5% |
| Maturidade digital: MEI x EPP (escala 0 a 80\) | 35 x 46 |

Também vale mostrar: oficinas mecânicas e reparação de eletrodomésticos aparecem entre as atividades com menor maturidade digital, setores parecidos com os nossos contatos.

Cuidados: são dados nacionais, então completar com números das entrevistas de hoje. Usar dois ou três números no slide, não todos.

## **Evidências: o cliente que compra uma vez e some**

Validação: Wellington (ACIAP, consultor de vendas da Jorrovi) confirmou que a maior dor do varejo é o cliente que compra uma vez e não volta. Os levantamentos abaixo sustentam isso.

| Evidência | Número | Fonte |
| :---- | :---- | :---- |
| Aumentar a retenção em 5% eleva o lucro entre 25% e 95% | 25% a 95% | Reichheld, Bain & Company, publicado na Harvard Business Review ([Forrester](https://www.forrester.com/blogs/profiting-from-post-sale-marketing)) |
| Conquistar um cliente novo custa mais que manter um atual | 5 a 25 vezes | HBR, Amy Gallo, 2014 ([Salesforce](https://www.salesforce.com/ca/blog/wp-json/wp/v2/posts/2285)) |
| Clientes perdidos que saíram por pouca atenção do fornecedor (não por preço ou produto) | 70% | Forum Corporation, 14 empresas ([O'Reilly](https://oreilly.com/library/view/the-relationship-edge/9780470915479/ch12.html)) |
| Consumidores que já deixaram de comprar de uma marca após problema no atendimento | 80% | Neogrid e Opinion Box, abr/2025 ([Central do Varejo](https://centraldovarejo.com.br/80-dos-consumidores-deixam-compras-por-problemas-com-atendimento/)) |
| Consumidores que veem benefício em ofertas baseadas no histórico de compras | 84% | Neogrid e Opinion Box, abr/2025 ([Central do Varejo](https://centraldovarejo.com.br/80-dos-consumidores-deixam-compras-por-problemas-com-atendimento/)) |
| Receita do varejo de moda que vem de recompra | 60% | Dito, 26,8 milhões de compradores ([Mercado\&Consumo](https://mercadoeconsumo.com.br/27/08/2021/noticias/recompra-representa-60-da-receita-do-varejo-de-moda-mostra-pesquisa/amp/)) |
| Média de compras por cliente no varejo de moda | 2,25 | Dito ([Mercado\&Consumo](https://mercadoeconsumo.com.br/27/08/2021/noticias/recompra-representa-60-da-receita-do-varejo-de-moda-mostra-pesquisa/amp/)) |
| Taxa de recompra considerada saudável para cliente novo | até 30% | Dito ([Mercado\&Consumo](https://mercadoeconsumo.com.br/27/08/2021/noticias/recompra-representa-60-da-receita-do-varejo-de-moda-mostra-pesquisa/amp/)) |
| Chance de vender de novo para quem já comprou | 60% a 70% | Marketing Metrics, citado pela Dito ([Mercado\&Consumo](https://mercadoeconsumo.com.br/27/08/2021/noticias/recompra-representa-60-da-receita-do-varejo-de-moda-mostra-pesquisa/amp/)) |
| Brasileiros que já se comunicaram com empresas pelo WhatsApp | 82% | Opinion Box, jun/2025 ([Canaltech](https://canaltech.com.br/apps/o-que-os-brasileiros-mais-fazem-no-whatsapp-segundo-pesquisa/)) |
| Frequência de mensagens de empresa que o usuário aceita | até 1 vez por semana | Opinion Box, jun/2025 ([Canaltech](https://canaltech.com.br/apps/o-que-os-brasileiros-mais-fazem-no-whatsapp-segundo-pesquisa/)) |

Como usar no pitch: a dor (70% saem por falta de atenção, 80% após problema no atendimento), o tamanho do prêmio (5% de retenção, até 95% de lucro) e o canal certo (82% já falam com empresas pelo WhatsApp). A última linha justifica o limite de mensagens do Freguês para não virar spam.

Cuidados: o dado da Bain é um estudo clássico com faixa ampla, varia por setor. Os dados da Dito são do varejo de moda, não do nosso público. Apresentar como referência de mercado e completar com os números das entrevistas.

## **Concorrência, inovação e custos**

Existem CRMs, plataformas de automação de WhatsApp e apps de fidelidade, mas são feitos para empresas que têm alguém para configurar fluxos e pagar mensalidade. Antes do pitch, pesquisar concorrentes diretos de cada setor (por exemplo, apps de pedido de gás).

Onde inovamos:

* **Configuração zero**: o lojista usa o WhatsApp que já usa, e o sistema aprende o ciclo de cada cliente sozinho.  
* **Rede local**: lojas da cidade indicam umas às outras. Quem compra gás para o churrasco recebe a oferta da loja de carvão do bairro. Um marketplace não replica isso.

Custos: não treinamos um modelo por loja. Os dados de cada loja ficam no nosso banco e só o trecho daquela loja vai junto em cada pedido para a IA, a frações de centavo por interação. O custo que mais pesa é a API oficial do WhatsApp, cobrada por mensagem (as de marketing são as mais caras). Conferir a tabela atual da Meta para o modelo de receita.

## **Foco do pitch (versão afunilada)**

Uma dor, uma solução, uma métrica:

* **Dor:** o cliente que compra uma vez e some (validado com Wellington, ACIAP).  
* **Solução:** o Freguês transforma a primeira compra em segunda, sozinho: comprovante com cashback que expira, pós-venda automático, alerta de problema e convite para voltar na hora certa.  
* **Métrica:** taxa de segunda compra e valor recuperado em reais.

Fica fora do pitch (guardar para perguntas da banca): rede local entre lojas, registro por voz, várias lojas no mesmo app.

Roteiro de 5 minutos:

| Tempo | Parte | Conteúdo |
| :---- | :---- | :---- |
| 0:00 a 0:45 | Dor | Cliente de uma compra só; 70% dos clientes saem por falta de atenção |
| 0:45 a 1:15 | Evidência | Entrevistas com os comerciantes \+ dados do Sebrae |
| 1:15 a 3:00 | Demonstração | Cadastro com WhatsApp e cashback, envio automático, alerta de problema, cliente volta, painel em reais |
| 3:00 a 4:15 | Negócio | R\$ 99/mês, se paga com 1 venda recuperada, mercado em Paranavaí, plano de 3 anos |
| 4:15 a 5:00 | Fechamento | Diferença para CRM e frase final |

## **Mudanças sugeridas pelo André (Sebrae)**

* **Envio automático:** ligado por padrão, todo dia às 9h, no máximo uma mensagem por semana por cliente. O lojista pode pular um envio ou desligar o automático.  
* **Tela inicial com resultado do negócio:** valor recuperado no mês, quantas vezes isso paga a mensalidade, clientes que voltaram, taxa de segunda compra.  
* **Histórico de mensagens:** tudo o que foi enviado e o que aconteceu depois (respondeu, voltou e comprou quanto).  
* **Valor da venda:** registrado em cada venda, para calcular o valor recuperado.  
* **Telefone e CPF:** WhatsApp obrigatório para cliente novo, com autorização registrada (LGPD e regra do WhatsApp para mensagens de marketing). CPF opcional, só para achar o cliente no caixa e vincular o cashback. Guardar só o necessário.  
* **Cashback com prazo:** recompensa padrão da segunda compra. Vira crédito que expira, o que cria urgência para voltar.

## **Modelo de negócio**

**Como cobrar:** assinatura mensal de **R\$ 99** por loja no plano Essencial (até 200 clientes) e R\$ 199 no plano Completo (clientes ilimitados e IA), primeiro mês grátis. Ticket médio usado na projeção: R\$ 149\. Os primeiros pilotos (comerciantes das entrevistas) usam grátis por 3 meses em troca de depoimento e dados.

**Argumento para o lojista:** a mensalidade se paga com uma venda recuperada (um botijão de gás, uma revisão de ferramenta).

**Custo por loja (estimativa):**

| Item | Base | Custo/mês |
| :---- | :---- | :---- |
| Mensagens de marketing (lembrete, convite, reativação) | \~60 × R\$ 0,3217 | R\$ 19,30 |
| Mensagens de utilidade (comprovante, pós-venda) | \~150 × R\$ 0,035 | R\$ 5,25 |
| IA e servidor | estimativa | R\$ 5,00 |
| **Total** |  | **\~R\$ 30** |

Margem de contribuição: cerca de R\$ 69 por loja no Essencial e R\$ 169 no Completo. Tarifa da Meta para o Brasil vigente desde 1º/10/2026; mensagem de marketing custa cerca de 9 vezes a de utilidade, então o produto deve usar utilidade sempre que possível.

**Custo de implementação (antes da primeira receita):** o time desenvolve o MVP em cerca de 3 meses, sem salário. Gastos em dinheiro: abertura de CNPJ e contador, termos de uso e LGPD, servidor e domínio, cerca de R\$ 4 mil. O prêmio do Inovathon cobre.

**Projeção de 3 anos (hipóteses para validar):**

|  | Ano 1 | Ano 2 | Ano 3 |
| :---- | :---- | :---- | :---- |
| Onde | Paranavaí | Paranavaí \+ Noroeste do PR | Paraná |
| Lojas pagantes no fim do ano | 30 | 150 | 600 |
| Média de lojas pagantes no ano | 12 | 90 | 380 |
| Receita (ticket médio de R\$ 149\) | R\$ 21 mil | R\$ 161 mil | R\$ 679 mil |
| Custo variável (\~R\$ 30/loja/mês) | R\$ 5 mil | R\$ 32 mil | R\$ 137 mil |
| Time: 5 pessoas, pró-labore \+ INSS de 11% | R\$ 100 mil (R\$ 1.500/mês cada, meio período) | R\$ 200 mil (R\$ 3.000/mês cada) | R\$ 333 mil (R\$ 5.000/mês cada, tempo integral) |
| Outros custos fixos | R\$ 20 mil (ver Investimento do primeiro ano) | R\$ 47 mil (+ 1 pessoa de suporte e vendas meio período) | R\$ 190 mil (equipe de vendas e suporte, nuvem, marketing, contador) |
| **Resultado** | **R\$ \-103 mil** | **R\$ \-118 mil** | **R\$ \+20 mil** |

Com o salário do time, o negócio precisa de cerca de **R\$ 220 mil de investimento acumulado** nos dois primeiros anos e empata no Ano 3\. O ponto de equilíbrio, com o time em tempo integral, fica em torno de 370 lojas pagantes em média.

Por que dois planos: com preço único de R\$ 99, o resultado seria de R\$ \-110 mil, R\$ \-172 mil e R\$ \-208 mil, e o negócio não se pagaria em 3 anos. A projeção supõe metade das lojas em cada plano.

Não inclui cancelamentos; validar a taxa de cancelamento com os pilotos.

## **Investimento do primeiro ano**

Inclui o pró-labore do time. Valores estimados, para validar.

| Item | Custo no ano |
| :---- | :---- |
| Time: 5 pessoas, R\$ 1.500/mês cada (meio período), mais INSS de 11% do pró-labore | R\$ 99.900 |
| Abertura do CNPJ e contador (R\$ 300/mês) | R\$ 4.600 |
| Jurídico: termos de uso, política de privacidade e contrato (LGPD) | R\$ 2.500 |
| Nuvem: servidor, banco de dados e backups (cerca de R\$ 400/mês) | R\$ 4.800 |
| WhatsApp e IA (lojas pagantes e pilotos, cerca de R\$ 30/loja/mês) | R\$ 5.200 |
| Domínio, e-mail e ferramentas | R\$ 1.500 |
| Marketing local e deslocamento (material, eventos da ACIAP) | R\$ 4.000 |
| Reserva para imprevistos | R\$ 2.300 |
| **Total** | **cerca de R\$ 125 mil** |

Com receita estimada de R\$ 21 mil no Ano 1, a necessidade de investimento fica em cerca de **R\$ 103 mil**. Se o time não tirar pró-labore no Ano 1, ela cai para cerca de R\$ 4 mil. Fontes possíveis: investidor anjo ou aceleradora, editais de subvenção para inovação (Sebrae e governo do Paraná, a pesquisar), o prêmio do Inovathon e créditos de nuvem para startups (Microsoft for Startups ou AWS Activate). Pró-labore de sócio paga INSS de 11%; se alguém for contratado com carteira assinada, os encargos são bem maiores.

## **Tecnologia**

| Camada | Escolha | Por quê |
| :---- | :---- | :---- |
| Servidor (back-end) | C\# com ASP.NET Core (Web API) | O time domina; rápido, tipado e com bom suporte na nuvem |
| Rotinas agendadas | Worker Service do .NET com Hangfire | Envio diário das 9h, cálculo de quem chamar, vencimento do cashback |
| Aplicativo (front-end) | React com TypeScript (Vite), como PWA | Abre pelo link no celular, sem loja de apps; acessível (WCAG AA) |
| Banco de dados | PostgreSQL | Clientes, vendas, mensagens, consentimentos e cashback; CPF criptografado |
| Mensagens | API oficial do WhatsApp (Cloud API da Meta), com webhooks | Envio das mensagens e recebimento das respostas (botões Gostei e Tive um problema) |
| IA (fase 2\) | API de modelo de linguagem | Registrar venda por texto livre ou áudio e deixar as mensagens mais naturais |
| Hospedagem | Azure (recomendado) ou AWS | Ver abaixo |
| Qualidade | Testes automatizados (xUnit no servidor, Playwright no aplicativo) e GitHub Actions | Cada mudança testada e publicada automaticamente |
| Segurança e LGPD | Login do lojista (ASP.NET Core Identity), criptografia, registro de consentimento, opção de sair por mensagem | Exigência da LGPD e das regras do WhatsApp |

**Azure ou AWS:** recomendamos Azure por casar melhor com .NET: App Service para o servidor, Azure Database for PostgreSQL e Application Insights para monitorar. Na AWS, o equivalente seria Elastic Beanstalk ou ECS, RDS para PostgreSQL e CloudWatch. Como o custo no começo é baixo nas duas, vale decidir pela que der mais créditos para startups.

## **Mercado em Paranavaí**

* Empresas ativas no município: cerca de 14,1 mil em 2025 (estudo apresentado com o Sebrae).  
* Mercado considerado: 6 segmentos do varejo com compra recorrente, escolhidos para bater com as entrevistas, somando 952 lojas ativas.

| Segmento | Lojas ativas | Depoimento |
| :---- | :---- | :---- |
| Vestuário e acessórios | 627 | Conseguir com uma loja de roupas |
| Bebidas e conveniência | 111 | Loja de artigos de churrasco (tia do Luis) |
| Ferragens e ferramentas | 90 | Reparo de ferramentas elétricas (pai de um membro) |
| Calçados | 57 | Jorrovi, pelo Wellington (ACIAP) |
| Tecidos e armarinho | 37 | Revenda de tecidos por metro (tio de uma membro) |
| Revendas de gás (GLP) | 30 | Revenda de gás (tia do Luis) |
| Total | 952 |  |

Fonte: MaisCNPJ, base da Receita Federal de out/2026, atividade principal. O reparo de ferramentas é serviço, mas o público e o ciclo de recompra são os mesmos de ferragens e ferramentas.

* Frase para o slide: "Nos 6 segmentos que validamos com comerciantes, Paranavaí tem 952 lojas ativas. Nossa meta do primeiro ano é 30."  
* Meta do Ano 1: 30 lojas, cerca de 3% desse mercado.  
* Se não conseguirem depoimento de uma loja de roupas até o pitch: tirar vestuário e ficar com 325 lojas (meta de cerca de 9%).  
* O garagista entra como contraponto, não como mercado: "testamos com quatro comerciantes, e o produto encaixa melhor em quem vende produtos e serviços que se repetem".  
* Canal de venda: parceria com a ACIAP (condição especial para associados) e programas do Sebrae. A Jorrovi é candidata a piloto.

Nicho inicial: as 30 revendas de gás são o caso mais claro de recompra previsível (o botijão acaba), e é o negócio de um dos nossos pilotos.

Expansão (segmentos recorrentes ainda sem depoimento): cosméticos e perfumaria (127), pet shop (77), hortifrúti (55), farmácias (49), minimercados e açougues. Materiais de construção (45) fica de fora: compra de obra é pontual.

## **Protótipo**

O protótipo navegável já está pronto: [Freguês – protótipo](https://claude.ai/artifact/NzdTFp54sD83WchDvT2Fx5). Funciona no celular, com clientes e números de exemplo, e não envia mensagens de verdade.

Telas:

* **Hoje**: lista de quem chamar, separada em "Precisa da sua atenção" (alertas de problema), "Clientes novos" (régua da primeira compra), "Hora de lembrar" e "Clientes sumidos", com a mensagem pronta e editável.  
* **Registrar venda**: em 3 toques ou pelo botão "Falar a venda" (simula a IA de voz).  
* **Recompensas**: duas regras, uma para a segunda compra (com prazo) e outra para clientes sumidos, cada uma com tipo de recompensa e prévia da mensagem.  
* **Resultados**: taxa de segunda compra, clientes sumidos que voltaram e problemas resolvidos.

No topo dá para trocar entre três lojas (gás e churrasco, reparo de ferramentas, tecidos) e aumentar a letra.

Roteiro de demonstração para a banca:

1. Tela Hoje: Lucas, cliente novo, recebe o "Deu tudo certo?" e responde Tive um problema. O alerta aparece no topo e o lojista resolve.  
2. Marcos, que comprou uma vez, recebe o lembrete com a recompensa da segunda compra e volta.  
3. "Cliente comprou de novo": fecha o ciclo.  
4. Resultados: taxa de segunda compra e problemas resolvidos antes de perder o cliente.

## **Próximos passos**

* ☐ Entrevistar os quatro comerciantes hoje e mostrar o protótipo para cada um  
* ☐ Anotar números reais: clientes por mês, quantos voltam, tempo gasto no WhatsApp  
* ☐ Passar produtos e prazos reais de cada loja para atualizar o protótipo  
* ☐ Pesquisar concorrentes diretos por setor  
* ☐ Definir nome final e modelo de cobrança (assinatura, freemium)  
* ☐ Montar o pitch: dor, solução, mercado (TAM/SAM/SOM) e plano de 3 anos  
* ☐ Ensaiar e cronometrar os 5 minutos

Perguntas para as entrevistas:

1. Como o cliente costuma voltar? Ele liga, aparece ou some?  
2. Você sabe quando um cliente parou de comprar com você?  
3. Quanto tempo por dia vai em WhatsApp respondendo "tá pronto?" ou "tem tal coisa?"  
4. Já perdeu venda para concorrente ou para a internet por não ter chamado o cliente antes?  
5. Você pagaria por algo que fizesse isso por você? Quanto faz sentido?  
6. Para o garagista, pergunta aberta: o que mais te faz perder venda?

Se as entrevistas mostrarem uma dor diferente, seguir a dor, não a ideia.

