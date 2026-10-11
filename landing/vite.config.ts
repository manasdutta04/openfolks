import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

// Static site: `base: "./"` keeps asset URLs relative so it works from a
// GitHub Pages project path as well as from a custom domain.
export default defineConfig({
  root,
  base: "./",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true, target: "es2022" },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.OPENFOLKS_LANDING_PORT) || 5290,
    // crew data is read straight from ../crews
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
});
