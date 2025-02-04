import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on mode
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        optimizeDeps: {
            exclude: ['lucide-react'],
        },
        define: {
            // Define global env variables
            'process.env': env,
        },
        build: {
            outDir: 'dist',
            sourcemap: true,
            // Ensure assets are placed in a predictable location
            assetsDir: 'assets',
            // Generate a manifest for better caching
            manifest: true,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
                    },
                },
            },
        },
        server: {
            proxy: {
                '/api': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                },
            },
        },
    };
});
