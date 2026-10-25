import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTheme } from 'next-themes';
import { CalendarPlus, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemSeparator,
    ItemTitle,
} from '@/components/ui/item';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { brl, ddmm } from '@/domain/formato';
import { campoMascarado, mascaraTelefone } from '@/lib/mascaras';
import {
    MENSALIDADE,
    type Plano,
    useFregues,
    useHoje,
    useLoja,
} from '@/store/useFregues';

/**
 * @summary
 * Ajustes da loja: dados, produtos, preferências, plano e modo demonstração.
 *
 * @remarks
 * O endereço `/ajustes#demo` rola direto até o modo demonstração.
 *
 * @returns A tela Ajustes.
 */
export function Ajustes()
{
    const l = useLoja();
    const hoje = useHoje();
    const s = useFregues();
    const { theme, setTheme } = useTheme();
    const { hash } = useLocation();

    useEffect(() =>
    {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    }, [hash]);

    return (
        <div className="flex flex-col gap-3">
            <header className="mb-1">
                <h1 className="font-heading text-xl font-semibold tracking-tight">Ajustes</h1>
                <p className="text-sm text-muted-foreground">Loja, produtos e preferências.</p>
            </header>

            <MinhaLoja key={l.id} />

            <Card>
                <CardHeader>
                    <CardTitle>Produtos e prazos de recompra</CardTitle>
                    <CardDescription>
                        O prazo vale até haver compras em dias diferentes. Depois, o Freguês aprende o ritmo de cada um.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ItemGroup className="gap-0">
                        {l.produtos.map((p, i) => (
                            <div key={p.id} role="listitem">
                                {i > 0 && <ItemSeparator className="my-0" />}
                                <Item asChild className="rounded-none px-0">
                                    <Link to={`/ajustes/produtos/${p.id}`}>
                                        <ItemContent className="min-w-0">
                                            <ItemTitle className="w-full truncate">{p.nome}</ItemTitle>
                                            <ItemDescription className="line-clamp-1 tabular-nums">
                                                {`${brl(p.preco)} · volta a cada ${p.ciclo} dias`}
                                            </ItemDescription>
                                        </ItemContent>
                                        <ItemActions>
                                            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                                        </ItemActions>
                                    </Link>
                                </Item>
                            </div>
                        ))}
                    </ItemGroup>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/ajustes/produtos/novo">
                            <Plus data-icon="inline-start" />
                            {' '}
                            Novo produto
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferências</CardTitle>
                </CardHeader>
                <CardContent>
                    <FieldGroup className="gap-4">
                        <Field orientation="horizontal">
                            <FieldContent>
                                <FieldLabel htmlFor="pref-auto">Envio automático às 9h</FieldLabel>
                                <FieldDescription>No máximo um lembrete por semana para cada cliente.</FieldDescription>
                            </FieldContent>
                            <Switch
                                id="pref-auto"
                                checked={l.auto}
                                onCheckedChange={(v) =>
                                {
                                    s.alternarAuto();
                                    toast.success(v ? 'Envio automático ligado.' : 'Envio automático desligado.');
                                }}
                            />
                        </Field>
                        <Field orientation="horizontal">
                            <FieldContent>
                                <FieldLabel htmlFor="pref-letra">Letra maior</FieldLabel>
                                <FieldDescription>Aumenta o texto de todas as telas.</FieldDescription>
                            </FieldContent>
                            <Switch
                                id="pref-letra"
                                checked={s.letraGrande}
                                onCheckedChange={(v) =>
                                {
                                    s.setLetraGrande(v);
                                    toast.success(v ? 'Letra maior ligada.' : 'Letra maior desligada.');
                                }}
                            />
                        </Field>
                        <Field>
                            <FieldTitle>Cores da tela</FieldTitle>
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                aria-label="Cores da tela"
                                className="w-full"
                                value={theme ?? 'system'}
                                onValueChange={t => t && setTheme(t)}
                            >
                                <ToggleGroupItem value="system" className="flex-1">Do celular</ToggleGroupItem>
                                <ToggleGroupItem value="light" className="flex-1">Claro</ToggleGroupItem>
                                <ToggleGroupItem value="dark" className="flex-1">Escuro</ToggleGroupItem>
                            </ToggleGroup>
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Plano</CardTitle>
                    <CardDescription>Primeiro mês grátis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        aria-label="Plano"
                        value={s.plano}
                        onValueChange={(p) =>
                        {
                            s.setPlano(p as Plano);
                            toast.success(`Plano ${p === 'essencial' ? 'Essencial' : 'Completo'} selecionado.`);
                        }}
                        className="grid grid-cols-2 gap-2"
                    >
                        {([['essencial', 'Essencial', 'Até 200 clientes'], ['completo', 'Completo', 'Ilimitado e IA']] as [Plano, string, string][]).map(([id, nome, desc]) => (
                            <FieldLabel key={id} htmlFor={`plano-${id}`}>
                                <Field orientation="horizontal">
                                    <FieldContent className="min-w-0">
                                        <FieldTitle>{nome}</FieldTitle>
                                        <FieldDescription className="tabular-nums">
                                            {brl(MENSALIDADE[id])}
                                            /mês ·
                                            {' '}
                                            {desc}
                                        </FieldDescription>
                                    </FieldContent>
                                    <RadioGroupItem value={id} id={`plano-${id}`} />
                                </Field>
                            </FieldLabel>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card id="demo" className="scroll-mt-20">
                <CardHeader>
                    <CardTitle>Modo demonstração</CardTitle>
                    <CardDescription>Nenhuma mensagem é enviada de verdade.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <RadioGroup
                        aria-label="Loja de exemplo"
                        value={s.lojaId}
                        onValueChange={(id) =>
                        {
                            s.trocarLoja(id);
                            toast.success(`Mostrando ${s.lojas[id].nome}.`);
                        }}
                        className="gap-2"
                    >
                        {Object.values(s.lojas).map(x => (
                            <FieldLabel key={x.id} htmlFor={`loja-${x.id}`}>
                                <Field orientation="horizontal">
                                    <FieldContent className="min-w-0">
                                        <FieldTitle className="w-full truncate">{x.nome}</FieldTitle>
                                        <FieldDescription>
                                            {x.clientes.length}
                                            {' '}
                                            clientes
                                        </FieldDescription>
                                    </FieldContent>
                                    <RadioGroupItem value={x.id} id={`loja-${x.id}`} />
                                </Field>
                            </FieldLabel>
                        ))}
                    </RadioGroup>
                    <Item variant="outline">
                        <ItemContent>
                            <ItemDescription>Dia da demonstração</ItemDescription>
                            <ItemTitle className="tabular-nums">{ddmm(hoje)}</ItemTitle>
                        </ItemContent>
                        <ItemActions>
                            <Button
                                variant="outline"
                                onClick={() =>
                                {
                                    s.avancarDia();
                                    toast.success('Avançou 1 dia.', { description: 'Veja quem entrou nas oportunidades de hoje.' });
                                }}
                            >
                                <CalendarPlus data-icon="inline-start" />
                                {' '}
                                Avançar 1 dia
                            </Button>
                        </ItemActions>
                    </Item>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() =>
                            toast('Restaurar os dados de exemplo?', {
                                description: 'O que você registrou na demonstração será apagado.',
                                action: {
                                    label: 'Restaurar',
                                    onClick: () =>
                                    {
                                        s.restaurar();
                                        toast.success('Dados de exemplo restaurados.');
                                    },
                                },
                            })}
                    >
                        <RotateCcw data-icon="inline-start" />
                        {' '}
                        Restaurar dados de exemplo
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

/**
 * @summary
 * Cartão com os dados da loja, editados num rascunho e salvos pelo botão.
 *
 * @returns O formulário "Minha loja".
 */
function MinhaLoja()
{
    const l = useLoja();
    const atualizar = useFregues(s => s.atualizarLoja);
    const [d, setD] = useState({ nome: l.nome, dono: l.dono, de: l.de, tel: l.tel });
    const mudou = d.nome !== l.nome || d.dono !== l.dono || d.de !== l.de || d.tel !== l.tel;
    const valido = !!(d.nome.trim() && d.dono.trim() && d.de.trim());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Minha loja</CardTitle>
            </CardHeader>
            <CardContent>
                <FieldGroup className="grid grid-cols-2 gap-3">
                    <Field className="col-span-2">
                        <FieldLabel htmlFor="loja-nome">Nome da loja</FieldLabel>
                        <Input id="loja-nome" value={d.nome} onChange={e => setD({ ...d, nome: e.target.value })} />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="loja-dono">Seu nome</FieldLabel>
                        <Input id="loja-dono" value={d.dono} onChange={e => setD({ ...d, dono: e.target.value })} />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="loja-tel">WhatsApp da loja</FieldLabel>
                        <Input
                            id="loja-tel"
                            type="tel"
                            inputMode="tel"
                            placeholder="(44) 99999-0000"
                            {...campoMascarado(d.tel, mascaraTelefone, tel => setD({ ...d, tel }))}
                        />
                    </Field>
                    <Field className="col-span-2">
                        <FieldLabel htmlFor="loja-de">Nas mensagens: “Aqui é…”</FieldLabel>
                        <Input id="loja-de" value={d.de} onChange={e => setD({ ...d, de: e.target.value })} />
                    </Field>
                </FieldGroup>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    disabled={!mudou || !valido}
                    onClick={() =>
                    {
                        atualizar({ nome: d.nome.trim(), dono: d.dono.trim(), de: d.de.trim(), tel: d.tel.trim() });
                        toast.success('Dados da loja salvos.');
                    }}
                >
                    {mudou ? 'Salvar alterações' : 'Tudo salvo'}
                </Button>
            </CardFooter>
        </Card>
    );
}
