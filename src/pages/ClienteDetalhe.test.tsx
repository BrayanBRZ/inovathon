import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { lojasExemplo } from '@/data/seed';
import type { Loja } from '@/domain/tipos';
import { useHoje, useLoja } from '@/store/useFregues';
import { ClienteDetalhe } from './ClienteDetalhe';

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

function renderCliente(nome: string): string
{
    const cliente = loja.clientes.find(c => c.nome.startsWith(nome))!;
    return renderToStaticMarkup(
        <MemoryRouter initialEntries={[`/clientes/${cliente.id}`]}>
            <Routes>
                <Route path="/clientes/:id" element={<ClienteDetalhe />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('estimativa na ficha do cliente', () =>
{
    it('explica a ausência de estimativa para clientes com uma compra', () =>
    {
        const html = renderCliente('Fernanda');
        expect(html).toMatch(/Estimativa de recompra<\/p><div[^>]*>Sem estimativa/);
        expect(html).toContain('Disponível após compras em dias diferentes.');
        expect(html).toContain('Prazo do produto');
        expect(html).not.toContain('Próxima compra');
        expect(html).toContain('lucide-alarm-clock-off');
        expect(html).toContain('aria-label="Sem estimativa de recompra"');
        expect(html).toMatch(/<svg[^>]*class="[^"]*text-muted-foreground[^>]*aria-label="Sem estimativa/);
    });

    it('destaca em amarelo a estimativa próxima baseada nas compras anteriores', () =>
    {
        const html = renderCliente('Dona Maria');
        expect(html).toMatch(/Estimativa de recompra<\/p><div[^>]*>27\/10/);
        expect(html).toContain('Recompra estimada em 3 dias.');
        expect(html).toContain('Intervalo médio');
        expect(html).toContain('aria-label="Data estimada se aproxima"');
        expect(html).toMatch(/<svg[^>]*class="[^"]*text-warning-foreground/);
    });

    it('mostra a data passada para um cliente sumido, sem usá-lo como valor da estimativa', () =>
    {
        const html = renderCliente('Edna');
        expect(html).toMatch(/Estimativa de recompra<\/p><div[^>]*>24\/09/);
        expect(html).toContain('A data estimada passou há 30 dias.');
        expect(html).toContain('>Sumido</span>');
        expect(html).toContain('aria-label="Cliente sumido: estimativa vencida"');
        expect(html).toMatch(/<svg[^>]*class="[^"]*text-destructive/);
    });

    it('destaca em amarelo quando a estimativa é para hoje', () =>
    {
        vi.mocked(useHoje).mockReturnValue('2026-10-27');
        const html = renderCliente('Dona Maria');
        expect(html).toContain('aria-label="Estimativa para hoje"');
        expect(html).toMatch(/<svg[^>]*class="[^"]*text-warning-foreground/);
        expect(html).toContain('A recompra está estimada para hoje.');
    });

    it('mostra relógio verde quando a estimativa está além da antecedência do lembrete', () =>
    {
        vi.mocked(useHoje).mockReturnValue('2026-10-21');
        const html = renderCliente('Dona Maria');
        expect(html).toContain('aria-label="Data estimada ainda não chegou"');
        expect(html).toMatch(/<svg[^>]*class="[^"]*text-secondary-foreground/);
        expect(html).toContain('Recompra estimada em 6 dias.');
    });

    it('mostra relógio laranja quando a data passou e o cliente ainda não está sumido', () =>
    {
        vi.mocked(useHoje).mockReturnValue('2026-10-28');
        const html = renderCliente('Dona Maria');
        expect(html).toContain('aria-label="Data estimada já passou"');
        expect(html).toMatch(/<svg[^>]*class="[^"]*text-orange-700/);
        expect(html).toContain('A data estimada passou há 1 dia.');
    });

    it('mantém a ausência de estimativa em cinza mesmo para um cliente sumido com uma compra', () =>
    {
        vi.mocked(useHoje).mockReturnValue('2027-01-24');
        const html = renderCliente('Fernanda');
        expect(html).toContain('>Sumido</span>');
        expect(html).toContain('aria-label="Sem estimativa de recompra"');
        expect(html).toContain('Disponível após compras em dias diferentes.');
    });
});
