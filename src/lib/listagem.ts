import { useLocation, useNavigate } from 'react-router';

/**
 * @summary
 * Estado transitório de uma listagem, associado à entrada do histórico de navegação.
 *
 * @property lote - Quantidade solicitada e identidade da lista, incluindo loja e filtros.
 * @property retornoLista - Endereço e estado da lista que abriu um detalhe.
 * @property restaurarRolagem - Chave da entrada cuja posição deve ser recuperada ao voltar.
 */
export interface EstadoListagem
{
    lote?: { chave: string; limite: number };
    retornoLista?: { to: string; chave: string; estado: EstadoListagem | null };
    restaurarRolagem?: string;
}

/**
 * @summary
 * Controle de exibição incremental de uma lista local.
 *
 * @property exibidos - Quantidade visível, limitada ao total disponível.
 * @property temMais - Indica que ainda existem registros para revelar.
 * @property carregarMais - Acrescenta um lote sem criar outra entrada no histórico.
 * @property reiniciar - Remove o lote atual quando critérios mantidos fora da URL mudarem.
 * @property estadoDetalhe - Estado a passar aos links de detalhe para permitir o retorno à lista.
 */
interface Lotes
{
    exibidos: number;
    temMais: boolean;
    carregarMais: () => void;
    reiniciar: () => void;
    estadoDetalhe: EstadoListagem;
}

/**
 * @summary
 * Limita a exibição após a busca e a ordenação, preservando o lote no histórico.
 *
 * @remarks
 * A chave deve incluir loja, lista e critérios de busca. Uma chave diferente recomeça no lote inicial.
 * Os dados continuam locais; o controle apenas revela mais registros já disponíveis.
 *
 * @param total - Total de registros após aplicar os filtros.
 * @param chave - Identidade da lista e dos seus critérios.
 * @param inicial - Quantidade inicial de registros, positiva; o padrão é 20.
 * @param passo - Quantidade acrescentada por acionamento, positiva; o padrão é 20.
 * @returns Quantidade visível, ação de expansão e contexto para links de detalhe.
 */
export function useLotes(total: number, chave: string, inicial = 20, passo = 20): Lotes
{
    const location = useLocation();
    const navigate = useNavigate();
    const estado = location.state as EstadoListagem | null;
    const lote = estado?.lote;
    const limite = lote?.chave === chave && Number.isSafeInteger(lote.limite)
        ? Math.max(inicial, lote.limite)
        : inicial;
    const exibidos = Math.min(total, limite);

    return {
        exibidos,
        temMais: exibidos < total,
        carregarMais: () =>
        {
            void navigate(`${location.pathname}${location.search}${location.hash}`, {
                replace: true,
                preventScrollReset: true,
                state: {
                    ...estado,
                    lote: { chave, limite: exibidos + passo },
                    restaurarRolagem: undefined,
                } satisfies EstadoListagem,
            });
        },
        reiniciar: () =>
        {
            if (!lote) return;
            void navigate(`${location.pathname}${location.search}${location.hash}`, {
                replace: true,
                preventScrollReset: true,
                state: { ...estado, lote: undefined, restaurarRolagem: undefined } satisfies EstadoListagem,
            });
        },
        estadoDetalhe: {
            retornoLista: {
                to: `${location.pathname}${location.search}`,
                chave: location.key,
                estado,
            },
        },
    };
}

/**
 * @summary
 * Propriedades de navegação para retornar do detalhe à lista de origem.
 *
 * @param destino - Caminho da lista, usado também quando o detalhe é aberto diretamente.
 * @returns Destino e estado para um `Link`, incluindo os filtros, lote e posição anteriores.
 */
export function useRetornoLista(destino: string): { to: string; state: EstadoListagem | null }
{
    const location = useLocation();
    const retorno = (location.state as EstadoListagem | null)?.retornoLista;
    if (!retorno || retorno.to.split('?')[0] !== destino) return { to: destino, state: null };
    return {
        to: retorno.to,
        state: { ...retorno.estado, restaurarRolagem: retorno.chave },
    };
}
