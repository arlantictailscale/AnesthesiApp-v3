import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "android", "mobile", "mobile-kotlin"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: ["lib/**/*.ts", "utils/**/*.ts", "hooks/**/*.ts", "middleware.ts"],
      exclude: ["**/*.d.ts", "**/*.{test,spec}.{ts,tsx}"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
})
