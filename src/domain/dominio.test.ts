import { describe, expect, it } from 'vitest';
import { lojasExemplo } from '@/data/seed';
import { filaDoDia } from './fila';
import { parseValor, somarDias, waUrl } from './formato';
import { textoMensagem } from './mensagens';
import {
    dispararEnvio,
    enviarMensagem,
    registrarVenda,
    responder,
} from './operacoes';
import { situacao } from './recorrencia';
import { numerosDaLoja, serieRecuperado } from './resultados';
import type { Loja } from './tipos';

const HOJE = '2026-10-24';
/** toLocaleString separa "R$" do número com espaço sem quebra. */
const txt = (s?: string) => (s ?? '').replace(/\u00a0/g, ' ');

function gas(): Loja
{
    return lojasExemplo(HOJE).gas;
}
function cli(l: Loja, nome: string)
{
    return l.clientes.find(c => c.nome.startsWith(nome))!;
}
function sit(l: Loja, nome: string, hoje = HOJE)
{
    return situacao(cli(l, nome), l.produtos, l.regraSumido, hoje);
}

describe('motor de recorrência', () =>
{
    it('Lucas, 1 dia depois da primeira compra, recebe o pós-venda', () =>
    {
        expect(sit(gas(), 'Lucas')).toMatchObject({ est: 'novo', etapa: 'obrigado', media: 40 });
    });

    it('Marcos, 37 dias depois de um P13, recebe o convite da 2ª compra com o cashback', () =>
    {
        const l = gas();
        const s = sit(l, 'Marcos');
        expect(s).toMatchObject({ est: 'novo', etapa: 'segunda' });
        const t = txt(textoMensagem(
            cli(l, 'Marcos'),
            l,
            'segunda',
            s,
            HOJE,
        ));
        expect(t).toContain('R$ 5,75 de cashback');
        expect(t).toContain('até 01/11');
    });

    it('aprende o intervalo médio entre compras', () =>
    {
        expect(sit(gas(), 'Dona Maria')).toMatchObject({ media: 40, desde: 37, est: 'perto', aprendido: true });
    });

    it('não estima a recompra com apenas uma compra, mesmo conhecendo o prazo do produto', () =>
    {
        expect(sit(gas(), 'Fernanda')).toMatchObject({ media: 15, aprendido: false, proxima: null });
    });

    it('continua sem estimativa quando um cliente de uma compra só fica sumido', () =>
    {
        expect(sit(gas(), 'Marcos', somarDias(HOJE, 30))).toMatchObject({
            est: 'sumido',
            aprendido: false,
            proxima: null,
        });
    });

    it('estima a recompra pelo histórico, mesmo se as compras estiverem fora de ordem', () =>
    {
        const l = gas();
        cli(l, 'Dona Maria').compras.reverse();
        expect(sit(l, 'Dona Maria').proxima).toBe(somarDias(HOJE, 3));
    });

    it('preserva a data estimada de um cliente sumido, mesmo quando ela já passou', () =>
    {
        expect(sit(gas(), 'Edna')).toMatchObject({
            est: 'sumido',
            aprendido: true,
            proxima: somarDias(HOJE, -30),
        });
    });

    it('passa a estimar a recompra após o registro da segunda compra', () =>
    {
        const l = gas();
        const marcos = cli(l, 'Marcos');
        expect(sit(l, 'Marcos').proxima).toBeNull();
        registrarVenda(l, { clienteId: marcos.id, produtoId: 'p13', valor: 115 }, HOJE, '11:00');
        expect(sit(l, 'Marcos')).toMatchObject({ aprendido: true, proxima: somarDias(HOJE, 37) });
    });

    it('Edna, 65 dias sem comprar, está sumida', () =>
    {
        expect(sit(gas(), 'Edna').est).toBe('sumido');
    });

    it('passou de 1,25 vez o intervalo: atrasado', () =>
    {
        expect(sit(gas(), 'Dona Maria', somarDias(HOJE, 14)).est).toBe('atrasado');
    });
});

describe('fila do dia', () =>
{
    it('não repete a mesma mensagem nem manda dois lembretes na mesma semana', () =>
    {
        const l = gas();
        const antes = filaDoDia(l, HOJE).map(x => x.cliente.chamar);
        expect(antes).toEqual(expect.arrayContaining([
            'Lucas',
            'Marcos',
            'Dona Maria',
            'Seu Jorge',
            'Edna',
        ]));
        expect(antes).not.toContain('Fernanda'); // a dica já foi ontem
        expect(antes).not.toContain('Rosângela'); // em dia

        dispararEnvio(l, HOJE);
        expect(filaDoDia(l, HOJE)).toHaveLength(0);

        // Seis dias depois Dona Maria está atrasada, mas recebeu lembrete há menos de uma semana.
        const depois = somarDias(HOJE, 6);
        expect(sit(l, 'Dona Maria', somarDias(HOJE, 14)).est).toBe('atrasado');
        expect(filaDoDia(l, depois).map(x => x.cliente.chamar)).not.toContain('Dona Maria');
        expect(filaDoDia(l, somarDias(HOJE, 14)).map(x => x.cliente.chamar)).toContain('Dona Maria');
    });

    it('sumido recebe no máximo duas tentativas, com 30 dias entre elas', () =>
    {
        const l = gas();
        const edna = cli(l, 'Edna');
        enviarMensagem(
            l,
            edna.id,
            'sumido',
            'oi',
            HOJE,
            '09:00',
        );
        const naFila = (dia: string) => filaDoDia(l, dia).some(x => x.cliente.id === edna.id);
        expect(naFila(somarDias(HOJE, 10))).toBe(false);
        expect(naFila(somarDias(HOJE, 30))).toBe(true);
        enviarMensagem(
            l,
            edna.id,
            'sumido',
            'oi',
            somarDias(HOJE, 30),
            '09:00',
        );
        expect(naFila(somarDias(HOJE, 90))).toBe(false);
    });

    it('reativação dá a recompensa de sumido ao cliente', () =>
    {
        const l = gas();
        const edna = cli(l, 'Edna');
        enviarMensagem(
            l,
            edna.id,
            'sumido',
            'oi',
            HOJE,
            '09:00',
        );
        expect(edna.recompensa).toMatchObject({ origem: 'sumido', descricao: '1 saco de carvão de 3 kg de brinde' });
    });
});

describe('venda', () =>
{
    it('compra até 14 dias depois de um lembrete conta como recuperada', () =>
    {
        const l = gas();
        dispararEnvio(l, HOJE);
        const maria = cli(l, 'Dona Maria');
        const r = registrarVenda(l, { clienteId: maria.id, produtoId: 'p13', valor: 115 }, somarDias(HOJE, 3), '15:00');
        expect(r.tipo).toBe('recuperada');
        expect(numerosDaLoja(l, somarDias(HOJE, 3)).recuperado).toBe(130 + 115);
        expect(numerosDaLoja(l, somarDias(HOJE, 3)).voltaram).toBe(3);
    });

    it('compra sem lembrete recente não conta como recuperada', () =>
    {
        const l = gas();
        const claudia = cli(l, 'Cláudia');
        const r = registrarVenda(l, { clienteId: claudia.id, produtoId: 'carvao', valor: 30 }, HOJE, '15:00');
        expect(r.tipo).toBe('normal');
        expect(numerosDaLoja(l, HOJE).recuperado).toBe(130);
    });

    it('cliente novo ganha a recompensa da 2ª compra e recebe o comprovante', () =>
    {
        const l = gas();
        const r = registrarVenda(l, { novo: { nome: 'Ana Souza', tel: '(44) 99999-0000' }, produtoId: 'p13', valor: 115 }, HOJE, '15:00');
        expect(r.tipo).toBe('novo');
        expect(r.cliente.recompensa).toMatchObject({ valor: 5.75, validaAte: somarDias(HOJE, 45) });
        expect(txt(r.mensagem?.texto)).toContain('Você ganhou R$ 5,75 de cashback');
        expect(numerosDaLoja(l, HOJE).novos).toBe(11);
    });

    it('Marcos responde ao convite e volta: 2ª compra, venda recuperada e cashback usado', () =>
    {
        const l = gas();
        dispararEnvio(l, HOJE);
        const marcos = cli(l, 'Marcos');
        const m = l.mensagens.find(x => x.clienteId === marcos.id && x.tipo === 'segunda')!;
        responder(
            l,
            m.id,
            'quer',
            HOJE,
            '09:12',
        );
        expect(m).toMatchObject({ status: 'respondeu', resposta: { texto: 'Pode trazer! Vou usar meu crédito.' } });
        const r = registrarVenda(l, { clienteId: marcos.id, produtoId: 'p13', valor: 115, usarRecompensa: true }, HOJE, '11:00');
        expect(r.tipo).toBe('recuperada');
        expect(m.status).toBe('voltou');
        expect(numerosDaLoja(l, HOJE)).toMatchObject({ segunda: 8, recompensasUsadas: 1, recuperado: 239.25 });
        expect(cli(l, 'Marcos').recompensa).toBeUndefined();
        expect(serieRecuperado(l, HOJE).at(-1)).toEqual({ dia: HOJE, valor: 109.25 });
    });

    it('o histórico diário do gráfico soma o total do mês', () =>
    {
        const l = gas();
        const serie = serieRecuperado(l, HOJE, 24);
        expect(serie.reduce((a, x) => a + x.valor, 0)).toBe(numerosDaLoja(l, HOJE).recuperado);
        expect(serie.every(x => x.valor >= 0)).toBe(true);
    });

    it('"Tive um problema" abre um alerta', () =>
    {
        const l = gas();
        dispararEnvio(l, HOJE);
        const lucas = cli(l, 'Lucas');
        const m = l.mensagens.find(x => x.clienteId === lucas.id && x.tipo === 'obrigado')!;
        responder(
            l,
            m.id,
            'problema',
            HOJE,
            '09:30',
        );
        expect(l.problemasAbertos).toEqual([lucas.id]);
    });
});

describe('formato', () =>
{
    it.each([
        ['115,50', 115.5],
        ['115.50', 115.5],
        ['115.5', 115.5],
        ['1.150', 1150],
        ['1.150,00', 1150],
        ['R$ 90', 90],
        ['', 0],
    ])('parseValor(%j) = %d', (txt, v) => expect(parseValor(txt)).toBe(v));

    it('waUrl põe o 55 e codifica o texto', () =>
    {
        expect(waUrl('(44) 99812-3344', 'oi, tudo?')).toBe('https://wa.me/5544998123344?text=oi%2C%20tudo%3F');
    });
});
