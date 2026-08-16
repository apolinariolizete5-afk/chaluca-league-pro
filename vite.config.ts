// @lovable.dev/vite-tanstack-config already includes the required
// TanStack Start, React, Tailwind, Nitro and other plugins.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,

  tanstackStart: {
    // Use src/server.ts as the SSR server entry.
    server: {
      entry: "server",
    },
  },
});
