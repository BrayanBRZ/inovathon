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

export interface Compra {
    data: Dia;
    /** Hora do registro (as compras de exemplo não têm). */
    hora?: string;
    produtoId: string;
    valor: number;
    /** Veio de uma mensagem do Freguês (até 14 dias depois de lembrete, convite ou reativação). */
    recuperada?: boolean;
    recompensaUsada?: string;
}

export interface Recompensa {
    origem: 'segunda' | 'sumido';
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

export type TipoMensagem
    = | 'comprovante'
        | 'obrigado'
        | 'dica'
        | 'segunda'
        | 'perto'
        | 'atrasado'
        | 'sumido'
        | 'problema';

export type StatusMensagem = 'enviada' | 'gostei' | 'problema' | 'respondeu' | 'voltou';

export interface Mensagem {
    id: string;
    clienteId: string;
    tipo: TipoMensagem;
    data: Dia;
    hora: string;
    texto: string;
    status: StatusMensagem;
    valorVolta?: number;
    /** Resposta do cliente (simulada na demonstração). */
    resposta?: { hora: string; texto: string };
}

export interface Numeros {
    recuperado: number;
    voltaram: number;
    novos: number;
    segunda: number;
    problemas: number;
    recompensasUsadas: number;
}

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
    numeros: Numeros;
    /** Valor das vendas que vieram de mensagens, por dia (gráfico do Início). */
    recuperadoPorDia: Record<Dia, number>;
    problemasAbertos: string[];
    auto: boolean;
    /** Chaves "clienteId|tipo|dia" que o lojista mandou não enviar. */
    pulados: string[];
}

export type EstadoCliente = 'novo' | 'emdia' | 'perto' | 'atrasado' | 'sumido';
export type EtapaNovo = 'recente' | 'obrigado' | 'dica' | 'segunda';

export interface Situacao {
    desde: number;
    media: number;
    est: EstadoCliente;
    etapa: EtapaNovo | null;
    aprendido: boolean;
    proxima: Dia;
    ultima: Compra;
}
