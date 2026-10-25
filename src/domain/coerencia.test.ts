import { describe, expect, it } from 'vitest';
import { migrarLoja } from '@/data/migracao';
import { lojasExemplo } from '@/data/seed';
import { filaDoDia } from './fila';
import { somarDias } from './formato';
import { novaRecompensa, recompensaValida, textoMensagem, valorACobrar } from './mensagens';
import {
    dispararEnvio,
    enviarMensagem,
    pular,
    registrarVenda,
    resolverProblema,
    responder,
} from './operacoes';
import { situacao } from './recorrencia';
import { numerosDaLoja, serieRecuperado } from './resultados';
import type { Loja, TipoRecompensa } from './tipos';

const HOJE = '2026-10-25';
const gas = () => lojasExemplo(HOJE).gas;
const cliente = (l: Loja, chamar: string) => l.clientes.find(c => c.chamar === chamar)!;

describe('recompensas e cobrança', () =>
{
    it('aplica o percentual concedido e preserva a oferta após a regra mudar', () =>
    {
        const l = gas();
        const c = cliente(l, 'Marcos');
        c.recompensa = novaRecompensa(
            { ...l.regraSegunda, tipo: 'desconto', pct: 10 },
            'segunda',
            115,
            HOJE,
            45,
        );
        l.regraSegunda.pct = 50;
        expect(valorACobrar(115, recompensaValida(c, HOJE))).toBe(103.5);
        dispararEnvio(l, HOJE);
        const venda = registrarVenda(l, { clienteId: c.id, produtoId: 'p13', valor: 115, usarRecompensa: true }, HOJE, '11:00');
        expect(venda.valorPago).toBe(103.5);
        expect(venda.mensagem?.valorVolta).toBe(103.5);
        expect(c.compras.at(-1)).toMatchObject({ valor: 115, valorPago: 103.5, recompensaUsada: '10% de desconto' });
        expect(serieRecuperado(l, HOJE).at(-1)?.valor).toBe(103.5);
    });

    it('arredonda descontos em centavos e limita o cashback ao valor cobrado', () =>
    {
        const regra = gas().regraSegunda;
        expect(valorACobrar(19.99, novaRecompensa(
            { ...regra, tipo: 'desconto', pct: 10 },
            'segunda',
            20,
            HOJE,
            30,
        ))).toBe(17.99);
        expect(valorACobrar(1, novaRecompensa(
            regra,
            'segunda',
            115,
            HOJE,
            30,
        ))).toBe(0);
        expect(valorACobrar(115)).toBe(115);
    });

    it('encerra o benefício exclusivo da segunda compra mesmo sem resgate', () =>
    {
        const l = lojasExemplo(HOJE).ferramentas;
        const c = cliente(l, 'Beto');
        registrarVenda(l, { clienteId: c.id, produtoId: 'serra', valor: 120 }, HOJE, '10:00');
        expect(recompensaValida(c, HOJE)).toBeUndefined();
        registrarVenda(l, { clienteId: c.id, produtoId: 'serra', valor: 120, usarRecompensa: true }, somarDias(HOJE, 1), '10:00');
        expect(c.compras.at(-1)?.recompensaUsada).toBeUndefined();
    });

    it('antecipa o convite ao vencimento da recompensa de um produto de ciclo longo', () =>
    {
        const l = lojasExemplo(HOJE).ferramentas;
        const c = cliente(l, 'Beto');
        const dia = somarDias(c.recompensa!.validaAte, -5);
        expect(filaDoDia(l, dia).find(x => x.cliente.id === c.id)?.tipo).toBe('segunda');
        expect(textoMensagem(
            c,
            l,
            'segunda',
            situacao(c, l.produtos, l.regraSumido, dia),
            dia,
        )).toContain(c.recompensa!.descricao);
        expect(recompensaValida(c, dia)).toBeDefined();
    });

    it('oferece o benefício de cinco dias antes de vencer sem suprimir o pós-venda inicial', () =>
    {
        const l = gas();
        l.regraSegunda.dias = 5;
        const c = registrarVenda(l, { novo: { nome: 'Ana', tel: '44999999999' }, produtoId: 'p13', valor: 115 }, HOJE, '10:00').cliente;
        expect(filaDoDia(l, somarDias(HOJE, 1)).find(x => x.cliente.id === c.id)?.tipo).toBe('obrigado');
        expect(filaDoDia(l, somarDias(HOJE, 2)).find(x => x.cliente.id === c.id)?.tipo).toBe('segunda');
    });

    it.each<TipoRecompensa>(['brinde', 'desconto', 'entrega'])('não chama %s de crédito', (tipo) =>
    {
        const l = gas();
        l.regraSumido.tipo = tipo;
        const c = cliente(l, 'Edna');
        const m = enviarMensagem(
            l,
            c.id,
            'sumido',
            'Oferta',
            HOJE,
            '09:00',
        );
        responder(
            l,
            m.id,
            'quer',
            HOJE,
            '09:30',
        );
        expect(m.resposta?.texto).not.toContain('crédito');
    });
});

describe('atribuição e limites de envio', () =>
{
    it('não recupera duas compras por convites do mesmo ciclo', () =>
    {
        const l = gas();
        const c = cliente(l, 'Dona Maria');
        dispararEnvio(l, HOJE);
        const dia = somarDias(HOJE, 14);
        dispararEnvio(l, dia);
        const venda = { clienteId: c.id, produtoId: 'p13', valor: 115 };
        expect(registrarVenda(l, venda, dia, '10:00').tipo).toBe('recuperada');
        expect(registrarVenda(l, venda, dia, '10:01').tipo).toBe('normal');
        expect(c.compras.filter(x => x.recuperada)).toHaveLength(1);
    });

    it('mensagem livre de atendimento não recupera uma venda', () =>
    {
        const l = gas();
        const c = cliente(l, 'Tião');
        enviarMensagem(
            l,
            c.id,
            'atendimento',
            'Obrigado pela preferência!',
            HOJE,
            '09:00',
        );
        expect(registrarVenda(l, { clienteId: c.id, produtoId: 'p45', valor: 450 }, HOJE, '10:00').tipo).toBe('normal');
    });

    it('não permite forçar atribuição a outro cliente ou mensagem futura', () =>
    {
        const l = gas();
        const c = cliente(l, 'Tião');
        const m = enviarMensagem(
            l,
            cliente(l, 'Dona Maria').id,
            'perto',
            'Convite',
            HOJE,
            '09:00',
        );
        const venda = { clienteId: c.id, produtoId: 'p45', valor: 450, viaMensagemId: m.id };
        expect(registrarVenda(l, venda, HOJE, '10:00').tipo).toBe('normal');
        m.clienteId = c.id;
        m.data = somarDias(HOJE, 1);
        expect(registrarVenda(l, venda, HOJE, '11:00').tipo).toBe('normal');
    });

    it('aplica limite semanal e pulo também no envio direto de convites', () =>
    {
        const l = gas();
        const c = cliente(l, 'Dona Maria');
        enviarMensagem(
            l,
            c.id,
            'perto',
            'Convite',
            HOJE,
            '09:00',
        );
        expect(() => enviarMensagem(
            l,
            c.id,
            'atrasado',
            'Outro',
            HOJE,
            '09:01',
        )).toThrow();
        enviarMensagem(
            l,
            c.id,
            'atendimento',
            'Atendimento',
            HOJE,
            '09:02',
        );
        const edna = cliente(l, 'Edna');
        pular(l, edna.id, 'sumido', HOJE);
        expect(() => enviarMensagem(
            l,
            edna.id,
            'sumido',
            'Oferta',
            HOJE,
            '09:03',
        )).toThrow(/hoje/);
    });

    it('a compra não reinicia o limite semanal de convites', () =>
    {
        const l = gas();
        const c = cliente(l, 'Dona Maria');
        enviarMensagem(
            l,
            c.id,
            'perto',
            'Convite',
            HOJE,
            '09:00',
        );
        registrarVenda(l, { clienteId: c.id, produtoId: 'p13', valor: 115 }, somarDias(HOJE, 1), '10:00');
        expect(() => enviarMensagem(
            l,
            c.id,
            'atrasado',
            'Outro',
            somarDias(HOJE, 2),
            '09:00',
        )).toThrow(/semana/);
    });

    it('impede uma terceira reativação inclusive pelo envio direto', () =>
    {
        const l = gas();
        const c = cliente(l, 'Edna');
        enviarMensagem(
            l,
            c.id,
            'sumido',
            'Oferta',
            HOJE,
            '09:00',
        );
        enviarMensagem(
            l,
            c.id,
            'sumido',
            'Última oferta',
            somarDias(HOJE, 30),
            '09:00',
        );
        expect(() => enviarMensagem(
            l,
            c.id,
            'sumido',
            'Outra oferta',
            somarDias(HOJE, 60),
            '09:00',
        )).toThrow(/última tentativa/);
    });
});

describe('acompanhamento e problemas', () =>
{
    it('pausa a régua enquanto houver problema e retoma após resolver', () =>
    {
        const l = gas();
        const c = cliente(l, 'Lucas');
        dispararEnvio(l, HOJE);
        const m = l.mensagens.find(x => x.clienteId === c.id)!;
        responder(
            l,
            m.id,
            'problema',
            HOJE,
            '09:30',
        );
        const dia = somarDias(HOJE, 6);
        expect(filaDoDia(l, dia).some(x => x.cliente.id === c.id)).toBe(false);
        expect(() => enviarMensagem(
            l,
            c.id,
            'dica',
            'Dica',
            dia,
            '09:00',
        )).toThrow(/problema/);
        enviarMensagem(
            l,
            c.id,
            'problema',
            'Como posso ajudar?',
            dia,
            '09:10',
        );
        resolverProblema(l, c.id, dia);
        resolverProblema(l, c.id, dia);
        expect(l.problemasResolvidos).toHaveLength(1);
        expect(filaDoDia(l, dia).find(x => x.cliente.id === c.id)?.tipo).toBe('dica');
    });

    it('não aprende um intervalo zero com compras no mesmo dia', () =>
    {
        const l = gas();
        const c = registrarVenda(l, { novo: { nome: 'Ana', tel: '44999999999' }, produtoId: 'p13', valor: 115 }, HOJE, '10:00').cliente;
        registrarVenda(l, { clienteId: c.id, produtoId: 'p13', valor: 115 }, HOJE, '11:00');
        expect(situacao(c, l.produtos, l.regraSumido, HOJE)).toMatchObject({ est: 'emdia', media: 40, aprendido: false, proxima: null });
        registrarVenda(l, { clienteId: c.id, produtoId: 'p13', valor: 115 }, somarDias(HOJE, 2), '11:00');
        expect(situacao(c, l.produtos, l.regraSumido, somarDias(HOJE, 2))).toMatchObject({ est: 'emdia', media: 2, aprendido: true });
    });

    it('não trata um cliente de P45 como sumido antes de ultrapassar seu ritmo', () =>
    {
        const l = gas();
        const c = cliente(l, 'Tião');
        expect(situacao(c, l.produtos, l.regraSumido, somarDias(HOJE, 40))).toMatchObject({ desde: 60, media: 90, est: 'emdia' });
        expect(situacao(c, l.produtos, l.regraSumido, somarDias(HOJE, 93)).est).toBe('sumido');
    });

    it('não prepara nem permite enviar uma dica sem conteúdo', () =>
    {
        const l = gas();
        l.produtos.find(p => p.id === 'p13')!.dica = '';
        const c = cliente(l, 'Lucas');
        const dia = somarDias(HOJE, 6);
        expect(filaDoDia(l, dia).some(x => x.cliente.id === c.id)).toBe(false);
        expect(textoMensagem(
            c,
            l,
            'dica',
            situacao(c, l.produtos, l.regraSumido, dia),
            dia,
        )).toBe('');
        expect(() => enviarMensagem(
            l,
            c.id,
            'dica',
            'Uma dica pra você:',
            dia,
            '09:00',
        )).toThrow(/dica/);
    });
});

describe('indicadores e dados persistidos', () =>
{
    it.each(['gas', 'ferramentas', 'tecidos'])('concilia o painel e o gráfico com o histórico da loja %s', (id) =>
    {
        const l = lojasExemplo(HOJE)[id];
        const n = numerosDaLoja(l, HOJE);
        expect(n.novos).toBe(l.clientes.length);
        expect(n.voltaram).toBeLessThanOrEqual(l.clientes.length);
        expect(n.recuperado).toBe(serieRecuperado(l, HOJE, 25).reduce((a, x) => a + x.valor, 0));
        expect(l.mensagens.filter(m => m.status === 'voltou').every(m => m.encerradaEm)).toBe(true);
        expect(numerosDaLoja(l, '2026-11-01')).toMatchObject({ recuperado: 0, voltaram: 0, recompensasUsadas: 0 });
    });

    it('conta clientes distintos e ignora compras futuras ou de outro mês nos resultados mensais', () =>
    {
        const l = gas();
        const c = cliente(l, 'Tião');
        c.compras.push(
            {
                data: '2026-10-01',
                produtoId: 'p45',
                valor: 450,
                valorPago: 400,
                recuperada: true,
            },
            { data: '2026-10-02', produtoId: 'p45', valor: 450, recuperada: true },
            { data: '2026-10-26', produtoId: 'p45', valor: 450, recuperada: true },
            { data: '2026-09-30', produtoId: 'p45', valor: 450, recuperada: true },
        );
        expect(numerosDaLoja(l, HOJE)).toMatchObject({ recuperado: 980, voltaram: 3, novos: 10, segunda: 7 });
    });

    it('migra uma recompensa antiga sem perder a loja nem interpretar o desconto pela regra atual', () =>
    {
        const l = gas();
        const c = cliente(l, 'Marcos');
        const legado = { origem: 'segunda', descricao: '10% de desconto', validaAte: '2026-11-01' };
        Object.assign(c, { recompensa: legado });
        Object.assign(l, { numeros: { recuperado: 99999 }, recuperadoPorDia: { [HOJE]: 99999 } });
        const migrada = migrarLoja(l);
        expect(migrada.clientes).toHaveLength(l.clientes.length);
        expect(cliente(migrada, 'Marcos').recompensa).toMatchObject({ tipo: 'desconto', pct: 10 });
        expect(migrada).not.toHaveProperty('numeros');
        expect(migrada).not.toHaveProperty('recuperadoPorDia');
        expect(l).toHaveProperty('numeros');
    });
});
