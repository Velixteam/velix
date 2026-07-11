import { defineConfig, tailwindPlugin } from "@teamvelix/velix";

export default defineConfig({
  app: {
    name: "test",
  },
  server: {
    port: 3000,
    host: "localhost",
  },
  seo: {
    sitemap: true,
    robots: true,
    openGraph: true,
  },
  favicon: "/favicon.webp",
  plugins: [
    tailwindPlugin()
  ],
});
