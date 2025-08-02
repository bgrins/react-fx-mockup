/**
 * Proxy Tunnel Core Library
 * Provides postMessage tunnel functionality for cross-origin communication
 * Can be used both as an ES module and as a standalone script
 */

// Default configuration
export const DEFAULT_CONFIG = {
  PROXY_DOMAIN: "arewexblstill.com",
  ALLOWED_ORIGINS: ["*"],
};

// URL conversion utilities
export function realToProxyUrl(url, proxyDomain = DEFAULT_CONFIG.PROXY_DOMAIN) {
  try {
    const urlObj = new URL(url, window.location.href);

    // Skip if already a proxy URL
    if (urlObj.hostname.endsWith(proxyDomain)) {
      return url;
    }

    // Skip non-http(s) protocols
    if (!urlObj.protocol.match(/^https?:/)) {
      return url;
    }

    // Convert hostname: www.example.com -> www-example-com
    const proxySubdomain = urlObj.hostname
      .replace(/-/g, "--") // First escape existing dashes
      .replace(/\./g, "-"); // Then replace dots with dashes

    // Build proxy URL
    const proxyUrl = `https://${proxySubdomain}.${proxyDomain}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    return proxyUrl;
  } catch (e) {
    // Return original URL if parsing fails
    return url;
  }
}

export function proxyToRealUrl(url, proxyDomain = DEFAULT_CONFIG.PROXY_DOMAIN) {
  try {
    const urlObj = new URL(url);

    // Check if it's a proxy URL
    if (!urlObj.hostname.endsWith(proxyDomain)) {
      return url;
    }

    // Extract subdomain
    const subdomain = urlObj.hostname.replace(`.${proxyDomain}`, "");

    // Convert back: www-example-com -> www.example.com
    const realHostname = subdomain
      .replace(/--/g, "___TEMP___") // Temporarily replace double dashes
      .replace(/-/g, ".") // Replace single dashes with dots
      .replace(/___TEMP___/g, "-"); // Restore single dashes

    // Build real URL
    const realUrl = `${urlObj.protocol}//${realHostname}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    return realUrl;
  } catch (e) {
    return url;
  }
}

// Tunnel commands
export const tunnelCommands = {
  // Get element info
  getElement: (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;

    return {
      tagName: el.tagName,
      innerHTML: el.innerHTML,
      textContent: el.textContent,
      innerText: el.innerText,
      attributes: Array.from(el.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {}),
      rect: el.getBoundingClientRect(),
    };
  },

  // Execute querySelector
  querySelector: (selector) => {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map((el) => ({
      tagName: el.tagName,
      textContent: el.textContent,
      id: el.id,
      className: el.className,
    }));
  },

  // Get page info
  getPageInfo: () => ({
    title: document.title,
    url: window.location.href,
    readyState: document.readyState,
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }),

  // Scroll to element
  scrollToElement: (selector) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    }
    return false;
  },

  // Click element
  clickElement: (selector) => {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      return true;
    }
    return false;
  },

  // Reload the page
  reload: () => {
    window.location.reload();
    return true;
  },

  // Navigate back
  goBack: () => {
    try {
      window.history.back();
      return true;
    } catch (e) {
      console.error("[PROXY] Failed to go back:", e);
      return false;
    }
  },

  // Navigate forward
  goForward: () => {
    try {
      window.history.forward();
      return true;
    } catch (e) {
      console.error("[PROXY] Failed to go forward:", e);
      return false;
    }
  },

  // Navigate to a URL
  navigate: (url) => {
    window.location.href = url;
    return true;
  },
};

// Link rewriting functionality
export function rewriteLinks(proxyDomain = DEFAULT_CONFIG.PROXY_DOMAIN) {
  const links = document.querySelectorAll("a[href]");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      const newHref = realToProxyUrl(href, proxyDomain);
      if (newHref !== href) {
        link.setAttribute("href", newHref);
        link.setAttribute("data-proxy-original-href", href);
      }
    }
  });
}

export function rewriteElementLinks(element, proxyDomain = DEFAULT_CONFIG.PROXY_DOMAIN) {
  if (element.tagName === "A" && element.hasAttribute("href")) {
    const href = element.getAttribute("href");
    const newHref = realToProxyUrl(href, proxyDomain);
    if (newHref !== href) {
      element.setAttribute("href", newHref);
      element.setAttribute("data-proxy-original-href", href);
    }
  }

  // Also check child elements
  const links = element.querySelectorAll("a[href]");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      const newHref = realToProxyUrl(href, proxyDomain);
      if (newHref !== href) {
        link.setAttribute("href", newHref);
        link.setAttribute("data-proxy-original-href", href);
      }
    }
  });
}

// Main ProxyTunnel class
export class ProxyTunnel {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.commands = tunnelCommands;
    this.targetOrigin = new URL(window.location.href).origin;
    this.observer = null;
    this.messageHandler = null;
  }

  init() {
    // Set up message handler
    this.messageHandler = async (event) => {
      // Security check
      if (
        this.config.ALLOWED_ORIGINS[0] !== "*" &&
        !this.config.ALLOWED_ORIGINS.includes(event.origin)
      ) {
        return;
      }

      // Validate message format
      if (!event.data || event.data.type !== "PROXY_TUNNEL_COMMAND") {
        return;
      }

      const { id, command, args } = event.data;

      try {
        // Execute command
        const result = this.commands[command]
          ? await this.commands[command](...(args || []))
          : {
              error: "Unknown command: " + command,
            };

        // Send response
        event.source.postMessage(
          {
            type: "PROXY_TUNNEL_RESPONSE",
            id,
            result,
            command,
          },
          event.origin,
        );
      } catch (error) {
        // Send error response
        event.source.postMessage(
          {
            type: "PROXY_TUNNEL_RESPONSE",
            id,
            error: error.message,
            command,
          },
          event.origin,
        );
      }
    };

    window.addEventListener("message", this.messageHandler);

    // Set up link rewriting
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupLinkRewriting());
    } else {
      this.setupLinkRewriting();
    }

    // Notify parent that tunnel is ready
    if (window.parent !== window) {
      console.log("[PROXY TUNNEL] Sending READY message");
      window.parent.postMessage(
        {
          type: "PROXY_TUNNEL_READY",
          origin: this.targetOrigin,
          url: window.location.href,
        },
        "*",
      );

      // Send initial navigation state
      this.sendNavigationState();

      // Listen for navigation events
      this.setupNavigationListeners();
    }
  }

  setupLinkRewriting() {
    // Initial rewrite
    rewriteLinks(this.config.PROXY_DOMAIN);

    // Set up observer for dynamic content
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            rewriteElementLinks(node, this.config.PROXY_DOMAIN);
          }
        });

        // Handle attribute changes on existing elements
        if (mutation.type === "attributes" && mutation.attributeName === "href") {
          const element = mutation.target;
          if (element.tagName === "A" && !element.hasAttribute("data-proxy-rewriting")) {
            element.setAttribute("data-proxy-rewriting", "true");
            const href = element.getAttribute("href");
            if (href) {
              const newHref = realToProxyUrl(href, this.config.PROXY_DOMAIN);
              if (newHref !== href) {
                element.setAttribute("href", newHref);
                element.setAttribute("data-proxy-original-href", href);
              }
            }
            element.removeAttribute("data-proxy-rewriting");
          }
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });
  }

  setupNavigationListeners() {
    // Listen for popstate
    window.addEventListener("popstate", () => {
      console.log("[PROXY TUNNEL] popstate event");
      this.sendNavigationState();
    });

    // Override pushState/replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      console.log("[PROXY TUNNEL] pushState called");
      this.sendNavigationState();
    };

    window.history.replaceState = (...args) => {
      originalReplaceState.apply(window.history, args);
      console.log("[PROXY TUNNEL] replaceState called");
      this.sendNavigationState();
    };
  }

  sendNavigationState() {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "PROXY_TUNNEL_NAVIGATION",
          url: window.location.href,
          canGoBack: window.history.length > 1,
          canGoForward: false, // Can't reliably detect this
        },
        "*",
      );
    }
  }

  destroy() {
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// For standalone script usage
if (typeof window !== "undefined" && window.PROXY_TUNNEL_AUTO_INIT) {
  const tunnel = new ProxyTunnel(window.PROXY_TUNNEL_CONFIG || {});
  tunnel.init();
  window.proxyTunnel = tunnel;
}
