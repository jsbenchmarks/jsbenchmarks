import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from "path";
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
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
})
