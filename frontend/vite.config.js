import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Determine the base path based on deployment target
// NETLIFY env var is automatically set in Netlify deployment environment
const isNetlify = process.env.NETLIFY === 'true';


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['@chakra-ui/react'],
  },
  // Use root path for Netlify, and /eventvex for GitHub Pages
  base: isNetlify ? '/' : '/',
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    // Ensure dev server serves at root path
    base: '/',
  },
});