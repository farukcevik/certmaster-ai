import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({ plugins: [react()], resolve: { alias: { '@': resolve(__dirname, 'src'), '@shared': resolve(__dirname, 'shared') } }, base: './', build:{rollupOptions:{output:{manualChunks:{react:['react','react-dom','react-router-dom'],charts:['recharts'],i18n:['i18next','react-i18next'],icons:['lucide-react']}}}} });
