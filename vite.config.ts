// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro, VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    preview: {
      allowedHosts: [
        "ligadechalucune.onrender.com",
      ],
    },
  },

  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts
    server: {
      entry: "server",
    },
  },
});
