// Configuration
const CONFIG = {
  // CORS settings
  ALLOWED_ORIGIN: "*", // Use "*" for all origins, or specify like "https://example.com"
  ALLOWED_METHODS: "GET, POST, PUT, DELETE, OPTIONS, HEAD",
  ALLOWED_HEADERS: "*",

  // Proxy settings
  PROXY_DOMAIN: "arewexblstill.com",
  DEBUG_PATH: "/THROW_LOGS",

  // User agent handling
  // Set to "forward" to use the browser's user agent, or provide a specific string
  USER_AGENT: "forward", // Options: "forward" or a specific user agent string
  // Example fixed user agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",

  // PostMessage tunnel injection
  INJECT_POSTMESSAGE_TUNNEL: true, // Enable/disable postMessage tunnel injection
  TUNNEL_ORIGIN_WHITELIST: ["*"], // Array of allowed origins for postMessage, use ["*"] for all
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Extract subdomain from *.{PROXY_DOMAIN}
    const domainPattern = new RegExp(`^([^.]+)\\.${CONFIG.PROXY_DOMAIN.replace(/\./g, "\\.")}$`);
    const subdomainMatch = hostname.match(domainPattern);
    if (!subdomainMatch) {
      return new Response("Invalid proxy URL format", { status: 400 });
    }

    // Convert subdomain format to target domain
    // Double dashes (--) become single dashes (-), single dashes (-) become dots (.)
    // Example: www-airbnb-co-uk → www.airbnb.co.uk
    const targetDomain = subdomainMatch[1]
      .replace(/--/g, "___TEMP___")
      .replace(/-/g, ".")
      .replace(/___TEMP___/g, "-");

    // Special case: redirect bare www to main site
    if (targetDomain === "www") {
      return Response.redirect(`https://${CONFIG.PROXY_DOMAIN}`, 301);
    }

    const targetUrl = `https://${targetDomain}${url.pathname}${url.search}`;

    // Debug endpoint
    if (url.pathname.startsWith(CONFIG.DEBUG_PATH)) {
      return createDebugResponse(request, targetUrl, targetDomain);
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCorsOptions(request);
    }

    try {
      // Prepare headers for target request
      const headers = prepareRequestHeaders(request.headers);

      // Fetch from target
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        redirect: "manual",
      });

      // Handle redirects by converting them to proxy format
      if (response.status >= 301 && response.status <= 308) {
        return handleRedirect(response, targetUrl);
      }

      // Handle error responses with custom page
      if (response.status >= 400) {
        return createErrorResponse(response, targetUrl);
      }

      // Return proxied response with CORS headers
      return createProxiedResponse(response, targetUrl);
    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": CONFIG.ALLOWED_ORIGIN,
        },
      });
    }
  },
};

// Helper functions

function createDebugResponse(request, targetUrl, targetDomain) {
  const debugInfo = {
    originalUrl: request.url,
    targetUrl,
    targetDomain,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    pathname: new URL(request.url).pathname,
    search: new URL(request.url).search,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": CONFIG.ALLOWED_ORIGIN,
    },
  });
}

function handleCorsOptions(request) {
  const headers = new Headers({
    "Access-Control-Allow-Origin": CONFIG.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": CONFIG.ALLOWED_METHODS,
    "Access-Control-Max-Age": "86400",
  });

  const requestHeaders = request.headers.get("Access-Control-Request-Headers");
  headers.set("Access-Control-Allow-Headers", requestHeaders || CONFIG.ALLOWED_HEADERS);

  return new Response(null, { status: 204, headers });
}

function prepareRequestHeaders(originalHeaders) {
  const filtered = new Headers();
  const skipHeaders = new Set([
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-ray",
    "cf-visitor",
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-real-ip",
    "forwarded",
    "via",
  ]);

  for (const [key, value] of originalHeaders.entries()) {
    const lowerKey = key.toLowerCase();
    if (!skipHeaders.has(lowerKey) && !lowerKey.startsWith("cf-")) {
      filtered.set(key, value);
    }
  }

  // Handle user agent
  if (CONFIG.USER_AGENT === "forward") {
    // Forward the original user agent from the request
    const originalUserAgent = originalHeaders.get("user-agent");
    if (originalUserAgent) {
      filtered.set("User-Agent", originalUserAgent);
    }
  } else if (CONFIG.USER_AGENT) {
    // Use the configured user agent
    filtered.set("User-Agent", CONFIG.USER_AGENT);
  }

  return filtered;
}

function handleRedirect(response, targetUrl) {
  const location = response.headers.get("location");
  if (!location) return response;

  const redirectUrl = new URL(location, targetUrl);
  const proxyDomain = redirectUrl.hostname.replace(/-/g, "--").replace(/\./g, "-");
  const proxyRedirect = `https://${proxyDomain}.${CONFIG.PROXY_DOMAIN}${redirectUrl.pathname}${redirectUrl.search}`;

  return new Response(null, {
    status: response.status,
    headers: {
      Location: proxyRedirect,
      "Access-Control-Allow-Origin": CONFIG.ALLOWED_ORIGIN,
      "Access-Control-Expose-Headers": "Location, x-redirect-status, x-redirect-location",
      "x-redirect-status": response.status.toString(),
      "x-redirect-location": location,
    },
  });
}

function createProxiedResponse(response, targetUrl) {
  // Check if we should inject postMessage tunnel
  const contentType = response.headers.get("content-type") || "";
  const shouldInject =
    CONFIG.INJECT_POSTMESSAGE_TUNNEL &&
    contentType.includes("text/html") &&
    !contentType.includes("charset=iso-8859-1"); // Avoid non-UTF8 content

  let body = response.body;

  if (shouldInject) {
    // Use streaming transformation for HTML injection
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Create the injection script
    const injectionScript = createInjectionScript(targetUrl);

    // Stream the response and inject before </body>
    streamHTMLWithInjection(response.body, writer, injectionScript);

    body = readable;
  }

  const modifiedResponse = new Response(body, response);
  const headers = modifiedResponse.headers;

  // Add CORS headers
  headers.set("Access-Control-Allow-Origin", CONFIG.ALLOWED_ORIGIN);
  headers.set("Access-Control-Allow-Methods", CONFIG.ALLOWED_METHODS);
  headers.set("Access-Control-Allow-Headers", CONFIG.ALLOWED_HEADERS);
  headers.set("Access-Control-Allow-Credentials", "true");

  // Expose useful headers
  const exposeHeaders = [
    "Content-Length",
    "Content-Type",
    "Content-Range",
    "Accept-Ranges",
    "ETag",
    "Last-Modified",
    "Content-Encoding",
    "Content-Language",
    "Cache-Control",
    "Expires",
    "Pragma",
  ].filter((header) => response.headers.has(header));

  if (exposeHeaders.length > 0) {
    headers.set("Access-Control-Expose-Headers", exposeHeaders.join(", "));
  }

  // Remove security headers that might interfere with embedding
  const securityHeaders = [
    "X-Frame-Options",
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-XSS-Protection",
    "Referrer-Policy",
    "Permissions-Policy",
    "Cross-Origin-Embedder-Policy",
    "Cross-Origin-Opener-Policy",
    "Cross-Origin-Resource-Policy",
  ];

  securityHeaders.forEach((header) => headers.delete(header));

  return modifiedResponse;
}

function createErrorResponse(response, targetUrl) {
  const errorBody = `
<!DOCTYPE html>
<html>
<head>
    <title>Proxy Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .error { background-color: #f8d7da; color: #721c24; padding: 20px; border-radius: 5px; }
        .details { margin-top: 20px; font-size: 14px; color: #666; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="error">
        <h1>Error ${response.status}: ${response.statusText}</h1>
        <p>The requested resource could not be loaded.</p>
    </div>
    <div class="details">
        <p><strong>Target URL:</strong> <code>${targetUrl}</code></p>
        <p><strong>Status:</strong> ${response.status} ${response.statusText}</p>
    </div>
</body>
</html>`;

  return new Response(errorBody, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": CONFIG.ALLOWED_ORIGIN,
    },
  });
}

// HTML streaming transformer that injects script before </body>
async function streamHTMLWithInjection(readable, writer, injectionScript) {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let buffer = "";
  const CHUNK_SIZE = 1024; // Process in 1KB chunks

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Final chunk - inject if we haven't found </body>
        if (buffer) {
          const injected = buffer.replace(/<\/body>/i, `${injectionScript}</body>`);
          await writer.write(encoder.encode(injected));
        }
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Look for </body> in the buffer
      const bodyCloseIndex = buffer.toLowerCase().indexOf("</body>");

      if (bodyCloseIndex !== -1) {
        // Found </body>, inject script before it
        const beforeBody = buffer.substring(0, bodyCloseIndex);
        const afterBody = buffer.substring(bodyCloseIndex);
        await writer.write(encoder.encode(beforeBody + injectionScript + afterBody));
        buffer = "";
      } else {
        // No </body> found yet, write most of buffer and keep some for next iteration
        // Keep last 100 chars in case </body> is split across chunks
        if (buffer.length > CHUNK_SIZE) {
          const toWrite = buffer.substring(0, buffer.length - 100);
          await writer.write(encoder.encode(toWrite));
          buffer = buffer.substring(buffer.length - 100);
        }
      }
    }
  } finally {
    await writer.close();
  }
}

// Create the postMessage tunnel injection script
function createInjectionScript(targetUrl) {
  const targetOrigin = new URL(targetUrl).origin;

  return `
<script data-proxy-tunnel="true">
(function() {
  // PostMessage tunnel for cross-origin communication
  const PROXY_DOMAIN = ${JSON.stringify(CONFIG.PROXY_DOMAIN)};
  const TARGET_ORIGIN = ${JSON.stringify(targetOrigin)};
  const ALLOWED_ORIGINS = ${JSON.stringify(CONFIG.TUNNEL_ORIGIN_WHITELIST)};
  
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
        .replace(/\\./g, '-'); // Then replace dots with dashes
      
      // Build proxy URL
      const proxyUrl = \`https://\${proxySubdomain}.\${PROXY_DOMAIN}\${urlObj.pathname}\${urlObj.search}\${urlObj.hash}\`;
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
      const subdomain = urlObj.hostname.replace(\`.\${PROXY_DOMAIN}\`, '');
      
      // Convert back: www-example-com -> www.example.com
      const realHostname = subdomain
        .replace(/--/g, '___TEMP___')  // Temporarily replace double dashes
        .replace(/-/g, '.')            // Replace single dashes with dots
        .replace(/___TEMP___/g, '-');  // Restore single dashes
      
      // Build real URL
      const realUrl = \`\${urlObj.protocol}//\${realHostname}\${urlObj.pathname}\${urlObj.search}\${urlObj.hash}\`;
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
  
  // Notify parent that tunnel is ready
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'PROXY_TUNNEL_READY',
      origin: TARGET_ORIGIN,
      url: window.location.href
    }, '*');
  }
})();
</script>
`;
}
