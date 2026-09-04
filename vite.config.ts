// ============= Full file contents =============

// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: {
        // Pin entities (React Email dependency chain) to the hoisted v4.5.0
        // copy — nested v7 copies removed ./lib/decode.js and break SSR.
        "entities/lib/decode.js": path.resolve(
          __dirname,
          "node_modules/entities/lib/decode.js",
        ),
        "entities/lib/encode.js": path.resolve(
          __dirname,
          "node_modules/entities/lib/encode.js",
        ),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },
    plugins: [
      {
        // Server routes (email sending, webhooks) read non-VITE_ env vars such
        // as LOVABLE_API_KEY and SUPABASE_SERVICE_ROLE_KEY from process.env.
        // Load the full .env into process.env for server-side code only —
        // never expose these keys through client envDefine.
        name: "load-server-env",
        config(_config, { mode }) {
          const serverEnv = loadEnv(mode, process.cwd(), "");
          Object.assign(process.env, serverEnv);
        },
      },
    ],
  },
});
