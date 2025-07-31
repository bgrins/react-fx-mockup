export function urlToProxy(url: string): string {
  try {
    const urlObj = new URL(url);
    // Convert hostname: www.example.com -> www-example-com
    const proxySubdomain = urlObj.hostname
      .replace(/-/g, "--") // First escape existing dashes
      .replace(/\./g, "-"); // Then replace dots with dashes

    return `https://${proxySubdomain}.arewexblstill.com${urlObj.pathname}${urlObj.search}`;
  } catch {
    return url;
  }
}

export function proxyToUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Check if it's a proxy URL
    if (!urlObj.hostname.endsWith(".arewexblstill.com")) {
      return url;
    }

    // Extract subdomain
    const subdomain = urlObj.hostname.replace(".arewexblstill.com", "");

    // Convert back: www-example-com -> www.example.com
    const realHostname = subdomain
      .replace(/--/g, "___TEMP___") // Temporarily replace double dashes
      .replace(/-/g, ".") // Replace single dashes with dots
      .replace(/___TEMP___/g, "-"); // Restore single dashes

    // Build real URL
    return `${urlObj.protocol}//${realHostname}${urlObj.pathname}${urlObj.search}`;
  } catch {
    return url;
  }
}
