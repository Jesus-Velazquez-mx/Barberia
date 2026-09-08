import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

export default [
    {
        ignores: ['dist/**'],
    },
    {
        files: ['**/*.{ts,tsx}'],
    },
    {
        languageOptions: { globals: globals.browser },
        settings: { react: { version: '19.2.8' } },
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    pluginReact.configs.flat['jsx-runtime'],
];
