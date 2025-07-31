import { createFileRoute } from "@tanstack/react-router";
import { BrowserShell } from "~/components/firefox/BrowserShell";
import { DynamicFavicon, FirefoxFavicon } from "~/components/firefox/Favicons";
import { NewTabPage } from "~/components/firefox/NewTabPage";
import { urlToProxy, proxyToUrl } from "~/utils/proxy";
import { useDebug } from "~/contexts/DebugContext";
import React from "react";

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: React.ReactNode;
  isPinned?: boolean;
  isActive?: boolean;
  type?: "proxy" | "stub";
  history?: string[];
  historyIndex?: number;
}

export const Route = createFileRoute("/")({
  component: Browser,
});

function Browser(): React.ReactElement {
  const [activeTabId, setActiveTabId] = React.useState("tab-1");
  const [tabs, setTabs] = React.useState<Tab[]>([
    {
      id: "tab-1",
      title: "New Tab",
      url: "about:blank",
      favicon: <FirefoxFavicon />,
      isActive: true,
    },
  ]);
  const { setDebugInfo } = useDebug();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleNavigate = React.useCallback(
    (url: string) => {
      if (!url || !activeTab) return;

      // Ensure URL has a protocol
      let fullUrl = url;
      if (!url.match(/^https?:\/\//)) {
        fullUrl = `https://${url}`;
      }

      try {
        const urlObj = new URL(fullUrl);
        // Update the active tab with the new URL and history
        setTabs(
          tabs.map((tab) => {
            if (tab.id === activeTabId) {
              const history = tab.history || [tab.url];
              const historyIndex = tab.historyIndex ?? 0;

              // Add new URL to history (remove any forward history)
              const newHistory = [...history.slice(0, historyIndex + 1), fullUrl];

              return {
                ...tab,
                url: fullUrl,
                title: `Loading ${urlObj.hostname}...`,
                favicon: <DynamicFavicon url={fullUrl} />,
                type: "proxy" as const,
                history: newHistory,
                historyIndex: newHistory.length - 1,
              };
            }
            return tab;
          }),
        );
      } catch (_e) {
        // Invalid URL, don't navigate
        console.error("Invalid URL:", fullUrl);
      }
    },
    [activeTab, activeTabId, tabs],
  );

  // Update debug info whenever active tab changes
  React.useEffect(() => {
    if (activeTab) {
      const proxyUrl =
        activeTab.type === "proxy" && activeTab.url !== "about:blank"
          ? urlToProxy(activeTab.url)
          : undefined;

      setDebugInfo({
        currentTab: {
          url: activeTab.url,
          proxyUrl,
          title: activeTab.title,
          type: activeTab.type,
        },
      });
    }
  }, [activeTab, setDebugInfo]);

  // Handle messages from proxy tunnel
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle proxy tunnel ready message
      if (event.data?.type === "PROXY_TUNNEL_READY") {
        console.log("Proxy tunnel ready:", event.data);

        // Extract the URL from the proxy URL
        if (event.data.url) {
          const realUrl = proxyToUrl(event.data.url);

          // Update tab URL if it changed (navigation within iframe)
          if (activeTab && realUrl !== activeTab.url && realUrl !== event.data.url) {
            handleNavigate(realUrl);
          }
        }

        // Request page info to update tab
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: "PROXY_TUNNEL_COMMAND",
              id: `cmd-${Date.now()}`,
              command: "getPageInfo",
              args: [],
            },
            "*",
          );
        }
      }

      // Handle proxy tunnel responses
      if (event.data?.type === "PROXY_TUNNEL_RESPONSE") {
        const { result, command } = event.data;

        if (command === "getPageInfo" && result) {
          // Update tab title and URL
          setTabs((currentTabs) =>
            currentTabs.map((tab) =>
              tab.id === activeTabId
                ? {
                    ...tab,
                    title: result.title || tab.title,
                    // Keep the original URL, not the proxy URL
                    url: tab.url,
                  }
                : tab,
            ),
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [activeTabId, activeTab, handleNavigate]);

  const handleBack = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex === undefined) return;

    const newIndex = activeTab.historyIndex - 1;
    if (newIndex < 0) return;

    const previousUrl = activeTab.history[newIndex];
    if (!previousUrl) return;

    setTabs(
      tabs.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              url: previousUrl,
              historyIndex: newIndex,
              title: `Loading...`,
              favicon: <DynamicFavicon url={previousUrl} />,
            }
          : tab,
      ),
    );
  };

  const handleForward = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex === undefined) return;

    const newIndex = activeTab.historyIndex + 1;
    if (newIndex >= activeTab.history.length) return;

    const nextUrl = activeTab.history[newIndex];
    if (!nextUrl) return;

    setTabs(
      tabs.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              url: nextUrl,
              historyIndex: newIndex,
              title: `Loading...`,
              favicon: <DynamicFavicon url={nextUrl} />,
            }
          : tab,
      ),
    );
  };

  const handleTabClose = (id: string) => {
    const newTabs = tabs.filter((t) => t.id !== id);

    // If we're closing the last tab, create a new one
    if (newTabs.length === 0) {
      const newTab: Tab = {
        id: `tab-${Date.now()}`,
        title: "New Tab",
        url: "about:blank",
        favicon: <FirefoxFavicon />,
        isActive: true,
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    } else if (id === activeTabId) {
      // If we closed the active tab, switch to another tab
      const closedIndex = tabs.findIndex((t) => t.id === id);
      const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
      const newActiveTab = newTabs[newActiveIndex];
      if (newActiveTab) {
        setActiveTabId(newActiveTab.id);
      }
    } else {
      setTabs(newTabs);
    }
  };

  const handleNewTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newTabId,
      title: "New Tab",
      url: "about:blank",
      favicon: <FirefoxFavicon />,
      isActive: true,
    };
    // Set all other tabs as inactive
    const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }));
    setTabs([...updatedTabs, newTab]);
    setActiveTabId(newTabId);
  };

  const handleTabReorder = (draggedTabId: string, targetTabId: string, dropBefore: boolean) => {
    const draggedIndex = tabs.findIndex((t) => t.id === draggedTabId);
    const targetIndex = tabs.findIndex((t) => t.id === targetTabId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTabs = [...tabs];
    const [draggedTab] = newTabs.splice(draggedIndex, 1);

    if (!draggedTab) return;

    // Calculate the new index based on drop position
    let newIndex = targetIndex;
    if (!dropBefore && draggedIndex < targetIndex) {
      // When dragging left to right and dropping after, we need to account for the removed item
      newIndex = targetIndex;
    } else if (!dropBefore) {
      newIndex = targetIndex + 1;
    } else if (draggedIndex < targetIndex) {
      // When dragging left to right and dropping before
      newIndex = targetIndex - 1;
    }

    newTabs.splice(newIndex, 0, draggedTab);
    setTabs(newTabs);
  };

  return (
    <div className="h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 lg:p-12 overflow-hidden">
      <div className="h-full max-w-[1600px] mx-auto flex flex-col">
        <BrowserShell
          tabs={tabs}
          activeTabId={activeTabId}
          currentUrl={activeTab?.url ?? ""}
          onTabClick={(tabId) => {
            setActiveTabId(tabId);
            // Update active state
            setTabs(tabs.map((tab) => ({ ...tab, isActive: tab.id === tabId })));
          }}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
          onTabReorder={handleTabReorder}
          onNavigate={handleNavigate}
          onBack={handleBack}
          onForward={handleForward}
          canGoBack={!!activeTab?.history && (activeTab.historyIndex ?? 0) > 0}
          canGoForward={
            !!activeTab?.history && (activeTab.historyIndex ?? 0) < activeTab.history.length - 1
          }
          className="flex-1 min-h-0"
        >
          {activeTab?.url === "about:blank" ? (
            <NewTabPage onNavigate={handleNavigate} />
          ) : activeTab?.type === "proxy" ? (
            <iframe
              ref={iframeRef}
              src={urlToProxy(activeTab.url)}
              className="w-full h-full"
              title={activeTab.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : null}
        </BrowserShell>
      </div>
    </div>
  );
}
