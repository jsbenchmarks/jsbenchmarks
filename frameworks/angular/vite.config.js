import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [angular({ tsconfig: './tsconfig.json' })],
  resolve: {
    alias: {
      "common": path.resolve(__dirname, "../../common"),
    },
  },
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    modulePreload: false,
  },
});
