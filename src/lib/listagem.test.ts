import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { type Location, useLocation, useNavigate } from 'react-router';
import { type EstadoListagem, useLotes, useRetornoLista } from './listagem';

vi.mock('react-router', () => ({ useLocation: vi.fn(), useNavigate: vi.fn() }));

let location: Location<EstadoListagem | null>;
const navegar = vi.fn();

beforeEach(() =>
{
    location = {
        pathname: '/clientes',
        search: '?filtro=voltar',
        hash: '',
        key: 'lista',
        state: null,
    };
    navegar.mockReset();
    navegar.mockImplementation((_to, options) =>
    {
        location = { ...location, state: options.state };
    });
    vi.mocked(useLocation).mockImplementation(() => location);
    vi.mocked(useNavigate).mockReturnValue(navegar);
});

describe('exibição por lotes', () =>
{
    it('acrescenta 20 itens por vez até alcançar o total, sem empilhar páginas no histórico', () =>
    {
        expect(useLotes(45, 'gas:clientes').exibidos).toBe(20);
        useLotes(45, 'gas:clientes').carregarMais();
        expect(useLotes(45, 'gas:clientes').exibidos).toBe(40);
        expect(navegar).toHaveBeenLastCalledWith('/clientes?filtro=voltar', expect.objectContaining({ replace: true }));
        useLotes(45, 'gas:clientes').carregarMais();
        expect(useLotes(45, 'gas:clientes')).toMatchObject({ exibidos: 45, temMais: false });
    });

    it.each([0, 1, 20])('não oferece expansão para %i registros', (total) =>
    {
        expect(useLotes(total, 'gas:clientes')).toMatchObject({ exibidos: total, temMais: false });
    });

    it('reinicia quando mudam loja, filtro ou busca e permite limpar critérios locais', () =>
    {
        useLotes(60, 'gas:clientes:todos').carregarMais();
        expect(useLotes(60, 'gas:clientes:todos').exibidos).toBe(40);
        expect(useLotes(60, 'tecidos:clientes:todos').exibidos).toBe(20);
        expect(useLotes(60, 'gas:clientes:novos').exibidos).toBe(20);
        expect(useLotes(60, 'gas:clientes:busca').exibidos).toBe(20);
        useLotes(60, 'gas:clientes:busca').reiniciar();
        expect(useLotes(60, 'gas:clientes:todos').exibidos).toBe(20);
    });

    it('permite lotes menores no histórico e lida com redução do total', () =>
    {
        const chave = 'gas:historico:cliente';
        expect(useLotes(11, chave, 4, 4).exibidos).toBe(4);
        useLotes(11, chave, 4, 4).carregarMais();
        expect(useLotes(11, chave, 4, 4).exibidos).toBe(8);
        expect(useLotes(3, chave, 4, 4)).toMatchObject({ exibidos: 3, temMais: false });
    });

    it('ignora limites inválidos no estado da navegação', () =>
    {
        location.state = { lote: { chave: 'lista', limite: Infinity } };
        expect(useLotes(60, 'lista').exibidos).toBe(20);
    });
});

describe('retorno à lista', () =>
{
    it('recupera filtros, lote e chave da posição ao voltar pelo botão do detalhe', () =>
    {
        useLotes(60, 'gas:clientes').carregarMais();
        const estadoDetalhe = useLotes(60, 'gas:clientes').estadoDetalhe;
        location = {
            ...location,
            pathname: '/clientes/123',
            search: '',
            key: 'detalhe',
            state: estadoDetalhe,
        };
        const retorno = useRetornoLista('/clientes');
        expect(retorno.to).toBe('/clientes?filtro=voltar');
        expect(retorno.state?.restaurarRolagem).toBe('lista');
        location = { ...location, pathname: '/clientes', state: retorno.state };
        expect(useLotes(60, 'gas:clientes').exibidos).toBe(40);
        useLotes(60, 'gas:clientes').carregarMais();
        expect(location.state?.restaurarRolagem).toBeUndefined();
    });

    it('usa a lista padrão quando não há origem ou a origem pertence a outra tela', () =>
    {
        expect(useRetornoLista('/clientes')).toEqual({ to: '/clientes', state: null });
        location.state = useLotes(60, 'lista').estadoDetalhe;
        expect(useRetornoLista('/mensagens')).toEqual({ to: '/mensagens', state: null });
    });
});
