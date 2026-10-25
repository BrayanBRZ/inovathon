import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Children, type ComponentProps } from 'react';
import { MemoryRouter } from 'react-router';
import type { Button } from '@/components/ui/button';
import { lojasExemplo } from '@/data/seed';
import type { Loja, StatusMensagem } from '@/domain/tipos';
import { type Estado, useHoje, useLoja } from '@/store/useFregues';
import { Mensagens } from './Mensagens';

const acoes = vi.hoisted(() => ({
    enviar: vi.fn(),
    disparar: vi.fn(() => 6),
    envios: [] as NonNullable<ComponentProps<typeof Button>['onClick']>[],
}));

vi.mock('@/components/ui/button', async (importOriginal) =>
{
    const original = await importOriginal<typeof import('@/components/ui/button')>();
    return {
        ...original,
        Button: (props: ComponentProps<typeof Button>) =>
        {
            if (props.onClick && Children.toArray(props.children).some(c =>
                typeof c === 'string' && c.startsWith('Enviar')))
                acoes.envios.push(props.onClick);
            return <original.Button {...props} />;
        },
    };
});

vi.mock('@/store/useFregues', () => ({
    useHoje: vi.fn(),
    useLoja: vi.fn(),
    useFregues: (selector: (state: Pick<Estado, 'enviarMensagem' | 'dispararEnvio'>) => unknown) => selector({
        enviarMensagem: acoes.enviar,
        dispararEnvio: acoes.disparar,
    }),
}));

const HOJE = '2026-10-25';
let loja: Loja;

beforeEach(() =>
{
    vi.clearAllMocks();
    acoes.envios = [];
    loja = lojasExemplo(HOJE).gas;
    vi.mocked(useHoje).mockReturnValue(HOJE);
    vi.mocked(useLoja).mockReturnValue(loja);
});

function renderMensagens(consulta = ''): string
{
    return renderToStaticMarkup(
        <MemoryRouter initialEntries={[`/mensagens${consulta}`]}>
            <Mensagens />
        </MemoryRouter>,
    );
}

function nomesExibidos(html: string): string[]
{
    return [...html.matchAll(/href="\/mensagens\/([^"]+)"/g)]
        .map(m => loja.clientes.find(c => c.id === m[1])!.nome);
}

describe('filtros de mensagens', () =>
{
    it('exibe a busca por cliente e o filtro por status em conversas', () =>
    {
        const html = renderMensagens();
        expect(html).toContain('placeholder="Nome, CPF ou número de telefone"');
        expect(html).toContain('Filtrar conversas por status');
        expect(html).toContain('Todos os status');
        expect(html).toContain('Status da última mensagem. Problemas abertos têm prioridade.');
        expect(new Set(nomesExibidos(html)).size).toBe(nomesExibidos(html).length);
    });

    it.each<StatusMensagem>([
        'enviada',
        'gostei',
        'respondeu',
        'problema',
        'voltou',
    ])(
        'filtra a situação %s da última mensagem, ignorando mensagens antigas',
        (status) =>
        {
            const statuses: StatusMensagem[] = [
                'enviada',
                'gostei',
                'respondeu',
                'problema',
                'voltou',
            ];
            loja.mensagens = statuses.map((s, i) => ({
                id: `mensagem-${i}`,
                clienteId: loja.clientes[i].id,
                tipo: 'obrigado',
                data: HOJE,
                hora: '09:00',
                texto: 'Mensagem de exemplo',
                status: s,
            }));
            loja.mensagens.push({
                ...loja.mensagens[0],
                id: 'antiga',
                data: '2026-10-01',
                status: 'problema',
            });
            const html = renderMensagens(`?status=${status}`);
            expect(nomesExibidos(html)).toEqual([loja.clientes[statuses.indexOf(status)].nome]);
        },
    );

    it('combina busca por cliente e status', () =>
    {
        const ultima = loja.mensagens[0];
        const c = loja.clientes.find(c => c.id === ultima.clienteId)!;
        expect(nomesExibidos(renderMensagens(`?status=${ultima.status}&q=${encodeURIComponent(c.nome)}`)))
            .toEqual([c.nome]);
        expect(nomesExibidos(renderMensagens(`?status=${ultima.status}&q=inexistente`))).toEqual([]);
    });

    it('busca por telefone ou CPF formatado e sem pontuação', () =>
    {
        const c = loja.clientes.find(c => c.id === loja.mensagens[0].clienteId)!;
        c.cpf = '123.456.789-09';
        for (const q of [c.cpf, '12345678909', c.tel, c.tel.replace(/\D/g, '')])
            expect(nomesExibidos(renderMensagens(`?q=${encodeURIComponent(q)}`))).toEqual([c.nome]);
    });

    it('filtra programadas por tipo e mantém os filtros das conversas independentes', () =>
    {
        const html = renderMensagens('?aba=programadas&tipo=atrasado&status=problema');
        expect(html).toContain('Filtrar programadas por tipo');
        expect(html).toContain('Lembrete: atrasados (1)');
        expect(nomesExibidos(html)).toEqual(['Cláudia Ferreira']);
        expect(html).toContain('Enviar 1 filtrada agora');
    });

    it('combina busca e tipo na fila e desabilita o envio sem resultados', () =>
    {
        const html = renderMensagens('?aba=programadas&tipo=atrasado&q=inexistente');
        expect(nomesExibidos(html)).toEqual([]);
        expect(html).toContain('Nenhuma programada encontrada');
        expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Enviar 0 filtradas agora/);
        expect(html).toContain('Limpar');
    });

    it('envia somente os resultados filtrados e mantém o restante da fila fora do envio', () =>
    {
        renderMensagens('?aba=programadas&tipo=atrasado');
        const cliente = loja.clientes.find(c => c.nome === 'Cláudia Ferreira')!;
        acoes.envios[0]({} as Parameters<typeof acoes.envios[number]>[0]);
        expect(acoes.disparar).not.toHaveBeenCalled();
        expect(acoes.enviar).toHaveBeenCalledTimes(1);
        expect(acoes.enviar).toHaveBeenCalledWith(cliente.id, 'atrasado', expect.any(String));
    });

    it('mantém o envio de toda a fila quando não há filtros ativos', () =>
    {
        renderMensagens('?aba=programadas');
        acoes.envios[0]({} as Parameters<typeof acoes.envios[number]>[0]);
        expect(acoes.disparar).toHaveBeenCalledOnce();
        expect(acoes.enviar).not.toHaveBeenCalled();
    });

    it('ignora critérios desconhecidos e mostra o estado vazio sem filtros', () =>
    {
        expect(nomesExibidos(renderMensagens('?status=inexistente')))
            .toEqual(nomesExibidos(renderMensagens()));
        expect(nomesExibidos(renderMensagens('?aba=programadas&tipo=inexistente')))
            .toEqual(nomesExibidos(renderMensagens('?aba=programadas')));
        loja.mensagens = [];
        expect(renderMensagens()).toContain('Nenhuma conversa ainda');
    });
});
