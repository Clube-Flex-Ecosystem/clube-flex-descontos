import { defineConfig } from 'tsup';

// `@flex/contracts` é publicado como TypeScript; por isso é embutido no bundle.
export default defineConfig({
    entry: ['src/server.ts', 'src/migrate.ts', 'src/seed.ts'],
    format: ['esm'],
    target: 'node24',
    platform: 'node',
    clean: true,
    noExternal: ['@flex/contracts'],
});
