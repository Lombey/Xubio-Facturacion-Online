module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: 'espree'
  },
  plugins: [
    'vue'
  ],
  rules: {
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn'
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.js', '*.config.cjs']
};
