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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { iniciais } from '@/lib/estados';
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
            <header className="sticky top-0 z-30 bg-background/60 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
                <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
                    <Link to="/" className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Store className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <p className="font-heading text-sm leading-tight font-semibold tracking-tight">Freguês</p>
                            <p className="truncate text-xs text-muted-foreground">{loja.nome}</p>
                        </div>
                    </Link>
                    <Badge variant="outline" className="text-muted-foreground">Demo</Badge>
                    <Button asChild variant="ghost" size="icon-lg" className="rounded-full">
                        <Link to="/ajustes" aria-label={`Ajustes (${loja.dono})`}>
                            <Avatar>
                                <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                                    {iniciais(loja.dono)}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                    </Button>
                </div>
            </header>

            <main ref={main} tabIndex={-1} className="mx-auto max-w-lg px-4 pt-4 pb-32 outline-none">
                <Outlet />
            </main>

            {/* Menu flutuante em vidro escuro; a venda fica no centro, em destaque. */}
            <nav
                aria-label="Menu principal"
                className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-full bg-dock text-dock-foreground shadow-glass ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150"
            >
                <ul className="grid h-16 grid-cols-5 items-center px-1.5">
                    {MENU.map(({ to, rotulo, Icone, central }) => (
                        <li key={to} className="flex justify-center">
                            {central
                                ? (
                                        <Button
                                            asChild
                                            size="icon-lg"
                                            className="size-12 rounded-full bg-dock-foreground text-dock shadow-glass hover:bg-dock-foreground/90"
                                        >
                                            <Link to={to} aria-label={rotulo} aria-current={ativo(to) ? 'page' : undefined}>
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
                                                ativo(to) && 'bg-dock-foreground/12 text-dock-foreground',
                                            )}
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
            </nav>

            <Toaster position="bottom-center" offset={{ bottom: 96 }} mobileOffset={{ bottom: 96 }} closeButton />
        </div>
    );
}
