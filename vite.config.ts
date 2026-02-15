import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Enable minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        dead_code: true,
        passes: 2,
      },
    },
    // Optimize chunk splitting for better caching and loading
    rollupOptions: {
      output: {
        // Manual chunks to separate vendor code from app code
        manualChunks: (id) => {
          // Phaser library in its own chunk for better caching
          // This large library rarely changes, so browsers can cache it separately
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }
          // Scenes are dynamically imported, so they'll be code-split automatically
          // Systems and utilities in separate chunks
          if (id.includes('/src/systems/')) {
            return 'systems';
          }
          if (id.includes('/src/entities/')) {
            return 'entities';
          }
          // Return undefined to let Vite handle default chunking for remaining files
          return undefined;
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Increase chunk size warning limit (we're addressing it with code splitting)
    chunkSizeWarningLimit: 600,
    // Enable source maps for debugging (can be disabled for production)
    sourcemap: false,
  },
  server: {
    port: 3000,
  },
});
