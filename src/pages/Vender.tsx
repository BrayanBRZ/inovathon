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
import { recompensaValida } from '@/domain/mensagens';
import type { Cliente } from '@/domain/tipos';
import { useFregues, useHoje, useLoja } from '@/store/useFregues';

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
    const [busca, setBusca] = useState('');
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
        return [...l.clientes]
            // Quem veio da ficha do cliente fica no topo; os outros, de quem comprou por último.
            .sort((a, b) =>
                Number(b.id === inicial?.id) - Number(a.id === inicial?.id)
                || ultimaCompra(b).data.localeCompare(ultimaCompra(a).data))
            .filter(c =>
                !q
                || c.nome.toLowerCase().includes(q)
                || (qd.length > 2 && (soDigitos(c.tel).includes(qd) || soDigitos(c.cpf ?? '').includes(qd))));
    }, [l.clientes, busca, inicial?.id]);

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
    const cobrar = rec?.valor && usarRecompensa ? Math.max(0, v - rec.valor) : v;

    function escolher(id: string)
    {
        const c = l.clientes.find(x => x.id === id);
        if (!c) return;
        setClienteId(c.id);
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
            toast.success(`Venda recuperada: ${brl(v)}.`, { description: `${quem} voltou depois da mensagem.` });
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
            <Button asChild variant="ghost" className="-ml-2 self-start">
                <Link to={voltarPara}>
                    <ChevronLeft data-icon="inline-start" />
                    {' '}
                    Voltar
                </Link>
            </Button>
            <header className="mb-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">Nova venda</h1>
                <p className="text-sm text-muted-foreground">O Freguês cuida do comprovante e do convite para voltar.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Quem comprou?</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={modo} onValueChange={m => setModo(m as Modo)}>
                        <TabsList className="w-full">
                            <TabsTrigger value="existente">Já é cliente</TabsTrigger>
                            <TabsTrigger value="novo">Cliente novo</TabsTrigger>
                        </TabsList>

                        <TabsContent value="existente" className="mt-2 flex h-80 flex-col gap-2">
                            <InputGroup>
                                <InputGroupAddon>
                                    <Search />
                                </InputGroupAddon>
                                <InputGroupInput
                                    type="search"
                                    aria-label="Buscar por nome, telefone ou CPF"
                                    placeholder="Nome, telefone ou CPF"
                                    autoComplete="off"
                                    value={busca}
                                    onChange={e => setBusca(e.target.value)}
                                />
                            </InputGroup>
                            <ScrollArea className="min-h-0 flex-1 rounded-lg">
                                {lista.length === 0
                                    ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                                    : (
                                            <RadioGroup aria-label="Clientes" value={clienteId} onValueChange={escolher} className="gap-2">
                                                {lista.map(c => (
                                                    <FieldLabel key={c.id} htmlFor={`cli-${c.id}`}>
                                                        <Field orientation="horizontal">
                                                            <FieldContent className="min-w-0">
                                                                <FieldTitle className="w-full truncate">{c.nome}</FieldTitle>
                                                                <FieldDescription>{c.tel}</FieldDescription>
                                                            </FieldContent>
                                                            <RadioGroupItem value={c.id} id={`cli-${c.id}`} />
                                                        </Field>
                                                    </FieldLabel>
                                                ))}
                                            </RadioGroup>
                                        )}
                            </ScrollArea>
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
                                            value={novo.tel}
                                            onChange={e => setNovo({ ...novo, tel: e.target.value })}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="n-cpf">CPF (opcional)</FieldLabel>
                                        <Input id="n-cpf" inputMode="numeric" autoComplete="off" value={novo.cpf} onChange={e => setNovo({ ...novo, cpf: e.target.value })} />
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
                                    value={valor}
                                    onChange={e => setValor(e.target.value)}
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
