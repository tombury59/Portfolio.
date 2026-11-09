import { defineConfig } from "vite";

// three.js lives in its own lazy chunk (src/scene), so the page itself stays tiny
export default defineConfig({
  build: { target: "es2022", chunkSizeWarningLimit: 700 },
});
