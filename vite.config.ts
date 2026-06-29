import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path is configurable so the same build works on Vercel/Netlify (base "/")
// and on GitHub Pages (base "/<repo>/"). Set DEPLOY_BASE at build time if needed.
export default defineConfig({
  plugins: [react()],
  base: process.env.DEPLOY_BASE || '/',
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
