import { somarDias } from './formato';
import type { Dia, Loja, Numeros } from './tipos';

/**
 * @summary
 * Deriva os resultados mensais e a taxa de segunda compra da base cadastrada.
 *
 * @param l - Loja com o histórico completo de compras e resoluções.
 * @param hoje - Último dia incluído no mês; a taxa considera toda a base até essa data.
 * @returns Receita líquida e clientes distintos recuperados no mês, além dos demais indicadores.
 */
export function numerosDaLoja(l: Loja, hoje: Dia): Numeros
{
    const noMes = (data: Dia) => data.slice(0, 7) === hoje.slice(0, 7) && data <= hoje;
    const base = l.clientes.map(c => ({ c, compras: c.compras.filter(x => x.data <= hoje) }));
    const compras = base.flatMap(x => x.compras).filter(x => noMes(x.data));
    const recuperado = compras.filter(x => x.recuperada).reduce((a, x) => a + (x.valorPago ?? x.valor), 0);
    return {
        recuperado: Math.round(recuperado * 100) / 100,
        voltaram: base.filter(x => x.compras.some(c => c.recuperada && noMes(c.data))).length,
        novos: base.filter(x => x.compras.length > 0).length,
        segunda: base.filter(x => x.compras.length >= 2).length,
        problemas: l.problemasResolvidos.filter(x => noMes(x.data)).length,
        recompensasUsadas: compras.filter(x => x.recompensaUsada).length,
    };
}

/**
 * @summary
 * Monta a série diária usando exclusivamente compras recuperadas do histórico.
 *
 * @param l - Loja consultada.
 * @param hoje - Último dia da série, inclusive.
 * @param n - Quantidade de dias, com padrão de sete.
 * @returns Dias do mais antigo ao mais recente, com os valores efetivamente cobrados em reais.
 */
export function serieRecuperado(l: Loja, hoje: Dia, n = 7): { dia: Dia; valor: number }[]
{
    const compras = l.clientes.flatMap(c => c.compras).filter(x => x.recuperada);
    return Array.from({ length: n }, (_, i) =>
    {
        const dia = somarDias(hoje, i - n + 1);
        const valor = compras.filter(x => x.data === dia).reduce((a, x) => a + (x.valorPago ?? x.valor), 0);
        return { dia, valor: Math.round(valor * 100) / 100 };
    });
}
