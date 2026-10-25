import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronRight, Search, UserPlus, UsersRound } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemSeparator,
    ItemTitle,
} from '@/components/ui/item';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dias, soDigitos } from '@/domain/formato';
import { produtoDe } from '@/domain/recorrencia';
import type { EstadoCliente, Situacao } from '@/domain/tipos';
import { iniciais, retornou, seloCliente, useSituacoes } from '@/lib/estados';
import { cn } from '@/lib/utils';
import { useHoje, useLoja } from '@/store/useFregues';

type Filtro = 'todos' | 'novos' | 'voltar';
const PRECISA_VOLTAR: EstadoCliente[] = ['perto', 'atrasado', 'sumido'];
/** Quem precisa de ação aparece primeiro. */
const ORDEM: EstadoCliente[] = [
    'perto',
    'atrasado',
    'novo',
    'sumido',
    'emdia',
];

/**
 * @summary
 * Lista de clientes com busca e filtro por situação. Busca e filtro ficam na URL para sobreviver à navegação.
 *
 * @returns A tela Clientes.
 */
export function Clientes()
{
    const l = useLoja();
    const hoje = useHoje();
    const sits = useSituacoes(l, hoje);
    const [params, setParams] = useSearchParams();
    const filtro = (params.get('filtro') as Filtro) || 'todos';
    const busca = params.get('q') ?? '';

    function muda(k: string, v: string)
    {
        const p = new URLSearchParams(params);
        if (v) p.set(k, v);
        else p.delete(k);
        setParams(p, { replace: true });
    }

    const lista = useMemo(() =>
    {
        const q = busca.trim().toLowerCase();
        const qd = soDigitos(q);
        const passa = (s: Situacao) =>
            filtro === 'todos' || (filtro === 'novos' ? s.est === 'novo' : PRECISA_VOLTAR.includes(s.est));
        return l.clientes
            .filter(c => passa(sits.get(c.id)!))
            .filter(c =>
                !q
                || c.nome.toLowerCase().includes(q)
                || (qd.length > 2 && (soDigitos(c.tel).includes(qd) || soDigitos(c.cpf ?? '').includes(qd))))
            .sort((a, b) =>
            {
                const sa = sits.get(a.id)!;
                const sb = sits.get(b.id)!;
                return ORDEM.indexOf(sa.est) - ORDEM.indexOf(sb.est) || sb.desde - sa.desde;
            });
    }, [l.clientes, sits, busca, filtro]);

    return (
        <div className="flex flex-col gap-3">
            <header className="mb-2 flex items-start justify-between gap-3">
                <div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">Clientes</h1>
                    <p className="text-sm text-muted-foreground">Conheça quem compra com você.</p>
                </div>
                <Button asChild variant="outline">
                    <Link to="/vender?novo=1">
                        <UserPlus data-icon="inline-start" />
                        {' '}
                        Novo
                    </Link>
                </Button>
            </header>

            <InputGroup className="h-10 bg-card">
                <InputGroupAddon>
                    <Search />
                </InputGroupAddon>
                <InputGroupInput
                    type="search"
                    aria-label="Buscar cliente por nome, telefone ou CPF"
                    placeholder="Buscar cliente"
                    autoComplete="off"
                    value={busca}
                    onChange={e => muda('q', e.target.value)}
                />
            </InputGroup>

            <Tabs value={filtro} onValueChange={v => muda('filtro', v === 'todos' ? '' : v)}>
                <TabsList className="w-full">
                    <TabsTrigger value="todos">Todos</TabsTrigger>
                    <TabsTrigger value="novos">Novos</TabsTrigger>
                    <TabsTrigger value="voltar">Hora de voltar</TabsTrigger>
                </TabsList>
            </Tabs>

            {lista.length === 0
                ? (
                        <Empty className="border bg-card">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <UsersRound />
                                </EmptyMedia>
                                <EmptyTitle>
                                    {`Nenhum cliente ${busca ? 'encontrado' : 'nesta lista'}`}
                                </EmptyTitle>
                                <EmptyDescription>Tente outro nome, telefone ou filtro.</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    )
                : (
                        <Card className="py-1">
                            <ItemGroup className="gap-0">
                                {lista.map((c, i) =>
                                {
                                    const s = sits.get(c.id)!;
                                    const p = produtoDe(l.produtos, s.ultima.produtoId);
                                    const selo = seloCliente(s, hoje);
                                    const sub = retornou(s, hoje)
                                        ? 'Voltou nesta semana'
                                        : s.est === 'novo' && s.desde <= 1
                                            ? `Primeira compra ${s.desde === 0 ? 'hoje' : 'ontem'}`
                                            : `${p?.nome ?? 'Produto'} · há ${dias(s.desde)}`;
                                    return (
                                        <div key={c.id} role="listitem">
                                            {i > 0 && <ItemSeparator className="my-0" />}
                                            <Item asChild className="rounded-none px-4">
                                                <Link to={`/clientes/${c.id}`}>
                                                    <ItemMedia>
                                                        <Avatar size="lg">
                                                            <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
                                                        </Avatar>
                                                    </ItemMedia>
                                                    <ItemContent className="min-w-0">
                                                        <ItemTitle className="w-full truncate">{c.nome}</ItemTitle>
                                                        <ItemDescription className="line-clamp-1">{sub}</ItemDescription>
                                                    </ItemContent>
                                                    <ItemActions>
                                                        <Badge variant={selo.variant} className={cn('w-24', selo.className)}>
                                                            {selo.rotulo}
                                                        </Badge>
                                                        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                                                    </ItemActions>
                                                </Link>
                                            </Item>
                                        </div>
                                    );
                                })}
                            </ItemGroup>
                        </Card>
                    )}
        </div>
    );
}
