import { defineConfig, tailwindPlugin } from "velix";

export default defineConfig({
  app: {
    name: "../demo-app",
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
