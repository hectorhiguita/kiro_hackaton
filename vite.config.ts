import { defineConfig } from "vite";

// base relativa para que el sitio funcione bajo https://<usuario>.github.io/<repo>/
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
});
