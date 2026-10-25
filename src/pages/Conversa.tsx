import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import {
    CheckCheck,
    ChevronLeft,
    CircleCheck,
    MessageCircle,
    Plus,
    Send,
    ThumbsUp,
    TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';
import { bloqueio, tipoDaSituacao } from '@/domain/fila';
import { brl, quando, waUrl } from '@/domain/formato';
import { recompensaValida, textoMensagem, TIPO_MENSAGEM, TIPOS_CONVITE } from '@/domain/mensagens';
import { type Resposta, textoResposta } from '@/domain/operacoes';
import { situacao } from '@/domain/recorrencia';
import type { Cliente, Loja, Mensagem, TipoMensagem } from '@/domain/tipos';
import { iniciais } from '@/lib/estados';
import { useFregues, useHoje, useLoja } from '@/store/useFregues';

/**
 * @summary
 * Conversa com um cliente: histórico, mensagem preparada, resposta simulada e próxima ação.
 *
 * @remarks
 * Redireciona para Mensagens quando o cliente da URL não existe na loja atual.
 *
 * @returns A tela da conversa.
 */
export function Conversa()
{
    const { id } = useParams();
    const l = useLoja();
    const c = l.clientes.find(x => x.id === id);
    if (!c) return <Navigate to="/mensagens" replace />;
    // A chave recria o rascunho ao trocar de cliente.
    return <ConversaCliente key={c.id} l={l} c={c} />;
}

/**
 * @summary
 * Propriedades de {@link ConversaCliente}.
 *
 * @property l - Loja atual.
 * @property c - Cliente da conversa.
 */
interface ConversaClienteProps
{
    l: Loja;
    c: Cliente;
}

/**
 * @summary
 * Conteúdo da conversa de um cliente já encontrado.
 *
 * @param props - Loja e cliente.
 * @returns O histórico, as ações e o campo de nova mensagem.
 */
function ConversaCliente({ l, c }: ConversaClienteProps)
{
    const hoje = useHoje();
    const { enviarMensagem, pular, responder, resolverProblema } = useFregues();
    const s = situacao(c, l.produtos, l.regraSumido, hoje);
    const tipoSit = tipoDaSituacao(s);
    const preparada = tipoSit && !bloqueio(
        l,
        c,
        s,
        tipoSit,
        hoje,
    )
        ? tipoSit
        : null;
    const textoPreparado = preparada
        ? textoMensagem(
                c,
                l,
                preparada,
                s,
                hoje,
            )
        : '';
    const problema = l.problemasAbertos.includes(c.id);
    const msgs = l.mensagens.filter(m => m.clienteId === c.id).reverse();
    const ultima: Mensagem | undefined = msgs[msgs.length - 1];
    const tipoLivre: TipoMensagem = problema ? 'problema' : 'atendimento';
    const [rascunho, setRascunho] = useState(() => (problema
        ? textoMensagem(
                c,
                l,
                'problema',
                s,
                hoje,
            )
        : ''));

    function enviar(tipo: TipoMensagem, texto: string)
    {
        try
        {
            enviarMensagem(c.id, tipo, texto);
            toast.success(`Mensagem enviada para ${c.chamar}.`);
        }
        catch (erro)
        {
            toast.error(erro instanceof Error ? erro.message : 'Não foi possível enviar a mensagem.');
        }
    }

    function simular(r: Resposta)
    {
        if (!ultima) return;
        responder(ultima.id, r);
        toast.success('Resposta do cliente simulada.', {
            description: r === 'problema' ? 'O alerta apareceu em Hoje.' : r === 'quer' ? 'Registre a compra quando ele vier.' : undefined,
        });
    }

    const aguardando = ultima?.status === 'enviada' && (ultima.tipo === 'obrigado' || TIPOS_CONVITE.includes(ultima.tipo));

    return (
        <div className="flex flex-col gap-3">
            <Button asChild variant="ghost" className="-ml-2 self-start">
                <Link to="/mensagens">
                    <ChevronLeft data-icon="inline-start" />
                    {' '}
                    Mensagens
                </Link>
            </Button>

            <Card className="gap-0 pb-0">
                <CardHeader className="border-b">
                    <div className="flex min-w-0 items-center gap-3">
                        <Avatar size="lg">
                            <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
                        </Avatar>
                        <Link to={`/clientes/${c.id}`} className="min-w-0">
                            <CardTitle className="truncate">
                                <h1>{c.nome}</h1>
                            </CardTitle>
                            <CardDescription className="truncate">{TIPO_MENSAGEM[problema ? 'problema' : preparada ?? ultima?.tipo ?? 'atendimento']}</CardDescription>
                        </Link>
                    </div>
                    <CardAction>
                        <Badge variant="secondary">Simulação</Badge>
                    </CardAction>
                </CardHeader>

                <CardContent className="bg-muted/50 py-4">
                    <ol className="flex flex-col gap-2" aria-label="Conversa">
                        {msgs.length === 0 && !preparada && (
                            <li className="py-6 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</li>
                        )}
                        {msgs.map((m, i) => (
                            <li key={m.id} className="flex flex-col gap-2">
                                {(i === 0 || msgs[i - 1].data !== m.data) && (
                                    <Badge variant="outline" className="self-center bg-card">{quando(m.data, hoje)}</Badge>
                                )}
                                <Card size="sm" className="ml-10 max-w-[85%] gap-1 self-end rounded-br-sm bg-secondary py-2.5 text-foreground ring-0">
                                    <CardContent className="px-3">
                                        <span className="sr-only">Loja: </span>
                                        <p className="whitespace-pre-wrap">{m.texto}</p>
                                        <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                            {m.hora}
                                            {' '}
                                            <CheckCheck className="size-3.5 text-chart-1" aria-label="entregue" />
                                        </p>
                                    </CardContent>
                                </Card>
                                {m.resposta && (
                                    <Card size="sm" className="mr-10 max-w-[85%] gap-1 self-start rounded-bl-sm py-2.5">
                                        <CardContent className="px-3">
                                            <span className="sr-only">Cliente: </span>
                                            <p className="whitespace-pre-wrap">{m.resposta.texto}</p>
                                            <p className="mt-1 text-right text-xs text-muted-foreground">{m.resposta.hora}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </li>
                        ))}
                        {preparada && (
                            <li className="flex flex-col gap-2">
                                {ultima?.data !== hoje && <Badge variant="outline" className="self-center bg-card">Hoje</Badge>}
                                <Card size="sm" className="ml-10 max-w-[85%] gap-1 self-end rounded-br-sm border border-dashed border-chart-1 py-2.5 ring-0">
                                    <CardHeader className="px-3">
                                        <CardDescription className="text-xs font-medium text-secondary-foreground">
                                            {l.auto ? 'Programada · sai às 9h' : 'Preparada · aguardando você'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-3">
                                        <p className="whitespace-pre-wrap">{textoPreparado}</p>
                                    </CardContent>
                                </Card>
                            </li>
                        )}
                    </ol>
                </CardContent>

                {preparada && (
                    <CardFooter className="grid grid-cols-2 gap-2 border-t">
                        <Button onClick={() => enviar(preparada, textoPreparado)}>
                            <Send data-icon="inline-start" />
                            {' '}
                            Enviar agora
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                            {
                                pular(c.id, preparada);
                                toast.success('Mensagem de hoje cancelada.');
                            }}
                        >
                            Não enviar hoje
                        </Button>
                    </CardFooter>
                )}
            </Card>

            {problema && (
                <Alert variant="destructive" className="bg-card">
                    <TriangleAlert />
                    <AlertTitle>Cliente teve um problema</AlertTitle>
                    <AlertDescription>Resolva antes de perder o cliente.</AlertDescription>
                </Alert>
            )}
            {problema && (
                <Button
                    size="lg"
                    className="w-full"
                    onClick={() =>
                    {
                        resolverProblema(c.id);
                        toast.success(`Problema resolvido. ${c.chamar} continua sendo seu cliente.`);
                    }}
                >
                    Marcar como resolvido
                </Button>
            )}
            {!preparada && !problema && ultima?.status === 'respondeu' && (
                <>
                    <Alert className="bg-card">
                        <CircleCheck />
                        <AlertTitle>Cliente respondeu ao lembrete</AlertTitle>
                        <AlertDescription>Registre a compra quando ele vier.</AlertDescription>
                    </Alert>
                    <Button asChild size="lg" className="w-full">
                        <Link to={`/vender?cliente=${c.id}`}>
                            <Plus data-icon="inline-start" />
                            {' '}
                            Registrar nova compra
                        </Link>
                    </Button>
                </>
            )}
            {!preparada && !problema && (ultima?.status === 'voltou' || ultima?.status === 'gostei') && (
                <Alert className="bg-card">
                    {ultima.status === 'voltou' ? <CircleCheck /> : <ThumbsUp />}
                    <AlertTitle>
                        {ultima.status === 'voltou' ? `Voltou e comprou ${brl(ultima.valorVolta ?? 0)}` : 'Cliente gostou da compra'}
                    </AlertTitle>
                </Alert>
            )}
            {!preparada && !problema && aguardando && (
                <Card size="sm" className="border border-dashed ring-0">
                    <CardHeader>
                        <CardDescription>
                            {`Demonstração: simule a resposta de ${c.chamar}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ultima.tipo === 'obrigado'
                            ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" onClick={() => simular('gostei')}>
                                            <ThumbsUp data-icon="inline-start" />
                                            {' '}
                                            Gostei
                                        </Button>
                                        <Button variant="outline" onClick={() => simular('problema')}>
                                            <TriangleAlert data-icon="inline-start" />
                                            {' '}
                                            Tive um problema
                                        </Button>
                                    </div>
                                )
                            : (
                                    <Button variant="outline" className="w-full" onClick={() => simular('quer')}>
                                        “
                                        {textoResposta('quer', recompensaValida(c, hoje)?.tipo === 'cashback')}
                                        ”
                                    </Button>
                                )}
                    </CardContent>
                </Card>
            )}

            <InputGroup className="bg-card">
                <InputGroupTextarea
                    aria-label={`Escrever mensagem para ${c.chamar}`}
                    placeholder={`Escrever para ${c.chamar}…`}
                    className="h-20"
                    value={rascunho}
                    onChange={e => setRascunho(e.target.value)}
                />
                <InputGroupAddon align="block-end" className="border-t">
                    <InputGroupButton asChild size="icon-sm" variant="ghost" aria-label="Abrir no WhatsApp (abre em outra janela)">
                        <a href={waUrl(c.tel, rascunho || textoPreparado)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle />
                        </a>
                    </InputGroupButton>
                    <InputGroupButton
                        variant="default"
                        size="sm"
                        className="ml-auto"
                        disabled={!rascunho.trim()}
                        onClick={() =>
                        {
                            enviar(tipoLivre, rascunho.trim());
                            setRascunho('');
                        }}
                    >
                        <Send data-icon="inline-start" />
                        {' '}
                        Enviar
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}
