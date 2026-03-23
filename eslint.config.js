import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        globalThis: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Headers: 'readonly',
        EventSource: 'readonly',
        fetch: 'readonly',
        window: 'readonly',
        document: 'readonly',
        location: 'readonly',
        requestIdleCallback: 'readonly',
        IntersectionObserver: 'readonly',
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.velix/**',
      'templates/**',
    ]
  }
];
