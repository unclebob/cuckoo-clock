import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const pageGoneMs = 1000;

function exitWhenPageCloses(): Plugin {
  return {
    name: "exit-when-page-closes",
    configureServer(server) {
      let pageOpened = false;
      let wait: ReturnType<typeof setTimeout> | undefined;
      let leaving = false;

      const leave = () => {
        if (leaving) {
          return;
        }
        leaving = true;
        if (wait) {
          clearTimeout(wait);
          wait = undefined;
        }
        void server.close().finally(() => {
          const runtime = globalThis as { process?: { exit(code?: number): never } };
          runtime.process?.exit(0);
        });
      };

      server.ws.on("connection", (socket) => {
        pageOpened = true;
        if (wait) {
          clearTimeout(wait);
          wait = undefined;
        }
        socket.on("close", () => {
          if (leaving || server.ws.clients.size > 0) {
            return;
          }
          wait = setTimeout(() => {
            wait = undefined;
            if (pageOpened && server.ws.clients.size === 0) {
              leave();
            }
          }, pageGoneMs);
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [exitWhenPageCloses()],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
