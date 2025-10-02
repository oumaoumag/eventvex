import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isNetlify = process.env.NETLIFY === 'true';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@chakra-ui/react', 'buffer'],
  },
  base: isNetlify ? '/' : '/',
  server: {
    port: 5173,
    host: true,
    base: '/',
  },
});