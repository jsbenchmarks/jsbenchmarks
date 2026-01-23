import preact from '@preact/preset-vite';
import path from "path";
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [preact()],
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
