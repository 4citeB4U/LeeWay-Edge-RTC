import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/sdk/index.ts'),
      name: 'LeewaySDK',
      fileName: (format) => `leeway-sdk.${format}.js`
    },
    rollupOptions: {
      // Ensure we don't bundle dependencies that should be provided by the consumer
      external: ['react', 'react-dom', 'framer-motion', 'lucide-react', 'recharts', 'mediasoup-client'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'framer-motion': 'FramerMotion',
          'lucide-react': 'LucideReact',
          'recharts': 'Recharts',
          'mediasoup-client': 'MediasoupClient'
        }
      }
    }
  }
});
