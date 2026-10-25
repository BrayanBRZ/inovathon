import { useMemo } from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';
import { diasEntre } from '@/domain/formato';
import { situacao } from '@/domain/recorrencia';
import type {
    Dia,
    EstadoCliente,
    Loja,
    Situacao,
    StatusMensagem,
    TipoMensagem,
} from '@/domain/tipos';

/** Variante do `Badge` do shadcn/ui, incluindo os tons `warning` e `success` do tema. */
export type VarianteSelo = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

/**
 * @summary
 * Tom semântico de um estado. A cor só aparece quando comunica algo.
 *
 * @remarks
 * `secondary` é neutro; `warning` pede atenção; `success` é resultado positivo; `destructive` é problema ou perda.
 */
export type Tom = 'secondary' | 'warning' | 'success' | 'destructive';

/**
 * @summary
 * Aparência de um estado exibido em `Badge`: texto e variante oficial.
 *
 * @property rotulo - Texto curto do selo.
 * @property variant - Variante do `Badge`; segue o tom semântico do estado.
 */
export interface Selo
{
    rotulo: string;
    variant: VarianteSelo;
}

/** Selo de cada estado do motor de recorrência. */
export const SELO_ESTADO: Record<EstadoCliente, Selo> = {
    novo: { rotulo: 'Novo', variant: 'secondary' },
    emdia: { rotulo: 'Em dia', variant: 'secondary' },
    perto: { rotulo: 'Hora de voltar', variant: 'warning' },
    atrasado: { rotulo: 'Atrasado', variant: 'warning' },
    sumido: { rotulo: 'Sumido', variant: 'destructive' },
};

/** Selo de cada tipo de mensagem nas oportunidades do dia. */
export const SELO_TIPO: Record<TipoMensagem, Selo> = {
    comprovante: { rotulo: 'Comprovante', variant: 'secondary' },
    obrigado: { rotulo: 'Pós-venda', variant: 'secondary' },
    dica: { rotulo: 'Dica de uso', variant: 'secondary' },
    segunda: { rotulo: 'Hora de lembrar', variant: 'warning' },
    perto: { rotulo: 'Hora de lembrar', variant: 'warning' },
    atrasado: { rotulo: 'Atrasado', variant: 'warning' },
    sumido: { rotulo: 'Sumido', variant: 'destructive' },
    problema: { rotulo: 'Problema', variant: 'destructive' },
    atendimento: { rotulo: 'Atendimento', variant: 'secondary' },
};

/** Selo do resultado de cada mensagem enviada. */
export const SELO_STATUS: Record<StatusMensagem, Selo> = {
    enviada: { rotulo: 'Enviada', variant: 'outline' },
    gostei: { rotulo: 'Gostou', variant: 'success' },
    respondeu: { rotulo: 'Respondeu', variant: 'secondary' },
    problema: { rotulo: 'Problema', variant: 'destructive' },
    voltou: { rotulo: 'Voltou', variant: 'success' },
};

/**
 * @summary
 * Fundo e texto de superfícies que não são `Badge` (por exemplo, um `Item` com crédito ou um alerta de recompra).
 *
 * @remarks
 * Usar com `data-tom` no `Item` para que o ícone de `ItemMedia variant="icon"` acompanhe o tom.
 */
export const TOM_SUPERFICIE: Record<Tom, string> = {
    secondary: 'bg-muted text-foreground',
    warning: 'bg-warning text-warning-foreground',
    success: 'bg-success text-success-foreground',
    destructive: 'bg-destructive/10 text-destructive',
};

/** Texto (e ícone) no tom indicado, sem fundo. */
export const TOM_TEXTO: Record<Tom, string> = {
    secondary: 'text-muted-foreground',
    warning: 'text-warning-foreground',
    success: 'text-success-foreground',
    destructive: 'text-destructive',
};

/**
 * @summary
 * Indica se o cliente voltou por causa de uma mensagem nos últimos 7 dias.
 *
 * @param s - Situação calculada do cliente.
 * @param hoje - Dia da demonstração.
 * @returns `true` quando a última compra veio de uma mensagem há 7 dias ou menos; `false` caso contrário.
 */
export function retornou(s: Situacao, hoje: Dia): boolean
{
    return !!s.ultima.recuperada && diasEntre(s.ultima.data, hoje) <= 7;
}

/**
 * @summary
 * Escolhe o selo de um cliente: "Retornou" tem prioridade sobre o estado do motor.
 *
 * @param s - Situação calculada do cliente.
 * @param hoje - Dia da demonstração.
 * @returns O selo a exibir na lista e na ficha do cliente.
 */
export function seloCliente(s: Situacao, hoje: Dia): Selo
{
    return retornou(s, hoje) ? { rotulo: 'Retornou', variant: 'success' } : SELO_ESTADO[s.est];
}

/**
 * @summary
 * Gera as iniciais exibidas no `AvatarFallback`.
 *
 * @remarks
 * Ignora trechos entre parênteses e preposições ("da", "de", "do"...). Usa a primeira e a última palavra.
 *
 * @param nome - Nome da pessoa ou da empresa.
 * @returns Até duas letras maiúsculas.
 */
export function iniciais(nome: string): string
{
    const p = nome
        .replace(/\(.*\)/, '')
        .trim()
        .split(/\s+/)
        .filter(x => !/^(da|de|do|dos|das|e)$/i.test(x));
    return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

/**
 * @summary
 * Calcula a situação de todos os clientes da loja, memorizada enquanto loja e dia não mudam.
 *
 * @param l - Loja atual.
 * @param hoje - Dia da demonstração.
 * @returns Mapa do identificador do cliente para a sua situação.
 */
export function useSituacoes(l: Loja, hoje: Dia): Map<string, Situacao>
{
    return useMemo(
        () => new Map(l.clientes.map(c => [c.id, situacao(c, l.produtos, l.regraSumido, hoje)])),
        [l, hoje],
    );
}
