
rules: [
    {
        test: /\.njk$/,
        use: [
            {
                loader: 'simple-nunjucks-loader',
                options: {                        
                    searchPaths: [
                    'node_modules/govuk-frontend/govuk/components/date-input/template.njk'
                    ]
                }
            }
        ]
    }
]