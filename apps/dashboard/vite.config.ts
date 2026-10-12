import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        // Roteamento por arquivos com divisão automática de código por rota; deve preceder o React.
        tanstackRouter({ target: 'react', autoCodeSplitting: true }),
        react(),
        tailwindcss(),
    ],
});
