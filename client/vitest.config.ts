import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        root: path.resolve(__dirname),
        include: ['src/**/*.test.tsx'],
        exclude: ['node_modules', 'dist'],
        setupFiles: ['./test/setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@shared': path.resolve(__dirname, '../shared')
        }
    }
});
