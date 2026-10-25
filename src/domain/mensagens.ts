import { brl, ddmm, somarDias } from './formato';
import { produtoDe } from './recorrencia';
import type {
    Cliente,
    Dia,
    Loja,
    Recompensa,
    Regra,
    Situacao,
    TipoMensagem,
} from './tipos';

export const TIPO_MENSAGEM: Record<TipoMensagem, string> = {
    comprovante: 'Comprovante e recompensa',
    obrigado: 'Pós-venda: deu tudo certo?',
    dica: 'Dica de uso',
    segunda: 'Convite para a 2ª compra',
    perto: 'Lembrete de recompra',
    atrasado: 'Lembrete de recompra',
    sumido: 'Reativação de sumido',
    problema: 'Resposta a problema',
    atendimento: 'Atendimento',
};

/** Tipos que contam para o limite de 1 mensagem por semana e para a venda recuperada. */
export const TIPOS_CONVITE: TipoMensagem[] = [
    'segunda',
    'perto',
    'atrasado',
    'sumido',
];

export function premioTxt(r: Regra, valor?: number): string
{
    if (r.tipo === 'cashback')
        return valor
            ? `${brl((valor * r.pct) / 100)} de cashback`
            : `${r.pct}% de cashback`;
    if (r.tipo === 'desconto') return `${r.pct}% de desconto`;
    if (r.tipo === 'entrega') return 'entrega grátis';
    return r.brinde ? `${r.brinde} de brinde` : 'um brinde';
}

/**
 * @summary
 * Concede um benefício preservando os termos da regra no momento da emissão.
 *
 * @param r - Regra que define o benefício.
 * @param origem - Condição de concessão: segunda compra ou reativação.
 * @param valorCompra - Valor bruto usado como base do cashback em reais.
 * @param dia - Data de concessão.
 * @param validade - Quantidade de dias até o vencimento, inclusive.
 * @returns Oferta com tipo, percentual, descrição e validade próprios.
 */
export function novaRecompensa(
    r: Regra,
    origem: Recompensa['origem'],
    valorCompra: number,
    dia: Dia,
    validade: number,
): Recompensa
{
    return {
        origem,
        tipo: r.tipo,
        pct: r.pct,
        descricao: premioTxt(r, valorCompra),
        valor:
      r.tipo === 'cashback' ? Math.round(valorCompra * r.pct) / 100 : undefined,
        validaAte: somarDias(dia, validade),
    };
}

/**
 * @summary
 * Verifica a validade e a elegibilidade do benefício para a próxima venda.
 *
 * @param c - Cliente com seu histórico e oferta concedida.
 * @param hoje - Data de referência; o dia de vencimento ainda permite resgate.
 * @returns Benefício válido; undefined se vencido ou se a segunda compra já ocorreu.
 */
export function recompensaValida(
    c: Cliente,
    hoje: Dia,
): Recompensa | undefined
{
    return c.recompensa && c.recompensa.validaAte >= hoje
        && (c.recompensa.origem !== 'segunda' || c.compras.length === 1)
        ? c.recompensa
        : undefined;
}

/**
 * @summary
 * Calcula a cobrança com os termos do benefício concedido.
 *
 * @param valor - Valor bruto da venda em reais.
 * @param rec - Benefício elegível e selecionado; ausente mantém a cobrança integral.
 * @returns Valor em reais, arredondado em centavos e nunca negativo.
 */
export function valorACobrar(valor: number, rec?: Recompensa): number
{
    const abatimento = rec?.tipo === 'cashback'
        ? rec.valor ?? 0
        : rec?.tipo === 'desconto' ? valor * rec.pct / 100 : 0;
    return Math.max(0, Math.round((valor - abatimento) * 100) / 100);
}

function oi(c: Cliente, l: Loja)
{
    return `Oi, ${c.chamar}! Aqui é ${l.de}. `;
}

export function textoComprovante(
    c: Cliente,
    l: Loja,
    valor: number,
    rec?: Recompensa,
): string
{
    let t = `Oi, ${c.chamar}! Obrigado pela compra de ${brl(valor)} ${l.de}.`;
    if (rec)
    {
        t
            += rec.tipo === 'cashback'
                ? ` Você ganhou ${rec.descricao} pra usar na segunda compra, até ${ddmm(rec.validaAte)}.`
                : ` Na sua segunda compra, até ${ddmm(rec.validaAte)}, você ganha ${rec.descricao}.`;
    }
    return t;
}

export function textoMensagem(
    c: Cliente,
    l: Loja,
    tipo: TipoMensagem,
    s: Situacao,
    hoje: Dia,
): string
{
    const p = produtoDe(l.produtos, s.ultima.produtoId);
    const nome = p?.nome ?? 'a sua compra';
    const o = oi(c, l);
    switch (tipo)
    {
        case 'sumido':
            return `${o}Faz tempo que você não aparece e sentimos sua falta. Na sua próxima compra você ganha ${premioTxt(l.regraSumido, s.ultima.valor)}.`;
        case 'obrigado':
            return `${o}Obrigado pela compra! Deu tudo certo com ${nome}?`;
        case 'dica':
            return p?.dica.trim() ? `${o}Uma dica pra você: ${p.dica}` : '';
        case 'atendimento':
            return '';
        case 'problema':
            return `${o}Vi que você teve um problema com ${nome}. Me conta o que aconteceu? Quero resolver pra você.`;
        case 'comprovante':
            return textoComprovante(c, l, s.ultima.valor, recompensaValida(c, hoje));
        case 'segunda': {
            let t = o + (p?.msg ?? '');
            const r = recompensaValida(c, hoje);
            if (r)
            {
                t += r.valor
                    ? ` Lembrando: você tem ${r.descricao} pra usar até ${ddmm(r.validaAte)}.`
                    : ` Lembrando: na sua segunda compra você ganha ${r.descricao}, até ${ddmm(r.validaAte)}.`;
            }
            return t;
        }
        default:
            return o + (p?.msg ?? '');
    }
}
