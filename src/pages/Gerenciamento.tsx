import { Link, useLocation, useSearchParams } from 'react-router';
import { PackagePlus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EstadoListagem } from '@/lib/listagem';
import { Clientes } from '@/pages/Clientes';
import { Produtos } from '@/pages/Produtos';

/**
 * @summary
 * Central de clientes e produtos, com a aba e os critérios de cada lista mantidos na URL.
 *
 * @returns A tela Gerenciamento com o seletor de abas e a ação de cadastro correspondente.
 */
export function Gerenciamento()
{
    const [params, setParams] = useSearchParams();
    const location = useLocation();
    const aba = params.get('aba') === 'produtos' ? 'produtos' : 'clientes';
    const produtos = aba === 'produtos';
    const estadoDetalhe: EstadoListagem = {
        retornoLista: {
            to: `${location.pathname}${location.search}`,
            chave: location.key,
            estado: location.state as EstadoListagem | null,
        },
    };

    return (
        <div className="flex flex-col gap-3">
            <header className="mb-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="font-heading text-xl font-semibold tracking-tight">Gerenciamento</h1>
                    <p className="text-sm text-muted-foreground">Clientes e produtos em um só lugar.</p>
                </div>
                <Button asChild variant="outline" size="icon" className="size-11 shrink-0 rounded-full">
                    <Link
                        to={produtos ? '/produtos/novo' : '/vender?novo=1'}
                        state={produtos ? estadoDetalhe : undefined}
                        aria-label={produtos ? 'Novo produto' : 'Novo cliente'}
                    >
                        {produtos ? <PackagePlus className="size-5" aria-hidden="true" /> : <UserPlus className="size-5" aria-hidden="true" />}
                    </Link>
                </Button>
            </header>

            <Tabs
                value={aba}
                onValueChange={(valor) =>
                {
                    const p = new URLSearchParams(params);
                    if (valor === 'produtos') p.set('aba', valor);
                    else p.delete('aba');
                    setParams(p, { replace: true });
                }}
            >
                <TabsList className="w-full" aria-label="Gerenciar clientes ou produtos">
                    <TabsTrigger value="clientes">Clientes</TabsTrigger>
                    <TabsTrigger value="produtos">Produtos</TabsTrigger>
                </TabsList>
                <TabsContent value="clientes" className="mt-2"><Clientes /></TabsContent>
                <TabsContent value="produtos" className="mt-2"><Produtos /></TabsContent>
            </Tabs>
        </div>
    );
}
