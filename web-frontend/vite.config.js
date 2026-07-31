import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Keep the historical REACT_APP_ prefix (matches .env.example, the
  // infra Dockerfiles, and Kubernetes manifests, which all pass
  // REACT_APP_* build args) while also allowing the modern VITE_ prefix.
  envPrefix: ["REACT_APP_", "VITE_"],

  // This project's source lives in plain .js files that contain JSX
  // (a Create React App convention). esbuild only parses JSX in .jsx
  // files by default, so we tell it to treat .js files under src/ as
  // JSX too, avoiding a large rename-and-fix-imports pass.
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },

  server: {
    port: 3000,
    open: false,
    // Equivalent of CRA's "proxy" field: forward API calls to the
    // backend during local development.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 3000,
  },

  build: {
    // Match the output directory the infra Dockerfile/nginx config and
    // Kubernetes manifests already expect (COPY --from=builder /app/build).
    outDir: "build",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@mui/lab",
            "@emotion/react",
            "@emotion/styled",
          ],
          "vendor-charts": ["chart.js", "react-chartjs-2", "d3"],
          "vendor-web3": ["web3"],
        },
      },
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
    css: true,
  },
});
