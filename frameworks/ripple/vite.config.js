import { ripple } from '@ripple-ts/vite-plugin';
import path from "path";
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    "process.env.NODE_ENV": `"production"`,
  },
  plugins: [ripple()],
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
