import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills';


export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  plugins: [tailwindcss(),
  react(),
  nodePolyfills({
    globals: {
      process: true,
      Buffer: true,
    },
    protocolImports: true,
  }),],
})
