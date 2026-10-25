import type { ChangeEvent, KeyboardEvent } from 'react';

/**
 * @summary
 * Formata o CPF progressivamente, descartando letras e dígitos excedentes.
 *
 * @param texto - Entrada digitada ou colada, com ou sem pontuação.
 * @returns Até onze dígitos no padrão 000.000.000-00; vazio permanece vazio.
 */
export function mascaraCpf(texto: string): string
{
    return texto.replace(/\D/g, '').slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
        .replace(/(\.\d{3})(\d)/, '$1-$2');
}

/**
 * @summary
 * Formata telefone brasileiro com DDD, para telefone fixo ou celular.
 *
 * @param texto - Entrada digitada ou colada, aceitando o prefixo internacional +55.
 * @returns Telefone nacional com até onze dígitos; vazio permanece vazio.
 */
export function mascaraTelefone(texto: string): string
{
    let numeros = texto.replace(/\D/g, '');
    if (numeros.length > 11 && numeros.startsWith('55')) numeros = numeros.slice(2);
    numeros = numeros.slice(0, 11);
    if (!numeros) return '';
    if (numeros.length <= 2) return `(${numeros}`;
    const assinante = numeros.slice(2);
    const corte = assinante.length > 8 ? 5 : 4;
    return `(${numeros.slice(0, 2)}) ${assinante.slice(0, corte)}`
        + (assinante.length > corte ? `-${assinante.slice(corte)}` : '');
}

/**
 * @summary
 * Formata moeda em reais com duas casas decimais, preenchendo a partir dos centavos.
 *
 * @param texto - Dígitos digitados ou valor colado no padrão brasileiro.
 * @returns Valor com milhares e vírgula decimal, sem R$; vazio permanece vazio.
 */
export function mascaraValor(texto: string): string
{
    const numeros = texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 15);
    if (!numeros) return '';
    const centavos = numeros.padStart(3, '0');
    const inteiro = centavos.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${inteiro},${centavos.slice(-2)}`;
}

/**
 * @summary
 * Fornece propriedades de entrada mascarada para os inputs oficiais do shadcn/ui.
 *
 * @remarks
 * Mantém a posição do cursor ao editar e remove o dígito adjacente quando a exclusão
 * alcança um separador. Não altera o layout nem cria um componente visual.
 *
 * @param valor - Conteúdo atual, formatado também na apresentação inicial.
 * @param formatar - Máscara aplicada durante digitação, colagem e exclusão.
 * @param atualizar - Recebe o texto formatado para atualizar o estado do formulário.
 * @returns Valor e eventos para espalhar diretamente no input controlado.
 */
export function campoMascarado(valor: string, formatar: (texto: string) => string, atualizar: (texto: string) => void)
{
    function aplicar(input: HTMLInputElement, texto: string, posicao: number)
    {
        const digitosAntes = texto.slice(0, posicao).replace(/\D/g, '').length;
        const formatado = formatar(texto);
        // Só desconta dígitos removidos do início; truncar o final não deve mover o cursor.
        const numeros = texto.replace(/\D/g, '');
        const removidos = formatar === mascaraTelefone && numeros.length > 11 && numeros.startsWith('55')
            ? 2
            : formatar === mascaraValor ? numeros.length - numeros.replace(/^0+(?=\d)/, '').length : 0;
        const alvo = Math.max(0, digitosAntes - removidos);
        let cursor = 0;
        let vistos = 0;
        while (cursor < formatado.length && vistos < alvo)
        {
            if (/\d/.test(formatado[cursor])) vistos++;
            cursor++;
        }
        if (posicao === texto.length) cursor = formatado.length;
        input.value = formatado;
        input.setSelectionRange(cursor, cursor);
        atualizar(formatado);
    }

    return {
        value: formatar(valor),
        onChange: (evento: ChangeEvent<HTMLInputElement>) =>
        {
            const input = evento.currentTarget;
            const tipo = (evento.nativeEvent as InputEvent).inputType;
            const apagando = tipo?.startsWith('delete');
            const limparZero = formatar === mascaraValor && apagando && /^0+$/.test(valor.replace(/\D/g, ''));
            let texto = limparZero ? '' : input.value;
            let posicao = input.selectionStart ?? texto.length;
            // Teclados móveis podem excluir separadores sem disparar keydown.
            if (apagando && texto !== valor && texto.replace(/\D/g, '') === valor.replace(/\D/g, ''))
            {
                const paraTras = tipo?.endsWith('Backward');
                let indice = paraTras ? posicao - 1 : posicao;
                while (indice >= 0 && indice < texto.length && /\D/.test(texto[indice])) indice += paraTras ? -1 : 1;
                if (indice >= 0 && indice < texto.length)
                {
                    texto = texto.slice(0, indice) + texto.slice(indice + 1);
                    posicao = Math.min(posicao, indice);
                }
            }
            aplicar(input, texto, posicao);
        },
        onKeyDown: (evento: KeyboardEvent<HTMLInputElement>) =>
        {
            if (evento.key !== 'Backspace' && evento.key !== 'Delete') return;
            if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
            const input = evento.currentTarget;
            const inicio = input.selectionStart ?? 0;
            if (inicio !== input.selectionEnd) return;
            const texto = input.value;
            const paraTras = evento.key === 'Backspace';
            let indice = paraTras ? inicio - 1 : inicio;
            if (indice < 0 || indice >= texto.length || /\d/.test(texto[indice])) return;
            while (indice >= 0 && indice < texto.length && /\D/.test(texto[indice])) indice += paraTras ? -1 : 1;
            if (indice < 0 || indice >= texto.length) return;
            evento.preventDefault();
            const fim = paraTras ? inicio : indice + 1;
            const comeco = paraTras ? indice : inicio;
            aplicar(input, texto.slice(0, comeco) + texto.slice(fim), comeco);
        },
    };
}
