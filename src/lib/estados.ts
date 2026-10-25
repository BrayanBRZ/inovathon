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

/**
 * @summary
 * Aparência de um estado exibido em `Badge`: texto, variante oficial e classes extras.
 *
 * @property rotulo - Texto curto do selo.
 * @property variant - Variante do `Badge` do shadcn/ui.
 * @property className - Classes adicionais; usadas só para o tom de aviso (token `warning` do tema).
 */
export interface Selo
{
    rotulo: string;
    variant: NonNullable<VariantProps<typeof badgeVariants>['variant']>;
    className?: string;
}

/** Tom de aviso (âmbar) sobre o `Badge`, com o token `warning` definido em `index.css`. */
const AVISO = 'border-transparent bg-warning text-warning-foreground';

/** Selo de cada estado do motor de recorrência. */
export const SELO_ESTADO: Record<EstadoCliente, Selo> = {
    novo: { rotulo: 'Novo', variant: 'secondary' },
    emdia: { rotulo: 'Em dia', variant: 'secondary' },
    perto: { rotulo: 'Hora de voltar', variant: 'outline', className: AVISO },
    atrasado: { rotulo: 'Atrasado', variant: 'outline', className: AVISO },
    sumido: { rotulo: 'Sumido', variant: 'destructive' },
};

/** Selo de cada tipo de mensagem nas oportunidades do dia. */
export const SELO_TIPO: Record<TipoMensagem, Selo> = {
    comprovante: { rotulo: 'Comprovante', variant: 'secondary' },
    obrigado: { rotulo: 'Pós-venda', variant: 'secondary' },
    dica: { rotulo: 'Dica de uso', variant: 'secondary' },
    segunda: { rotulo: 'Hora de lembrar', variant: 'outline', className: AVISO },
    perto: { rotulo: 'Hora de lembrar', variant: 'outline', className: AVISO },
    atrasado: { rotulo: 'Atrasado', variant: 'outline', className: AVISO },
    sumido: { rotulo: 'Sumido', variant: 'destructive' },
    problema: { rotulo: 'Problema', variant: 'destructive' },
    atendimento: { rotulo: 'Atendimento', variant: 'secondary' },
};

/** Selo do resultado de cada mensagem enviada. */
export const SELO_STATUS: Record<StatusMensagem, Selo> = {
    enviada: { rotulo: 'Enviada', variant: 'outline' },
    gostei: { rotulo: 'Gostou', variant: 'secondary' },
    respondeu: { rotulo: 'Respondeu', variant: 'secondary' },
    problema: { rotulo: 'Problema', variant: 'destructive' },
    voltou: { rotulo: 'Voltou', variant: 'secondary' },
};

/** Tom de aviso para elementos que não são `Badge` (por exemplo, um `Item` com crédito disponível). */
export const CLASSE_AVISO = 'bg-warning text-warning-foreground';

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
    return retornou(s, hoje) ? { rotulo: 'Retornou', variant: 'secondary' } : SELO_ESTADO[s.est];
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
