import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
    ChevronRight,
    Search,
    SlidersHorizontal,
    UserPlus,
    UsersRound,
    X,
} from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dias, soDigitos } from '@/domain/formato';
import { produtoDe } from '@/domain/recorrencia';
import type { Dia, EstadoCliente, Situacao } from '@/domain/tipos';
import {
    iniciais,
    retornou,
    seloCliente,
    type Tom,
    useSituacoes,
} from '@/lib/estados';
import { useLotes } from '@/lib/listagem';
import { cn } from '@/lib/utils';
import { useHoje, useLoja } from '@/store/useFregues';

/**
 * @summary
 * Critérios de acompanhamento da lista, incluindo o selo de retorno e o grupo que precisa voltar.
 */
type Filtro = 'todos' | 'novos' | 'voltar' | 'emdia' | 'perto' | 'atrasado' | 'sumido' | 'retornou';
/**
 * @summary
 * Opção visível do filtro por status do cliente.
 *
 * @property valor - Critério preservado na URL.
 * @property rotulo - Nome apresentado no seletor e no resumo dos resultados.
 * @property descricao - Explicação do acompanhamento para o critério selecionado.
 */
interface OpcaoFiltro
{
    valor: Filtro;
    rotulo: string;
    descricao: string;
}
const FILTROS: OpcaoFiltro[] = [
    { valor: 'todos', rotulo: 'Todos os clientes', descricao: 'Acompanhe o momento de cada cliente e encontre quem precisa de atenção.' },
    { valor: 'voltar', rotulo: 'Precisam voltar', descricao: 'Clientes na hora de voltar, atrasados ou sumidos.' },
    { valor: 'novos', rotulo: 'Novos', descricao: 'Clientes com uma única compra, ainda conhecendo sua loja.' },
    { valor: 'emdia', rotulo: 'Em dia', descricao: 'Clientes dentro do seu ritmo habitual de compra.' },
    { valor: 'perto', rotulo: 'Hora de voltar', descricao: 'A próxima compra está próxima ou dentro da margem de acompanhamento.' },
    { valor: 'atrasado', rotulo: 'Atrasados', descricao: 'Clientes que passaram do intervalo habitual de compra.' },
    { valor: 'sumido', rotulo: 'Sumidos', descricao: 'Clientes sem comprar pelo prazo configurado na loja.' },
    { valor: 'retornou', rotulo: 'Retornaram', descricao: 'Clientes que voltaram por uma mensagem nos últimos 7 dias.' },
];
/** Tom de cada filtro: o contador do resultado usa a mesma cor do selo dos clientes filtrados. */
const TOM_FILTRO: Record<Filtro, Tom> = {
    todos: 'secondary',
    novos: 'secondary',
    emdia: 'secondary',
    voltar: 'warning',
    perto: 'warning',
    atrasado: 'warning',
    sumido: 'destructive',
    retornou: 'success',
};
const PRECISA_VOLTAR: EstadoCliente[] = ['perto', 'atrasado', 'sumido'];
/** Quem precisa de ação aparece primeiro. */
const ORDEM: EstadoCliente[] = [
    'perto',
    'atrasado',
    'novo',
    'sumido',
    'emdia',
];

function passaFiltro(s: Situacao, valor: Filtro, hoje: Dia): boolean
{
    if (valor === 'todos') return true;
    if (valor === 'retornou') return retornou(s, hoje);
    // O retorno substitui o selo do motor; os filtros acompanham o selo visível.
    if (retornou(s, hoje)) return false;
    if (valor === 'voltar') return PRECISA_VOLTAR.includes(s.est);
    return s.est === (valor === 'novos' ? 'novo' : valor);
}

/**
 * @summary
 * Lista de clientes em lotes, com busca e filtro por situação preservados na navegação.
 *
 * @returns A tela Clientes.
 */
export function Clientes()
{
    const l = useLoja();
    const hoje = useHoje();
    const sits = useSituacoes(l, hoje);
    const [params, setParams] = useSearchParams();
    const opcao = FILTROS.find(f => f.valor === params.get('filtro')) ?? FILTROS[0];
    const filtro = opcao.valor;
    const busca = params.get('q') ?? '';
    const temFiltro = !!busca || filtro !== 'todos';

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
        return l.clientes
            .filter(c => passaFiltro(sits.get(c.id)!, filtro, hoje))
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
    }, [
        l.clientes,
        sits,
        busca,
        filtro,
        hoje,
    ]);
    const lotes = useLotes(lista.length, JSON.stringify([l.id, 'clientes', filtro, busca]));
    const contagens = new Map(FILTROS.map(f => [
        f.valor,
        l.clientes.filter(c => passaFiltro(sits.get(c.id)!, f.valor, hoje)).length,
    ]));

    return (
        <div className="flex flex-col gap-3">
            <header className="mb-1 flex items-start justify-between gap-3">
                <div>
                    <h1 className="font-heading text-xl font-semibold tracking-tight">Clientes</h1>
                    <p className="text-sm text-muted-foreground">Conheça quem compra com você.</p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to="/vender?novo=1">
                        <UserPlus data-icon="inline-start" />
                        {' '}
                        Novo
                    </Link>
                </Button>
            </header>

            <div className="flex flex-col gap-2">
                <InputGroup className="rounded-full">
                    <InputGroupAddon className="pl-3.5"><Search /></InputGroupAddon>
                    <InputGroupInput
                        id="busca-cliente"
                        type="search"
                        aria-label="Buscar cliente por nome, CPF ou número de telefone"
                        placeholder="Nome, CPF ou número de telefone"
                        autoComplete="off"
                        value={busca}
                        onChange={e => muda('q', e.target.value)}
                    />
                </InputGroup>
                <Select value={filtro} onValueChange={v => muda('filtro', v === 'todos' ? '' : v)}>
                    <SelectTrigger id="filtro-clientes" aria-label="Filtrar clientes por status" className="h-10! w-full *:data-[slot=select-value]:flex-1">
                        <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
                        <SelectValue>{`${opcao.rotulo} (${contagens.get(filtro)})`}</SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                        {FILTROS.map(f => (
                            <SelectItem key={f.valor} value={f.valor}>
                                <span className="flex-1">{f.rotulo}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">{contagens.get(f.valor)}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 pt-1">
                <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
                    <span className="truncate">{opcao.rotulo}</span>
                    <Badge variant={TOM_FILTRO[filtro]}>{lista.length}</Badge>
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn('shrink-0 rounded-full text-muted-foreground', !temFiltro && 'invisible')}
                    disabled={!temFiltro}
                    aria-hidden={!temFiltro}
                    tabIndex={temFiltro ? undefined : -1}
                    onClick={() =>
                    {
                        const p = new URLSearchParams(params);
                        p.delete('q');
                        p.delete('filtro');
                        setParams(p, { replace: true });
                    }}
                >
                    <X data-icon="inline-start" />
                    Limpar
                </Button>
                <p className="col-span-2 line-clamp-2 h-8 text-xs leading-4 text-muted-foreground">
                    {opcao.descricao}
                </p>
            </div>

            {lista.length === 0
                ? (
                        <Empty className="bg-card shadow-glass ring-1 ring-glass-border backdrop-blur-xl">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <UsersRound />
                                </EmptyMedia>
                                <EmptyTitle>
                                    {`Nenhum cliente ${busca ? 'encontrado' : 'nesta lista'}`}
                                </EmptyTitle>
                                <EmptyDescription>
                                    Tente outro nome, CPF, número de telefone ou status.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    )
                : (
                        <Card className="py-1">
                            <ItemGroup className="gap-0">
                                {lista.slice(0, lotes.exibidos).map((c, i) =>
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
                                            <Item asChild size="sm" className="rounded-none px-4">
                                                <Link to={`/clientes/${c.id}`} state={lotes.estadoDetalhe}>
                                                    <ItemMedia>
                                                        <Avatar>
                                                            <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
                                                        </Avatar>
                                                    </ItemMedia>
                                                    <ItemContent className="min-w-0">
                                                        <ItemTitle className="w-full truncate">{c.nome}</ItemTitle>
                                                        <ItemDescription className="line-clamp-1 text-xs">{sub}</ItemDescription>
                                                    </ItemContent>
                                                    <ItemActions>
                                                        <Badge variant={selo.variant} className="w-24">
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
            {lista.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p role="status" className="text-center text-xs text-muted-foreground">
                        {`${lotes.exibidos} de ${lista.length} clientes`}
                    </p>
                    {lotes.temMais && (
                        <Button variant="outline" className="w-full rounded-full" onClick={lotes.carregarMais}>
                            Carregar mais clientes
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
