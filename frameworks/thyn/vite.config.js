import thyn from "@thyn/core";
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
