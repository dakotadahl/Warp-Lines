import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
    {
        files: ['**/*.js'],

        plugins: {
            prettier: prettierPlugin,
        },

        rules: {
            ...prettierConfig.rules,
            'prettier/prettier': 'error',
        },
    },
]
