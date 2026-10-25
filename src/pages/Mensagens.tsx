import { Link, useSearchParams } from 'react-router';
import {
    ChevronRight,
    Inbox,
    Search,
    Send,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { filaDoDia } from '@/domain/fila';
import { quando, soDigitos } from '@/domain/formato';
import { textoMensagem, TIPO_MENSAGEM } from '@/domain/mensagens';
import type { Cliente, Mensagem, StatusMensagem, TipoMensagem } from '@/domain/tipos';
import { CLASSE_AVISO, iniciais, SELO_STATUS } from '@/lib/estados';
import { useLotes } from '@/lib/listagem';
import { cn } from '@/lib/utils';
import { useFregues, useHoje, useLoja } from '@/store/useFregues';

/**
 * @summary
 * Listas de mensagens disponíveis, cada uma com seu critério de acompanhamento.
 */
type Aba = 'conversas' | 'programadas';

const STATUS: StatusMensagem[] = [
    'enviada',
    'gostei',
    'respondeu',
    'problema',
    'voltou',
];
const TIPOS: TipoMensagem[] = [
    'obrigado',
    'dica',
    'segunda',
    'perto',
    'atrasado',
    'sumido',
];
const ROTULOS_TIPO: Partial<Record<TipoMensagem, string>> = {
    perto: 'Lembrete: hora de voltar',
    atrasado: 'Lembrete: atrasados',
};

function correspondeBusca(c: Cliente, busca: string): boolean
{
    const q = busca.trim().toLocaleLowerCase('pt-BR');
    const numeros = soDigitos(q);
    return !q || c.nome.toLocaleLowerCase('pt-BR').includes(q)
        || (numeros.length > 2 && (soDigitos(c.tel).includes(numeros) || soDigitos(c.cpf ?? '').includes(numeros)));
}

/**
 * @summary
 * Conversas com os clientes e mensagens programadas para hoje.
 *
 * @remarks
 * A aba, busca e filtros ficam na URL e são preservados ao voltar de uma conversa.
 * Conversas consideram o status da última mensagem, com prioridade para problemas abertos.
 * Programadas consideram o tipo de envio.
 * Com filtros ativos na fila, o envio em lote inclui somente os resultados encontrados.
 *
 * @returns A tela Mensagens.
 */
export function Mensagens()
{
    const l = useLoja();
    const hoje = useHoje();
    const disparar = useFregues(s => s.dispararEnvio);
    const enviar = useFregues(s => s.enviarMensagem);
    const [params, setParams] = useSearchParams();
    const aba: Aba = params.get('aba') === 'programadas' ? 'programadas' : 'conversas';
    const busca = params.get('q') ?? '';
    const status = STATUS.find(s => s === params.get('status')) ?? 'todos';
    const tipo = TIPOS.find(t => t === params.get('tipo')) ?? 'todos';
    const fila = filaDoDia(l, hoje);

    function muda(chave: string, valor: string)
    {
        const p = new URLSearchParams(params);
        if (valor) p.set(chave, valor);
        else p.delete(chave);
        setParams(p, { replace: true });
    }

    // Uma conversa por cliente, a mais recente primeiro (as mensagens vêm da mais nova para a mais antiga).
    const ultimas = new Map<string, Mensagem>();
    for (const m of l.mensagens)
    {
        if (!ultimas.has(m.clienteId)) ultimas.set(m.clienteId, m);
    }
    const conversas = [...ultimas.values()]
        .map(m => ({
            m: l.problemasAbertos.includes(m.clienteId) ? { ...m, status: 'problema' as const } : m,
            c: l.clientes.find(x => x.id === m.clienteId),
        }))
        .filter((x): x is { m: Mensagem; c: Cliente } => !!x.c);
    const conversasFiltradas = conversas.filter(({ c, m }) =>
        correspondeBusca(c, busca) && (status === 'todos' || m.status === status));
    const programadas = fila.filter(({ cliente, tipo: t }) =>
        correspondeBusca(cliente, busca) && (tipo === 'todos' || t === tipo));
    const filtro = aba === 'conversas' ? status : tipo;
    const temFiltro = !!busca.trim() || filtro !== 'todos';
    const total = aba === 'programadas' ? programadas.length : conversasFiltradas.length;
    const lotes = useLotes(total, JSON.stringify([
        l.id,
        'mensagens',
        aba,
        filtro,
        busca,
    ]));
    const opcoes = aba === 'conversas'
        ? [
                { valor: 'todos', rotulo: 'Todos os status', quantidade: conversas.length },
                ...STATUS.map(s => ({
                    valor: s,
                    rotulo: SELO_STATUS[s].rotulo,
                    quantidade: conversas.filter(({ m }) => m.status === s).length,
                })),
            ]
        : [
                { valor: 'todos', rotulo: 'Todos os tipos', quantidade: fila.length },
                ...TIPOS.map(t => ({
                    valor: t,
                    rotulo: ROTULOS_TIPO[t] ?? TIPO_MENSAGEM[t],
                    quantidade: fila.filter(item => item.tipo === t).length,
                })),
            ];
    const opcao = opcoes.find(o => o.valor === filtro)!;

    return (
        <div className="flex flex-col gap-3">
            <header className="mb-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">Mensagens</h1>
                <p className="text-sm text-muted-foreground">Conversas que trazem clientes de volta.</p>
            </header>

            <Tabs value={aba} onValueChange={v => muda('aba', v === 'conversas' ? '' : v)}>
                <TabsList className="w-full">
                    <TabsTrigger value="conversas">Conversas</TabsTrigger>
                    <TabsTrigger value="programadas">
                        Programadas
                        <Badge variant="outline" className={cn('tabular-nums', CLASSE_AVISO)}>{fila.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <Card className="mt-3 py-4">
                    <CardContent className="flex flex-col gap-4 px-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="busca-mensagens">Buscar cliente</Label>
                            <InputGroup className="h-11 bg-background/50">
                                <InputGroupAddon><Search /></InputGroupAddon>
                                <InputGroupInput
                                    id="busca-mensagens"
                                    type="search"
                                    aria-label="Buscar cliente por nome, CPF ou número de telefone"
                                    placeholder="Nome, CPF ou número de telefone"
                                    autoComplete="off"
                                    value={busca}
                                    onChange={e => muda('q', e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="filtro-mensagens">
                                <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
                                {aba === 'conversas' ? 'Filtrar conversas por status' : 'Filtrar programadas por tipo'}
                            </Label>
                            <Select
                                value={filtro}
                                onValueChange={v => muda(
                                    aba === 'conversas' ? 'status' : 'tipo',
                                    v === 'todos' ? '' : v,
                                )}
                            >
                                <SelectTrigger id="filtro-mensagens" className="min-h-11 w-full bg-background/50">
                                    <SelectValue>{`${opcao.rotulo} (${opcao.quantidade})`}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {opcoes.map(o => (
                                        <SelectItem key={o.valor} value={o.valor}>
                                            {`${o.rotulo} (${o.quantidade})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
                    <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                        <span className="truncate">
                            {filtro === 'todos'
                                ? aba === 'conversas' ? 'Todas as conversas' : 'Todas as programadas'
                                : opcao.rotulo}
                        </span>
                        <Badge variant="secondary" className="tabular-nums">{total}</Badge>
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn('min-h-11 shrink-0', !temFiltro && 'invisible')}
                        disabled={!temFiltro}
                        aria-hidden={!temFiltro}
                        tabIndex={temFiltro ? undefined : -1}
                        onClick={() =>
                        {
                            const p = new URLSearchParams(params);
                            p.delete('q');
                            p.delete(aba === 'conversas' ? 'status' : 'tipo');
                            setParams(p, { replace: true });
                        }}
                    >
                        <X data-icon="inline-start" />
                        Limpar
                    </Button>
                    <p className="col-span-2 line-clamp-2 h-8 text-xs leading-4 text-muted-foreground">
                        {aba === 'conversas' ? 'Status da última mensagem. Problemas abertos têm prioridade.' : 'Mensagens preparadas para hoje.'}
                    </p>
                </div>

                <TabsContent value="conversas" className="mt-2">
                    {conversasFiltradas.length === 0
                        ? (
                                <Empty className="border bg-card">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Inbox />
                                        </EmptyMedia>
                                        <EmptyTitle>{temFiltro ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</EmptyTitle>
                                        <EmptyDescription>
                                            {temFiltro
                                                ? 'Tente outro nome, CPF, número de telefone ou status.'
                                                : 'As mensagens enviadas aparecem aqui.'}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            )
                        : (
                                <Card className="py-1">
                                    <ItemGroup className="gap-0">
                                        {conversasFiltradas.slice(0, lotes.exibidos).map(({ m, c }, i) =>
                                        {
                                            const st = SELO_STATUS[m.status];
                                            return (
                                                <div key={c.id} role="listitem">
                                                    {i > 0 && <ItemSeparator className="my-0" />}
                                                    <Item asChild className="rounded-none px-4">
                                                        <Link to={`/mensagens/${c.id}`} state={lotes.estadoDetalhe}>
                                                            <ItemMedia>
                                                                <Avatar size="lg">
                                                                    <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
                                                                </Avatar>
                                                            </ItemMedia>
                                                            <ItemContent className="min-w-0">
                                                                <ItemTitle className="w-full truncate">{c.nome}</ItemTitle>
                                                                <ItemDescription className="line-clamp-1">
                                                                    {`${quando(m.data, hoje)}, ${m.hora} · ${TIPO_MENSAGEM[m.tipo]}`}
                                                                </ItemDescription>
                                                            </ItemContent>
                                                            <ItemActions>
                                                                <Badge variant={st.variant} className={cn('w-24', st.className)}>{st.rotulo}</Badge>
                                                            </ItemActions>
                                                        </Link>
                                                    </Item>
                                                </div>
                                            );
                                        })}
                                    </ItemGroup>
                                </Card>
                            )}
                </TabsContent>

                <TabsContent value="programadas" className="mt-2 flex flex-col gap-3">
                    <Button
                        size="lg"
                        className="w-full"
                        disabled={!programadas.length}
                        onClick={() =>
                        {
                            let n: number;
                            if (temFiltro)
                            {
                                for (const { cliente: c, tipo: t, s } of programadas)
                                    enviar(c.id, t, textoMensagem(
                                        c,
                                        l,
                                        t,
                                        s,
                                        hoje,
                                    ));
                                n = programadas.length;
                            }
                            else n = disparar();
                            toast.success(`${n} ${n === 1 ? 'mensagem enviada' : 'mensagens enviadas'}.`, {
                                description: temFiltro ? 'Simulação do envio das mensagens filtradas.' : 'Simulação do envio das 9h.',
                            });
                        }}
                    >
                        <Send data-icon="inline-start" />
                        {' '}
                        {temFiltro
                            ? `Enviar ${programadas.length} ${programadas.length === 1 ? 'filtrada' : 'filtradas'} agora`
                            : 'Enviar todas agora'}
                    </Button>
                    {programadas.length === 0
                        ? (
                                <Empty className="border bg-card">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Inbox />
                                        </EmptyMedia>
                                        <EmptyTitle>{temFiltro ? 'Nenhuma programada encontrada' : 'Nada programado para hoje'}</EmptyTitle>
                                        <EmptyDescription>
                                            {temFiltro
                                                ? 'Tente outro nome, CPF, número de telefone ou tipo de mensagem.'
                                                : 'Os lembretes aparecem aqui no dia certo de cada cliente.'}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            )
                        : (
                                <Card className="py-1">
                                    <ItemGroup className="gap-0">
                                        {programadas.slice(0, lotes.exibidos).map(({ cliente: c, tipo }, i) => (
                                            <div key={c.id} role="listitem">
                                                {i > 0 && <ItemSeparator className="my-0" />}
                                                <Item asChild className="rounded-none px-4">
                                                    <Link to={`/mensagens/${c.id}`} state={lotes.estadoDetalhe}>
                                                        <ItemMedia>
                                                            <Avatar size="lg">
                                                                <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
                                                            </Avatar>
                                                        </ItemMedia>
                                                        <ItemContent className="min-w-0">
                                                            <ItemTitle className="w-full truncate">{c.nome}</ItemTitle>
                                                            <ItemDescription className="line-clamp-1">{TIPO_MENSAGEM[tipo]}</ItemDescription>
                                                        </ItemContent>
                                                        <ItemActions>
                                                            <span className="text-xs text-muted-foreground">{l.auto ? '9h' : 'Revisar'}</span>
                                                            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                                                        </ItemActions>
                                                    </Link>
                                                </Item>
                                            </div>
                                        ))}
                                    </ItemGroup>
                                </Card>
                            )}
                </TabsContent>
            </Tabs>

            {total > 0 && (
                <div className="flex flex-col gap-2">
                    <p role="status" className="text-center text-xs text-muted-foreground">
                        {`${lotes.exibidos} de ${total} ${aba === 'programadas' ? 'mensagens programadas' : 'conversas'}`}
                    </p>
                    {lotes.temMais && (
                        <Button variant="outline" size="lg" className="min-h-11 w-full" onClick={lotes.carregarMais}>
                            {aba === 'programadas' ? 'Carregar mais mensagens programadas' : 'Carregar mais conversas'}
                        </Button>
                    )}
                </div>
            )}

            <Button asChild variant="outline" className="w-full">
                <Link to="/ajustes#demo">
                    <SlidersHorizontal data-icon="inline-start" />
                    {' '}
                    Modo demonstração
                </Link>
            </Button>
        </div>
    );
}
