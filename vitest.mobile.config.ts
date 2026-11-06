import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';

export default defineConfig({
  plugins:[react()],
  resolve:{alias:{'@mobile':resolve(__dirname,'mobile'),'@shared':resolve(__dirname,'shared')}},
  test:{environment:'jsdom',setupFiles:['./mobile/test/setup.ts'],include:['mobile/**/*.test.{ts,tsx}','shared/examEngine.test.ts']}
});
