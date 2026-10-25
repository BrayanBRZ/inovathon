import { useState } from 'react';
import { Link } from 'react-router';
import { Gift, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { brl, ddmm, somarDias } from '@/domain/formato';
import { premioTxt } from '@/domain/mensagens';
import type { Regra, TipoRecompensa } from '@/domain/tipos';
import { TOM_SUPERFICIE } from '@/lib/estados';
import { cn } from '@/lib/utils';
import { useFregues, useHoje, useLoja } from '@/store/useFregues';

type Qual = 'regraSegunda' | 'regraSumido';

const TIPOS: { id: TipoRecompensa; rotulo: string; valor: string }[] = [
    { id: 'cashback', rotulo: 'Crédito para voltar', valor: 'Crédito da compra' },
    { id: 'brinde', rotulo: 'Brinde', valor: 'Qual brinde' },
    { id: 'entrega', rotulo: 'Entrega grátis', valor: 'Valor' },
    { id: 'desconto', rotulo: 'Desconto', valor: 'Desconto' },
];

/**
 * @summary
 * Regras de recompensa da loja: segunda compra e clientes sumidos.
 *
 * @returns A tela Recompensas.
 */
export function Recompensas()
{
    const l = useLoja();
    return (
        <div className="flex flex-col gap-3">
            <header className="mb-1">
                <h1 className="font-heading text-xl font-semibold tracking-tight">Recompensas</h1>
                <p className="text-sm text-muted-foreground">Um motivo a mais para voltar.</p>
            </header>

            <FormRegra
                qual="regraSegunda"
                titulo="Recompensa da 2ª compra"
                descricao="Enviada no comprovante da primeira compra."
                rotuloDias="Validade"
                regra={l.regraSegunda}
            />
            <FormRegra
                qual="regraSumido"
                titulo="Clientes sumidos"
                descricao="Para quem parou de comprar. Depois de uma última tentativa, paramos."
                rotuloDias="Depois de"
                regra={l.regraSumido}
            />

            <Item variant="outline" className="border-glass-border bg-card shadow-glass backdrop-blur-xl">
                <ItemMedia variant="icon">
                    <TrendingUp />
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>O cuidado continua</ItemTitle>
                    <ItemDescription>Pós-venda e lembretes acompanham o cliente até ele voltar.</ItemDescription>
                </ItemContent>
            </Item>

            <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground">
                <Link to="/ajustes#demo">
                    <SlidersHorizontal data-icon="inline-start" />
                    {' '}
                    Modo demonstração
                </Link>
            </Button>
        </div>
    );
}

/**
 * @summary
 * Propriedades de {@link FormRegra}.
 *
 * @property qual - Regra editada.
 * @property titulo - Título do cartão.
 * @property descricao - Explicação curta de quando a recompensa é oferecida.
 * @property rotuloDias - Rótulo do campo de dias ("Validade" ou "Depois de").
 * @property regra - Valores salvos, usados como ponto de partida do rascunho.
 */
interface FormRegraProps
{
    qual: Qual;
    titulo: string;
    descricao: string;
    rotuloDias: string;
    regra: Regra;
}

/**
 * @summary
 * Formulário de uma regra de recompensa, com rascunho local e botão salvar.
 *
 * @remarks
 * O cartão tem altura fixa: a troca de tipo muda só o rótulo e o conteúdo do campo de valor.
 *
 * @param props - Regra, textos e valores salvos.
 * @returns O cartão da regra com a prévia de como o cliente recebe.
 */
function FormRegra({
    qual,
    titulo,
    descricao,
    rotuloDias,
    regra,
}: FormRegraProps)
{
    const salvar = useFregues(s => s.atualizarRegra);
    const [r, setR] = useState(regra);
    const [pct, setPct] = useState(String(regra.pct));
    const [diasTxt, setDiasTxt] = useState(String(regra.dias));
    const tipo = TIPOS.find(t => t.id === r.tipo)!;
    const usaPct = r.tipo === 'cashback' || r.tipo === 'desconto';

    const pctN = Number(pct);
    const diasN = Number(diasTxt);
    const pctInvalido = usaPct && !(pctN >= 1 && pctN <= 50);
    const brindeInvalido = r.tipo === 'brinde' && !r.brinde.trim();
    const diasInvalido = !(diasN >= 5 && diasN <= 365);
    const invalido = pctInvalido || brindeInvalido || diasInvalido;
    const rascunho: Regra = { ...r, pct: usaPct ? pctN : r.pct, dias: diasN, brinde: r.brinde.trim() };
    const mudou = JSON.stringify(rascunho) !== JSON.stringify(regra);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{titulo}</CardTitle>
                <CardDescription>{descricao}</CardDescription>
                <CardAction>
                    <Switch id={`${qual}-ativa`} aria-label={titulo} checked={r.ativa} onCheckedChange={ativa => setR({ ...r, ativa })} />
                </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                <FieldGroup className="grid grid-cols-2 gap-3">
                    <Field className="col-span-2" data-disabled={!r.ativa}>
                        <FieldLabel htmlFor={`${qual}-tipo`}>O que oferecer</FieldLabel>
                        <Select
                            value={r.tipo}
                            onValueChange={t => setR({ ...r, tipo: t as TipoRecompensa })}
                            disabled={!r.ativa}
                        >
                            <SelectTrigger id={`${qual}-tipo`} className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIPOS.map(t => <SelectItem key={t.id} value={t.id}>{t.rotulo}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field data-disabled={!r.ativa} data-invalid={pctInvalido || brindeInvalido}>
                        <FieldLabel htmlFor={`${qual}-valor`}>{tipo.valor}</FieldLabel>
                        {r.tipo === 'brinde'
                            ? (
                                    <Input
                                        id={`${qual}-valor`}
                                        disabled={!r.ativa}
                                        aria-invalid={brindeInvalido}
                                        value={r.brinde}
                                        onChange={e => setR({ ...r, brinde: e.target.value })}
                                    />
                                )
                            : (
                                    <InputGroup>
                                        <InputGroupInput
                                            id={`${qual}-valor`}
                                            inputMode="numeric"
                                            disabled={!r.ativa || !usaPct}
                                            aria-invalid={pctInvalido}
                                            className="tabular-nums"
                                            value={usaPct ? pct : '—'}
                                            onChange={e => setPct(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>%</InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                )}
                        <FieldDescription>{r.tipo === 'brinde' ? 'Um produto da loja.' : usaPct ? 'De 1% a 50%.' : 'Sem valor.'}</FieldDescription>
                    </Field>
                    <Field data-disabled={!r.ativa} data-invalid={diasInvalido}>
                        <FieldLabel htmlFor={`${qual}-dias`}>{rotuloDias}</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                id={`${qual}-dias`}
                                inputMode="numeric"
                                disabled={!r.ativa}
                                aria-invalid={diasInvalido}
                                className="tabular-nums"
                                value={diasTxt}
                                onChange={e => setDiasTxt(e.target.value.replace(/\D/g, ''))}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>dias</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                        <FieldDescription>{qual === 'regraSumido' ? 'De 5 a 365. Respeita também o ritmo do cliente.' : 'De 5 a 365. O convite chega antes de vencer.'}</FieldDescription>
                    </Field>
                </FieldGroup>

                <Previa qual={qual} r={invalido ? regra : rascunho} />
            </CardContent>

            <CardFooter>
                <Button
                    className="w-full"
                    disabled={!mudou || invalido}
                    onClick={() =>
                    {
                        salvar(qual, rascunho);
                        toast.success('Alterações salvas.', {
                            description: `${titulo}: ${rascunho.ativa ? premioTxt(rascunho) : 'desligada'}.`,
                        });
                    }}
                >
                    {mudou ? 'Salvar alterações' : 'Tudo salvo'}
                </Button>
            </CardFooter>
        </Card>
    );
}

/**
 * @summary
 * Prévia de como o cliente recebe a recompensa. Altura fixa: o texto muda, o bloco não.
 *
 * @param props - Regra exibida (o rascunho válido ou, se inválido, a regra salva).
 * @returns Um `Item` com a mensagem resumida.
 */
function Previa({ qual, r }: { qual: Qual; r: Regra })
{
    const l = useLoja();
    const hoje = useHoje();
    const exemplo = l.produtos[0]?.preco ?? 100;
    const ganho
        = r.tipo === 'cashback'
            ? `Você ganhou ${brl((exemplo * r.pct) / 100)}`
            : r.tipo === 'brinde'
                ? `Você ganha ${r.brinde || 'um brinde'}`
                : r.tipo === 'entrega'
                    ? 'Você ganha entrega grátis'
                    : `Você ganha ${r.pct}% de desconto`;
    const quando = qual === 'regraSegunda'
        ? `Na sua 2ª compra. Válido até ${ddmm(somarDias(hoje, r.dias))}`
        : 'Na sua próxima compra. Válido por 30 dias';

    return (
        <Item variant="muted" data-tom={r.ativa ? 'warning' : undefined} className={cn('h-24', r.ativa && TOM_SUPERFICIE.warning)}>
            <ItemMedia variant="icon">
                <Gift />
            </ItemMedia>
            <ItemContent className="min-w-0">
                <ItemDescription className={cn('line-clamp-1 text-xs', r.ativa && 'text-current opacity-80')}>Como o cliente recebe</ItemDescription>
                <ItemTitle className="w-full truncate text-base">{r.ativa ? ganho : 'Recompensa desligada'}</ItemTitle>
                <ItemDescription className={cn('line-clamp-1', r.ativa && 'text-current opacity-80')}>
                    {r.ativa ? quando : 'Ligue para oferecer um motivo para voltar.'}
                </ItemDescription>
            </ItemContent>
        </Item>
    );
}
