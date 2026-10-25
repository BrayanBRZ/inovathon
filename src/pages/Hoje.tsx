import { format, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
    ChevronRight,
    Clock,
    Gift,
    MessageSquareText,
    PartyPopper,
    TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';
import { filaDoDia } from '@/domain/fila';
import { brl, dias } from '@/domain/formato';
import { recompensaValida, TIPO_MENSAGEM } from '@/domain/mensagens';
import { numerosDaLoja, serieRecuperado } from '@/domain/resultados';
import type { Cliente, Recompensa, Situacao, TipoMensagem } from '@/domain/tipos';
import { iniciais, SELO_TIPO, type Tom, TOM_SUPERFICIE } from '@/lib/estados';
import { cn } from '@/lib/utils';
import { MENSALIDADE, useFregues, useHoje, useLoja } from '@/store/useFregues';

const MAX_OPORTUNIDADES = 4;
/** Régua do cliente novo primeiro: é onde está a 2ª compra. */
const PRIORIDADE: TipoMensagem[] = [
    'obrigado',
    'segunda',
    'perto',
    'atrasado',
    'dica',
    'sumido',
];
const SEMANA = [
    'Dom',
    'Seg',
    'Ter',
    'Qua',
    'Qui',
    'Sex',
    'Sáb',
];

const configGrafico = {
    valor: { label: 'Vendas', color: 'var(--chart-1)' },
} satisfies ChartConfig;

function saudacao(): string
{
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/**
 * @summary
 * Tela inicial: resultado do mês, envio automático e quem chamar hoje.
 *
 * @returns A tela Hoje.
 */
export function Hoje()
{
    const l = useLoja();
    const hoje = useHoje();
    const plano = useFregues(s => s.plano);
    const alternarAuto = useFregues(s => s.alternarAuto);

    const n = numerosDaLoja(l, hoje);
    const vezes = Math.floor(n.recuperado / MENSALIDADE[plano]);
    const taxa = n.novos ? Math.round((n.segunda / n.novos) * 100) : 0;
    const fila = filaDoDia(l, hoje).sort((a, b) => PRIORIDADE.indexOf(a.tipo) - PRIORIDADE.indexOf(b.tipo));
    const problemas = l.problemasAbertos
        .map(id => l.clientes.find(c => c.id === id))
        .filter(c => !!c);
    const total = problemas.length + fila.length;
    const serie = serieRecuperado(l, hoje).map(p => ({ ...p, rotulo: SEMANA[getDay(parseISO(p.dia))] }));

    return (
        <div className="flex flex-col gap-3">
            <header className="mb-1">
                <h1 className="font-heading text-xl font-semibold tracking-tight">
                    {`${saudacao()}, ${l.dono.split(' ')[0]}`}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {format(parseISO(hoje), 'EEEE, d \'de\' MMMM', { locale: ptBR })}
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardDescription>
                        {`Compras após os lembretes · ${format(parseISO(hoje), 'MMMM', { locale: ptBR })}`}
                    </CardDescription>
                    <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">{brl(n.recuperado)}</CardTitle>
                    <CardAction>
                        <Badge variant="success">{`${vezes}× a mensalidade`}</Badge>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <p className="mb-2 text-xs text-muted-foreground">Últimos 7 dias</p>
                    <ChartContainer config={configGrafico} className="aspect-auto h-24 w-full">
                        <BarChart accessibilityLayer data={serie} margin={{ left: 0, right: 0, top: 4 }}>
                            <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis hide domain={[0, 'dataMax']} />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent formatter={v => brl(Number(v))} />}
                            />
                            <Bar dataKey="valor" fill="var(--color-valor)" radius={6} maxBarSize={20} minPointSize={4} isAnimationActive={false} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                <Card size="sm">
                    <CardHeader>
                        <CardDescription className="text-xs">Voltaram no mês</CardDescription>
                        <CardTitle className="text-2xl! font-semibold tracking-tight tabular-nums">{n.voltaram}</CardTitle>
                        <CardDescription className="text-xs">Clientes distintos</CardDescription>
                    </CardHeader>
                </Card>
                <Card size="sm">
                    <CardHeader>
                        <CardDescription className="text-xs">Fizeram a 2ª compra</CardDescription>
                        <CardTitle className="text-2xl! font-semibold tracking-tight tabular-nums">{`${taxa}%`}</CardTitle>
                        <CardDescription className="text-xs">{`${n.segunda} de ${n.novos} clientes`}</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Item variant="outline" className="border-glass-border bg-card shadow-glass backdrop-blur-xl">
                <ItemMedia variant="icon">
                    <Clock />
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>{l.auto ? 'Próximo envio às 9h' : 'Envio automático desligado'}</ItemTitle>
                    <ItemDescription className="line-clamp-1">
                        {fila.length}
                        {' '}
                        {fila.length === 1 ? 'mensagem' : 'mensagens'}
                        {' '}
                        {l.auto ? 'preparadas' : 'para você revisar'}
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        aria-label="Envio automático às 9h"
                        checked={l.auto}
                        onCheckedChange={(v) =>
                        {
                            alternarAuto();
                            toast.success(v ? 'Envio automático ligado.' : 'Envio automático desligado.', {
                                description: v ? 'As mensagens saem todo dia às 9h.' : 'Você revisa cada mensagem antes de enviar.',
                            });
                        }}
                    />
                </ItemActions>
            </Item>

            <div className="mt-3 flex items-center gap-2">
                <h2 className="font-heading text-base font-semibold tracking-tight">Oportunidades de hoje</h2>
                <Badge variant="secondary">{total}</Badge>
            </div>

            {total === 0
                ? (
                        <Empty className="bg-card shadow-glass ring-1 ring-glass-border backdrop-blur-xl">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <PartyPopper />
                                </EmptyMedia>
                                <EmptyTitle>Nenhum cliente para chamar hoje</EmptyTitle>
                                <EmptyDescription>
                                    Quando alguém estiver perto de voltar, aparece aqui.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    )
                : (
                        <ul className="flex flex-col gap-2">
                            {problemas.map(c => <Oportunidade key={c.id} c={c} tipo="problema" />)}
                            {fila.slice(0, Math.max(0, MAX_OPORTUNIDADES - problemas.length)).map(x => (
                                <Oportunidade
                                    key={x.cliente.id}
                                    c={x.cliente}
                                    s={x.s}
                                    tipo={x.tipo}
                                    rec={recompensaValida(x.cliente, hoje)}
                                />
                            ))}
                        </ul>
                    )}
            {fila.length > Math.max(0, MAX_OPORTUNIDADES - problemas.length) && (
                <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground">
                    <Link to="/mensagens?aba=programadas">
                        {`Ver todas as ${fila.length} mensagens preparadas`}
                    </Link>
                </Button>
            )}
        </div>
    );
}

/**
 * @summary
 * Propriedades de {@link Oportunidade}.
 *
 * @property c - Cliente a chamar.
 * @property s - Situação do cliente; ausente quando a oportunidade é um problema relatado.
 * @property tipo - Mensagem preparada ou `problema` para um alerta aberto.
 * @property rec - Recompensa válida do cliente, quando houver.
 */
interface OportunidadeProps
{
    c: Cliente;
    s?: Situacao;
    tipo: TipoMensagem;
    rec?: Recompensa;
}

/**
 * @summary
 * Cartão de um cliente a chamar hoje. Tem sempre a mesma altura: cabeçalho e uma linha de destaque que abre a conversa.
 *
 * @param props - Cliente, situação, tipo da mensagem e recompensa.
 * @returns O item da lista de oportunidades.
 */
function Oportunidade({ c, s, tipo, rec }: OportunidadeProps)
{
    const selo = SELO_TIPO[tipo];
    const sub = !s
        ? 'Respondeu à mensagem'
        : s.est === 'novo' && s.desde < 7
            ? `Primeira compra ${s.desde === 1 ? 'ontem' : `há ${dias(s.desde)}`}`
            : `Há ${dias(s.desde)} sem comprar`;
    const acao = tipo === 'problema' ? 'Abrir conversa' : tipo === 'obrigado' || tipo === 'dica' ? 'Ver mensagem' : 'Ver lembrete';

    const tom: Tom | undefined = tipo === 'problema' ? 'destructive' : rec ? 'warning' : undefined;

    return (
        <li>
            <Card size="sm">
                <CardContent className="flex flex-col gap-2.5">
                    <Item className="p-0">
                        <ItemMedia>
                            <Avatar>
                                <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
                            </Avatar>
                        </ItemMedia>
                        <ItemContent className="min-w-0 gap-0">
                            <ItemTitle className="w-full truncate">{c.nome}</ItemTitle>
                            <ItemDescription className="line-clamp-1 text-xs">{sub}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                            <Badge variant={selo.variant} className="w-28">{selo.rotulo}</Badge>
                        </ItemActions>
                    </Item>
                    <Item
                        asChild
                        size="sm"
                        variant="muted"
                        data-tom={tom}
                        className={cn('rounded-xl py-1.5 pl-1.5', tom && TOM_SUPERFICIE[tom])}
                    >
                        <Link to={`/mensagens/${c.id}`}>
                            <ItemMedia variant="icon">
                                {tipo === 'problema' ? <TriangleAlert /> : rec ? <Gift /> : <MessageSquareText />}
                            </ItemMedia>
                            <ItemContent className="min-w-0">
                                <ItemTitle className="w-full truncate font-normal">
                                    {tipo === 'problema'
                                        ? 'Respondeu: tive um problema'
                                        : rec
                                            ? rec.valor ? `${brl(rec.valor)} de crédito disponível` : `Recompensa: ${rec.descricao}`
                                            : TIPO_MENSAGEM[tipo]}
                                </ItemTitle>
                            </ItemContent>
                            <ItemActions className="gap-0.5 text-xs font-medium">
                                {acao}
                                <ChevronRight className="size-4 opacity-60" aria-hidden />
                            </ItemActions>
                        </Link>
                    </Item>
                </CardContent>
            </Card>
        </li>
    );
}
