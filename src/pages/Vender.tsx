import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    brl,
    dias,
    parseValor,
    soDigitos,
    valorParaCampo,
} from '@/domain/formato';
import { recompensaValida, valorACobrar } from '@/domain/mensagens';
import type { Cliente } from '@/domain/tipos';
import { campoMascarado, mascaraCpf, mascaraTelefone, mascaraValor } from '@/lib/mascaras';
import { useFregues, useHoje, useLoja } from '@/store/useFregues';

/**
 * @summary
 * Origem do cliente que está realizando a compra.
 */
type Modo = 'existente' | 'novo';

function ultimaCompra(c: Cliente)
{
    return c.compras.reduce((a, b) => (b.data > a.data ? b : a));
}

/**
 * @summary
 * Registro de venda: cliente (cadastrado ou novo), produto, valor e uso do crédito.
 *
 * @remarks
 * Aceita `?cliente=<id>` para começar com o cliente escolhido e `?novo=1` para abrir o cadastro.
 * Os blocos têm altura fixa: trocar de aba ou escolher opções não muda o tamanho da tela.
 *
 * @returns A tela Nova venda.
 */
export function Vender()
{
    const l = useLoja();
    const hoje = useHoje();
    const registrar = useFregues(s => s.registrarVenda);
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const inicial = l.clientes.find(c => c.id === params.get('cliente'));
    const voltarPara = inicial ? `/clientes/${inicial.id}` : '/';
    const [modo, setModo] = useState<Modo>(params.get('novo') === '1' ? 'novo' : 'existente');
    const [clienteId, setClienteId] = useState<string>(inicial?.id ?? '');
    const [busca, setBusca] = useState(inicial?.nome ?? '');
    const [pesquisando, setPesquisando] = useState(false);
    const [novo, setNovo] = useState({ nome: '', tel: '', cpf: '', ok: false });
    const [produtoId, setProdutoId] = useState<string>(inicial ? ultimaCompra(inicial).produtoId : '');
    const [valor, setValor] = useState(inicial ? valorParaCampo(ultimaCompra(inicial).valor) : '');
    const [usarRecompensa, setUsarRecompensa] = useState(true);

    const cliente = modo === 'existente' ? l.clientes.find(c => c.id === clienteId) : undefined;
    const rec = cliente ? recompensaValida(cliente, hoje) : undefined;
    const v = parseValor(valor);

    const lista = useMemo(() =>
    {
        const q = busca.trim().toLowerCase();
        const qd = soDigitos(q);
        if (!q) return [];
        return [...l.clientes]
            // Quem veio da ficha do cliente fica no topo; os outros, de quem comprou por último.
            .sort((a, b) =>
                Number(b.id === inicial?.id) - Number(a.id === inicial?.id)
                || ultimaCompra(b).data.localeCompare(ultimaCompra(a).data))
            .filter(c =>
                c.nome.toLowerCase().includes(q)
                || (qd.length > 0 && (soDigitos(c.tel).includes(qd) || soDigitos(c.cpf ?? '').includes(qd))))
            .slice(0, 5);
    }, [l.clientes, busca, inicial?.id]);
    const buscaAberta = pesquisando && !!busca.trim();

    const falta
        = modo === 'existente' && !cliente
            ? 'Escolha quem comprou.'
            : modo === 'novo' && !novo.nome.trim()
                ? 'Informe o nome do cliente.'
                : modo === 'novo' && soDigitos(novo.tel).length < 10
                    ? 'Informe o WhatsApp com DDD.'
                    : modo === 'novo' && !novo.ok
                        ? 'Marque a autorização do cliente.'
                        : !produtoId
                                ? 'Escolha o produto.'
                                : v <= 0
                                    ? 'Informe o valor da venda.'
                                    : null;
    const cobrar = valorACobrar(v, usarRecompensa ? rec : undefined);

    function escolher(id: string)
    {
        const c = l.clientes.find(x => x.id === id);
        if (!c) return;
        setClienteId(c.id);
        setBusca(c.nome);
        document.getElementById('busca-venda')?.focus({ preventScroll: true });
        setPesquisando(false);
        const u = ultimaCompra(c);
        setProdutoId(u.produtoId);
        setValor(valorParaCampo(u.valor));
        setUsarRecompensa(true);
    }

    function confirmar()
    {
        if (falta || !produtoId) return;
        const r = registrar(
            modo === 'novo'
                ? { novo: { nome: novo.nome, tel: novo.tel, cpf: novo.cpf }, produtoId, valor: v }
                : { clienteId: cliente!.id, produtoId, valor: v, usarRecompensa: !!rec && usarRecompensa },
        );
        const quem = r.cliente.chamar;
        if (r.tipo === 'novo')
        {
            toast.success('Venda registrada e cliente cadastrado.', {
                description: 'Comprovante enviado. Amanhã o Freguês pergunta se deu tudo certo.',
            });
        }
        else if (r.tipo === 'recuperada')
        {
            toast.success(`Venda recuperada: ${brl(r.valorPago)}.`, { description: `${quem} voltou depois da mensagem.` });
        }
        else
        {
            toast.success(r.tipo === 'segunda' ? `Segunda compra de ${quem}!` : 'Venda registrada.', {
                description: `Vamos lembrar ${quem} daqui a uns ${dias(r.media)}.`,
            });
        }
        navigate(r.tipo === 'novo' ? '/' : voltarPara);
    }

    return (
        <div className="flex flex-col gap-3">
            <Button asChild variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground">
                <Link to={voltarPara}>
                    <ChevronLeft data-icon="inline-start" />
                    {' '}
                    Voltar
                </Link>
            </Button>
            <header className="mb-1">
                <h1 className="font-heading text-xl font-semibold tracking-tight">Nova venda</h1>
                <p className="text-sm text-muted-foreground">O Freguês cuida do comprovante e do convite para voltar.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Quem comprou?</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs
                        value={modo}
                        onValueChange={(m) =>
                        {
                            setModo(m as Modo);
                            setPesquisando(false);
                        }}
                    >
                        <TabsList className="w-full">
                            <TabsTrigger value="existente">Já é cliente</TabsTrigger>
                            <TabsTrigger value="novo">Cliente novo</TabsTrigger>
                        </TabsList>

                        <TabsContent value="existente" className="mt-2 flex h-80 flex-col gap-2">
                            <Popover open={buscaAberta} onOpenChange={setPesquisando}>
                                <PopoverAnchor asChild>
                                    <InputGroup>
                                        <InputGroupAddon>
                                            <Search />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="busca-venda"
                                            type="search"
                                            aria-label="Buscar cliente por nome, CPF ou número de telefone"
                                            aria-haspopup="dialog"
                                            aria-expanded={buscaAberta}
                                            aria-describedby="ajuda-busca-venda"
                                            placeholder="Nome, CPF ou número de telefone"
                                            autoComplete="off"
                                            value={busca}
                                            onFocus={() => setPesquisando(true)}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === 'Escape') setPesquisando(false);
                                                if (e.key === 'ArrowDown' && lista.length > 0)
                                                {
                                                    e.preventDefault();
                                                    setPesquisando(true);
                                                    requestAnimationFrame(() => document.getElementById(`resultado-${lista[0].id}`)?.focus());
                                                }
                                                if (e.key === 'Enter' && buscaAberta && lista.length > 0)
                                                {
                                                    e.preventDefault();
                                                    escolher(lista[0].id);
                                                }
                                            }}
                                            onChange={(e) =>
                                            {
                                                setBusca(e.target.value);
                                                setClienteId('');
                                                setPesquisando(true);
                                            }}
                                        />
                                    </InputGroup>
                                </PopoverAnchor>
                                <PopoverContent
                                    align="start"
                                    aria-label="Resultados da busca de clientes"
                                    className="w-(--radix-popover-trigger-width) overflow-hidden p-0"
                                    onOpenAutoFocus={e => e.preventDefault()}
                                    onCloseAutoFocus={e => e.preventDefault()}
                                    onInteractOutside={(e) =>
                                    {
                                        if (e.target instanceof Element && e.target.id === 'busca-venda') e.preventDefault();
                                    }}
                                >
                                    <ScrollArea className="max-h-72 **:data-[slot=scroll-area-viewport]:max-h-72">
                                        {lista.length === 0
                                            ? <p role="status" className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                                            : (
                                                    <ul aria-label="Clientes encontrados">
                                                        {lista.map(c => (
                                                            <li key={c.id}>
                                                                <Button
                                                                    id={`resultado-${c.id}`}
                                                                    type="button"
                                                                    variant="ghost"
                                                                    aria-pressed={clienteId === c.id}
                                                                    className="h-auto w-full justify-start rounded-none px-4 py-3 text-left whitespace-normal focus-visible:ring-inset"
                                                                    onClick={() => escolher(c.id)}
                                                                >
                                                                    <span className="flex min-w-0 flex-col gap-0.5">
                                                                        <span className="truncate font-medium">{c.nome}</span>
                                                                        <span className="text-sm font-normal text-muted-foreground">{c.tel}</span>
                                                                    </span>
                                                                </Button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                            <p id="ajuda-busca-venda" role="status" className="min-h-10 text-sm text-muted-foreground">
                                {cliente
                                    ? `Cliente selecionado: ${cliente.nome} · ${cliente.tel}`
                                    : 'Digite para pesquisar. Exibimos até 5 clientes por busca.'}
                            </p>
                        </TabsContent>

                        <TabsContent value="novo" className="mt-2 h-80">
                            <FieldGroup className="gap-4">
                                <Field>
                                    <FieldLabel htmlFor="n-nome">Nome</FieldLabel>
                                    <Input id="n-nome" autoComplete="off" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field>
                                        <FieldLabel htmlFor="n-tel">WhatsApp</FieldLabel>
                                        <Input
                                            id="n-tel"
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="off"
                                            placeholder="(44) 99999-0000"
                                            {...campoMascarado(
                                                novo.tel,
                                                mascaraTelefone,
                                                tel => setNovo({ ...novo, tel }),
                                            )}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="n-cpf">CPF (opcional)</FieldLabel>
                                        <Input
                                            id="n-cpf"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            placeholder="000.000.000-00"
                                            {...campoMascarado(novo.cpf, mascaraCpf, cpf => setNovo({ ...novo, cpf }))}
                                        />
                                    </Field>
                                </div>
                                <Field orientation="horizontal">
                                    <Checkbox id="n-ok" checked={novo.ok} onCheckedChange={x => setNovo({ ...novo, ok: x === true })} />
                                    <FieldLabel htmlFor="n-ok" className="font-normal">
                                        O cliente autorizou receber mensagens da loja pelo WhatsApp.
                                    </FieldLabel>
                                </Field>
                            </FieldGroup>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>O que comprou?</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        aria-label="Produto"
                        value={produtoId}
                        onValueChange={(id) =>
                        {
                            setProdutoId(id);
                            const p = l.produtos.find(x => x.id === id);
                            if (p) setValor(valorParaCampo(p.preco));
                        }}
                        className="grid grid-cols-2 gap-2"
                    >
                        {l.produtos.map(p => (
                            <FieldLabel key={p.id} htmlFor={`prod-${p.id}`}>
                                <Field orientation="horizontal">
                                    <FieldContent className="min-w-0">
                                        <FieldTitle className="w-full truncate">{p.nome}</FieldTitle>
                                        <FieldDescription className="tabular-nums">{brl(p.preco)}</FieldDescription>
                                    </FieldContent>
                                    <RadioGroupItem value={p.id} id={`prod-${p.id}`} />
                                </Field>
                            </FieldLabel>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <FieldGroup className="gap-4">
                        <Field>
                            <FieldLabel htmlFor="valor">Valor da venda</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText>R$</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="valor"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    className="tabular-nums"
                                    placeholder="0,00"
                                    {...campoMascarado(valor, mascaraValor, setValor)}
                                />
                            </InputGroup>
                        </Field>
                        <FieldLabel htmlFor="usar">
                            <Field orientation="horizontal" data-disabled={!rec}>
                                <FieldContent className="min-w-0">
                                    <FieldTitle>{!rec ? 'Sem crédito disponível' : rec.valor ? `Usar ${brl(rec.valor)} de crédito` : 'Usar recompensa'}</FieldTitle>
                                    <FieldDescription className="line-clamp-1">
                                        {!rec ? 'O cliente não tem recompensa válida.' : rec.valor ? 'Desconta do valor a cobrar.' : rec.descricao}
                                    </FieldDescription>
                                </FieldContent>
                                <Switch id="usar" checked={!!rec && usarRecompensa} disabled={!rec} onCheckedChange={setUsarRecompensa} />
                            </Field>
                        </FieldLabel>
                    </FieldGroup>
                </CardContent>
            </Card>

            <p className="flex h-6 items-center justify-center text-sm text-muted-foreground" aria-live="polite">
                {falta ?? (
                    <>
                        Cobrar
                        <b className="mx-1 text-foreground tabular-nums">{brl(cobrar)}</b>
                        {' '}
                        do cliente
                    </>
                )}
            </p>
            <Button size="lg" className="w-full" disabled={!!falta} onClick={confirmar}>
                Registrar venda
            </Button>
        </div>
    );
}
