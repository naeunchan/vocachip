import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/ai": {
        target: process.env.VITE_AI_PROXY_TARGET ?? "http://127.0.0.1:8787",
        changeOrigin: true,
      },
      "/api/dictionary": {
        target: process.env.VITE_AI_PROXY_TARGET ?? "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react")) {
            return "react-vendor";
          }

          if (
            id.includes("@toss/tds-mobile") ||
            id.includes("@toss/tds-mobile-ait") ||
            id.includes("@toss/tds-colors")
          ) {
            return "tds-vendor";
          }

          if (id.includes("@apps-in-toss/web-framework")) {
            return "framework-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
