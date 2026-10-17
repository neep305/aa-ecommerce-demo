import crypto from "node:crypto";

// Node.js 20.11.x 호환성을 위한 crypto.hash 폴리필
if (typeof (crypto as any).hash !== "function") {
  (crypto as any).hash = function (
    algorithm: string,
    data: crypto.BinaryLike,
    outputEncoding: crypto.BinaryToTextEncoding = "hex"
  ) {
    return crypto.createHash(algorithm).update(data).digest(outputEncoding);
  };
}

import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { authApiMiddleware } from "./server/auth-api";

function authApiPlugin(): Plugin {
  return {
    name: "auth-api-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void authApiMiddleware(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void authApiMiddleware(req, res, next);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), authApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
