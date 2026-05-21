import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const STANDALONE_SLUGS = ["qrptspi", "otel"];

function rewriteStandaloneUrl(req: { url?: string }) {
  if (!req.url) return;
  for (const slug of STANDALONE_SLUGS) {
    if (req.url === `/notes/${slug}` || req.url === `/notes/${slug}/`) {
      req.url = `/notes/${slug}/index.html`;
      return;
    }
  }
}

function standalonePrettyUrl() {
  return {
    name: "standalone-pretty-url",
    configureServer(server: {
      middlewares: {
        use: (
          fn: (req: { url?: string }, _res: unknown, next: () => void) => void,
        ) => void;
      };
    }) {
      server.middlewares.use((req, _res, next) => {
        rewriteStandaloneUrl(req);
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
        rewriteStandaloneUrl(req);
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [standalonePrettyUrl(), react(), tailwindcss()],
});
