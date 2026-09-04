import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://terrawoman.org";

const BRANCH_SLUGS = [
  "healing",
  "wisdom",
  "voice",
  "craft",
  "care",
  "science",
  "leadership",
  "spirit",
] as const;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/invite", changefreq: "monthly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.8" },
          { path: "/roots", changefreq: "weekly", priority: "0.9" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
        ];

        for (const branch of BRANCH_SLUGS) {
          entries.push({ path: `/roots/branch/${branch}`, changefreq: "weekly", priority: "0.6" });
        }

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) {
                  headers.delete("Authorization");
                }
                headers.set("apikey", key);
                return fetch(input, { ...init, headers });
              },
            },
          });

          const pageSize = 1000;
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
              .from("roots_content")
              .select("id")
              .eq("published", true)
              .eq("historical_accuracy_status", "VERIFIED")
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            const rows = data ?? [];
            entries.push(
              ...rows.map((row: { id: string }) => ({
                path: `/roots/${encodeURIComponent(row.id)}`,
                changefreq: "monthly" as const,
                priority: "0.6",
              })),
            );
            if (rows.length < pageSize) break;
          }
        } catch {
          // Fall back to static entries if the archive is unavailable.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
