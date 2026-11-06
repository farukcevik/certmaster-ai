import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({ plugins: [react()], resolve:{alias:{'@':resolve(__dirname,'src'),'@shared':resolve(__dirname,'shared')}}, test:{environment:'jsdom',setupFiles:['./src/test/setup.ts'],include:['src/**/*.test.{ts,tsx}','shared/**/*.test.ts','electron/**/*.test.ts'],exclude:['dist/**','dist-electron/**','e2e/**','node_modules/**'],coverage:{reporter:['text','html']}} });
