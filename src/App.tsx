import { Fragment, type ReactElement } from 'react';
import {
    HashRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from 'react-router';
import { Layout } from '@/components/Layout';
import { Ajustes } from '@/pages/Ajustes';
import { ClienteDetalhe } from '@/pages/ClienteDetalhe';
import { Clientes } from '@/pages/Clientes';
import { Conversa } from '@/pages/Conversa';
import { Hoje } from '@/pages/Hoje';
import { Mensagens } from '@/pages/Mensagens';
import { Produto } from '@/pages/Produto';
import { Recompensas } from '@/pages/Recompensas';
import { Vender } from '@/pages/Vender';
import { useFregues } from '@/store/useFregues';

/**
 * @summary
 * Propriedades de {@link ComChave}.
 *
 * @property children - Tela com rascunho local que deve recomeçar do zero.
 * @property url - Quando verdadeiro, a busca da URL (`?cliente=...`) também reinicia a tela.
 */
interface ComChaveProps
{
    children: ReactElement;
    url?: boolean;
}

/**
 * @summary
 * Reinicia telas com rascunho quando muda a loja (ou, opcionalmente, a busca da URL).
 *
 * @param props - Tela e critério de reinício.
 * @returns A tela com uma chave que força a remontagem.
 */
function ComChave({ children, url }: ComChaveProps)
{
    const { search } = useLocation();
    const lojaId = useFregues(s => s.lojaId);
    return <Fragment key={`${lojaId}${url ? search : ''}`}>{children}</Fragment>;
}

/**
 * @summary
 * Rotas do aplicativo. Usa `HashRouter` para funcionar em qualquer hospedagem estática.
 *
 * @returns O roteador com o layout e todas as telas.
 */
export default function App()
{
    return (
        <HashRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Hoje />} />
                    <Route path="clientes" element={<Clientes />} />
                    <Route path="clientes/:id" element={<ClienteDetalhe />} />
                    <Route path="mensagens" element={<Mensagens />} />
                    <Route path="mensagens/:id" element={<Conversa />} />
                    <Route path="recompensas" element={<ComChave><Recompensas /></ComChave>} />
                    <Route path="vender" element={<ComChave url><Vender /></ComChave>} />
                    <Route path="ajustes" element={<Ajustes />} />
                    <Route path="ajustes/produtos/:id" element={<ComChave><Produto /></ComChave>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}
