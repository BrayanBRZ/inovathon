/** Datas sempre como 'yyyy-MM-dd' (dia do calendário, sem fuso). */
export type Dia = string;

export type TipoRecompensa = 'cashback' | 'desconto' | 'brinde' | 'entrega';

export interface Regra {
    ativa: boolean;
    /** Regra de sumidos: dias sem comprar. Regra da 2ª compra: validade da recompensa. */
    dias: number;
    tipo: TipoRecompensa;
    pct: number;
    brinde: string;
}

export interface Produto {
    id: string;
    nome: string;
    preco: number;
    /** Prazo de recompra padrão, usado enquanto o cliente só tem uma compra. */
    ciclo: number;
    msg: string;
    dica: string;
}

/**
 * @summary
 * Compra registrada, com valores bruto e cobrado e eventual origem de recuperação.
 *
 * @property data - Dia da compra no calendário da demonstração.
 * @property hora - Horário do registro; ausente em exemplos antigos.
 * @property produtoId - Produto comprado.
 * @property valor - Valor bruto antes do benefício, em reais.
 * @property valorPago - Valor cobrado após o benefício; ausente em históricos sem esse detalhamento.
 * @property recuperada - Indica atribuição a um convite comercial elegível.
 * @property recompensaUsada - Descrição do benefício resgatado nesta compra.
 */
export interface Compra {
    data: Dia;
    /** Hora do registro (as compras de exemplo não têm). */
    hora?: string;
    produtoId: string;
    valor: number;
    /** Valor efetivamente cobrado, após o benefício; ausente no histórico antigo sem abatimento. */
    valorPago?: number;
    /** Veio de uma mensagem do Freguês (até 14 dias depois de lembrete, convite ou reativação). */
    recuperada?: boolean;
    recompensaUsada?: string;
}

/**
 * @summary
 * Benefício concedido, com os termos preservados mesmo que a regra da loja mude.
 *
 * @property origem - Segunda compra ou reativação de um cliente sumido.
 * @property tipo - Natureza do benefício concedido.
 * @property pct - Percentual concedido, para cashback ou desconto.
 * @property descricao - Oferta apresentada ao cliente.
 * @property valor - Saldo em reais, somente para cashback.
 * @property validaAte - Último dia em que o benefício pode ser utilizado.
 */
export interface Recompensa {
    origem: 'segunda' | 'sumido';
    tipo: TipoRecompensa;
    pct: number;
    descricao: string;
    /** Só para cashback: valor em reais. */
    valor?: number;
    validaAte: Dia;
}

export interface Cliente {
    id: string;
    nome: string;
    /** Como a loja chama o cliente na mensagem: "Dona Maria", "Seu Jorge". */
    chamar: string;
    tel: string;
    cpf?: string;
    autorizadoEm: Dia;
    compras: Compra[];
    recompensa?: Recompensa;
}

/**
 * @summary
 * Finalidade explícita da mensagem; atendimento não é um convite comercial.
 */
export type TipoMensagem
    = | 'comprovante'
        | 'obrigado'
        | 'dica'
        | 'segunda'
        | 'perto'
        | 'atrasado'
        | 'sumido'
        | 'atendimento'
        | 'problema';

export type StatusMensagem = 'enviada' | 'gostei' | 'problema' | 'respondeu' | 'voltou';

/**
 * @summary
 * Envio e seu resultado no histórico de uma conversa.
 *
 * @property id - Identificador do envio.
 * @property clienteId - Destinatário na loja.
 * @property tipo - Finalidade do conteúdo.
 * @property data - Dia do envio.
 * @property hora - Horário do envio.
 * @property texto - Conteúdo apresentado ao cliente.
 * @property status - Último resultado desse envio.
 * @property valorVolta - Valor cobrado na compra atribuída a este envio, em reais.
 * @property encerradaEm - Compra que encerrou o ciclo; impede outra atribuição ao convite.
 * @property resposta - Texto e horário da resposta simulada, quando houver.
 */
export interface Mensagem {
    id: string;
    clienteId: string;
    tipo: TipoMensagem;
    data: Dia;
    hora: string;
    texto: string;
    status: StatusMensagem;
    valorVolta?: number;
    /** Compra que encerrou o ciclo deste convite; impede atribuir outra venda ao mesmo ciclo. */
    encerradaEm?: Dia;
    /** Resposta do cliente (simulada na demonstração). */
    resposta?: { hora: string; texto: string };
}

/**
 * @summary
 * Indicadores derivados das compras, sem totais independentes do histórico.
 *
 * @property recuperado - Valor efetivamente cobrado em compras recuperadas no mês até o dia consultado.
 * @property voltaram - Clientes distintos com compra recuperada no mesmo período.
 * @property novos - Clientes da base com primeira compra até o dia consultado, em qualquer mês.
 * @property segunda - Clientes dessa base que já fizeram pelo menos duas compras.
 * @property problemas - Problemas resolvidos no mês até o dia consultado.
 * @property recompensasUsadas - Compras com benefício utilizado no mesmo período mensal.
 */
export interface Numeros {
    recuperado: number;
    voltaram: number;
    novos: number;
    segunda: number;
    problemas: number;
    recompensasUsadas: number;
}

/**
 * @summary
 * Dados persistidos da loja; indicadores são derivados do histórico ao consultar.
 *
 * @property id - Identificador da loja de exemplo.
 * @property dono - Nome de quem atende.
 * @property nome - Nome comercial apresentado nas telas.
 * @property de - Complemento usado na identificação da loja nas mensagens.
 * @property tel - Telefone da loja.
 * @property regraSumido - Benefício e prazo mínimo de inatividade para reativação.
 * @property regraSegunda - Benefício e validade exclusivos da segunda compra.
 * @property produtos - Catálogo e prazos padrão.
 * @property clientes - Cadastro com histórico de compras e benefícios concedidos.
 * @property mensagens - Envios ordenados do mais recente para o mais antigo.
 * @property problemasAbertos - Identificadores dos clientes com atendimento pendente.
 * @property problemasResolvidos - Cliente e data de cada resolução registrada.
 * @property auto - Indica se o acompanhamento está apresentado como automático.
 * @property pulados - Chaves de envios que não devem ocorrer no dia solicitado.
 */
export interface Loja {
    id: string;
    /** Nome de quem atende: aparece na saudação e no avatar. */
    dono: string;
    nome: string;
    /** Complemento de "Aqui é ...": "do Gás da Cida". */
    de: string;
    tel: string;
    regraSumido: Regra;
    regraSegunda: Regra;
    produtos: Produto[];
    clientes: Cliente[];
    mensagens: Mensagem[];
    problemasAbertos: string[];
    /** Registros de resolução, usados nos indicadores por período. */
    problemasResolvidos: { clienteId: string; data: Dia }[];
    auto: boolean;
    /** Chaves "clienteId|tipo|dia" que o lojista mandou não enviar. */
    pulados: string[];
}

export type EstadoCliente = 'novo' | 'emdia' | 'perto' | 'atrasado' | 'sumido';
export type EtapaNovo = 'recente' | 'obrigado' | 'dica' | 'segunda';

/**
 * @summary
 * Estado de acompanhamento do cliente e estimativa baseada no seu histórico de compras.
 *
 * @property desde - Dias entre a última compra e o dia de referência.
 * @property media - Intervalo médio em dias; sem histórico, prazo padrão usado no acompanhamento.
 * @property est - Estado atual do relacionamento com o cliente.
 * @property etapa - Etapa de acompanhamento de uma primeira compra, ou null fora dessa régua.
 * @property aprendido - Indica se o intervalo foi calculado entre compras em dias diferentes.
 * @property proxima - Data estimada de recompra, inclusive passada; null sem compras em dias diferentes.
 * @property ultima - Compra mais recente usada como referência para o cálculo.
 */
export interface Situacao {
    desde: number;
    media: number;
    est: EstadoCliente;
    etapa: EtapaNovo | null;
    aprendido: boolean;
    proxima: Dia | null;
    ultima: Compra;
}
