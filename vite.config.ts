import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function rewriteQrptspiUrl(req: { url?: string }) {
  if (req.url === "/notes/qrptspi" || req.url === "/notes/qrptspi/") {
    req.url = "/notes/qrptspi/index.html";
  }
}

function qrptspiPrettyUrl() {
  return {
    name: "qrptspi-pretty-url",
    configureServer(server: {
      middlewares: {
        use: (
          fn: (req: { url?: string }, _res: unknown, next: () => void) => void,
        ) => void;
      };
    }) {
      server.middlewares.use((req, _res, next) => {
        rewriteQrptspiUrl(req);
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
        rewriteQrptspiUrl(req);
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [qrptspiPrettyUrl(), react(), tailwindcss()],
});
