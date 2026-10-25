import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { parseValor, valorParaCampo } from '@/domain/formato';
import { novoId } from '@/domain/operacoes';
import type { Produto as TProduto } from '@/domain/tipos';
import { produtoEmUso, useFregues, useLoja } from '@/store/useFregues';

/**
 * @summary
 * Cadastro ou edição de um produto (`/ajustes/produtos/:id`, com `novo` para cadastrar).
 *
 * @remarks
 * Redireciona para Ajustes quando o produto da URL não existe na loja atual.
 *
 * @returns A tela do produto.
 */
export function Produto()
{
    const { id } = useParams();
    const l = useLoja();
    const existente = l.produtos.find(p => p.id === id);
    if (id !== 'novo' && !existente) return <Navigate to="/ajustes" replace />;
    return (
        <Form
            key={id}
            inicial={existente ?? {
                id: novoId('p'),
                nome: '',
                preco: 0,
                ciclo: 30,
                msg: '',
                dica: '',
            }}
            novo={!existente}
        />
    );
}

/**
 * @summary
 * Propriedades de {@link Form}.
 *
 * @property inicial - Valores iniciais do rascunho (o produto existente ou um novo em branco).
 * @property novo - Verdadeiro ao cadastrar; falso ao editar.
 */
interface FormProps
{
    inicial: TProduto;
    novo: boolean;
}

/**
 * @summary
 * Formulário do produto com rascunho local; salva ou remove com aviso de confirmação.
 *
 * @param props - Valores iniciais e modo de cadastro ou edição.
 * @returns O formulário com os botões de salvar e remover.
 */
function Form({ inicial, novo }: FormProps)
{
    const l = useLoja();
    const { salvarProduto, removerProduto } = useFregues();
    const navigate = useNavigate();
    const [p, setP] = useState(inicial);
    const [preco, setPreco] = useState(inicial.preco ? valorParaCampo(inicial.preco) : '');
    const [ciclo, setCiclo] = useState(String(inicial.ciclo));
    const emUso = !novo && produtoEmUso(l, p.id);

    const erro
        = !p.nome.trim()
            ? 'Informe o nome do produto.'
            : parseValor(preco) <= 0
                ? 'Informe o preço.'
                : !(Number(ciclo) >= 1 && Number(ciclo) <= 730)
                        ? 'Informe em quantos dias o cliente costuma voltar.'
                        : !p.msg.trim()
                                ? 'Escreva o lembrete.'
                                : null;

    return (
        <div className="flex flex-col gap-3">
            <Button asChild variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground">
                <Link to="/ajustes">
                    <ChevronLeft data-icon="inline-start" />
                    {' '}
                    Ajustes
                </Link>
            </Button>
            <header className="mb-1">
                <h1 className="font-heading text-xl font-semibold tracking-tight">{novo ? 'Novo produto' : 'Editar produto'}</h1>
                <p className="text-sm text-muted-foreground">Preço, prazo de recompra e o que o Freguês diz ao cliente.</p>
            </header>

            <Card>
                <CardContent>
                    <form
                        id="form-produto"
                        onSubmit={(e) =>
                        {
                            e.preventDefault();
                            if (erro) return;
                            salvarProduto({
                                ...p,
                                nome: p.nome.trim(),
                                msg: p.msg.trim(),
                                dica: p.dica.trim(),
                                preco: parseValor(preco),
                                ciclo: Number(ciclo),
                            });
                            toast.success(novo ? 'Produto cadastrado.' : 'Produto salvo.');
                            navigate('/ajustes');
                        }}
                    >
                        <FieldGroup className="grid grid-cols-2 gap-4">
                            <Field className="col-span-2">
                                <FieldLabel htmlFor="p-nome">Nome</FieldLabel>
                                <Input id="p-nome" value={p.nome} onChange={e => setP({ ...p, nome: e.target.value })} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="p-preco">Preço</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText>R$</InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput id="p-preco" inputMode="decimal" className="tabular-nums" value={preco} onChange={e => setPreco(e.target.value)} />
                                </InputGroup>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="p-ciclo">Volta a cada</FieldLabel>
                                <InputGroup>
                                    <InputGroupInput
                                        id="p-ciclo"
                                        inputMode="numeric"
                                        className="tabular-nums"
                                        value={ciclo}
                                        onChange={e => setCiclo(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <InputGroupAddon align="inline-end">
                                        <InputGroupText>dias</InputGroupText>
                                    </InputGroupAddon>
                                </InputGroup>
                            </Field>
                            <Field className="col-span-2">
                                <FieldLabel htmlFor="p-msg">Lembrete</FieldLabel>
                                <Textarea
                                    id="p-msg"
                                    className="h-24 resize-none"
                                    value={p.msg}
                                    onChange={e => setP({ ...p, msg: e.target.value })}
                                    placeholder="Seu gás deve estar acabando. Quer que a gente leve hoje?"
                                />
                                <FieldDescription>Vem depois de “Oi, Maria! Aqui é da loja.”</FieldDescription>
                            </Field>
                            <Field className="col-span-2">
                                <FieldLabel htmlFor="p-dica">Dica de uso (opcional)</FieldLabel>
                                <Textarea id="p-dica" className="h-24 resize-none" value={p.dica} onChange={e => setP({ ...p, dica: e.target.value })} />
                                <FieldDescription>Enviada uma semana depois da primeira compra.</FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>

            <p className="flex h-5 items-center justify-center text-sm text-muted-foreground" aria-live="polite">{erro}</p>
            <Button type="submit" form="form-produto" size="lg" className="w-full" disabled={!!erro}>
                Salvar produto
            </Button>
            {!novo && (
                <>
                    <Button
                        variant="destructive"
                        className="w-full"
                        disabled={emUso}
                        onClick={() =>
                            toast(`Remover ${p.nome}?`, {
                                action: {
                                    label: 'Remover',
                                    onClick: () =>
                                    {
                                        removerProduto(p.id);
                                        toast.success('Produto removido.');
                                        navigate('/ajustes');
                                    },
                                },
                            })}
                    >
                        <Trash2 data-icon="inline-start" />
                        {' '}
                        Remover produto
                    </Button>
                    <p className="flex h-5 items-center justify-center text-center text-xs text-muted-foreground">
                        {emUso ? 'Já tem vendas registradas, por isso não pode ser removido.' : ''}
                    </p>
                </>
            )}
        </div>
    );
}
