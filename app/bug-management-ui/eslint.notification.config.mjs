import js from '@eslint/js';

// Fallback N2 tập trung: config Fiori hiện có import Babel parser dev-only không nằm trong lock tree.
export default [
    js.configs.recommended,
    {
        files: ['webapp/ext/notification/**/*.js', 'webapp/Component.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                sap: 'readonly',
                document: 'readonly',
                window: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly'
            }
        }
    }
];
