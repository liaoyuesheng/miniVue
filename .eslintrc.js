module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    commonjs: true,
    amd: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  globals: {},
  rules: {
    semi: ['error', 'never'],
    indent: ['error', 2, {'SwitchCase': 1}],
    'comma-dangle': ['error', {
      objects: 'always',
    }],
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    'no-cond-assign': 0,
  },
}
