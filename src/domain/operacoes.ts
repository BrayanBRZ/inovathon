/**
 * Ações sobre uma loja. Cada função recebe uma cópia da loja (veja `comLoja` na store),
 * altera e devolve um resultado para a interface mostrar.
 */
import { diasEntre } from './formato';
import { bloqueio, chavePulo, filaDoDia } from './fila';
import {
    novaRecompensa,
    recompensaValida,
    textoComprovante,
    textoMensagem,
    TIPOS_CONVITE,
    valorACobrar,
} from './mensagens';
import { situacao } from './recorrencia';
import type {
    Cliente,
    Compra,
    Dia,
    Loja,
    Mensagem,
    TipoMensagem,
} from './tipos';

/** Compra até quantos dias depois de um lembrete conta como venda recuperada. */
export const JANELA_ATRIBUICAO = 14;
/** Validade da recompensa oferecida na reativação de sumidos. */
export const VALIDADE_REATIVACAO = 30;

let seq = 0;
export function novoId(prefixo: string)
{
    seq = (seq + 1) % 1e6;
    return `${prefixo}${Date.now().toString(36)}${seq.toString(36)}`;
}

function cliente(l: Loja, id: string): Cliente
{
    const c = l.clientes.find(x => x.id === id);
    if (!c) throw new Error(`Cliente ${id} não encontrado`);
    return c;
}

function registrarMensagem(l: Loja, c: Cliente, tipo: TipoMensagem, texto: string, hoje: Dia, hora: string): Mensagem
{
    const m: Mensagem = {
        id: novoId('m'),
        clienteId: c.id,
        tipo,
        data: hoje,
        hora,
        texto,
        status: 'enviada',
    };
    l.mensagens.unshift(m);
    if (tipo === 'sumido' && l.regraSumido.ativa)
    {
        const s = situacao(c, l.produtos, l.regraSumido, hoje);
        c.recompensa = novaRecompensa(
            l.regraSumido,
            'sumido',
            s.ultima.valor,
            hoje,
            VALIDADE_REATIVACAO,
        );
    }
    return m;
}

/**
 * @summary
 * Efetiva um envio direto respeitando os bloqueios da régua de acompanhamento.
 *
 * @param l - Loja alterada em memória.
 * @param clienteId - Destinatário cadastrado na loja.
 * @param tipo - Classificação explícita; atendimento não participa da atribuição comercial.
 * @param texto - Conteúdo não vazio.
 * @param hoje - Dia do envio.
 * @param hora - Horário exibido no histórico.
 * @returns Mensagem registrada, com eventual benefício de reativação concedido.
 * @throws Error se o cliente não existir, o texto estiver vazio ou o acompanhamento estiver bloqueado.
 */
export function enviarMensagem(l: Loja, clienteId: string, tipo: TipoMensagem, texto: string, hoje: Dia, hora: string)
{
    const c = cliente(l, clienteId);
    const motivo = bloqueio(
        l,
        c,
        situacao(c, l.produtos, l.regraSumido, hoje),
        tipo,
        hoje,
    );
    if (motivo) throw new Error(motivo);
    if (!texto.trim()) throw new Error('Escreva a mensagem antes de enviar.');
    return registrarMensagem(
        l,
        c,
        tipo,
        texto,
        hoje,
        hora,
    );
}

/** O envio automático das 9h: manda a mensagem de cada cliente da fila. */
export function dispararEnvio(l: Loja, hoje: Dia): number
{
    const fila = filaDoDia(l, hoje);
    for (const { cliente: c, s, tipo } of fila) registrarMensagem(
        l,
        c,
        tipo,
        textoMensagem(
            c,
            l,
            tipo,
            s,
            hoje,
        ),
        hoje,
        '09:00',
    );
    return fila.length;
}

export function pular(l: Loja, clienteId: string, tipo: TipoMensagem, hoje: Dia)
{
    l.pulados.push(chavePulo(clienteId, tipo, hoje));
}

export type Resposta = 'gostei' | 'problema' | 'quer';

/** Texto que o cliente "responde" na demonstração. */
export function textoResposta(r: Resposta, comCredito: boolean): string
{
    if (r === 'gostei') return 'Gostei! Deu tudo certo, obrigado.';
    if (r === 'problema') return 'Tive um problema.';
    return comCredito ? 'Pode trazer! Vou usar meu crédito.' : 'Quero sim! Pode separar pra mim.';
}

/**
 * @summary
 * Simula uma resposta e abre o alerta de problema quando necessário.
 *
 * @param l - Loja alterada em memória.
 * @param mensagemId - Mensagem respondida; inexistente é ignorada.
 * @param r - Resposta simulada.
 * @param hoje - Data para verificar a elegibilidade do cashback mencionado na resposta.
 * @param hora - Horário apresentado na resposta.
 */
export function responder(l: Loja, mensagemId: string, r: Resposta, hoje: Dia, hora: string)
{
    const m = l.mensagens.find(x => x.id === mensagemId);
    if (!m) return;
    const c = cliente(l, m.clienteId);
    m.status = r === 'quer' ? 'respondeu' : r;
    m.resposta = { hora, texto: textoResposta(r, recompensaValida(c, hoje)?.tipo === 'cashback') };
    if (r === 'problema' && !l.problemasAbertos.includes(m.clienteId)) l.problemasAbertos.push(m.clienteId);
}

/**
 * @summary
 * Encerra um problema aberto e registra sua data, sem duplicar resoluções.
 *
 * @param l - Loja alterada em memória.
 * @param clienteId - Cliente com problema pendente; sem pendência a operação é ignorada.
 * @param hoje - Data incluída nos indicadores de resolução.
 */
export function resolverProblema(l: Loja, clienteId: string, hoje: Dia)
{
    if (!l.problemasAbertos.includes(clienteId)) return;
    l.problemasAbertos = l.problemasAbertos.filter(id => id !== clienteId);
    l.problemasResolvidos.push({ clienteId, data: hoje });
}

/**
 * @summary
 * Dados necessários para registrar uma compra e sua eventual recuperação.
 *
 * @property clienteId - Cliente existente; ausente exige os dados de novo cliente.
 * @property novo - Nome, telefone e CPF opcional para cadastrar o comprador.
 * @property produtoId - Produto do catálogo da loja.
 * @property valor - Valor bruto positivo em reais.
 * @property usarRecompensa - Quando verdadeiro, resgata o benefício elegível nesta compra.
 * @property viaMensagemId - Restringe a origem a um convite que ainda precisa atender às regras de atribuição.
 */
export interface NovaVenda {
    clienteId?: string;
    novo?: { nome: string; tel: string; cpf?: string };
    produtoId: string;
    valor: number;
    usarRecompensa?: boolean;
    /** Seleciona uma mensagem que ainda precisa atender às regras de atribuição. */
    viaMensagemId?: string;
}

/**
 * @summary
 * Resultado do registro de uma venda para a apresentação da confirmação.
 *
 * @property cliente - Cliente atualizado com a compra.
 * @property tipo - Primeira compra, segunda compra, recuperação por convite ou venda normal.
 * @property mensagem - Comprovante da primeira compra ou convite responsável pela recuperação.
 * @property media - Prazo de acompanhamento após a compra, em dias.
 * @property valorPago - Cobrança efetiva em reais, após aplicar o benefício selecionado.
 */
export interface ResultadoVenda {
    cliente: Cliente;
    tipo: 'novo' | 'segunda' | 'recuperada' | 'normal';
    mensagem?: Mensagem;
    media: number;
    /** Valor efetivamente cobrado após aplicar a recompensa. */
    valorPago: number;
}

/**
 * @summary
 * Registra uma compra, aplica o benefício elegível e encerra o ciclo dos convites anteriores.
 *
 * @remarks
 * O histórico conserva o valor bruto e o cobrado. A recuperação usa um convite não consumido,
 * do mesmo cliente e ciclo, enviado nos 14 dias anteriores. A segunda compra encerra seu benefício.
 *
 * @param l - Loja alterada em memória.
 * @param v - Cliente, produto, valor bruto e opção de resgate.
 * @param hoje - Data da compra.
 * @param hora - Horário do registro.
 * @returns Cliente atualizado, classificação da venda e valor efetivamente cobrado.
 * @throws Error se o valor não for positivo e finito ou se o produto ou cliente não existir.
 */
export function registrarVenda(l: Loja, v: NovaVenda, hoje: Dia, hora: string): ResultadoVenda
{
    if (!Number.isFinite(v.valor) || v.valor <= 0) throw new Error('Informe um valor de venda positivo.');
    if (!l.produtos.some(p => p.id === v.produtoId)) throw new Error('Produto não encontrado.');
    const compra: Compra = {
        data: hoje,
        hora,
        produtoId: v.produtoId,
        valor: v.valor,
        valorPago: valorACobrar(v.valor),
    };

    if (!v.clienteId)
    {
        if (!v.novo) throw new Error('Venda sem cliente');
        const nome = v.novo.nome.trim();
        const c: Cliente = {
            id: novoId('c'),
            nome,
            chamar: nome.split(/\s+/)[0],
            tel: v.novo.tel,
            cpf: v.novo.cpf || undefined,
            autorizadoEm: hoje,
            compras: [compra],
        };
        if (l.regraSegunda.ativa) c.recompensa = novaRecompensa(
            l.regraSegunda,
            'segunda',
            v.valor,
            hoje,
            l.regraSegunda.dias,
        );
        l.clientes.push(c);
        const m = registrarMensagem(
            l,
            c,
            'comprovante',
            textoComprovante(c, l, v.valor, c.recompensa),
            hoje,
            hora,
        );
        return {
            cliente: c,
            tipo: 'novo',
            mensagem: m,
            media: situacao(c, l.produtos, l.regraSumido, hoje).media,
            valorPago: compra.valorPago!,
        };
    }

    const c = cliente(l, v.clienteId);
    const eraNovo = c.compras.length === 1;
    const rec = recompensaValida(c, hoje);
    if (v.usarRecompensa && rec)
    {
        compra.valorPago = valorACobrar(v.valor, rec);
        compra.recompensaUsada = rec.descricao;
        c.recompensa = undefined;
    }

    const ultima = situacao(c, l.produtos, l.regraSumido, hoje).ultima;
    const origem = l.mensagens.find(m =>
        (!v.viaMensagemId || m.id === v.viaMensagemId)
        && m.clienteId === c.id
        && (m.status === 'enviada' || m.status === 'respondeu')
        && !m.encerradaEm
        && TIPOS_CONVITE.includes(m.tipo)
        && m.data >= ultima.data
        && (m.data !== ultima.data || m.hora >= (ultima.hora ?? '00:00'))
        && diasEntre(m.data, hoje) >= 0
        && diasEntre(m.data, hoje) <= JANELA_ATRIBUICAO);
    if (origem)
    {
        origem.status = 'voltou';
        origem.valorVolta = compra.valorPago;
        compra.recuperada = true;
    }
    // Uma compra encerra todos os convites pendentes anteriores, inclusive os do mesmo dia.
    for (const m of l.mensagens)
        if (m.clienteId === c.id && TIPOS_CONVITE.includes(m.tipo) && !m.encerradaEm && m.data <= hoje)
            m.encerradaEm = hoje;
    if (eraNovo && c.recompensa?.origem === 'segunda') c.recompensa = undefined;
    c.compras.push(compra);

    const media = situacao(c, l.produtos, l.regraSumido, hoje).media;
    return {
        cliente: c,
        tipo: origem ? 'recuperada' : eraNovo ? 'segunda' : 'normal',
        mensagem: origem,
        media,
        valorPago: compra.valorPago!,
    };
}
