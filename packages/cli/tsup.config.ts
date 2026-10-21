import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  clean: true,
  // Package workspace ini harus ikut di-bundle: hanya `dist` yang dipublish.
  noExternal: ["@scaff/security-audit"],
});
