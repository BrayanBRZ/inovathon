import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { Dia } from './tipos';

export function brl(v: number): string
{
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Lê o valor digitado pelo lojista. Aceita "115,50", "115.50", "1.150,00" e "1,150.00".
 * O último separador seguido de 1 ou 2 dígitos é o decimal; os outros são de milhar.
 */
export function parseValor(txt: string): number
{
    const s = txt.replace(/[^\d.,]/g, '');
    if (!s) return 0;
    const m = s.match(/^(.*)[.,](\d{1,2})$/);
    const n = m ? Number(m[1].replace(/[.,]/g, '') + '.' + m[2]) : Number(s.replace(/[.,]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

/**
 * @summary
 * Prepara um valor em reais para os campos monetários com máscara brasileira.
 *
 * @param v - Quantia em reais.
 * @returns Valor com separador de milhares e duas casas decimais, sem R$.
 */
export function valorParaCampo(v: number): string
{
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function dias(n: number): string
{
    return n === 1 ? '1 dia' : `${n} dias`;
}

export function somarDias(d: Dia, n: number): Dia
{
    return format(addDays(parseISO(d), n), 'yyyy-MM-dd');
}

export function diasEntre(de: Dia, ate: Dia): number
{
    return differenceInCalendarDays(parseISO(ate), parseISO(de));
}

export function diaHoje(): Dia
{
    return format(new Date(), 'yyyy-MM-dd');
}

export function ddmm(d: Dia): string
{
    return format(parseISO(d), 'dd/MM');
}

export function quando(d: Dia, hoje: Dia): string
{
    const n = diasEntre(d, hoje);
    if (n === 0) return 'Hoje';
    if (n === 1) return 'Ontem';
    if (n < 7) return `Há ${dias(n)}`;
    return format(parseISO(d), 'dd/MM/yyyy');
}

export function soDigitos(s: string): string
{
    return s.replace(/\D/g, '');
}

export function waUrl(tel: string, texto?: string): string
{
    let n = soDigitos(tel);
    if (n.length <= 11) n = '55' + n;
    return `https://wa.me/${n}` + (texto ? `?text=${encodeURIComponent(texto)}` : '');
}
