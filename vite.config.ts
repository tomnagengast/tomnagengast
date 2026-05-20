import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function rewriteQrspiUrl(req: { url?: string }) {
  if (req.url === "/notes/qrspi" || req.url === "/notes/qrspi/") {
    req.url = "/notes/qrspi/index.html";
  }
}

function qrspiPrettyUrl() {
  return {
    name: "qrspi-pretty-url",
    configureServer(server: {
      middlewares: {
        use: (
          fn: (req: { url?: string }, _res: unknown, next: () => void) => void,
        ) => void;
      };
    }) {
      server.middlewares.use((req, _res, next) => {
        rewriteQrspiUrl(req);
        next();
      });
    },
    configurePreviewServer(server: {
      middlewares: {
        use: (
          fn: (req: { url?: string }, _res: unknown, next: () => void) => void,
        ) => void;
      };
    }) {
      server.middlewares.use((req, _res, next) => {
        rewriteQrspiUrl(req);
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [qrspiPrettyUrl(), react(), tailwindcss()],
});
