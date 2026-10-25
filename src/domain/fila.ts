import { diasEntre } from './formato';
import { TIPOS_CONVITE } from './mensagens';
import { situacao } from './recorrencia';
import type {
    Cliente,
    Dia,
    Loja,
    Situacao,
    TipoMensagem,
} from './tipos';

/** Lembretes, convites e reativações: no máximo um a cada 7 dias por cliente. */
export const LIMITE_DIAS = 7;
/** Cliente sumido recebe a reativação e, depois de 30 dias, uma última tentativa. Depois disso, paramos. */
export const TENTATIVAS_SUMIDO = 2;
export const ESPERA_ULTIMA_TENTATIVA = 30;

export interface ItemFila {
    cliente: Cliente;
    s: Situacao;
    tipo: TipoMensagem;
}

export function chavePulo(clienteId: string, tipo: TipoMensagem, hoje: Dia)
{
    return `${clienteId}|${tipo}|${hoje}`;
}

/** Qual mensagem a situação pede, ou null se não há nada a mandar. */
export function tipoDaSituacao(s: Situacao): TipoMensagem | null
{
    if (s.etapa) return s.etapa === 'recente' ? null : s.etapa;
    if (s.est === 'perto' || s.est === 'atrasado' || s.est === 'sumido') return s.est;
    return null;
}

/** Motivo pelo qual o cliente não recebe mensagem hoje (null se recebe). */
export function bloqueio(l: Loja, c: Cliente, s: Situacao, tipo: TipoMensagem, hoje: Dia): string | null
{
    if (l.pulados.includes(chavePulo(c.id, tipo, hoje))) return 'Você pediu para não enviar hoje.';
    const desdeCompra = l.mensagens.filter(m => m.clienteId === c.id && m.data >= s.ultima.data);
    if (tipo === 'sumido')
    {
        const tentativas = desdeCompra.filter(m => m.tipo === 'sumido');
        if (tentativas.length >= TENTATIVAS_SUMIDO) return 'Já recebeu a última tentativa. Paramos para não virar spam.';
        if (tentativas.length && diasEntre(tentativas[0].data, hoje) < ESPERA_ULTIMA_TENTATIVA)
            return 'A última tentativa sai 30 dias depois da primeira.';
    }
    else if (desdeCompra.some(m => m.tipo === tipo))
    {
        return 'Esta mensagem já foi enviada.';
    }
    if (TIPOS_CONVITE.includes(tipo))
    {
        const recente = desdeCompra.some(m => TIPOS_CONVITE.includes(m.tipo) && diasEntre(m.data, hoje) < LIMITE_DIAS);
        if (recente) return 'Recebeu um lembrete há menos de uma semana.';
    }
    return null;
}

export function filaDoDia(l: Loja, hoje: Dia): ItemFila[]
{
    const out: ItemFila[] = [];
    for (const cliente of l.clientes)
    {
        const s = situacao(cliente, l.produtos, l.regraSumido, hoje);
        const tipo = tipoDaSituacao(s);
        if (tipo && !bloqueio(
            l,
            cliente,
            s,
            tipo,
            hoje,
        )) out.push({ cliente, s, tipo });
    }
    return out;
}
