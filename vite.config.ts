// @lovable.dev/vite-tanstack-config already includes the required
// TanStack Start, React, Tailwind, Nitro and other plugins.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    preview: {
      allowedHosts: ["ligadechalucune.onrender.com"],
    },
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  nitro: {
    preset: "node",
  },
});
