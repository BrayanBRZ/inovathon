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
 * @summary
 * Calcula o intervalo de acompanhamento, o estado do cliente e sua estimativa de recompra.
 *
 * @remarks
 * Exige pelo menos uma compra. Com uma única compra, usa o prazo do produto (ou 30 dias)
 * apenas para organizar o acompanhamento, sem gerar uma estimativa de recompra.
 * Compras no mesmo dia não formam um intervalo. A estimativa exige compras em dias diferentes
 * e preserva a data calculada mesmo quando ela já passou. Sumidos precisam ultrapassar também
 * a margem de atraso do próprio ritmo. O convite da segunda compra antecipa o vencimento do benefício.
 *
 * @param c - Cliente com pelo menos uma compra registrada.
 * @param produtos - Produtos da loja e seus prazos padrão de acompanhamento.
 * @param regraSumido - Regra que determina quando um cliente fica sumido, se estiver ativa.
 * @param hoje - Dia de referência para calcular o estado e os dias desde a última compra.
 * @returns Situação calculada, com estimativa de recompra somente após compras em dias diferentes.
 */
export function situacao(c: Cliente, produtos: Produto[], regraSumido: Regra, hoje: Dia): Situacao
{
    const compras = [...c.compras].sort((a, b) => a.data.localeCompare(b.data));
    const ultima = compras[compras.length - 1];
    const desde = diasEntre(ultima.data, hoje);
    const intervalos: number[] = [];
    for (let i = 1; i < compras.length; i++)
    {
        const intervalo = diasEntre(compras[i - 1].data, compras[i].data);
        if (intervalo > 0) intervalos.push(intervalo);
    }
    const produto = produtos.find(p => p.id === ultima.produtoId);
    const media = intervalos.length
        ? Math.round(intervalos.reduce((a, b) => a + b, 0) / intervalos.length)
        : (produto?.ciclo ?? 30);

    let est: Situacao['est'];
    let etapa: Situacao['etapa'] = null;
    if (regraSumido.ativa && desde >= Math.max(regraSumido.dias, Math.ceil(media * FOLGA_ATRASO))) est = 'sumido';
    else if (compras.length === 1)
    {
        est = 'novo';
        const rec = c.recompensa;
        const pertoDeVencer = rec?.origem === 'segunda' && rec.validaAte >= hoje
            && diasEntre(hoje, rec.validaAte) <= ANTECEDENCIA;
        if (desde < 1) etapa = 'recente';
        else if (desde >= 2 && pertoDeVencer) etapa = 'segunda';
        else if (desde < 7) etapa = 'obrigado';
        else if (desde < media - ANTECEDENCIA) etapa = 'dica';
        else etapa = 'segunda';
    }
    else if (desde === 0) est = 'emdia';
    else if (desde >= media * FOLGA_ATRASO) est = 'atrasado';
    else if (desde >= media - ANTECEDENCIA) est = 'perto';
    else est = 'emdia';

    return {
        desde,
        media,
        est,
        etapa,
        aprendido: intervalos.length > 0,
        proxima: intervalos.length > 0 ? somarDias(ultima.data, media) : null,
        ultima,
    };
}

export function produtoDe(produtos: Produto[], id: string): Produto | undefined
{
    return produtos.find(p => p.id === id);
}
