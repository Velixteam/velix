/**
 * Velix v5 Metadata & SEO System
 *
 * First-class SEO with automatic:
 * - Meta tags, Open Graph, Twitter Cards
 * - Canonical URLs, robots, sitemaps
 * - JSON-LD structured data
 * - Viewport, theme color, icons
 */
export interface Metadata {
    title?: string | {
        default: string;
        template?: string;
        absolute?: string;
    };
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
export interface Author {
    name?: string;
    url?: string;
}
export interface Robots {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
    noimageindex?: boolean;
    nocache?: boolean;
    googleBot?: Robots | string;
}
export interface Icons {
    icon?: IconDescriptor | IconDescriptor[];
    shortcut?: IconDescriptor | IconDescriptor[];
    apple?: IconDescriptor | IconDescriptor[];
    other?: IconDescriptor[];
}
export interface IconDescriptor {
    url: string;
    type?: string;
    sizes?: string;
    color?: string;
    rel?: string;
    media?: string;
}
export interface OpenGraph {
    type?: string;
    url?: string;
    title?: string;
    description?: string;
    siteName?: string;
    locale?: string;
    images?: OGImage | OGImage[];
    videos?: OGVideo | OGVideo[];
    determiner?: string;
    publishedTime?: string;
    modifiedTime?: string;
    expirationTime?: string;
    authors?: string | string[];
    section?: string;
    tags?: string[];
}
export interface OGImage {
    url: string;
    secureUrl?: string;
    type?: string;
    width?: number;
    height?: number;
    alt?: string;
}
export interface OGVideo {
    url: string;
    secureUrl?: string;
    type?: string;
    width?: number;
    height?: number;
}
export interface Twitter {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    siteId?: string;
    creator?: string;
    creatorId?: string;
    title?: string;
    description?: string;
    images?: string | TwitterImage | (string | TwitterImage)[];
}
export interface TwitterImage {
    url: string;
    alt?: string;
}
export interface Verification {
    google?: string | string[];
    yahoo?: string | string[];
    yandex?: string | string[];
    other?: Record<string, string | string[]>;
}
export interface Alternates {
    canonical?: string;
    languages?: Record<string, string>;
    media?: Record<string, string>;
}
export interface Viewport {
    width?: number | 'device-width';
    height?: number | 'device-height';
    initialScale?: number;
    minimumScale?: number;
    maximumScale?: number;
    userScalable?: boolean;
    viewportFit?: 'auto' | 'cover' | 'contain';
}
export interface ThemeColor {
    color: string;
    media?: string;
}
export interface FormatDetection {
    telephone?: boolean;
    date?: boolean;
    address?: boolean;
    email?: boolean;
}
export declare function generateMetadataTags(metadata: Metadata, baseUrl?: string): string;
export declare function mergeMetadata(parent: Metadata, child: Metadata): Metadata;
export declare function generateJsonLd(data: Record<string, unknown>): string;
export declare const jsonLd: {
    website: (c: {
        name: string;
        url: string;
        description?: string;
    }) => {
        '@context': string;
        '@type': string;
        name: string;
        url: string;
        description: string | undefined;
    };
    article: (c: {
        headline: string;
        description?: string;
        image?: string | string[];
        datePublished: string;
        dateModified?: string;
        author: {
            name: string;
            url?: string;
        } | {
            name: string;
            url?: string;
        }[];
    }) => {
        '@context': string;
        '@type': string;
        headline: string;
        description: string | undefined;
        image: string | string[] | undefined;
        datePublished: string;
        dateModified: string;
        author: {
            name: string;
            url?: string;
            '@type': string;
        }[] | {
            name: string;
            url?: string;
            '@type': string;
        };
    };
    organization: (c: {
        name: string;
        url: string;
        logo?: string;
        sameAs?: string[];
    }) => {
        '@context': string;
        '@type': string;
        name: string;
        url: string;
        logo: string | undefined;
        sameAs: string[] | undefined;
    };
    breadcrumb: (items: {
        name: string;
        url: string;
    }[]) => {
        '@context': string;
        '@type': string;
        itemListElement: {
            '@type': string;
            position: number;
            name: string;
            item: string;
        }[];
    };
};
/**
 * Generate sitemap.xml content from routes
 */
export declare function generateSitemap(routes: Array<{
    type: string;
    path: string;
}>, baseUrl: string): string;
/**
 * Generate robots.txt content
 */
export declare function generateRobotsTxt(baseUrl: string, options?: {
    disallow?: string[];
    allow?: string[];
}): string;
declare const _default: {
    generateMetadataTags: typeof generateMetadataTags;
    mergeMetadata: typeof mergeMetadata;
    generateJsonLd: typeof generateJsonLd;
    jsonLd: {
        website: (c: {
            name: string;
            url: string;
            description?: string;
        }) => {
            '@context': string;
            '@type': string;
            name: string;
            url: string;
            description: string | undefined;
        };
        article: (c: {
            headline: string;
            description?: string;
            image?: string | string[];
            datePublished: string;
            dateModified?: string;
            author: {
                name: string;
                url?: string;
            } | {
                name: string;
                url?: string;
            }[];
        }) => {
            '@context': string;
            '@type': string;
            headline: string;
            description: string | undefined;
            image: string | string[] | undefined;
            datePublished: string;
            dateModified: string;
            author: {
                name: string;
                url?: string;
                '@type': string;
            }[] | {
                name: string;
                url?: string;
                '@type': string;
            };
        };
        organization: (c: {
            name: string;
            url: string;
            logo?: string;
            sameAs?: string[];
        }) => {
            '@context': string;
            '@type': string;
            name: string;
            url: string;
            logo: string | undefined;
            sameAs: string[] | undefined;
        };
        breadcrumb: (items: {
            name: string;
            url: string;
        }[]) => {
            '@context': string;
            '@type': string;
            itemListElement: {
                '@type': string;
                position: number;
                name: string;
                item: string;
            }[];
        };
    };
    generateSitemap: typeof generateSitemap;
    generateRobotsTxt: typeof generateRobotsTxt;
};
export default _default;
//# sourceMappingURL=index.d.ts.map