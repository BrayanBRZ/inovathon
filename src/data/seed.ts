/**
 * Lojas e clientes de exemplo para a demonstração.
 * Os dados ficam em `lojas.json`, com as compras em "dias atrás"; aqui viram datas a partir de `hoje`
 * e ganham o histórico de mensagens e o gráfico do mês.
 */
import lojasJson from '@/data/lojas.json';
import { somarDias } from '@/domain/formato';
import { novaRecompensa, textoComprovante } from '@/domain/mensagens';
import { textoResposta } from '@/domain/operacoes';
import type {
    Cliente,
    Dia,
    Loja,
    Mensagem,
    Numeros,
    Produto,
    Regra,
    StatusMensagem,
    TipoMensagem,
} from '@/domain/tipos';

/**
 * @summary
 * Cliente de exemplo como aparece em `lojas.json`.
 *
 * @property nome - Nome completo exibido nas listas.
 * @property chamar - Como a loja chama o cliente nas mensagens ("Dona Maria").
 * @property tel - WhatsApp com DDD, no formato exibido.
 * @property prod - Identificador do produto comprado em todas as compras de exemplo.
 * @property dias - Compras, em dias antes de hoje; uma compra só indica cliente novo.
 * @property recuperadas - Compras que vieram de um lembrete: o dia da compra (em dias atrás),
 *   quantos dias antes o lembrete saiu e o tipo da mensagem.
 */
interface ClienteSeed
{
    nome: string;
    chamar: string;
    tel: string;
    prod: string;
    dias: number[];
    recuperadas?: { dia: number; lembrete: number; tipo: TipoMensagem }[];
}

/**
 * @summary
 * Loja de exemplo como aparece em `lojas.json`.
 *
 * @property id - Identificador da loja, usado também como prefixo dos clientes.
 * @property dono - Nome de quem atende, usado na saudação e no avatar.
 * @property nome - Nome da loja exibido no cabeçalho.
 * @property de - Complemento de "Aqui é ..." nas mensagens.
 * @property tel - WhatsApp da loja.
 * @property regraSumido - Recompensa para clientes sumidos.
 * @property regraSegunda - Recompensa da segunda compra.
 * @property numeros - Resultados do mês antes da demonstração.
 * @property produtos - Produtos com preço e prazo de recompra.
 * @property clientes - Clientes e suas compras de exemplo.
 */
interface LojaSeed
{
    id: string;
    dono: string;
    nome: string;
    de: string;
    tel: string;
    regraSumido: Regra;
    regraSegunda: Regra;
    numeros: Numeros;
    produtos: Produto[];
    clientes: ClienteSeed[];
}

/**
 * Lojas de exemplo de `lojas.json`. O JSON não carrega tipos literais (como o tipo da recompensa),
 * por isso a conversão para {@link LojaSeed}.
 */
const LOJAS: LojaSeed[] = lojasJson as LojaSeed[];

function montarLoja(s: LojaSeed, hoje: Dia): Loja
{
    const dia = (atras: number) => somarDias(hoje, -atras);
    const mensagens: Mensagem[] = [];
    const msg = (
        c: Cliente,
        tipo: TipoMensagem,
        atras: number,
        texto: string,
        status: StatusMensagem,
        valorVolta?: number,
    ) =>
        mensagens.push({
            id: `${c.id}-${tipo}-${atras}`,
            clienteId: c.id,
            tipo,
            data: dia(atras),
            hora: tipo === 'comprovante' ? '10:30' : '09:00',
            texto,
            status,
            valorVolta,
            resposta: status === 'gostei' ? { hora: '09:24', texto: textoResposta('gostei', false) } : status === 'voltou' ? { hora: '09:41', texto: textoResposta('quer', false) } : undefined,
        });

    const loja: Loja = {
        id: s.id,
        dono: s.dono,
        nome: s.nome,
        de: s.de,
        tel: s.tel,
        regraSumido: { ...s.regraSumido },
        regraSegunda: { ...s.regraSegunda },
        produtos: s.produtos.map(p => ({ ...p })),
        clientes: [],
        mensagens,
        numeros: { ...s.numeros },
        recuperadoPorDia: {},
        problemasAbertos: [],
        auto: true,
        pulados: [],
    };

    s.clientes.forEach((cs, i) =>
    {
        const p = s.produtos.find(x => x.id === cs.prod)!;
        const atrasOrdenado = [...cs.dias].sort((a, b) => b - a);
        const c: Cliente = {
            id: `${s.id}-${i}`,
            nome: cs.nome,
            chamar: cs.chamar,
            tel: cs.tel,
            autorizadoEm: dia(atrasOrdenado[0]),
            compras: atrasOrdenado.map(d => ({
                data: dia(d),
                produtoId: p.id,
                valor: p.preco,
                recuperada: cs.recuperadas?.some(r => r.dia === d) || undefined,
            })),
        };
        loja.clientes.push(c);

        for (const r of cs.recuperadas ?? [])
        {
            msg(
                c,
                r.tipo,
                r.dia + r.lembrete,
                `Oi, ${c.chamar}! Aqui é ${s.de}. ${p.msg}`,
                'voltou',
                p.preco,
            );
        }

        // Cliente novo: comprovante e a régua da primeira compra até hoje.
        if (cs.dias.length === 1)
        {
            const atras = cs.dias[0];
            if (s.regraSegunda.ativa && atras < s.regraSegunda.dias)
                c.recompensa = novaRecompensa(
                    s.regraSegunda,
                    'segunda',
                    p.preco,
                    dia(atras),
                    s.regraSegunda.dias,
                );
            msg(
                c,
                'comprovante',
                atras,
                textoComprovante(c, loja, p.preco, c.recompensa),
                'enviada',
            );
            if (atras >= 2) msg(
                c,
                'obrigado',
                atras - 1,
                `Oi, ${c.chamar}! Aqui é ${s.de}. Obrigado pela compra! Deu tudo certo com ${p.nome}?`,
                'gostei',
            );
            if (atras >= 8) msg(
                c,
                'dica',
                atras - 7,
                `Oi, ${c.chamar}! Aqui é ${s.de}. Uma dica pra você: ${p.dica}`,
                'enviada',
            );
        }
    });

    // Histórico do mês para o gráfico: o que veio de mensagens, crescendo nas últimas semanas.
    const reais = loja.clientes.flatMap(c => c.compras.filter(x => x.recuperada));
    for (const x of reais) loja.recuperadoPorDia[x.data] = (loja.recuperadoPorDia[x.data] ?? 0) + x.valor;
    const resto = s.numeros.recuperado - reais.reduce((a, x) => a + x.valor, 0);
    const pesos = Array.from({ length: 28 }, (_, i) => 1 + (28 - i) / 9 + ((i * 7) % 5) / 4);
    const soma = pesos.reduce((a, b) => a + b, 0);
    let distribuido = 0;
    pesos.forEach((p, i) =>
    {
        const v = Math.round((resto * p) / soma / 5) * 5;
        distribuido += v;
        if (v) loja.recuperadoPorDia[dia(i + 1)] = (loja.recuperadoPorDia[dia(i + 1)] ?? 0) + v;
    });
    loja.recuperadoPorDia[dia(3)] += resto - distribuido;

    mensagens.sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora));
    return loja;
}

/**
 * @summary
 * Monta as lojas de exemplo com datas relativas ao dia informado.
 *
 * @param hoje - Dia da demonstração; as compras e mensagens são posicionadas antes dele.
 * @returns Lojas indexadas pelo identificador, prontas para a store.
 */
export function lojasExemplo(hoje: Dia): Record<string, Loja>
{
    return Object.fromEntries(LOJAS.map(s => [s.id, montarLoja(s, hoje)]));
}
