module.exports = {
    todo: {
        input: '../api-spec/openapi.yaml',
        output: {
            mode: 'tags-split',
            target: 'generated/endpoints.ts',
            schemas: 'generated/model',
            client: 'react-query',
            baseUrl: 'http://localhost:3000',
        },
    },
};
