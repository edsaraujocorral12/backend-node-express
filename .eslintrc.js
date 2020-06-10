module.exports = {
    env: {
        node: true,
        es6: true,
    },
    extends: [
        'airbnb-base', 'prettier'
    ],
    plugins: ['prettier'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
    },
    rules: {
        "prettier/prettier": "error",
        "class-methods-use-this": "off",
        "no-param-ressign": "off",
        "camelcase": "off",
        "no-unused-vars": ["error", { "argsignorePattern": "next" }]
    },
};
