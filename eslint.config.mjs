// Minimal flat config: typescript-eslint recommended for TS sources,
// eslint-config-prettier last so formatting stays Prettier's job.
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'media/**', '.agents/**', '.claude/**'],
  },
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, prettier],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Non-null assertions are used deliberately where an invariant is
      // checked by hand right above (array index within bounds, registry
      // entries that always exist); TypeScript's strict flags cover the rest.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Fire-and-forget chrome.runtime/tabs messaging legitimately swallows
      // errors when the extension context or tab has gone away.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    extends: [eslint.configs.recommended, prettier],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
  {
    files: ['**/*.mjs'],
    extends: [eslint.configs.recommended, prettier],
    languageOptions: {
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
)
