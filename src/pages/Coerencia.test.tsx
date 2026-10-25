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
import { filaDoDia } from '@/domain/fila';
import { somarDias } from '@/domain/formato';
import { novaRecompensa } from '@/domain/mensagens';
import { enviarMensagem, responder } from '@/domain/operacoes';
import type { Loja } from '@/domain/tipos';
import { useHoje, useLoja } from '@/store/useFregues';
import { Conversa } from './Conversa';
import { Hoje } from './Hoje';
import { Mensagens } from './Mensagens';
import { Vender } from './Vender';

vi.mock('@/store/useFregues', () => ({
    useHoje: vi.fn(),
    useLoja: vi.fn(),
    useFregues: (selector?: (s: { plano: string }) => unknown) => selector ? selector({ plano: 'essencial' }) : {},
    MENSALIDADE: { essencial: 99, completo: 199 },
}));

const HOJE = '2026-10-25';
let loja: Loja;

beforeEach(() =>
{
    loja = lojasExemplo(HOJE).gas;
    vi.mocked(useHoje).mockReturnValue(HOJE);
    vi.mocked(useLoja).mockReturnValue(loja);
});

function render(element: React.ReactElement, url: string, rota: string): string
{
    return renderToStaticMarkup(
        <MemoryRouter initialEntries={[url]}>
            <Routes><Route path={rota} element={element} /></Routes>
        </MemoryRouter>,
    );
}

describe('coerência entre domínio e telas', () =>
{
    it('mostra a cobrança já reduzida pelo desconto concedido', () =>
    {
        const c = loja.clientes.find(c => c.chamar === 'Marcos')!;
        c.recompensa = novaRecompensa(
            { ...loja.regraSegunda, tipo: 'desconto', pct: 10 },
            'segunda',
            115,
            HOJE,
            45,
        );
        const html = render(<Vender />, `/vender?cliente=${c.id}`, '/vender');
        const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        expect(texto).toContain('10% de desconto');
        expect(texto).toMatch(/Cobrar R\$\s*103,50/);
    });

    it('mantém o problema resolvível, sem mensagem preparada nem duplicação em Hoje', () =>
    {
        const c = loja.clientes.find(c => c.chamar === 'Lucas')!;
        const m = enviarMensagem(
            loja,
            c.id,
            'obrigado',
            'Deu tudo certo?',
            HOJE,
            '09:00',
        );
        responder(
            loja,
            m.id,
            'problema',
            HOJE,
            '09:30',
        );
        const dia = somarDias(HOJE, 6);
        vi.mocked(useHoje).mockReturnValue(dia);
        const conversa = render(<Conversa />, `/mensagens/${c.id}`, '/mensagens/:id');
        expect(conversa).toContain('Marcar como resolvido');
        expect(conversa).not.toContain('Enviar agora');
        const inicio = render(<Hoje />, '/', '/');
        expect(inicio.match(/Lucas Andrade/g)).toHaveLength(1);
        expect(inicio).toContain(`Ver todas as ${filaDoDia(loja, dia).length} mensagens preparadas`);
    });

    it('mantém o filtro de problema aberto mesmo após uma mensagem de atendimento', () =>
    {
        const c = loja.clientes.find(c => c.chamar === 'Lucas')!;
        const m = enviarMensagem(
            loja,
            c.id,
            'obrigado',
            'Deu tudo certo?',
            HOJE,
            '09:00',
        );
        responder(
            loja,
            m.id,
            'problema',
            HOJE,
            '09:30',
        );
        enviarMensagem(
            loja,
            c.id,
            'problema',
            'Como posso ajudar?',
            HOJE,
            '10:00',
        );
        const html = render(<Mensagens />, '/mensagens?status=problema', '/mensagens');
        expect(html).toContain('Lucas Andrade');
        expect(html.match(/href="\/mensagens\/gas-7"/g)).toHaveLength(1);
    });
});
