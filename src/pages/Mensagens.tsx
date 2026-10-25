import { Link, useSearchParams } from 'react-router';
import { ChevronRight, Inbox, Send, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { filaDoDia } from '@/domain/fila';
import { quando } from '@/domain/formato';
import { TIPO_MENSAGEM } from '@/domain/mensagens';
import type { Cliente, Mensagem } from '@/domain/tipos';
import { CLASSE_AVISO, iniciais, SELO_STATUS } from '@/lib/estados';
import { cn } from '@/lib/utils';
import { useFregues, useHoje, useLoja } from '@/store/useFregues';

type Aba = 'conversas' | 'programadas';

/**
 * @summary
 * Conversas com os clientes e mensagens programadas para hoje.
 *
 * @remarks
 * A aba ativa fica na URL (`?aba=programadas`) para que a tela Hoje possa abrir direto na fila.
 *
 * @returns A tela Mensagens.
 */
export function Mensagens()
{
    const l = useLoja();
    const hoje = useHoje();
    const disparar = useFregues(s => s.dispararEnvio);
    const [params, setParams] = useSearchParams();
    const aba = (params.get('aba') as Aba) || 'conversas';
    const fila = filaDoDia(l, hoje);

    // Uma conversa por cliente, a mais recente primeiro (as mensagens vêm da mais nova para a mais antiga).
    const ultimas = new Map<string, Mensagem>();
    for (const m of l.mensagens)
    {
        if (!ultimas.has(m.clienteId)) ultimas.set(m.clienteId, m);
    }
    const conversas = [...ultimas.values()]
        .map(m => ({ m, c: l.clientes.find(x => x.id === m.clienteId) }))
        .filter((x): x is { m: Mensagem; c: Cliente } => !!x.c);

    return (
        <div className="flex flex-col gap-3">
            <header className="mb-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">Mensagens</h1>
                <p className="text-sm text-muted-foreground">Conversas que trazem clientes de volta.</p>
            </header>

            <Tabs value={aba} onValueChange={v => setParams(v === 'conversas' ? {} : { aba: v }, { replace: true })}>
                <TabsList className="w-full">
                    <TabsTrigger value="conversas">Conversas</TabsTrigger>
                    <TabsTrigger value="programadas">
                        Programadas
                        <Badge variant="outline" className={cn('tabular-nums', CLASSE_AVISO)}>{fila.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="conversas" className="mt-2">
                    {conversas.length === 0
                        ? (
                                <Empty className="border bg-card">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Inbox />
                                        </EmptyMedia>
                                        <EmptyTitle>Nenhuma conversa ainda</EmptyTitle>
                                        <EmptyDescription>As mensagens enviadas aparecem aqui.</EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            )
                        : (
                                <Card className="py-1">
                                    <ItemGroup className="gap-0">
                                        {conversas.map(({ m, c }, i) =>
                                        {
                                            const st = SELO_STATUS[m.status];
                                            return (
                                                <div key={c.id} role="listitem">
                                                    {i > 0 && <ItemSeparator className="my-0" />}
                                                    <Item asChild className="rounded-none px-4">
                                                        <Link to={`/mensagens/${c.id}`}>
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
                        disabled={!fila.length}
                        onClick={() =>
                        {
                            const n = disparar();
                            toast.success(`${n} ${n === 1 ? 'mensagem enviada' : 'mensagens enviadas'}.`, {
                                description: 'Simulação do envio das 9h.',
                            });
                        }}
                    >
                        <Send data-icon="inline-start" />
                        {' '}
                        Enviar todas agora
                    </Button>
                    {fila.length === 0
                        ? (
                                <Empty className="border bg-card">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Inbox />
                                        </EmptyMedia>
                                        <EmptyTitle>Nada programado para hoje</EmptyTitle>
                                        <EmptyDescription>
                                            Os lembretes aparecem aqui no dia certo de cada cliente.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            )
                        : (
                                <Card className="py-1">
                                    <ItemGroup className="gap-0">
                                        {fila.map(({ cliente: c, tipo }, i) => (
                                            <div key={c.id} role="listitem">
                                                {i > 0 && <ItemSeparator className="my-0" />}
                                                <Item asChild className="rounded-none px-4">
                                                    <Link to={`/mensagens/${c.id}`}>
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
