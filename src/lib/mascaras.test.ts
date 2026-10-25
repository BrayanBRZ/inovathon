import type { ChangeEvent, KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { parseValor, valorParaCampo } from '@/domain/formato';
import { campoMascarado, mascaraCpf, mascaraTelefone, mascaraValor } from './mascaras';

function entrada(value: string, cursor = value.length): HTMLInputElement
{
    return {
        value,
        selectionStart: cursor,
        selectionEnd: cursor,
        setSelectionRange(inicio: number, fim: number)
        {
            this.selectionStart = inicio;
            this.selectionEnd = fim;
        },
    } as HTMLInputElement;
}

function alterar(input: HTMLInputElement, inputType = 'insertText'): ChangeEvent<HTMLInputElement>
{
    return { currentTarget: input, nativeEvent: { inputType } } as unknown as ChangeEvent<HTMLInputElement>;
}

describe('máscaras durante a entrada', () =>
{
    it.each([
        ['', ''],
        ['1', '1'],
        ['1234', '123.4'],
        ['1234567', '123.456.7'],
        ['12345678909', '123.456.789-09'],
        ['abc123.456.789-091234', '123.456.789-09'],
    ])('formata CPF %s como %s', (texto, esperado) =>
    {
        expect(mascaraCpf(texto)).toBe(esperado);
    });

    it.each([
        ['', ''],
        ['4', '(4'],
        ['443', '(44) 3'],
        ['4434224050', '(44) 3422-4050'],
        ['44999887766', '(44) 99988-7766'],
        ['+55 (44) 99988-7766', '(44) 99988-7766'],
        ['letras (44) 3422-4050', '(44) 3422-4050'],
    ])('formata telefone %s como %s', (texto, esperado) =>
    {
        expect(mascaraTelefone(texto)).toBe(esperado);
    });

    it('insere centavos e milhares a cada dígito e mantém a quantia ao salvar', () =>
    {
        let valor = '';
        const vistos: string[] = [];
        for (const digito of '123456')
        {
            const input = entrada(valor + digito);
            campoMascarado(valor, mascaraValor, texto => valor = texto).onChange(alterar(input));
            vistos.push(valor);
        }
        expect(vistos).toEqual([
            '0,01',
            '0,12',
            '1,23',
            '12,34',
            '123,45',
            '1.234,56',
        ]);
        expect(parseValor(valor)).toBe(1234.56);
        expect(mascaraValor('R$ 1.234,56')).toBe(valor);
        expect(mascaraValor('abc')).toBe('');
    });

    it.each([0, 115, 115.5, 1234.56])('preserva o valor inicial de %s reais', (valor) =>
    {
        const texto = valorParaCampo(valor);
        expect(mascaraValor(texto)).toBe(texto);
        expect(parseValor(texto)).toBe(valor);
    });

    it('formata valores existentes sem esperar uma alteração', () =>
    {
        expect(campoMascarado('44999887766', mascaraTelefone, vi.fn()).value).toBe('(44) 99988-7766');
        expect(campoMascarado('12345678909', mascaraCpf, vi.fn()).value).toBe('123.456.789-09');
    });

    it('preserva o cursor ao inserir um dígito no meio do CPF', () =>
    {
        const atualizar = vi.fn();
        const input = entrada('123.9456.789-09', 5);
        campoMascarado('123.456.789-09', mascaraCpf, atualizar).onChange(alterar(input));
        expect(atualizar).toHaveBeenCalledWith('123.945.678-90');
        expect(input.selectionStart).toBe(5);
    });

    it.each([
        ['Backspace', 4, '124.567.890-9', 2],
        ['Delete', 3, '123.567.890-9', 3],
    ] as const)('permite %s sobre o ponto do CPF', (key, cursor, esperado, destino) =>
    {
        const atualizar = vi.fn();
        const preventDefault = vi.fn();
        const input = entrada('123.456.789-09', cursor);
        const evento = { key, currentTarget: input, preventDefault } as unknown as KeyboardEvent<HTMLInputElement>;
        campoMascarado(input.value, mascaraCpf, atualizar).onKeyDown(evento);
        expect(preventDefault).toHaveBeenCalledOnce();
        expect(atualizar).toHaveBeenCalledWith(esperado);
        expect(input.selectionStart).toBe(destino);
    });

    it('permite apagar a moeda até deixar o campo vazio', () =>
    {
        const atualizar = vi.fn();
        campoMascarado('0,00', mascaraValor, atualizar).onChange(alterar(entrada('0,0'), 'deleteContentBackward'));
        expect(atualizar).toHaveBeenCalledWith('');
        campoMascarado('1.234,56', mascaraValor, atualizar).onChange(alterar(entrada(''), 'deleteContentBackward'));
        expect(atualizar).toHaveBeenLastCalledWith('');
    });

    it.each([
        ['deleteContentBackward', '123456.789-09', 3, '124.567.890-9'],
        ['deleteContentForward', '123456.789-09', 3, '123.567.890-9'],
    ] as const)('exclui sobre separadores no teclado móvel com %s', (tipo, texto, cursor, esperado) =>
    {
        const atualizar = vi.fn();
        campoMascarado('123.456.789-09', mascaraCpf, atualizar).onChange(alterar(entrada(texto, cursor), tipo));
        expect(atualizar).toHaveBeenCalledWith(esperado);
    });
});
