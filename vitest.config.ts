import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    // Acota las pruebas a la app de la spec; excluye el proyecto de referencia `pasaporte/`.
    include: ["src/**/*.{test,spec}.ts", "tests/**/*.{test,spec}.ts"],
    exclude: ["node_modules/**", "dist/**", "pasaporte/**"],
  },
});
