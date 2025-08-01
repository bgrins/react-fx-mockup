import { createFileRoute } from "@tanstack/react-router";
import { BrowserShell } from "~/components/firefox/BrowserShell";
import { DynamicFavicon, FirefoxFavicon, FirefoxViewIcon } from "~/components/firefox/Favicons";
import { NewTabPage } from "~/components/firefox/NewTabPage";
import { Sidebar } from "~/components/firefox/Sidebar";
import { urlToProxy } from "~/utils/proxy";
import { useDebug } from "~/contexts/DebugContext";
import { useProxyTunnel } from "~/hooks/useProxyTunnel";
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
      id: "firefox-view",
      title: "Firefox View",
      url: "about:firefoxview",
      favicon: <FirefoxViewIcon />,
      isPinned: true,
      isActive: false,
      history: ["about:firefoxview"],
      historyIndex: 0,
    },
    {
      id: "tab-1",
      title: "New Tab",
      url: "about:blank",
      favicon: <FirefoxFavicon />,
      isActive: true,
      history: ["about:blank"],
      historyIndex: 0,
    },
  ]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [pageContent, setPageContent] = React.useState<string>("");
  const { setDebugInfo } = useDebug();
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

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

  // Use proxy tunnel hook
  const { requestPageInfo, requestPageContent } = useProxyTunnel({
    onNavigate: handleNavigate,
    onPageInfo: (info) => {
      // Update tab title
      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                title: info.title || tab.title,
                // Keep the original URL, not the proxy URL
                url: tab.url,
              }
            : tab,
        ),
      );
    },
    onPageContent: setPageContent,
    activeTabUrl: activeTab?.url,
    iframeRef,
    enabled: activeTab?.type === "proxy",
  });

  // Request page content when sidebar is opened or tab changes
  React.useEffect(() => {
    if (sidebarOpen && activeTab?.type === "proxy") {
      requestPageInfo();
      requestPageContent();
    }
  }, [sidebarOpen, activeTabId, activeTab?.type, requestPageInfo, requestPageContent]);

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
    // Don't close pinned tabs
    const tabToClose = tabs.find((t) => t.id === id);
    if (tabToClose?.isPinned) return;

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
        // Update the isActive state for all tabs
        setTabs(newTabs.map((tab) => ({ ...tab, isActive: tab.id === newActiveTab.id })));
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

  // Calculate scale for mobile
  const [scale, setScale] = React.useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateScale = () => {
      const headerHeight = 60;
      const padding = 40; // Total padding (20px on each side)
      const browserWidth = 1200;
      const browserHeight = 800;

      // Get available space
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - headerHeight - padding;

      // Calculate scale based on which dimension is more constrained
      const scaleX = availableWidth / browserWidth;
      const scaleY = availableHeight / browserHeight;
      const newScale = Math.min(scaleX, scaleY, 1); // Never scale up beyond 1

      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50 to-gray-100 p-5 flex items-start justify-center overflow-hidden">
      <div
        className="relative"
        style={{
          width: `${Math.min(1200 * scale, 1200)}px`,
          height: `${Math.min(800 * scale, 800)}px`,
        }}
      >
        <div
          ref={containerRef}
          className="flex flex-col absolute"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: "1200px",
            height: "800px",
            left: "50%",
            marginLeft: `${-600 * scale}px`,
          }}
        >
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
            canGoBack={Boolean(activeTab?.history && (activeTab.historyIndex ?? 0) > 0)}
            canGoForward={Boolean(
              activeTab?.history && (activeTab.historyIndex ?? 0) < activeTab.history.length - 1,
            )}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            className="flex-1 min-h-0"
          >
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              pageContent={pageContent}
              pageTitle={activeTab?.title}
              pageUrl={activeTab?.url}
              accessKey={
                typeof window !== "undefined"
                  ? localStorage.getItem("infer-access-key") || undefined
                  : undefined
              }
            />
            <div className="flex-1 h-full bg-white overflow-auto">
              {activeTab?.url === "about:blank" ? (
                <NewTabPage onNavigate={handleNavigate} />
              ) : activeTab?.url === "about:firefoxview" ? (
                <div className="flex items-center justify-center h-full bg-[#f9f9fb]">
                  <div className="text-center">
                    <h1 className="text-2xl font-light text-gray-700 mb-4">Firefox View</h1>
                    <p className="text-gray-500">
                      Recently closed tabs and synced tabs would appear here
                    </p>
                  </div>
                </div>
              ) : activeTab?.type === "proxy" ? (
                <iframe
                  ref={iframeRef}
                  src={urlToProxy(activeTab.url)}
                  className="w-full h-full"
                  title={activeTab.title}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              ) : null}
            </div>
          </BrowserShell>
        </div>
      </div>
    </div>
  );
}
