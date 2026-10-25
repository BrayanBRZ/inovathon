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

/** Recompensa criada a partir de uma regra, com validade contada a partir de `dia`. */
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
        descricao: premioTxt(r, valorCompra),
        valor:
      r.tipo === 'cashback' ? Math.round(valorCompra * r.pct) / 100 : undefined,
        validaAte: somarDias(dia, validade),
    };
}

export function recompensaValida(
    c: Cliente,
    hoje: Dia,
): Recompensa | undefined
{
    return c.recompensa && c.recompensa.validaAte >= hoje
        ? c.recompensa
        : undefined;
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
            += l.regraSegunda.tipo === 'cashback'
                ? ` Você ganhou ${rec.descricao} pra usar até ${ddmm(rec.validaAte)}.`
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
            return `${o}Uma dica pra você: ${p?.dica ?? ''}`;
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
