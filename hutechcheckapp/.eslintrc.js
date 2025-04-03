module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:kdu/kdu3-essential',
    'eslint:recommended',
    '@kdujs/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'kdu/no-deprecated-slot-attribute': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  }
}
