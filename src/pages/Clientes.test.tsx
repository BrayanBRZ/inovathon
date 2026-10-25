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
import { Clientes } from './Clientes';

vi.mock('@/store/useFregues', () => ({
    useHoje: vi.fn(),
    useLoja: vi.fn(),
}));

const HOJE = '2026-10-24';
let loja: Loja;

beforeEach(() =>
{
    loja = lojasExemplo(HOJE).gas;
    vi.mocked(useHoje).mockReturnValue(HOJE);
    vi.mocked(useLoja).mockReturnValue(loja);
});

function renderLista(consulta = ''): string
{
    return renderToStaticMarkup(
        <MemoryRouter initialEntries={[`/clientes${consulta}`]}>
            <Clientes />
        </MemoryRouter>,
    );
}

function nomesExibidos(html: string): string[]
{
    return [...html.matchAll(/href="\/clientes\/([^"]+)"/g)]
        .map(m => loja.clientes.find(c => c.id === m[1])!.nome);
}

describe('busca e filtros de clientes', () =>
{
    it('identifica os campos de busca e o filtro por status', () =>
    {
        const html = renderLista();
        expect(html).toContain('placeholder="Nome, CPF ou número de telefone"');
        expect(html).toContain('Filtrar clientes por status');
        expect(html).toContain('Todos os clientes (10)');
        expect(nomesExibidos(html)).toHaveLength(10);
    });

    it.each([
        ['novos', ['Marcos Vieira', 'Fernanda Costa', 'Lucas Andrade']],
        ['emdia', ['Bar do Tião', 'Paulo Henrique']],
        ['perto', ['Dona Maria Aparecida']],
        ['atrasado', ['Cláudia Ferreira']],
        ['sumido', ['Seu Jorge Batista', 'Edna Souza']],
        ['retornou', ['Rosângela Lima']],
        ['voltar', ['Dona Maria Aparecida', 'Cláudia Ferreira', 'Seu Jorge Batista', 'Edna Souza']],
    ])('filtra %s pelo status apresentado ao usuário', (filtro, nomes) =>
    {
        expect(nomesExibidos(renderLista(`?filtro=${filtro}`)).sort()).toEqual([...nomes].sort());
    });

    it('combina o status com a busca por nome', () =>
    {
        expect(nomesExibidos(renderLista('?filtro=novos&q=Fernanda'))).toEqual(['Fernanda Costa']);
        expect(nomesExibidos(renderLista('?filtro=sumido&q=Fernanda'))).toEqual([]);
    });

    it('encontra CPF e telefone com ou sem formatação', () =>
    {
        const cliente = loja.clientes[0];
        cliente.cpf = '123.456.789-09';
        for (const q of ['12345678909', cliente.cpf, cliente.tel, cliente.tel.replace(/\D/g, '')])
        {
            expect(nomesExibidos(renderLista(`?q=${encodeURIComponent(q)}`))).toEqual([cliente.nome]);
        }
    });

    it('usa todos os clientes para um filtro desconhecido e permite limpar os critérios', () =>
    {
        expect(nomesExibidos(renderLista('?filtro=inexistente'))).toHaveLength(10);
        const html = renderLista('?filtro=novos&q=sem-resultado');
        expect(html).toContain('Nenhum cliente encontrado');
        expect(html).toContain('Limpar');
    });
});
