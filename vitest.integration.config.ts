import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    passWithNoTests: false,
    testTimeout: 180_000,
    hookTimeout: 180_000,
    fileParallelism: false,
  },
});
