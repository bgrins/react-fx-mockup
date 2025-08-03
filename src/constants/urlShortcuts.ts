/**
 * Map of local paths to their corresponding display URLs
 * These are shown in the address bar when loading local files
 */
export const LOCAL_PATH_TO_URL: Record<string, string> = {
  "/pages/firefox-wiki.html": "https://en.wikipedia.org/wiki/Firefox",
  "/test-page.html": "https://example.com/test-page.html",
} as const;

/**
 * Get the display URL for a local path
 */
export function getUrlForLocalPath(path: string): string | undefined {
  return LOCAL_PATH_TO_URL[path];
}

/**
 * Check if a path is a local file path
 */
export function isLocalPath(path: string): boolean {
  return path.startsWith("/pages/") || path === "/test-page.html";
}
