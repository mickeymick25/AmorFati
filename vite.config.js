import { defineConfig } from "vite";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

function copyServiceWorkerPlugin() {
  return {
    name: "copy-service-worker",
    closeBundle() {
      const outDir = "dist";
      const swSource = "service-worker.js";
      const swDest = join(outDir, "service-worker.js");

      if (existsSync(swSource)) {
        if (!existsSync(outDir)) {
          mkdirSync(outDir, { recursive: true });
        }
        copyFileSync(swSource, swDest);
        console.log("[copy-sw] service-worker.js copied to dist/");
      }
    },
  };
}

export default defineConfig({
  base: "/AmorFati/",
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  plugins: [copyServiceWorkerPlugin()],
});
