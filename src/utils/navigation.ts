import { Tab, TabType, ABOUT_PAGES } from "~/constants/browser";
import { ParsedUrl } from "~/types/navigation";
import { isLocalPath } from "~/constants/urlShortcuts";

/**
 * Parse a URL and ensure it has a protocol
 */
export function parseNavigationUrl(url: string): ParsedUrl {
  if (!url) {
    throw new Error("URL cannot be empty");
  }

  // Ensure URL has a protocol
  let fullUrl = url;
  if (!url.match(/^https?:\/\//)) {
    fullUrl = `https://${url}`;
  }

  try {
    const urlObj = new URL(fullUrl);
    return {
      fullUrl,
      displayUrl: fullUrl,
      hostname: urlObj.hostname,
    };
  } catch {
    // Return original URL if parsing fails
    return {
      fullUrl: url,
      displayUrl: url,
    };
  }
}

/**
 * Determine if we should handle navigation locally vs in the proxy iframe
 */
export function shouldHandleNavigationLocally(tab: Tab | undefined, targetUrl: string): boolean {
  if (!tab) return true;

  // Always handle about: pages locally
  if (Object.values(ABOUT_PAGES).includes(targetUrl as any)) {
    return true;
  }

  // Non-proxy tabs are always handled locally
  if (tab.type !== TabType.PROXY) {
    return true;
  }

  // For proxy tabs, check if we're navigating TO an about: page or local file
  // This handles the case where we're going back from a proxy page to about:blank
  if (
    targetUrl &&
    (targetUrl.startsWith("about:") || targetUrl.startsWith("/") || targetUrl.startsWith("file:"))
  ) {
    return true;
  }

  return false;
}

/**
 * Get the URL to use for a tab's history entry
 */
export function getHistoryUrl(parsedUrl: ParsedUrl): string {
  // Always store the full URL
  return parsedUrl.fullUrl;
}

/**
 * Determine the tab type based on the URL
 */
export function getTabTypeForUrl(url: string): TabType {
  if (url === ABOUT_PAGES.BLANK || url === ABOUT_PAGES.FIREFOX_VIEW) {
    return TabType.STUB;
  }

  // Local paths should be treated as STUB type (not proxy)
  if (isLocalPath(url)) {
    return TabType.STUB;
  }

  return TabType.PROXY;
}

/**
 * Check if a navigation can go back
 */
export function canGoBack(tab: Tab | undefined, proxyCanGoBack: boolean): boolean {
  if (!tab) return false;

  // Check if we have local history to navigate back
  const hasLocalHistory = !!(tab.history && (tab.historyIndex ?? 0) > 0);

  // For proxy tabs, we can go back if:
  // 1. The proxy iframe can go back, OR
  // 2. We have local history (e.g., going back to about:blank)
  if (tab.type === TabType.PROXY) {
    return proxyCanGoBack || hasLocalHistory;
  }

  return hasLocalHistory;
}

/**
 * Check if a navigation can go forward
 */
export function canGoForward(tab: Tab | undefined): boolean {
  if (!tab) return false;

  // Check if we have local history to navigate forward
  const hasLocalForwardHistory = !!(
    tab.history &&
    tab.historyIndex !== undefined &&
    tab.historyIndex < tab.history.length - 1
  );

  // For all tabs (including proxy), we rely on local history tracking
  // because the browser doesn't provide a way to detect forward navigation capability
  return hasLocalForwardHistory;
}

/**
 * Get the previous URL in tab history
 */
export function getPreviousUrl(tab: Tab): { url: string; index: number } | null {
  if (!tab.history || tab.historyIndex === undefined) return null;

  const newIndex = tab.historyIndex - 1;
  if (newIndex < 0) return null;

  const previousUrl = tab.history[newIndex];
  if (!previousUrl) return null;

  return { url: previousUrl, index: newIndex };
}

/**
 * Get the next URL in tab history
 */
export function getNextUrl(tab: Tab): { url: string; index: number } | null {
  if (!tab.history || tab.historyIndex === undefined) return null;

  const newIndex = tab.historyIndex + 1;
  if (newIndex >= tab.history.length) return null;

  const nextUrl = tab.history[newIndex];
  if (!nextUrl) return null;

  return { url: nextUrl, index: newIndex };
}
