// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'chrome',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // absolute paths so resolution can't fail
        content:    path.resolve(__dirname, 'chrome/src/content/content.js'),
        background: path.resolve(__dirname, 'chrome/src/background/background.js'),
        popup:      path.resolve(__dirname, 'chrome/src/popup/popup.html'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'content/[name].js',
        chunkFileNames: 'content/chunk-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
