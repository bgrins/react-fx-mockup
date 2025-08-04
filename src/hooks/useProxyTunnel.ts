import { useEffect, useCallback, RefObject } from "react";
import { proxyToUrl } from "~/utils/proxy";
import { PROXY_MESSAGE_TYPES } from "~/constants/browser";

const PROXY_DOMAIN = import.meta.env.VITE_PROXY_DOMAIN;

interface ProxyTunnelOptions {
  onNavigate?: (url: string, navigationType?: string) => void;
  onPageInfo?: (info: { title?: string; content?: string; text?: string }) => void;
  onPageContent?: (content: string) => void;
  onNavigationStateChange?: (state: { canGoBack: boolean; canGoForward: boolean }) => void;
  activeTabId?: string;
  activeTabUrl?: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  enabled?: boolean;
}

interface ProxyCommand {
  type: string;
  id: string;
  command: string;
  args: any[];
}

export function useProxyTunnel({
  onNavigate,
  onPageInfo,
  onPageContent,
  onNavigationStateChange,
  activeTabUrl,
  iframeRef,
  enabled = true,
}: ProxyTunnelOptions) {
  // Send a command to the proxy tunnel
  const sendCommand = useCallback(
    (command: string, args: any[] = []) => {
      if (!iframeRef.current?.contentWindow) {
        console.log(`[PROXY] Cannot send ${command} command - no iframe contentWindow`);
        return;
      }

      const commandId = `cmd-${command}-${Date.now()}`;
      console.log(`[PROXY] Sending ${command} command:`, commandId);

      const message: ProxyCommand = {
        type: PROXY_MESSAGE_TYPES.COMMAND,
        id: commandId,
        command,
        args,
      };

      console.log(`[PROXY] Posting message to iframe:`, message);
      iframeRef.current.contentWindow.postMessage(message, "*");
      return commandId;
    },
    [iframeRef],
  );

  // Request page info (title, etc)
  const requestPageInfo = useCallback(() => {
    sendCommand("getPageInfo");
  }, [sendCommand]);

  // Request page content
  const requestPageContent = useCallback(() => {
    sendCommand("getElement", ["body"]);
  }, [sendCommand]);

  // Handle incoming messages
  useEffect(() => {
    if (!enabled) return;

    const handleMessage = (event: MessageEvent) => {
      // Handle proxy tunnel ready message
      if (event.data?.type === PROXY_MESSAGE_TYPES.READY) {
        console.log("[PROXY] Tunnel ready:", event.data);

        // Extract the URL from the proxy URL
        if (event.data.url) {
          const realUrl = proxyToUrl(event.data.url);

          // Update tab URL if it changed (navigation within iframe)
          // For local files, activeTabUrl might be a display URL, so also check if it's a proxy URL
          const isProxyUrl = PROXY_DOMAIN && event.data.url.includes(`.${PROXY_DOMAIN}`);
          if (isProxyUrl && realUrl !== activeTabUrl) {
            onNavigate?.(realUrl);
          }
        }

        // Handle page info if provided (from any source, not just proxy)
        if (event.data.pageInfo) {
          console.log("[PROXY] Page info from ready event:", event.data.pageInfo);
          onPageInfo?.(event.data.pageInfo);
        }

        // Request page content when DOM is loaded
        if (event.data.domLoaded) {
          console.log("[PROXY] DOM loaded, requesting page content");
          requestPageContent();
        }
      }

      // Handle proxy tunnel responses
      if (event.data?.type === PROXY_MESSAGE_TYPES.RESPONSE) {
        const { result, command, id } = event.data;
        console.log("[PROXY] Response received:", {
          command,
          id,
          result,
        });

        if (command === "getPageInfo" && result) {
          console.log("[PROXY] getPageInfo result contains:", Object.keys(result));

          onPageInfo?.({
            title: result.title,
            content: result.content,
            text: result.text,
          });

          // Also update page content if available
          if (result.content || result.text) {
            onPageContent?.(result.content || result.text || "");
          }
        }

        if (command === "getElement" && result) {
          const content = result.innerText || "";
          console.log("[PROXY] getElement result - text length:", content.length);
          console.log("[PROXY] Content preview:", content.substring(0, 200));
          onPageContent?.(content);
        }
      }

      // Handle proxy tunnel navigation events
      if (event.data?.type === PROXY_MESSAGE_TYPES.NAVIGATION) {
        console.log("[PROXY] Navigation event received:", {
          url: event.data.url,
          canGoBack: event.data.canGoBack,
          canGoForward: event.data.canGoForward,
          navigationType: event.data.navigationType,
          pageInfo: event.data.pageInfo,
          fullData: event.data,
        });

        // Update navigation state (back/forward availability)
        if (event.data.canGoBack !== undefined || event.data.canGoForward !== undefined) {
          const newState = {
            canGoBack: event.data.canGoBack || false,
            canGoForward: event.data.canGoForward || false,
          };
          console.log("[PROXY] Calling onNavigationStateChange with:", newState);
          onNavigationStateChange?.(newState);
        }

        // Handle page info if provided (from any source, not just proxy)
        if (event.data.pageInfo) {
          console.log("[PROXY] Page info from navigation event:", event.data.pageInfo);
          onPageInfo?.(event.data.pageInfo);
        }

        // Update URL if it changed
        if (event.data.url) {
          // Only process navigation if it's a proxied URL
          // This prevents local files from overriding their display URL
          const isProxyUrl = PROXY_DOMAIN && event.data.url.includes(`.${PROXY_DOMAIN}`);

          if (isProxyUrl) {
            const realUrl = proxyToUrl(event.data.url);
            // Navigate if we have a new URL from the iframe
            // This handles navigation from local files to proxied URLs
            if (realUrl && realUrl !== activeTabUrl) {
              onNavigate?.(realUrl, event.data.navigationType);
            }
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    enabled,
    activeTabUrl,
    onNavigate,
    onPageInfo,
    onPageContent,
    onNavigationStateChange,
    requestPageInfo,
    requestPageContent,
  ]);

  return {
    sendCommand,
    requestPageInfo,
    requestPageContent,
  };
}
