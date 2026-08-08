import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : fonctionne aussi bien sur
  // https://<user>.github.io/village-maudit/ que sur le domaine custom.
  base: "./",
  build: {
    outDir: "dist",
  },
});
