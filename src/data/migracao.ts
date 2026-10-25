import { TIPOS_CONVITE } from '@/domain/mensagens';
import type { Loja } from '@/domain/tipos';

/**
 * @summary
 * Atualiza uma loja persistida sem descartar clientes, vendas ou configurações.
 *
 * @param anterior - Loja salva antes de os benefícios preservarem seus termos e os indicadores serem derivados.
 * @returns Cópia compatível, sem totais sintéticos e com convites de ciclos encerrados identificados.
 */
export function migrarLoja(anterior: Loja): Loja
{
    const loja = structuredClone(anterior);
    delete (loja as Loja & { numeros?: unknown }).numeros;
    delete (loja as Loja & { recuperadoPorDia?: unknown }).recuperadoPorDia;
    loja.problemasResolvidos ??= [];
    for (const c of loja.clientes)
    {
        const rec = c.recompensa;
        if (rec)
        {
            const desconto = rec.descricao.match(/(\d+(?:[.,]\d+)?)% de desconto/);
            rec.tipo ??= rec.valor !== undefined
                ? 'cashback'
                : desconto
                    ? 'desconto'
                    : rec.descricao.includes('entrega grátis') ? 'entrega' : 'brinde';
            const regra = rec.origem === 'segunda' ? loja.regraSegunda : loja.regraSumido;
            rec.pct ??= desconto ? Number(desconto[1].replace(',', '.')) : regra.pct;
            if (rec.origem === 'segunda' && c.compras.length > 1) c.recompensa = undefined;
        }
        const ultima = [...c.compras].sort((a, b) => b.data.localeCompare(a.data) || (b.hora ?? '').localeCompare(a.hora ?? ''))[0];
        for (const m of loja.mensagens)
        {
            if (m.clienteId === c.id && TIPOS_CONVITE.includes(m.tipo) && !m.encerradaEm
                && (m.data < ultima.data || (m.data === ultima.data && m.hora <= (ultima.hora ?? '10:00'))))
                m.encerradaEm = ultima.data;
        }
    }
    return loja;
}
