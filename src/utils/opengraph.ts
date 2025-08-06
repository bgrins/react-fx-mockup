import { urlToProxy } from "./proxy";

// Use browser's built-in DOMParser instead of happy-dom to avoid clearImmediate issues
function parseHTML(html: string): Document {
  if (typeof window === "undefined") {
    throw new Error("OpenGraph extraction is only available on the client side");
  }

  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  siteName?: string;
  type?: string;
  locale?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  twitterImage?: string;
  twitterImageAlt?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  favicon?: string;
}

/**
 * Extracts OpenGraph and Twitter Card metadata from HTML content using browser's DOMParser
 */
export function extractOpenGraphFromHTML(html: string, baseUrl?: string): OpenGraphData {
  const document = parseHTML(html);

  try {
    const ogData: OpenGraphData = {};

    // Helper function to get meta content
    const getMetaContent = (selector: string): string | undefined => {
      const element = document.querySelector(selector);
      return element?.getAttribute("content") || undefined;
    };

    // Helper function to get multiple meta contents (for tags)
    const getMultipleMetaContents = (selector: string): string[] => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements)
        .map((el) => el.getAttribute("content"))
        .filter(Boolean) as string[];
    };

    // Basic OpenGraph properties
    ogData.title =
      getMetaContent('meta[property="og:title"]') ||
      getMetaContent('meta[name="title"]') ||
      document.querySelector("title")?.textContent?.trim();

    ogData.description =
      getMetaContent('meta[property="og:description"]') ||
      getMetaContent('meta[name="description"]');

    ogData.image = getMetaContent('meta[property="og:image"]');
    ogData.imageAlt = getMetaContent('meta[property="og:image:alt"]');
    ogData.url = getMetaContent('meta[property="og:url"]') || baseUrl;
    ogData.siteName = getMetaContent('meta[property="og:site_name"]');
    ogData.type = getMetaContent('meta[property="og:type"]') || "website";
    ogData.locale = getMetaContent('meta[property="og:locale"]');

    // Article-specific properties
    ogData.author =
      getMetaContent('meta[property="article:author"]') || getMetaContent('meta[name="author"]');
    ogData.publishedTime = getMetaContent('meta[property="article:published_time"]');
    ogData.modifiedTime = getMetaContent('meta[property="article:modified_time"]');
    ogData.section = getMetaContent('meta[property="article:section"]');

    // Article tags
    const articleTags = getMultipleMetaContents('meta[property="article:tag"]');
    const keywordTags =
      getMetaContent('meta[name="keywords"]')
        ?.split(",")
        .map((tag) => tag.trim()) || [];
    ogData.tags = [...articleTags, ...keywordTags].filter(Boolean);

    // Twitter Card properties
    ogData.twitterCard = getMetaContent('meta[name="twitter:card"]') || "summary";
    ogData.twitterSite = getMetaContent('meta[name="twitter:site"]');
    ogData.twitterCreator = getMetaContent('meta[name="twitter:creator"]');
    ogData.twitterImage = getMetaContent('meta[name="twitter:image"]') || ogData.image;
    ogData.twitterImageAlt = getMetaContent('meta[name="twitter:image:alt"]') || ogData.imageAlt;
    ogData.twitterTitle = getMetaContent('meta[name="twitter:title"]') || ogData.title;
    ogData.twitterDescription =
      getMetaContent('meta[name="twitter:description"]') || ogData.description;

    // Favicon
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
    ];

    for (const selector of faviconSelectors) {
      const faviconEl = document.querySelector(selector);
      if (faviconEl) {
        const href = faviconEl.getAttribute("href");
        if (href) {
          ogData.favicon = href.startsWith("http")
            ? href
            : baseUrl
              ? new URL(href, baseUrl).toString()
              : href;
          break;
        }
      }
    }

    // Clean up empty values
    Object.keys(ogData).forEach((key) => {
      const value = ogData[key as keyof OpenGraphData];
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete ogData[key as keyof OpenGraphData];
      }
    });

    return ogData;
  } catch (error) {
    console.error("Error extracting OpenGraph data:", error);
    return {};
  }
}

/**
 * Fetches a URL and extracts OpenGraph metadata from it
 */
export async function extractOpenGraphFromUrl(
  url: string,
  useProxy = true,
): Promise<OpenGraphData> {
  try {
    const fetchUrl = useProxy ? urlToProxy(url, true) : url;

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OpenGraph Bot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return extractOpenGraphFromHTML(html, url);
  } catch (error) {
    console.error(`Error fetching OpenGraph data from ${url}:`, error);
    return { url };
  }
}

/**
 * Validates and normalizes image URLs
 */
export function normalizeImageUrl(
  imageUrl: string | undefined,
  baseUrl?: string,
): string | undefined {
  if (!imageUrl) return undefined;

  try {
    // If already absolute URL, return as-is
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    // If we have a base URL, resolve relative URL
    if (baseUrl) {
      return new URL(imageUrl, baseUrl).toString();
    }

    return imageUrl;
  } catch {
    return undefined;
  }
}

/**
 * Gets a fallback title from URL if OpenGraph title is not available
 */
export function getFallbackTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return "Unknown Site";
  }
}
