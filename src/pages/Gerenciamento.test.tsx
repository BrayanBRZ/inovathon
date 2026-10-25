import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { lojasExemplo } from '@/data/seed';
import type { Loja } from '@/domain/tipos';
import { useHoje, useLoja } from '@/store/useFregues';
import { Gerenciamento } from './Gerenciamento';

vi.mock('@/store/useFregues', () => ({
    useHoje: vi.fn(),
    useLoja: vi.fn(),
}));

const HOJE = '2026-10-25';
let loja: Loja;

beforeEach(() =>
{
    loja = lojasExemplo(HOJE).gas;
    vi.mocked(useHoje).mockReturnValue(HOJE);
    vi.mocked(useLoja).mockReturnValue(loja);
});

function render(consulta = ''): string
{
    return renderToStaticMarkup(
        <MemoryRouter initialEntries={[`/clientes${consulta}`]}>
            <Gerenciamento />
        </MemoryRouter>,
    );
}

function produtosExibidos(html: string): string[]
{
    return [...html.matchAll(/href="\/produtos\/([^"]+)"/g)]
        .map(m => loja.produtos.find(p => p.id === m[1])?.nome)
        .filter((nome): nome is string => !!nome);
}

describe('gerenciamento de clientes e produtos', () =>
{
    it('abre clientes por padrão com acesso ao cadastro e às duas abas', () =>
    {
        const html = render();
        expect(html).toContain('Gerenciamento</h1>');
        expect(html).toContain('Gerenciar clientes ou produtos');
        expect(html).toContain('aria-label="Novo cliente"');
        expect(html).toContain('Buscar cliente por nome, CPF ou número de telefone');
        expect(produtosExibidos(html)).toEqual([]);
    });

    it('mostra o catálogo e o cadastro de produtos sem aplicar os filtros de clientes', () =>
    {
        const html = render('?aba=produtos&q=sem-cliente&filtro=sumido');
        expect(html).toContain('aria-label="Novo produto"');
        expect(html).toContain('href="/produtos/novo"');
        expect(html).toContain('Buscar produto por nome');
        expect(produtosExibidos(html)).toEqual(loja.produtos.map(p => p.nome).sort((a, b) => a.localeCompare(b, 'pt-BR')));
    });

    it('busca produtos sem diferenciar maiúsculas e mantém estado vazio quando não encontra', () =>
    {
        const nome = loja.produtos[0].nome;
        expect(produtosExibidos(render(`?aba=produtos&produto=${encodeURIComponent(nome.toUpperCase())}`))).toEqual([nome]);
        const html = render('?aba=produtos&produto=sem-produto');
        expect(produtosExibidos(html)).toEqual([]);
        expect(html).toContain('Nenhum produto encontrado');
        expect(html).toContain('Limpar');
    });

    it.each(['preco', 'ciclo'] as const)('ordena produtos por %s', (campo) =>
    {
        const esperados = [...loja.produtos].sort((a, b) => a[campo] - b[campo] || a.nome.localeCompare(b.nome, 'pt-BR'));
        expect(produtosExibidos(render(`?aba=produtos&ordem=${campo}`))).toEqual(esperados.map(p => p.nome));
    });

    it('orienta o cadastro quando a loja não tem produtos', () =>
    {
        loja.produtos = [];
        const html = render('?aba=produtos');
        expect(html).toContain('Nenhum produto cadastrado');
        expect(html).toContain('Use o botão de adicionar para cadastrar o primeiro produto da loja.');
    });
});
