import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        globalSetup: ['test/global-setup.ts'],
        // Os testes compartilham um único banco; execução serial evita dependência de ordem.
        fileParallelism: false,
    },
});
