import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'dist/**',
            'coverage/**',
            '.agents/**',
            '.docs/**',
            'prototype-ex/**',
        ],
    },

    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
            stylistic.configs.customize({
                indent: 4,
                quotes: 'single',
                semi: true,
                jsx: true,
            }),
        ],
        rules: {
            '@stylistic/brace-style': ['error', 'allman'],
            '@stylistic/linebreak-style': ['error', 'unix'],

            '@stylistic/exp-list-style': [
                'error',
                {
                    singleLine: {
                        maxItems: 4,
                    },
                },
            ],

            '@stylistic/max-len': [
                'warn',
                {
                    code: 120,
                    ignoreUrls: true,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                },
            ],
            'sort-imports': [
                'error',
                {
                    ignoreCase: true,
                    ignoreDeclarationSort: true,
                },
            ],
            '@typescript-eslint/member-ordering': [
                'error',
                {
                    classes: {
                        memberTypes: ['field', 'constructor', 'public-method', 'private-method'],
                        order: 'as-written',
                    },
                },
            ],
        },
    },

    {
        files: ['src/**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
            globals: globals.browser,
        },
    },
    {
        files: ['*.{js,mjs,cjs,ts,mts,cts}'],
        languageOptions: {
            globals: globals.node,
        },
    },
);
