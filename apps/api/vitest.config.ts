// Unit tests only — dist/ holds SAM packaging output, not tests
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"], exclude: ["node_modules", "dist"] },
});
