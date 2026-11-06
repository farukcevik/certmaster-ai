import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';

export default defineConfig({
  root:resolve(__dirname,'mobile'),
  plugins:[react()],
  resolve:{alias:{'@mobile':resolve(__dirname,'mobile'),'@shared':resolve(__dirname,'shared')}},
  build:{outDir:resolve(__dirname,'dist-mobile'),emptyOutDir:true,sourcemap:false},
  server:{port:5174,strictPort:true}
});
