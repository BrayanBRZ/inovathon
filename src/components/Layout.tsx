import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router';
import {
    Gift,
    House,
    type LucideIcon,
    MessageSquareText,
    Plus,
    Store,
    UserRound,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { iniciais } from '@/lib/estados';
import type { EstadoListagem } from '@/lib/listagem';
import { useFregues, useLoja } from '@/store/useFregues';

/**
 * @summary
 * Item do menu inferior.
 *
 * @property to - Rota de destino.
 * @property rotulo - Texto exibido sob o ícone.
 * @property Icone - Ícone do Lucide.
 * @property central - Quando verdadeiro, é a ação principal: botão redondo no centro do menu.
 */
interface ItemMenu
{
    to: string;
    rotulo: string;
    Icone: LucideIcon;
    central?: boolean;
}

const MENU: ItemMenu[] = [
    { to: '/', rotulo: 'Hoje', Icone: House },
    { to: '/clientes', rotulo: 'Clientes', Icone: UserRound },
    { to: '/vender', rotulo: 'Nova venda', Icone: Plus, central: true },
    { to: '/mensagens', rotulo: 'Mensagens', Icone: MessageSquareText },
    { to: '/recompensas', rotulo: 'Recompensas', Icone: Gift },
];

/**
 * @summary
 * Estrutura comum das telas: cabeçalho, conteúdo, menu inferior e avisos (toasts).
 *
 * @remarks
 * Ao abrir uma tela, leva o foco ao conteúdo. O retorno pelo histórico ou pelo detalhe restaura a rolagem.
 * Também aplica a preferência "letra maior" na raiz do documento.
 *
 * @returns O layout com a tela atual no `Outlet`.
 */
export function Layout()
{
    const loja = useLoja();
    const letraGrande = useFregues(s => s.letraGrande);
    const location = useLocation();
    const { pathname } = location;
    const navigationType = useNavigationType();
    const main = useRef<HTMLElement>(null);
    const posicoes = useRef(new Map<string, number>());
    const anterior = useRef<{ pathname: string; lojaId: string } | null>(null);

    useEffect(() =>
    {
        document.documentElement.classList.toggle('letra-grande', letraGrande);
    }, [letraGrande]);

    useLayoutEffect(() =>
    {
        const restauracao = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';
        return () =>
        {
            window.history.scrollRestoration = restauracao;
        };
    }, []);

    useLayoutEffect(() =>
    {
        const estado = location.state as EstadoListagem | null;
        const mesmaTela = anterior.current?.pathname === pathname && anterior.current.lojaId === loja.id;
        const chaveRetorno = navigationType === 'POP'
            ? location.key
            : navigationType === 'PUSH' ? estado?.restaurarRolagem : undefined;
        const posicao = chaveRetorno ? posicoes.current.get(`${loja.id}:${chaveRetorno}`) : undefined;
        const primeira = anterior.current === null;
        if (!primeira)
        {
            window.scrollTo(0, posicao ?? (mesmaTela ? window.scrollY : 0));
            if (!mesmaTela) main.current?.focus({ preventScroll: true });
        }
        anterior.current = { pathname, lojaId: loja.id };

        // Registra durante a leitura, antes que a próxima tela reduza a altura do documento.
        const guardar = () =>
        {
            posicoes.current.set(`${loja.id}:${location.key}`, window.scrollY);
        };
        guardar();
        window.addEventListener('scroll', guardar, { passive: true });
        return () =>
        {
            window.removeEventListener('scroll', guardar);
        };
    }, [
        location.key,
        location.state,
        loja.id,
        navigationType,
        pathname,
    ]);

    const ativo = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

    return (
        <div className="min-h-dvh">
            <header className="sticky top-0 z-30 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
                <div className="mx-auto flex h-16 max-w-lg items-center gap-3 px-4">
                    <Link to="/" className="flex min-w-0 flex-1 items-center gap-3">
                        <Store className="size-6 shrink-0" aria-hidden />
                        <div className="min-w-0">
                            <p className="font-heading text-base leading-tight font-semibold">Freguês</p>
                            <p className="truncate text-xs text-muted-foreground">{loja.nome}</p>
                        </div>
                    </Link>
                    <Button asChild variant="ghost" size="icon-lg" className="rounded-full">
                        <Link to="/ajustes" aria-label={`Ajustes (${loja.dono})`}>
                            <Avatar size="lg">
                                <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
                                    {iniciais(loja.dono)}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                    </Button>
                </div>
            </header>

            <main ref={main} tabIndex={-1} className="mx-auto max-w-lg px-4 pt-5 pb-32 outline-none">
                <Outlet />
            </main>

            <nav aria-label="Menu principal" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)]">
                <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 gap-0.5 px-1 pt-1.5">
                    {MENU.map(({ to, rotulo, Icone, central }) => (
                        <li key={to}>
                            {central
                                ? (
                                    // Ação principal: botão redondo no centro, acima da barra.
                                        <Link
                                            to={to}
                                            aria-current={ativo(to) ? 'page' : undefined}
                                            className="flex h-full flex-col items-center justify-end gap-0.5 pb-2.5 text-[0.68rem] font-medium tracking-tight text-muted-foreground"
                                        >
                                            <Button asChild size="icon-lg" className="-mt-8 size-14 rounded-full shadow-lg ring-4 ring-card">
                                                <span>
                                                    <Icone className="size-7" aria-hidden />
                                                </span>
                                            </Button>
                                            {rotulo}
                                        </Link>
                                    )
                                : (
                                        <Button
                                            asChild
                                            variant={ativo(to) ? 'secondary' : 'ghost'}
                                            className="h-full w-full flex-col gap-0.5 px-0 text-[0.68rem] tracking-tight"
                                        >
                                            <Link to={to} aria-current={ativo(to) ? 'page' : undefined}>
                                                <Icone className="size-5" aria-hidden />
                                                {rotulo}
                                            </Link>
                                        </Button>
                                    )}
                        </li>
                    ))}
                </ul>
                <p className="py-1 text-center text-[0.68rem] text-muted-foreground">Dados de demonstração</p>
            </nav>

            <Toaster position="bottom-center" offset={{ bottom: 112 }} mobileOffset={{ bottom: 112 }} closeButton />
        </div>
    );
}
