import { defineConfig, tailwindPlugin } from "@teamvelix/velix";

export default defineConfig({
  app: { name: "website" },
  server: { port: parseInt(process.env.PORT || "3000", 10), host: "localhost" },
  seo: { sitemap: true, robots: true, openGraph: true },
  favicon: "/favicon.webp",
  plugins: [
    tailwindPlugin()
  ],
});
