/**
 * Velix v5 Metadata & SEO System
 *
 * First-class SEO with automatic:
 * - Meta tags, Open Graph, Twitter Cards
 * - Canonical URLs, robots, sitemaps
 * - JSON-LD structured data
 * - Viewport, theme color, icons
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Types (comprehensive metadata interface)
// ============================================================================

export interface Metadata {
  title?: string | { default: string; template?: string; absolute?: string };
  description?: string;
  keywords?: string | string[];
  authors?: Author | Author[];
  creator?: string;
  publisher?: string;
  robots?: Robots | string;
  icons?: Icons;
  manifest?: string;
  openGraph?: OpenGraph;
  twitter?: Twitter;
  verification?: Verification;
  alternates?: Alternates;
  viewport?: Viewport | string;
  themeColor?: ThemeColor | ThemeColor[];
  colorScheme?: 'normal' | 'light' | 'dark' | 'light dark' | 'dark light';
  formatDetection?: FormatDetection;
  metadataBase?: URL | string;
  generator?: string;
  applicationName?: string;
  referrer?: string;
  other?: Record<string, string | string[]>;
}

export interface Author { name?: string; url?: string; }
export interface Robots { index?: boolean; follow?: boolean; noarchive?: boolean; nosnippet?: boolean; noimageindex?: boolean; nocache?: boolean; googleBot?: Robots | string; }
export interface Icons { icon?: IconDescriptor | IconDescriptor[]; shortcut?: IconDescriptor | IconDescriptor[]; apple?: IconDescriptor | IconDescriptor[]; other?: IconDescriptor[]; }
export interface IconDescriptor { url: string; type?: string; sizes?: string; color?: string; rel?: string; media?: string; }
export interface OpenGraph {
  type?: string; url?: string; title?: string; description?: string; siteName?: string;
  locale?: string; images?: OGImage | OGImage[]; videos?: OGVideo | OGVideo[];
  determiner?: string; publishedTime?: string; modifiedTime?: string;
  expirationTime?: string; authors?: string | string[]; section?: string; tags?: string[];
}
export interface OGImage { url: string; secureUrl?: string; type?: string; width?: number; height?: number; alt?: string; }
export interface OGVideo { url: string; secureUrl?: string; type?: string; width?: number; height?: number; }
export interface Twitter {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string; siteId?: string; creator?: string; creatorId?: string;
  title?: string; description?: string; images?: string | TwitterImage | (string | TwitterImage)[];
}
export interface TwitterImage { url: string; alt?: string; }
export interface Verification { google?: string | string[]; yahoo?: string | string[]; yandex?: string | string[]; other?: Record<string, string | string[]>; }
export interface Alternates { canonical?: string; languages?: Record<string, string>; media?: Record<string, string>; }
export interface Viewport { width?: number | 'device-width'; height?: number | 'device-height'; initialScale?: number; minimumScale?: number; maximumScale?: number; userScalable?: boolean; viewportFit?: 'auto' | 'cover' | 'contain'; }
export interface ThemeColor { color: string; media?: string; }
export interface FormatDetection { telephone?: boolean; date?: boolean; address?: boolean; email?: boolean; }

// ============================================================================
// Metadata Tag Generation
// ============================================================================

export function generateMetadataTags(metadata: Metadata, baseUrl?: string): string {
  const tags: string[] = [];
  const base = baseUrl || metadata.metadataBase?.toString() || '';

  // Title
  if (metadata.title) {
    const title = typeof metadata.title === 'string'
      ? metadata.title
      : metadata.title.absolute || (metadata.title.template
        ? metadata.title.template.replace('%s', metadata.title.default)
        : metadata.title.default);
    tags.push(`<title>${escapeHtml(title)}</title>`);
  }

  if (metadata.description) tags.push(`<meta name="description" content="${escapeHtml(metadata.description)}">`);

  if (metadata.keywords) {
    const kw = Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords;
    tags.push(`<meta name="keywords" content="${escapeHtml(kw)}">`);
  }

  if (metadata.authors) {
    const authors = Array.isArray(metadata.authors) ? metadata.authors : [metadata.authors];
    authors.forEach(a => {
      if (a.name) tags.push(`<meta name="author" content="${escapeHtml(a.name)}">`);
      if (a.url) tags.push(`<link rel="author" href="${a.url}">`);
    });
  }

  if (metadata.generator) tags.push(`<meta name="generator" content="${escapeHtml(metadata.generator)}">`);
  if (metadata.applicationName) tags.push(`<meta name="application-name" content="${escapeHtml(metadata.applicationName)}">`);
  if (metadata.referrer) tags.push(`<meta name="referrer" content="${metadata.referrer}">`);

  // Robots
  if (metadata.robots) {
    if (typeof metadata.robots === 'string') {
      tags.push(`<meta name="robots" content="${metadata.robots}">`);
    } else {
      tags.push(`<meta name="robots" content="${generateRobotsContent(metadata.robots)}">`);
      if (metadata.robots.googleBot) {
        const gbc = typeof metadata.robots.googleBot === 'string' ? metadata.robots.googleBot : generateRobotsContent(metadata.robots.googleBot);
        tags.push(`<meta name="googlebot" content="${gbc}">`);
      }
    }
  }

  // Viewport
  if (metadata.viewport) {
    const vc = typeof metadata.viewport === 'string' ? metadata.viewport : generateViewportContent(metadata.viewport);
    tags.push(`<meta name="viewport" content="${vc}">`);
  }

  // Theme Color
  if (metadata.themeColor) {
    const tcs = Array.isArray(metadata.themeColor) ? metadata.themeColor : [metadata.themeColor];
    tcs.forEach(tc => {
      const media = typeof tc !== 'string' && tc.media ? ` media="${tc.media}"` : '';
      const color = typeof tc === 'string' ? tc : tc.color;
      tags.push(`<meta name="theme-color" content="${color}"${media}>`);
    });
  }

  if (metadata.colorScheme) tags.push(`<meta name="color-scheme" content="${metadata.colorScheme}">`);

  // Icons
  if (metadata.icons) {
    const addIcon = (icon: IconDescriptor, defaultRel: string) => {
      const rel = icon.rel || defaultRel;
      const attrs = [
        icon.type ? ` type="${icon.type}"` : '',
        icon.sizes ? ` sizes="${icon.sizes}"` : '',
        icon.color ? ` color="${icon.color}"` : '',
      ].join('');
      tags.push(`<link rel="${rel}" href="${resolveUrl(icon.url, base)}"${attrs}>`);
    };
    if (metadata.icons.icon) { (Array.isArray(metadata.icons.icon) ? metadata.icons.icon : [metadata.icons.icon]).forEach(i => addIcon(i, 'icon')); }
    if (metadata.icons.apple) { (Array.isArray(metadata.icons.apple) ? metadata.icons.apple : [metadata.icons.apple]).forEach(i => addIcon(i, 'apple-touch-icon')); }
  }

  if (metadata.manifest) tags.push(`<link rel="manifest" href="${resolveUrl(metadata.manifest, base)}">`);

  // Open Graph
  if (metadata.openGraph) {
    const og = metadata.openGraph;
    if (og.type) tags.push(`<meta property="og:type" content="${og.type}">`);
    if (og.title) tags.push(`<meta property="og:title" content="${escapeHtml(og.title)}">`);
    if (og.description) tags.push(`<meta property="og:description" content="${escapeHtml(og.description)}">`);
    if (og.url) tags.push(`<meta property="og:url" content="${resolveUrl(og.url, base)}">`);
    if (og.siteName) tags.push(`<meta property="og:site_name" content="${escapeHtml(og.siteName)}">`);
    if (og.locale) tags.push(`<meta property="og:locale" content="${og.locale}">`);
    if (og.images) {
      (Array.isArray(og.images) ? og.images : [og.images]).forEach(img => {
        tags.push(`<meta property="og:image" content="${resolveUrl(img.url, base)}">`);
        if (img.width) tags.push(`<meta property="og:image:width" content="${img.width}">`);
        if (img.height) tags.push(`<meta property="og:image:height" content="${img.height}">`);
        if (img.alt) tags.push(`<meta property="og:image:alt" content="${escapeHtml(img.alt)}">`);
      });
    }
    if (og.type === 'article') {
      if (og.publishedTime) tags.push(`<meta property="article:published_time" content="${og.publishedTime}">`);
      if (og.modifiedTime) tags.push(`<meta property="article:modified_time" content="${og.modifiedTime}">`);
      if (og.tags) og.tags.forEach(t => tags.push(`<meta property="article:tag" content="${escapeHtml(t)}">`));
    }
  }

  // Twitter
  if (metadata.twitter) {
    const tw = metadata.twitter;
    if (tw.card) tags.push(`<meta name="twitter:card" content="${tw.card}">`);
    if (tw.site) tags.push(`<meta name="twitter:site" content="${tw.site}">`);
    if (tw.creator) tags.push(`<meta name="twitter:creator" content="${tw.creator}">`);
    if (tw.title) tags.push(`<meta name="twitter:title" content="${escapeHtml(tw.title)}">`);
    if (tw.description) tags.push(`<meta name="twitter:description" content="${escapeHtml(tw.description)}">`);
    if (tw.images) {
      (Array.isArray(tw.images) ? tw.images : [tw.images]).forEach(img => {
        const url = typeof img === 'string' ? img : img.url;
        tags.push(`<meta name="twitter:image" content="${resolveUrl(url, base)}">`);
      });
    }
  }

  // Verification
  if (metadata.verification) {
    if (metadata.verification.google) {
      (Array.isArray(metadata.verification.google) ? metadata.verification.google : [metadata.verification.google])
        .forEach(v => tags.push(`<meta name="google-site-verification" content="${v}">`));
    }
  }

  // Alternates
  if (metadata.alternates) {
    if (metadata.alternates.canonical) tags.push(`<link rel="canonical" href="${resolveUrl(metadata.alternates.canonical, base)}">`);
    if (metadata.alternates.languages) {
      Object.entries(metadata.alternates.languages).forEach(([lang, url]) => {
        tags.push(`<link rel="alternate" hreflang="${lang}" href="${resolveUrl(url, base)}">`);
      });
    }
  }

  return tags.join('\n    ');
}

// ============================================================================
// Merge & JSON-LD
// ============================================================================

export function mergeMetadata(parent: Metadata, child: Metadata): Metadata {
  return {
    ...parent, ...child,
    openGraph: child.openGraph ? { ...parent.openGraph, ...child.openGraph } : parent.openGraph,
    twitter: child.twitter ? { ...parent.twitter, ...child.twitter } : parent.twitter,
    icons: child.icons ? { ...parent.icons, ...child.icons } : parent.icons,
    alternates: child.alternates ? { ...parent.alternates, ...child.alternates } : parent.alternates,
  };
}

export function generateJsonLd(data: Record<string, any>): string {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

export const jsonLd = {
  website: (c: { name: string; url: string; description?: string }) => ({
    '@context': 'https://schema.org', '@type': 'WebSite', name: c.name, url: c.url, description: c.description
  }),
  article: (c: { headline: string; description?: string; image?: string | string[]; datePublished: string; dateModified?: string; author: { name: string; url?: string } | { name: string; url?: string }[] }) => ({
    '@context': 'https://schema.org', '@type': 'Article', headline: c.headline, description: c.description,
    image: c.image, datePublished: c.datePublished, dateModified: c.dateModified || c.datePublished,
    author: Array.isArray(c.author) ? c.author.map(a => ({ '@type': 'Person', ...a })) : { '@type': 'Person', ...c.author }
  }),
  organization: (c: { name: string; url: string; logo?: string; sameAs?: string[] }) => ({
    '@context': 'https://schema.org', '@type': 'Organization', name: c.name, url: c.url, logo: c.logo, sameAs: c.sameAs
  }),
  breadcrumb: (items: { name: string; url: string }[]) => ({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
  }),
};

// ============================================================================
// Automatic SEO Generation
// ============================================================================

/**
 * Generate sitemap.xml content from routes
 */
export function generateSitemap(routes: any[], baseUrl: string): string {
  const urls = routes
    .filter(r => r.type === 'page' && !r.path.includes(':') && !r.path.includes('*'))
    .map(r => {
      const loc = `${baseUrl.replace(/\/$/, '')}${r.path}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${r.path === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(baseUrl: string, options: { disallow?: string[]; allow?: string[] } = {}): string {
  const lines = ['User-agent: *'];
  if (options.allow) options.allow.forEach(p => lines.push(`Allow: ${p}`));
  if (options.disallow) options.disallow.forEach(p => lines.push(`Disallow: ${p}`));
  else lines.push('Allow: /');
  lines.push('', `Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml`);
  return lines.join('\n');
}

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function resolveUrl(url: string, base: string): string {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
  return base ? `${base.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}` : url;
}

function generateRobotsContent(robots: Robots): string {
  const parts: string[] = [];
  if (robots.index !== undefined) parts.push(robots.index ? 'index' : 'noindex');
  if (robots.follow !== undefined) parts.push(robots.follow ? 'follow' : 'nofollow');
  if (robots.noarchive) parts.push('noarchive');
  if (robots.nosnippet) parts.push('nosnippet');
  if (robots.noimageindex) parts.push('noimageindex');
  return parts.join(', ') || 'index, follow';
}

function generateViewportContent(viewport: Viewport): string {
  const parts: string[] = [];
  if (viewport.width) parts.push(`width=${viewport.width}`);
  if (viewport.height) parts.push(`height=${viewport.height}`);
  if (viewport.initialScale !== undefined) parts.push(`initial-scale=${viewport.initialScale}`);
  if (viewport.maximumScale !== undefined) parts.push(`maximum-scale=${viewport.maximumScale}`);
  if (viewport.userScalable !== undefined) parts.push(`user-scalable=${viewport.userScalable ? 'yes' : 'no'}`);
  return parts.join(', ') || 'width=device-width, initial-scale=1';
}

export default { generateMetadataTags, mergeMetadata, generateJsonLd, jsonLd, generateSitemap, generateRobotsTxt };
