import { useEffect, useCallback, RefObject } from "react";
import { proxyToUrl } from "~/utils/proxy";
import { PROXY_MESSAGE_TYPES } from "~/constants/browser";

interface ProxyTunnelOptions {
  onNavigate?: (url: string) => void;
  onPageInfo?: (info: { title?: string; content?: string; text?: string }) => void;
  onPageContent?: (content: string) => void;
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
  activeTabUrl,
  iframeRef,
  enabled = true,
}: ProxyTunnelOptions) {
  // Send a command to the proxy tunnel
  const sendCommand = useCallback(
    (command: string, args: any[] = []) => {
      if (!iframeRef.current?.contentWindow) return;

      const commandId = `cmd-${command}-${Date.now()}`;
      console.log(`[PROXY] Sending ${command} command:`, commandId);

      const message: ProxyCommand = {
        type: PROXY_MESSAGE_TYPES.COMMAND,
        id: commandId,
        command,
        args,
      };

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
          if (activeTabUrl && realUrl !== activeTabUrl && realUrl !== event.data.url) {
            onNavigate?.(realUrl);
          }
        }

        // Request page info and content when tunnel is ready
        requestPageInfo();
        requestPageContent();
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
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    enabled,
    activeTabUrl,
    onNavigate,
    onPageInfo,
    onPageContent,
    requestPageInfo,
    requestPageContent,
  ]);

  return {
    sendCommand,
    requestPageInfo,
    requestPageContent,
  };
}
