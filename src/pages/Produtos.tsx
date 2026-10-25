import { Link, useSearchParams } from 'react-router';
import {
    ArrowDownWideNarrow,
    ChevronRight,
    Package,
    Search,
    X,
} from 'lucide-react';
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
import { brl, dias } from '@/domain/formato';
import { useLotes } from '@/lib/listagem';
import { cn } from '@/lib/utils';
import { useLoja } from '@/store/useFregues';

/**
 * @summary
 * Catálogo de produtos da loja, com busca, ordenação e acesso ao cadastro existente.
 *
 * @remarks
 * Usa parâmetros próprios para preservar os critérios da aba Clientes ao alternar entre as listas.
 *
 * @returns A listagem de produtos com preço e prazo de recompra.
 */
export function Produtos()
{
    const loja = useLoja();
    const [params, setParams] = useSearchParams();
    const busca = params.get('produto') ?? '';
    const ordem = (['nome', 'preco', 'ciclo'] as const).find(o => o === params.get('ordem')) ?? 'nome';
    const temFiltro = !!busca || ordem !== 'nome';
    const q = busca.trim().toLocaleLowerCase('pt-BR');
    const lista = loja.produtos
        .filter(p => !q || p.nome.toLocaleLowerCase('pt-BR').includes(q))
        .sort((a, b) => (ordem === 'preco' ? a.preco - b.preco : ordem === 'ciclo' ? a.ciclo - b.ciclo : 0)
            || a.nome.localeCompare(b.nome, 'pt-BR'));
    const lotes = useLotes(lista.length, JSON.stringify([loja.id, 'produtos', busca, ordem]));

    function muda(chave: string, valor: string)
    {
        const p = new URLSearchParams(params);
        if (valor) p.set(chave, valor);
        else p.delete(chave);
        setParams(p, { replace: true });
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                <InputGroup className="rounded-full">
                    <InputGroupAddon className="pl-3.5"><Search /></InputGroupAddon>
                    <InputGroupInput
                        type="search"
                        aria-label="Buscar produto por nome"
                        placeholder="Nome do produto"
                        autoComplete="off"
                        value={busca}
                        onChange={e => muda('produto', e.target.value)}
                    />
                </InputGroup>
                <Select value={ordem} onValueChange={v => muda('ordem', v === 'nome' ? '' : v)}>
                    <SelectTrigger aria-label="Ordenar produtos" className="h-10! w-full *:data-[slot=select-value]:flex-1">
                        <ArrowDownWideNarrow className="size-4 text-muted-foreground" aria-hidden />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                        <SelectItem value="nome">Nome: A a Z</SelectItem>
                        <SelectItem value="preco">Menor preço</SelectItem>
                        <SelectItem value="ciclo">Menor prazo de recompra</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 pt-1">
                <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
                    <span className="truncate">Todos os produtos</span>
                    <Badge variant="secondary">{lista.length}</Badge>
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
                        p.delete('produto');
                        p.delete('ordem');
                        setParams(p, { replace: true });
                    }}
                >
                    <X data-icon="inline-start" />
                    Limpar
                </Button>
                <p className="col-span-2 line-clamp-2 h-8 text-xs leading-4 text-muted-foreground">
                    Preço e prazo inicial de recompra. Com o histórico, o Freguês aprende o ritmo de cada cliente.
                </p>
            </div>

            {lista.length === 0
                ? (
                        <Empty className="bg-card shadow-glass ring-1 ring-glass-border backdrop-blur-xl">
                            <EmptyHeader>
                                <EmptyMedia variant="icon"><Package /></EmptyMedia>
                                <EmptyTitle>{busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</EmptyTitle>
                                <EmptyDescription>
                                    {busca ? 'Tente outro nome ou limpe a busca.' : 'Use o botão de adicionar para cadastrar o primeiro produto da loja.'}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    )
                : (
                        <Card className="py-0">
                            <ItemGroup className="gap-0!">
                                {lista.slice(0, lotes.exibidos).map((p, i) => (
                                    <div key={p.id} role="listitem">
                                        {i > 0 && <ItemSeparator className="my-0" />}
                                        <Item asChild size="sm" className="rounded-none px-4 py-3.5">
                                            <Link to={`/produtos/${p.id}`} state={lotes.estadoDetalhe}>
                                                <ItemMedia variant="icon"><Package aria-hidden /></ItemMedia>
                                                <ItemContent className="min-w-0">
                                                    <ItemTitle className="w-full truncate">{p.nome}</ItemTitle>
                                                    <ItemDescription className="line-clamp-1 text-xs tabular-nums">
                                                        {`${brl(p.preco)} · recompra a cada ${dias(p.ciclo)}`}
                                                    </ItemDescription>
                                                </ItemContent>
                                                <ItemActions><ChevronRight className="size-4 text-muted-foreground" aria-hidden /></ItemActions>
                                            </Link>
                                        </Item>
                                    </div>
                                ))}
                            </ItemGroup>
                        </Card>
                    )}
            {lista.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p role="status" className="text-center text-xs text-muted-foreground">
                        {`${lotes.exibidos} de ${lista.length} produtos`}
                    </p>
                    {lotes.temMais && (
                        <Button variant="outline" className="w-full rounded-full" onClick={lotes.carregarMais}>
                            Carregar mais produtos
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
