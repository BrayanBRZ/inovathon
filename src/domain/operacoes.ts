/**
 * Ações sobre uma loja. Cada função recebe uma cópia da loja (veja `comLoja` na store),
 * altera e devolve um resultado para a interface mostrar.
 */
import { diasEntre, somarDias } from './formato';
import { chavePulo, filaDoDia } from './fila';
import {
    novaRecompensa,
    recompensaValida,
    textoComprovante,
    textoMensagem,
    TIPOS_CONVITE,
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

export function enviarMensagem(l: Loja, clienteId: string, tipo: TipoMensagem, texto: string, hoje: Dia, hora: string)
{
    return registrarMensagem(
        l,
        cliente(l, clienteId),
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

/** Resposta do cliente a uma mensagem: "Gostei", "Tive um problema" ou interesse em comprar. */
export function responder(l: Loja, mensagemId: string, r: Resposta, hoje: Dia, hora: string)
{
    const m = l.mensagens.find(x => x.id === mensagemId);
    if (!m) return;
    const c = cliente(l, m.clienteId);
    m.status = r === 'quer' ? 'respondeu' : r;
    m.resposta = { hora, texto: textoResposta(r, !!recompensaValida(c, hoje)) };
    if (r === 'problema' && !l.problemasAbertos.includes(m.clienteId)) l.problemasAbertos.push(m.clienteId);
}

export function resolverProblema(l: Loja, clienteId: string)
{
    l.problemasAbertos = l.problemasAbertos.filter(id => id !== clienteId);
    l.numeros.problemas++;
}

export interface NovaVenda {
    clienteId?: string;
    novo?: { nome: string; tel: string; cpf?: string };
    produtoId: string;
    valor: number;
    usarRecompensa?: boolean;
    /** Força a atribuição a esta mensagem. */
    viaMensagemId?: string;
}

export interface ResultadoVenda {
    cliente: Cliente;
    tipo: 'novo' | 'segunda' | 'recuperada' | 'normal';
    mensagem?: Mensagem;
    media: number;
}

export function registrarVenda(l: Loja, v: NovaVenda, hoje: Dia, hora: string): ResultadoVenda
{
    const compra: Compra = { data: hoje, hora, produtoId: v.produtoId, valor: v.valor };

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
        l.numeros.novos++;
        const m = registrarMensagem(
            l,
            c,
            'comprovante',
            textoComprovante(c, l, v.valor, c.recompensa),
            hoje,
            hora,
        );
        return { cliente: c, tipo: 'novo', mensagem: m, media: situacao(c, l.produtos, l.regraSumido, hoje).media };
    }

    const c = cliente(l, v.clienteId);
    const eraNovo = c.compras.length === 1;
    const rec = recompensaValida(c, hoje);
    if (v.usarRecompensa && rec)
    {
        compra.recompensaUsada = rec.descricao;
        c.recompensa = undefined;
        l.numeros.recompensasUsadas++;
    }

    const origem = l.mensagens.find(m =>
        v.viaMensagemId
            ? m.id === v.viaMensagemId
            : m.clienteId === c.id
                && (m.status === 'enviada' || m.status === 'respondeu')
                && TIPOS_CONVITE.includes(m.tipo)
                && diasEntre(m.data, hoje) <= JANELA_ATRIBUICAO);
    if (origem)
    {
        origem.status = 'voltou';
        origem.valorVolta = v.valor;
        compra.recuperada = true;
        l.numeros.recuperado += v.valor;
        l.numeros.voltaram++;
        l.recuperadoPorDia[hoje] = (l.recuperadoPorDia[hoje] ?? 0) + v.valor;
    }
    if (eraNovo) l.numeros.segunda++;
    c.compras.push(compra);

    const media = situacao(c, l.produtos, l.regraSumido, hoje).media;
    return { cliente: c, tipo: origem ? 'recuperada' : eraNovo ? 'segunda' : 'normal', mensagem: origem, media };
}

/** Valores recuperados nos últimos `n` dias, do mais antigo para hoje. */
export function serieRecuperado(l: Loja, hoje: Dia, n = 7): { dia: Dia; valor: number }[]
{
    return Array.from({ length: n }, (_, i) =>
    {
        const dia = somarDias(hoje, i - n + 1);
        return { dia, valor: l.recuperadoPorDia[dia] ?? 0 };
    });
}
