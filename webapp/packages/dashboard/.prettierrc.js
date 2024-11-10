module.exports = {
    singleQuote: true,
    trailingComma: 'all',
    tabWidth: 4,
    organizeImportsSkipDestructiveCodeActions: true,
    overrides: [
        {
            files: 'docs/**/*.(md|mdx|yaml|yml)',
            options: {
                useTabs: false,
                tabWidth: 2,
            },
        },
    ],
    bracketSameLine: false,
};
