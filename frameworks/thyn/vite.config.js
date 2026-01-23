import thyn from "@thyn/vite-plugin";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [thyn()],
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
