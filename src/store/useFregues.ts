import { format } from 'date-fns';
import { create } from 'zustand';
import {
    createJSONStorage,
    persist,
    type StateStorage,
} from 'zustand/middleware';
import { lojasExemplo } from '@/data/seed';
import { diaHoje, somarDias } from '@/domain/formato';
import * as op from '@/domain/operacoes';
import type {
    Dia,
    Loja,
    Produto,
    Regra,
    TipoMensagem,
} from '@/domain/tipos';

export type Plano = 'essencial' | 'completo';
export const MENSALIDADE: Record<Plano, number> = {
    essencial: 99,
    completo: 199,
};

interface Dados {
    lojas: Record<string, Loja>;
    lojaId: string;
    /** Relógio da demonstração ("Avançar 1 dia" muda esta data). */
    hoje: Dia;
    plano: Plano;
    letraGrande: boolean;
}

interface Acoes {
    trocarLoja(id: string): void;
    registrarVenda(v: op.NovaVenda): op.ResultadoVenda;
    enviarMensagem(clienteId: string, tipo: TipoMensagem, texto: string): void;
    dispararEnvio(): number;
    pular(clienteId: string, tipo: TipoMensagem): void;
    responder(mensagemId: string, resposta: op.Resposta): void;
    resolverProblema(clienteId: string): void;
    alternarAuto(): void;
    atualizarRegra(
        qual: 'regraSumido' | 'regraSegunda',
        mudanca: Partial<Regra>,
    ): void;
    atualizarLoja(mudanca: Partial<Pick<Loja, 'nome' | 'dono' | 'de' | 'tel'>>): void;
    salvarProduto(p: Produto): void;
    removerProduto(id: string): void;
    avancarDia(): void;
    restaurar(): void;
    setPlano(p: Plano): void;
    setLetraGrande(v: boolean): void;
}

export type Estado = Dados & Acoes;

function inicial(): Dados
{
    return {
        lojas: lojasExemplo(diaHoje()),
        lojaId: 'gas',
        hoje: diaHoje(),
        plano: 'essencial',
        letraGrande: false,
    };
}

function hora()
{
    return format(new Date(), 'HH:mm');
}

/** localStorage pode não existir ou lançar erro (aba anônima, dados bloqueados). */
const armazenamento: StateStorage = {
    getItem: (k) =>
    {
        try
        {
            return localStorage.getItem(k);
        }
        catch
        {
            return null;
        }
    },
    setItem: (k, v) =>
    {
        try
        {
            localStorage.setItem(k, v);
        }
        catch
        {
            /* segue só na memória */
        }
    },
    removeItem: (k) =>
    {
        try
        {
            localStorage.removeItem(k);
        }
        catch
        {
            /* idem */
        }
    },
};

export const useFregues = create<Estado>()(
    persist(
        (set, get) =>
        {
            /** Aplica uma operação numa cópia da loja atual e grava o resultado. */
            function comLoja<T>(fn: (l: Loja, hoje: Dia) => T): T
            {
                const { lojas, lojaId, hoje } = get();
                const l = structuredClone(lojas[lojaId]);
                const r = fn(l, hoje);
                set({ lojas: { ...lojas, [lojaId]: l } });
                return r;
            }

            return {
                ...inicial(),
                trocarLoja: id => set({ lojaId: id }),
                registrarVenda: v =>
                    comLoja((l, hoje) => op.registrarVenda(l, v, hoje, hora())),
                enviarMensagem: (id, tipo, texto) =>
                    comLoja((l, hoje) =>
                    {
                        op.enviarMensagem(
                            l,
                            id,
                            tipo,
                            texto,
                            hoje,
                            hora(),
                        );
                    }),
                dispararEnvio: () => comLoja((l, hoje) => op.dispararEnvio(l, hoje)),
                pular: (id, tipo) => comLoja((l, hoje) => op.pular(l, id, tipo, hoje)),
                responder: (id, r) => comLoja((l, hoje) => op.responder(
                    l,
                    id,
                    r,
                    hoje,
                    hora(),
                )),
                resolverProblema: id => comLoja(l => op.resolverProblema(l, id)),
                alternarAuto: () =>
                    comLoja((l) =>
                    {
                        l.auto = !l.auto;
                    }),
                atualizarRegra: (qual, m) =>
                    comLoja((l) =>
                    {
                        l[qual] = { ...l[qual], ...m };
                    }),
                atualizarLoja: m =>
                    comLoja((l) =>
                    {
                        Object.assign(l, m);
                    }),
                salvarProduto: p =>
                    comLoja((l) =>
                    {
                        const i = l.produtos.findIndex(x => x.id === p.id);
                        if (i >= 0) l.produtos[i] = p;
                        else l.produtos.push(p);
                    }),
                removerProduto: id =>
                    comLoja((l) =>
                    {
                        l.produtos = l.produtos.filter(p => p.id !== id);
                    }),
                avancarDia: () => set(s => ({ hoje: somarDias(s.hoje, 1) })),
                restaurar: () =>
                {
                    const { plano, letraGrande, lojaId } = get();
                    set({
                        ...inicial(),
                        plano,
                        letraGrande,
                        lojaId,
                    });
                },
                setPlano: plano => set({ plano }),
                setLetraGrande: letraGrande => set({ letraGrande }),
            };
        },
        {
            name: 'fregues-demo',
            version: 2,
            // Dados de versões anteriores da demonstração são descartados: volta aos exemplos.
            migrate: () => ({}) as Estado,
            storage: createJSONStorage(() => armazenamento),
            partialize: ({
                lojas,
                lojaId,
                hoje,
                plano,
                letraGrande,
            }) => ({
                lojas,
                lojaId,
                hoje,
                plano,
                letraGrande,
            }),
        },
    ),
);

export function useLoja(): Loja
{
    return useFregues(s => s.lojas[s.lojaId]);
}

export function useHoje(): Dia
{
    return useFregues(s => s.hoje);
}

/** Produto em uso por algum cliente não pode ser removido. */
export function produtoEmUso(l: Loja, id: string)
{
    return l.clientes.some(c => c.compras.some(x => x.produtoId === id));
}
