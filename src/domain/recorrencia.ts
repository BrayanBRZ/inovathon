import { diasEntre, somarDias } from './formato';
import type {
    Cliente,
    Dia,
    Produto,
    Regra,
    Situacao,
} from './tipos';

/** Faltando quantos dias para o intervalo médio o cliente entra em "hora de lembrar". */
export const ANTECEDENCIA = 5;
/** Passou de quantas vezes o intervalo médio para ficar "atrasado". */
export const FOLGA_ATRASO = 1.25;

/**
 * Motor de recorrência: calcula o intervalo médio entre as compras do cliente
 * (ou usa o prazo do produto, se ele só comprou uma vez) e decide o estado.
 */
export function situacao(c: Cliente, produtos: Produto[], regraSumido: Regra, hoje: Dia): Situacao
{
    const compras = [...c.compras].sort((a, b) => a.data.localeCompare(b.data));
    const ultima = compras[compras.length - 1];
    const desde = diasEntre(ultima.data, hoje);
    const intervalos: number[] = [];
    for (let i = 1; i < compras.length; i++) intervalos.push(diasEntre(compras[i - 1].data, compras[i].data));
    const produto = produtos.find(p => p.id === ultima.produtoId);
    const media = intervalos.length
        ? Math.round(intervalos.reduce((a, b) => a + b, 0) / intervalos.length)
        : (produto?.ciclo ?? 30);

    let est: Situacao['est'];
    let etapa: Situacao['etapa'] = null;
    if (regraSumido.ativa && desde >= regraSumido.dias) est = 'sumido';
    else if (compras.length === 1)
    {
        est = 'novo';
        if (desde < 1) etapa = 'recente';
        else if (desde < 7) etapa = 'obrigado';
        else if (desde < media - ANTECEDENCIA) etapa = 'dica';
        else etapa = 'segunda';
    }
    else if (desde >= media * FOLGA_ATRASO) est = 'atrasado';
    else if (desde >= media - ANTECEDENCIA) est = 'perto';
    else est = 'emdia';

    return {
        desde,
        media,
        est,
        etapa,
        aprendido: intervalos.length > 0,
        proxima: somarDias(ultima.data, media),
        ultima,
    };
}

export function produtoDe(produtos: Produto[], id: string): Produto | undefined
{
    return produtos.find(p => p.id === id);
}
