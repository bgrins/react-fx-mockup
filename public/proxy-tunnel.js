(function() {
  // Get configuration from script tag data attributes or window config
  const currentScript = document.currentScript || document.querySelector('script[src*="proxy-tunnel"]');
  const config = window.PROXY_TUNNEL_CONFIG || {};
  
  // PostMessage tunnel for cross-origin communication
  const PROXY_DOMAIN = config.PROXY_DOMAIN || currentScript?.getAttribute('data-proxy-domain');
  
  if (!PROXY_DOMAIN) {
    throw new Error('PROXY_DOMAIN is required. Please set it via window.PROXY_TUNNEL_CONFIG.PROXY_DOMAIN or data-proxy-domain attribute on the script tag.');
  }
  const TARGET_ORIGIN = window.location.origin;
  const ALLOWED_ORIGINS = config.ALLOWED_ORIGINS || (currentScript?.getAttribute('data-allowed-origins')?.split(',') || ['*']);
  
  // ===== URL REWRITING FUNCTIONALITY =====
  
  // Convert real URL to proxy URL
  function realToProxyUrl(url) {
    try {
      const urlObj = new URL(url, window.location.href);
      
      // Skip if already a proxy URL
      if (urlObj.hostname.endsWith(PROXY_DOMAIN)) {
        return url;
      }
      
      // Skip non-http(s) protocols
      if (!urlObj.protocol.match(/^https?:/)) {
        return url;
      }
      
      // Convert hostname: www.example.com -> www-example-com
      const proxySubdomain = urlObj.hostname
        .replace(/-/g, '--')  // First escape existing dashes
        .replace(/\./g, '-'); // Then replace dots with dashes
      
      // Build proxy URL
      const proxyUrl = `https://${proxySubdomain}.${PROXY_DOMAIN}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      return proxyUrl;
    } catch (e) {
      // Return original URL if parsing fails
      return url;
    }
  }
  
  // Convert proxy URL to real URL
  function proxyToRealUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a proxy URL
      if (!urlObj.hostname.endsWith(PROXY_DOMAIN)) {
        return url;
      }
      
      // Extract subdomain
      const subdomain = urlObj.hostname.replace(`.${PROXY_DOMAIN}`, '');
      
      // Convert back: www-example-com -> www.example.com
      const realHostname = subdomain
        .replace(/--/g, '___TEMP___')  // Temporarily replace double dashes
        .replace(/-/g, '.')            // Replace single dashes with dots
        .replace(/___TEMP___/g, '-');  // Restore single dashes
      
      // Build real URL
      const realUrl = `${urlObj.protocol}//${realHostname}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      return realUrl;
    } catch (e) {
      return url;
    }
  }
  
  // Rewrite all links on the page
  function rewriteLinks() {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const newHref = realToProxyUrl(href);
        if (newHref !== href) {
          link.setAttribute('href', newHref);
          link.setAttribute('data-proxy-original-href', href);
        }
      }
    });
  }
  
  // Rewrite a single element's links
  function rewriteElementLinks(element) {
    if (element.tagName === 'A' && element.hasAttribute('href')) {
      const href = element.getAttribute('href');
      const newHref = realToProxyUrl(href);
      if (newHref !== href) {
        element.setAttribute('href', newHref);
        element.setAttribute('data-proxy-original-href', href);
      }
    }
    
    // Also check child elements
    const links = element.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const newHref = realToProxyUrl(href);
        if (newHref !== href) {
          link.setAttribute('href', newHref);
          link.setAttribute('data-proxy-original-href', href);
        }
      }
    });
  }
  
  // Set up MutationObserver to handle dynamically added content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          rewriteElementLinks(node);
        }
      });
      
      // Handle attribute changes on existing elements
      if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
        const element = mutation.target;
        if (element.tagName === 'A' && !element.hasAttribute('data-proxy-rewriting')) {
          element.setAttribute('data-proxy-rewriting', 'true');
          const href = element.getAttribute('href');
          if (href) {
            const newHref = realToProxyUrl(href);
            if (newHref !== href) {
              element.setAttribute('href', newHref);
              element.setAttribute('data-proxy-original-href', href);
            }
          }
          element.removeAttribute('data-proxy-rewriting');
        }
      }
    });
  });
  
  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      rewriteLinks();
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href']
      });
    });
  } else {
    // DOM already loaded
    rewriteLinks();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href']
    });
  }
  
  // ===== END URL REWRITING =====
  
  // Tunnel commands
  const commands = {
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
        rect: el.getBoundingClientRect()
      };
    },
    
    // Execute querySelector
    querySelector: (selector) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        textContent: el.textContent,
        id: el.id,
        className: el.className
      }));
    },
    
    // Get page info
    getPageInfo: () => ({
      title: document.title,
      url: window.location.href,
      readyState: document.readyState,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight
    }),
    
    // Scroll to element
    scrollToElement: (selector) => {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        console.error('[PROXY] Failed to go back:', e);
        return false;
      }
    },
    
    // Navigate forward
    goForward: () => {
      try {
        window.history.forward();
        return true;
      } catch (e) {
        console.error('[PROXY] Failed to go forward:', e);
        return false;
      }
    },
    
    // Navigate to a URL
    navigate: (url) => {
      window.location.href = url;
      return true;
    }
  };
  
  // Message handler
  window.addEventListener('message', async (event) => {
    // Security check
    if (ALLOWED_ORIGINS[0] !== '*' && !ALLOWED_ORIGINS.includes(event.origin)) {
      return;
    }
    
    // Validate message format
    if (!event.data || event.data.type !== 'PROXY_TUNNEL_COMMAND') {
      return;
    }
    
    const { id, command, args } = event.data;
    
    try {
      // Execute command
      const result = commands[command] ? await commands[command](...(args || [])) : {
        error: 'Unknown command: ' + command
      };
      
      // Send response
      event.source.postMessage({
        type: 'PROXY_TUNNEL_RESPONSE',
        id,
        result,
        command
      }, event.origin);
    } catch (error) {
      // Send error response
      event.source.postMessage({
        type: 'PROXY_TUNNEL_RESPONSE',
        id,
        error: error.message,
        command
      }, event.origin);
    }
  });
  
  // Helper function to get page info
  function getPageInfo() {
    return {
      title: document.title,
      url: window.location.href,
      readyState: document.readyState,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight
    };
  }
  
  // Notify parent that tunnel is ready
  if (window.parent !== window) {
    // Send ready message immediately
    console.log('[PROXY WORKER] Sending READY message, history.length:', window.history.length);
    window.parent.postMessage({
      type: 'PROXY_TUNNEL_READY',
      origin: TARGET_ORIGIN,
      url: window.location.href,
      pageInfo: getPageInfo()
    }, '*');
    
    // Send initial navigation state
    console.log('[PROXY WORKER] Sending initial navigation state');
    window.parent.postMessage({
      type: 'PROXY_TUNNEL_NAVIGATION',
      url: window.location.href,
      canGoBack: window.history.length > 1,
      canGoForward: false,
      navigationType: 'initial',
      pageInfo: getPageInfo()
    }, '*');
    
    // Send updated ready message when DOM is loaded (with proper title)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[PROXY WORKER] DOM loaded, sending updated READY message with page info');
        window.parent.postMessage({
          type: 'PROXY_TUNNEL_READY',
          origin: TARGET_ORIGIN,
          url: window.location.href,
          domLoaded: true,
          pageInfo: getPageInfo()
        }, '*');
      });
    } else {
      // DOM already loaded
      console.log('[PROXY WORKER] DOM already loaded, sending updated READY message with page info');
      window.parent.postMessage({
        type: 'PROXY_TUNNEL_READY',
        origin: TARGET_ORIGIN,
        url: window.location.href,
        domLoaded: true,
        pageInfo: getPageInfo()
      }, '*');
    }
    
    // Listen for navigation events and notify parent
    window.addEventListener('popstate', () => {
      console.log('[PROXY WORKER] popstate event, history.length:', window.history.length);
      window.parent.postMessage({
        type: 'PROXY_TUNNEL_NAVIGATION',
        url: window.location.href,
        canGoBack: window.history.length > 1,
        canGoForward: false, // We can't reliably detect this
        navigationType: 'popstate',
        pageInfo: getPageInfo()
      }, '*');
    });
    
    // Track beforeunload for regular navigation
    window.addEventListener('beforeunload', () => {
      console.log('[PROXY WORKER] beforeunload event');
      window.parent.postMessage({
        type: 'PROXY_TUNNEL_NAVIGATION',
        url: window.location.href,
        canGoBack: window.history.length > 1,
        canGoForward: false,
        navigationType: 'beforeunload',
        pageInfo: getPageInfo()
      }, '*');
    });
    
    // Also listen for pushstate/replacestate
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function() {
      originalPushState.apply(window.history, arguments);
      console.log('[PROXY WORKER] pushState called, history.length:', window.history.length);
      window.parent.postMessage({
        type: 'PROXY_TUNNEL_NAVIGATION',
        url: window.location.href,
        canGoBack: window.history.length > 1,
        canGoForward: false,
        navigationType: 'pushstate',
        pageInfo: getPageInfo()
      }, '*');
    };
    
    window.history.replaceState = function() {
      originalReplaceState.apply(window.history, arguments);
      console.log('[PROXY WORKER] replaceState called, history.length:', window.history.length);
      window.parent.postMessage({
        type: 'PROXY_TUNNEL_NAVIGATION',
        url: window.location.href,
        canGoBack: window.history.length > 1,
        canGoForward: false,
        navigationType: 'replacestate',
        pageInfo: getPageInfo()
      }, '*');
    };
  }
})();