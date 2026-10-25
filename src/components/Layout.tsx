import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router';
import {
    BadgeDollarSign,
    Box,
    Gift,
    House,
    type LucideIcon,
    MessageSquareText,
    Settings,
} from 'lucide-react';
import logoDark from '@/assets/logo-dark.png';
import logoWhite from '@/assets/logo-white.png';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import type { EstadoListagem } from '@/lib/listagem';
import { cn } from '@/lib/utils';
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
interface ItemMenu {
    to: string;
    rotulo: string;
    Icone: LucideIcon;
    central?: boolean;
}

const MENU: ItemMenu[] = [
    { to: '/', rotulo: 'Hoje', Icone: House },
    { to: '/clientes', rotulo: 'Gestão', Icone: Box },
    { to: '/vender', rotulo: 'Nova venda', Icone: BadgeDollarSign, central: true },
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
        const mesmaTela
            = anterior.current?.pathname === pathname
                && anterior.current.lojaId === loja.id;
        const chaveRetorno
            = navigationType === 'POP'
                ? location.key
                : navigationType === 'PUSH'
                    ? estado?.restaurarRolagem
                    : undefined;
        const posicao = chaveRetorno
            ? posicoes.current.get(`${loja.id}:${chaveRetorno}`)
            : undefined;
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

    const ativo = (to: string) =>
        to === '/clientes'
            ? pathname.startsWith('/clientes')
            || pathname.startsWith('/produtos')
            || pathname.startsWith('/ajustes/produtos')
            : to === '/'
                ? pathname === '/'
                : pathname.startsWith(to);

    return (
        <div className="min-h-dvh">
            <header className="sticky top-0 z-30 border-b bg-background pt-[env(safe-area-inset-top)]">
                <div className="mx-auto flex h-20 max-w-lg items-center gap-3 px-4">
                    <Link
                        to="/"
                        aria-label="Freguês · Início"
                        className="flex min-w-0 flex-1 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <span className="flex h-12 w-36 max-w-full shrink-0 items-center justify-center">
                            <img
                                src={logoWhite}
                                alt="Freguês"
                                width={2162}
                                height={727}
                                className="h-full w-full object-contain dark:hidden"
                            />
                            <img
                                src={logoDark}
                                alt="Freguês"
                                width={2172}
                                height={724}
                                className="hidden h-full w-full object-contain dark:block"
                            />
                        </span>
                    </Link>
                    <Badge variant="outline" className="text-muted-foreground">
                        Demo
                    </Badge>
                    <Button
                        asChild
                        variant="ghost"
                        size="icon-lg"
                        className="rounded-full"
                    >
                        <Link to="/ajustes" aria-label="Configurações">
                            <Settings className="size-5" aria-hidden />
                        </Link>
                    </Button>
                </div>
            </header>

            <main
                ref={main}
                tabIndex={-1}
                className="mx-auto max-w-lg px-4 pt-4 pb-32 outline-none"
            >
                <Outlet />
            </main>

            {/* Menu sólido em marinho; a venda fica no centro, em destaque. */}
            <nav
                aria-label="Menu principal"
                className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-full bg-dock text-dock-foreground shadow-overlay ring-1 ring-dock-foreground/15"
            >
                <ul className="grid h-16 grid-cols-5 items-center px-1.5">
                    {MENU.map(({ to, rotulo, Icone, central }) => (
                        <li key={to} className="flex justify-center">
                            {central
                                ? (
                                        <Button
                                            asChild
                                            size="icon-lg"
                                            className="size-12 rounded-full bg-brand text-brand-foreground shadow-surface hover:bg-brand-hover"
                                        >
                                            <Link
                                                to={to}
                                                aria-label={rotulo}
                                                aria-current={
                                                    ativo(to) ? 'page' : undefined
                                                }
                                            >
                                                <Icone className="size-6" aria-hidden />
                                            </Link>
                                        </Button>
                                    )
                                : (
                                        <Button
                                            asChild
                                            variant="ghost"
                                            className={cn(
                                                'h-13 w-full flex-col gap-0.5 rounded-full px-0 text-[0.65rem] font-medium tracking-tight',
                                                'text-dock-foreground/60 hover:bg-dock-foreground/10 hover:text-dock-foreground',
                                                ativo(to)
                                                && 'bg-dock-foreground/12 text-dock-foreground',
                                            )}
                                        >
                                            <Link
                                                to={to}
                                                aria-current={
                                                    ativo(to) ? 'page' : undefined
                                                }
                                            >
                                                <Icone className="size-5" aria-hidden />
                                                {rotulo}
                                            </Link>
                                        </Button>
                                    )}
                        </li>
                    ))}
                </ul>
            </nav>

            <Toaster
                position="bottom-center"
                offset={{ bottom: 96 }}
                mobileOffset={{ bottom: 96 }}
                closeButton
            />
        </div>
    );
}
