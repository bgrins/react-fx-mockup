/**
 * Map of shortcut names to real URLs
 * These can be used in the UI to show friendly names instead of full URLs
 */
export const URL_SHORTCUTS: Record<string, string> = {
  "firefox-wiki": "/pages/firefox-wiki.html",
  "test-page": "/test-page.html",
  example: "https://example.com",
  "npr-text": "https://text.npr.org",
  espn: "https://www.espn.com",
  wikipedia: "https://en.wikipedia.org/wiki/Main_Page",
  mozilla: "https://www.mozilla.org",
  firefox: "https://www.firefox.com",
} as const;

/**
 * Map of local paths to their corresponding real URLs
 */
export const LOCAL_PATH_TO_URL: Record<string, string> = {
  "/pages/firefox-wiki.html": "https://en.wikipedia.org/wiki/Firefox",
  "/test-page.html": "https://example.com/test-page.html",
} as const;

/**
 * Reverse map of real URLs to shortcut names
 */
export const URL_TO_SHORTCUT = Object.fromEntries(
  Object.entries(URL_SHORTCUTS).map(([shortcut, url]) => [url, shortcut]),
);

/**
 * Check if a string is a shortcut name
 */
export function isUrlShortcut(value: string): boolean {
  return value in URL_SHORTCUTS;
}

/**
 * Get the real URL for a shortcut, or return the input if not a shortcut
 */
export function resolveUrlShortcut(shortcutOrUrl: string): string {
  return URL_SHORTCUTS[shortcutOrUrl] || shortcutOrUrl;
}

/**
 * Get the shortcut name for a URL if one exists, or return the URL
 */
export function getUrlShortcut(url: string): string {
  return URL_TO_SHORTCUT[url] || url;
}

/**
 * Get the real URL for a local path
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
