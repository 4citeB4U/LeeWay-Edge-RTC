/*
LEEWAY HEADER â€” DO NOT REMOVE
REGION: CONFIG.BUILD.VITE
TAG: CONFIG.VITE.ROOT
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=settings
5WH:
  WHAT = Vite build configuration with SFU proxy and Tailwind v4
  WHY  = Bundles the LeeWay Edge RTC frontend; proxies signaling to the SFU
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = vite.config.ts
  WHEN = 2026
  HOW  = Vite defineConfig with @tailwindcss/vite plugin; server.proxy tunnels
         /ws /dev /health /agents /metrics to SFU on port 3000
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  // In production (GitHub Pages), VITE_BASE_URL sets the subdirectory path.
  // e.g. if deployed to https://username.github.io/LeeWay-Edge-RTC-main/
  // set VITE_BASE_URL=/LeeWay-Edge-RTC-main/ in the GitHub Actions secret.
  // Leave blank to deploy to the repo's root Pages URL.
  const base = env.VITE_BASE_URL || '/';

  return {
    base,
    plugins: [react(), tailwindcss()],
    // No external vendor API keys — LeeWay Edge RTC is fully self-hosted.
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      // Dev proxy — tunnels signaling requests to local SFU on port 3000.
      // In production, VITE_SIGNALING_URL / VITE_HTTP_BASE_URL point at Fly.io.
      proxy: {
        '/ws':      { target: 'ws://localhost:3000',  ws: true,  changeOrigin: true },
        '/dev':     { target: 'http://localhost:3000', changeOrigin: true },
        '/health':  { target: 'http://localhost:3000', changeOrigin: true },
        '/agents':  { target: 'http://localhost:3000', changeOrigin: true },
        '/metrics': { target: 'http://localhost:3000', changeOrigin: true },
      },
    },
  };
});
