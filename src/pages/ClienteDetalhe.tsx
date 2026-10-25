import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, Navigate, useParams } from 'react-router';
import {
    ChevronLeft,
    Gift,
    MessageCircle,
    MessageSquareText,
    Plus,
    ShoppingBag,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { bloqueio, tipoDaSituacao } from '@/domain/fila';
import { brl, ddmm, dias, waUrl } from '@/domain/formato';
import { recompensaValida, TIPO_MENSAGEM } from '@/domain/mensagens';
import { produtoDe, situacao } from '@/domain/recorrencia';
import type { Dia } from '@/domain/tipos';
import { CLASSE_AVISO, iniciais, seloCliente } from '@/lib/estados';
import { cn } from '@/lib/utils';
import { useHoje, useLoja } from '@/store/useFregues';

/**
 * @summary
 * Evento da linha do tempo do cliente: uma compra ou uma mensagem.
 *
 * @property chave - Chave única para a lista.
 * @property data - Dia do evento.
 * @property hora - Hora do evento (compras de exemplo usam 10:00), usada só para ordenar.
 * @property titulo - Linha principal ("18 set · Primeira compra").
 * @property sub - Linha secundária (produto e valor, ou tipo da mensagem).
 * @property compra - Verdadeiro para compras; falso para mensagens.
 */
interface Evento
{
    chave: string;
    data: Dia;
    hora: string;
    titulo: string;
    sub: string;
    compra: boolean;
}

function diaCurto(d: Dia, hoje: Dia): string
{
    return d === hoje ? 'Hoje' : format(parseISO(d), 'd MMM', { locale: ptBR });
}

/**
 * @summary
 * Ficha do cliente: situação, crédito, ritmo de compra e últimos eventos.
 *
 * @remarks
 * Redireciona para a lista quando o cliente da URL não existe na loja atual.
 *
 * @returns A tela da ficha do cliente.
 */
export function ClienteDetalhe()
{
    const { id } = useParams();
    const l = useLoja();
    const hoje = useHoje();
    const c = l.clientes.find(x => x.id === id);
    if (!c) return <Navigate to="/clientes" replace />;

    const s = situacao(c, l.produtos, l.regraSumido, hoje);
    const rec = recompensaValida(c, hoje);
    const tipo = tipoDaSituacao(s);
    const preparada = tipo && !bloqueio(
        l,
        c,
        s,
        tipo,
        hoje,
    )
        ? tipo
        : null;
    const selo = seloCliente(s, hoje);

    const compras = [...c.compras].sort((a, b) => a.data.localeCompare(b.data));
    const eventos: Evento[] = [
        ...compras.map((x, i) => ({
            chave: `c${i}`,
            data: x.data,
            hora: x.hora ?? '10:00',
            compra: true,
            titulo: `${diaCurto(x.data, hoje)} · ${i === 0 ? 'Primeira compra' : x.recuperada ? 'Voltou pela mensagem' : 'Compra'}`,
            sub: `${produtoDe(l.produtos, x.produtoId)?.nome ?? 'Produto'} · ${brl(x.valor)}`,
        })),
        ...l.mensagens
            .filter(m => m.clienteId === c.id)
            .map(m => ({
                chave: m.id,
                data: m.data,
                hora: m.hora,
                compra: false,
                titulo: `${diaCurto(m.data, hoje)} · Mensagem enviada`,
                sub: TIPO_MENSAGEM[m.tipo],
            })),
    ].sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora));
    if (preparada)
    {
        eventos.unshift({
            chave: 'prep',
            data: hoje,
            hora: '',
            compra: false,
            titulo: 'Hoje · Mensagem preparada',
            sub: TIPO_MENSAGEM[preparada],
        });
    }

    return (
        <div className="flex flex-col gap-3">
            <Button asChild variant="ghost" className="-ml-2 self-start">
                <Link to="/clientes">
                    <ChevronLeft data-icon="inline-start" />
                    {' '}
                    Clientes
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Avatar size="lg">
                            <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <CardTitle className="truncate text-lg">
                                <h1>{c.nome}</h1>
                            </CardTitle>
                            <CardDescription>{c.tel}</CardDescription>
                        </div>
                    </div>
                    <CardAction>
                        <Badge variant={selo.variant} className={cn('w-24', selo.className)}>{selo.rotulo}</Badge>
                    </CardAction>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                    <Item variant="muted" className={cn(rec && CLASSE_AVISO)}>
                        <ItemMedia variant="icon">
                            <Gift />
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                            <ItemDescription className={cn('line-clamp-1', rec && 'text-current opacity-80')}>
                                {rec?.valor ? 'Crédito disponível' : 'Recompensa'}
                            </ItemDescription>
                            <ItemTitle className="w-full truncate text-base">
                                {rec ? (rec.valor ? brl(rec.valor) : rec.descricao) : 'Nenhuma no momento'}
                            </ItemTitle>
                        </ItemContent>
                        {rec && (
                            <ItemActions>
                                <Badge variant="outline" className="border-current">
                                    {`Até ${ddmm(rec.validaAte)}`}
                                </Badge>
                            </ItemActions>
                        )}
                    </Item>

                    <div className="grid grid-cols-2 gap-3">
                        <Item variant="outline">
                            <ItemContent>
                                <ItemDescription>{s.aprendido ? 'Compra a cada' : 'Prazo do produto'}</ItemDescription>
                                <ItemTitle>{dias(s.media)}</ItemTitle>
                            </ItemContent>
                        </Item>
                        <Item variant="outline">
                            <ItemContent>
                                <ItemDescription>Próxima compra</ItemDescription>
                                <ItemTitle>{s.est === 'sumido' ? 'Sumido' : ddmm(s.proxima)}</ItemTitle>
                            </ItemContent>
                        </Item>
                    </div>

                    <ItemGroup className="gap-0">
                        {eventos.slice(0, 4).map(e => (
                            <Item key={e.chave} size="sm" className="px-0" role="listitem">
                                <ItemMedia variant="icon">
                                    {e.compra ? <ShoppingBag /> : <MessageSquareText />}
                                </ItemMedia>
                                <ItemContent className="min-w-0">
                                    <ItemTitle className="w-full truncate">{e.titulo}</ItemTitle>
                                    <ItemDescription className="line-clamp-1">{e.sub}</ItemDescription>
                                </ItemContent>
                            </Item>
                        ))}
                    </ItemGroup>
                </CardContent>

                <CardFooter className="gap-2 border-t">
                    <Button asChild variant="outline" className="flex-1">
                        <Link to={`/mensagens/${c.id}`}>Ver conversa</Link>
                    </Button>
                    <Button asChild variant="outline" size="icon" aria-label="Abrir no WhatsApp (abre em outra janela)">
                        <a href={waUrl(c.tel)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle />
                        </a>
                    </Button>
                </CardFooter>
            </Card>

            <Button asChild size="lg" className="w-full">
                <Link to={`/vender?cliente=${c.id}`}>
                    <Plus data-icon="inline-start" />
                    {' '}
                    Registrar nova compra
                </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
                {`Autorizou receber mensagens em ${ddmm(c.autorizadoEm)}.`}
            </p>
        </div>
    );
}
