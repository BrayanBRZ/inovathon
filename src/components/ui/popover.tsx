import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * @summary
 * Controla a abertura de um popover não modal.
 *
 * @param props - Estado, eventos e conteúdo do popover Radix.
 * @returns O controlador do popover.
 */
function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>)
{
    return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

/**
 * @summary
 * Define o elemento de referência para posicionar o popover.
 *
 * @param props - Propriedades da âncora, incluindo composição com o elemento filho.
 * @returns A âncora do popover.
 */
function PopoverAnchor(props: React.ComponentProps<typeof PopoverPrimitive.Anchor>)
{
    return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/**
 * @summary
 * Exibe o conteúdo flutuante do popover em um portal.
 *
 * @param props - Conteúdo, alinhamento, distância da âncora e eventos de foco.
 * @returns O painel posicionado em relação à âncora.
 */
function PopoverContent({
    className,
    align = 'center',
    sideOffset = 4,
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>)
{
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                data-slot="popover-content"
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    'z-50 w-72 rounded-xl bg-popover p-4 text-popover-foreground shadow-glass ring-1 ring-glass-border outline-none backdrop-blur-2xl backdrop-saturate-150',
                    className,
                )}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
}

export { Popover, PopoverAnchor, PopoverContent };
