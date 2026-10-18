import { defineConfig, tailwindPlugin } from "@teamvelix/velix";

export default defineConfig({
  app: { name: "VelixDesk" },
  server: { port: 3001, host: "localhost" },
  seo: { sitemap: true, robots: true, openGraph: true },
  favicon: "/favicon.webp",
  plugins: [
    tailwindPlugin()
  ],
});
