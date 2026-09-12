import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: { 
    format: "es",
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react";
          if (id.includes("node_modules/uplot")) return "uplot";
          if (id.includes("node_modules/@tanstack")) return "tanstack";
          if (id.includes("node_modules/zustand")) return "zustand";
        },
      },
    },
  },
  server: {
    port: 5173,
    // Allow large CSV file
    fs: {
      strict: false,
    },
  },
  assetsInclude: ["**/*.csv"],
});
