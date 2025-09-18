// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const pxe = env.PXE_URL || 'https://pxe.warptoad.xyz';

  const envObj = { PXE_URL: pxe }; // <- single source of truth

  return {
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
        define: {
          // make node_modules see a concrete env object
          'process.env': JSON.stringify(envObj),
        },
      },
    },
    define: {
      // make your app code see the same env object
      'process.env': JSON.stringify(envObj),
    },
    plugins: [
      tailwindcss(),
      react(),
      nodePolyfills({
        globals: { process: true, Buffer: true },
        protocolImports: true,
      }),
    ],
  };
});
