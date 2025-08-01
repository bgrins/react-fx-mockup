import { createFileRoute } from "@tanstack/react-router";
import { BrowserShell } from "~/components/firefox/BrowserShell";
import { DynamicFavicon, FirefoxFavicon, FirefoxViewIcon } from "~/components/firefox/Favicons";
import { NewTabPage } from "~/components/firefox/NewTabPage";
import { Sidebar } from "~/components/firefox/Sidebar";
import { urlToProxy } from "~/utils/proxy";
import { useDebug } from "~/contexts/DebugContext";
import { useProxyTunnel } from "~/hooks/useProxyTunnel";
import React from "react";
import type { AddressBarHandle } from "~/components/firefox/AddressBar";
import { ABOUT_PAGES } from "~/constants/browser";
import { cn } from "~/lib/utils";

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
  const addressBarRef = React.useRef<AddressBarHandle>(null);
  const [activeTabId, setActiveTabId] = React.useState("tab-1");
  const [tabs, setTabs] = React.useState<Tab[]>([
    {
      id: "firefox-view",
      title: "Firefox View",
      url: ABOUT_PAGES.FIREFOX_VIEW,
      favicon: <FirefoxViewIcon />,
      isPinned: true,
      isActive: false,
      history: [ABOUT_PAGES.FIREFOX_VIEW],
      historyIndex: 0,
      type: "stub",
    },
    {
      id: "tab-1",
      title: "New Tab",
      url: ABOUT_PAGES.BLANK,
      favicon: <FirefoxFavicon />,
      isActive: true,
      history: [ABOUT_PAGES.BLANK],
      historyIndex: 0,
      type: "stub",
    },
  ]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [pageContent, setPageContent] = React.useState<string>("");
  const [proxyNavigationState, setProxyNavigationState] = React.useState<{
    canGoBack: boolean;
    canGoForward: boolean;
  }>({ canGoBack: false, canGoForward: false });
  const { setDebugInfo } = useDebug();
  const iframeRefs = React.useRef<{ [key: string]: HTMLIFrameElement | null }>({});

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Memoize navigation states to ensure consistent values during SSR
  const canGoBack = React.useMemo(() => {
    const result = (() => {
      if (!activeTab) return false;

      // Check if we have local history to navigate back
      const hasLocalHistory = !!(activeTab.history && (activeTab.historyIndex ?? 0) > 0);

      // For proxy tabs, we can go back if:
      // 1. The proxy iframe can go back, OR
      // 2. We have local history (e.g., going back to about:blank)
      if (activeTab.type === "proxy") {
        return proxyNavigationState.canGoBack || hasLocalHistory;
      }

      return hasLocalHistory;
    })();

    console.log("[INDEX] canGoBack computed:", result, {
      activeTab: activeTab?.id,
      type: activeTab?.type,
      proxyState: proxyNavigationState.canGoBack,
      localHistory: activeTab?.history,
      historyIndex: activeTab?.historyIndex,
    });

    return result;
  }, [activeTab, proxyNavigationState.canGoBack]);

  const canGoForward = React.useMemo(() => {
    if (!activeTab) return false;

    // Check if we have local history to navigate forward
    const hasLocalForwardHistory = !!(
      activeTab.history && (activeTab.historyIndex ?? 0) < activeTab.history.length - 1
    );

    // For proxy tabs, we can go forward if:
    // 1. The proxy iframe can go forward, OR
    // 2. We have local forward history (e.g., going forward from about:blank)
    if (activeTab.type === "proxy") {
      return proxyNavigationState.canGoForward || hasLocalForwardHistory;
    }

    return hasLocalForwardHistory;
  }, [activeTab, proxyNavigationState.canGoForward]);

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
              const newHistoryIndex = newHistory.length - 1;

              return {
                ...tab,
                url: fullUrl,
                title: `Loading ${urlObj.hostname}...`,
                favicon: <DynamicFavicon url={fullUrl} />,
                type: "proxy" as const,
                history: newHistory,
                historyIndex: newHistoryIndex,
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
        activeTab.type === "proxy" && activeTab.url !== ABOUT_PAGES.BLANK
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

  // Get current iframe ref
  const currentIframeRef = React.useMemo(() => {
    return {
      current: activeTab ? iframeRefs.current[activeTab.id] || null : null,
    };
  }, [activeTab]);

  // Use proxy tunnel hook
  const { requestPageInfo, requestPageContent, sendCommand } = useProxyTunnel({
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
    onNavigationStateChange: (state) => {
      console.log("[INDEX] Setting proxy navigation state:", state, "for tab:", activeTabId);
      setProxyNavigationState(state);
    },
    activeTabUrl: activeTab?.url,
    iframeRef: currentIframeRef,
    enabled: activeTab?.type === "proxy",
  });

  // Request page content when sidebar is opened or tab changes
  React.useEffect(() => {
    if (sidebarOpen && activeTab?.type === "proxy") {
      requestPageInfo();
      requestPageContent();
    }
  }, [sidebarOpen, activeTabId, activeTab?.type, requestPageInfo, requestPageContent]);

  // Reset proxy navigation state when switching tabs
  React.useEffect(() => {
    if (activeTab?.type !== "proxy") {
      setProxyNavigationState({ canGoBack: false, canGoForward: false });
    }
  }, [activeTabId, activeTab?.type]);

  const handleBack = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex === undefined) return;

    const newIndex = activeTab.historyIndex - 1;
    if (newIndex < 0) return;

    const previousUrl = activeTab.history[newIndex];
    if (!previousUrl) return;

    console.log(
      "[INDEX] handleBack:",
      "activeTab:",
      activeTab.id,
      "type:",
      activeTab.type,
      "history:",
      JSON.stringify(activeTab.history),
      "historyIndex:",
      activeTab.historyIndex,
      "newIndex:",
      newIndex,
      "previousUrl:",
      JSON.stringify(previousUrl),
      "previousUrl.length:",
      previousUrl.length,
      "previousUrl === ABOUT_PAGES.BLANK:",
      previousUrl === ABOUT_PAGES.BLANK,
      "previousUrl.trim() === ABOUT_PAGES.BLANK:",
      previousUrl.trim() === ABOUT_PAGES.BLANK,
    );

    // If we're going back to about:blank, handle it locally even for proxy tabs
    // since the proxy iframe can't navigate back to about:blank
    const shouldHandleLocally = activeTab.type !== "proxy" || previousUrl === ABOUT_PAGES.BLANK;

    console.log("[INDEX] Navigation decision:", {
      shouldHandleLocally,
      tabType: activeTab.type,
      previousUrl,
      previousUrlLength: previousUrl.length,
      previousUrlCharCodes: previousUrl.split("").map((c) => c.charCodeAt(0)),
    });

    if (!shouldHandleLocally) {
      // For proxy tabs going to non-about:blank URLs, send the goBack command
      console.log("[INDEX] Sending goBack command to proxy");
      sendCommand("goBack");
    } else {
      // For non-proxy tabs or when going back to about:blank, handle locally
      console.log("[INDEX] Handling back navigation locally");
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                url: previousUrl,
                historyIndex: newIndex,
                title: previousUrl === ABOUT_PAGES.BLANK ? "New Tab" : `Loading...`,
                favicon:
                  previousUrl === ABOUT_PAGES.BLANK ? (
                    <FirefoxFavicon />
                  ) : (
                    <DynamicFavicon url={previousUrl} />
                  ),
                type: previousUrl === ABOUT_PAGES.BLANK ? "stub" : tab.type,
              }
            : tab,
        ),
      );
    }
  };

  const handleForward = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex === undefined) return;

    const newIndex = activeTab.historyIndex + 1;
    if (newIndex >= activeTab.history.length) return;

    const nextUrl = activeTab.history[newIndex];
    if (!nextUrl) return;

    // If we're currently on about:blank, handle forward navigation locally
    // since we need to transition from stub to proxy tab
    if (activeTab.type === "proxy" && activeTab.url !== ABOUT_PAGES.BLANK) {
      // For proxy tabs that aren't on about:blank, send the goForward command
      sendCommand("goForward");
    } else {
      // For non-proxy tabs or when navigating from about:blank, handle locally
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                url: nextUrl,
                historyIndex: newIndex,
                title: nextUrl === ABOUT_PAGES.BLANK ? "New Tab" : `Loading...`,
                favicon:
                  nextUrl === ABOUT_PAGES.BLANK ? (
                    <FirefoxFavicon />
                  ) : (
                    <DynamicFavicon url={nextUrl} />
                  ),
                type: nextUrl === ABOUT_PAGES.BLANK ? "stub" : "proxy",
              }
            : tab,
        ),
      );
    }
  };

  const handleRefresh = () => {
    if (!activeTab) return;

    if (activeTab.type === "proxy") {
      // Update tab to show loading state
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                title: `Loading ${new URL(tab.url).hostname}...`,
              }
            : tab,
        ),
      );

      // Send reload command through the proxy tunnel
      sendCommand("reload");
    }
  };

  const handleTabClose = (id: string) => {
    // Don't close pinned tabs
    const tabToClose = tabs.find((t) => t.id === id);
    if (tabToClose?.isPinned) return;

    // Clean up iframe reference
    delete iframeRefs.current[id];

    const newTabs = tabs.filter((t) => t.id !== id);

    // If we're closing the last tab, create a new one
    if (newTabs.length === 0) {
      const newTab: Tab = {
        id: `tab-${Date.now()}`,
        title: "New Tab",
        url: ABOUT_PAGES.BLANK,
        favicon: <FirefoxFavicon />,
        isActive: true,
        history: [ABOUT_PAGES.BLANK],
        historyIndex: 0,
        type: "stub",
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);

      // Focus the address bar for the new tab
      setTimeout(() => {
        addressBarRef.current?.focus();
      }, 0);
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
      url: ABOUT_PAGES.BLANK,
      favicon: <FirefoxFavicon />,
      isActive: true,
      history: [ABOUT_PAGES.BLANK],
      historyIndex: 0,
      type: "stub",
    };
    // Set all other tabs as inactive
    const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }));
    setTabs([...updatedTabs, newTab]);
    setActiveTabId(newTabId);

    // Focus the address bar for the new tab
    setTimeout(() => {
      addressBarRef.current?.focus();
    }, 0);
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
      const padding = window.innerWidth < 640 ? 16 : 40; // 8px each side on mobile, 20px on desktop
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
    <div className="h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-5 flex items-start justify-center overflow-hidden">
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
            ref={addressBarRef}
            tabs={tabs}
            activeTabId={activeTabId}
            currentUrl={activeTab?.url ?? ""}
            onTabClick={(tabId) => {
              setActiveTabId(tabId);
              // Update active state
              setTabs(tabs.map((tab) => ({ ...tab, isActive: tab.id === tabId })));

              // Focus address bar if clicking on a new tab (about:blank)
              const clickedTab = tabs.find((tab) => tab.id === tabId);
              if (clickedTab?.url === ABOUT_PAGES.BLANK) {
                setTimeout(() => {
                  addressBarRef.current?.focus();
                }, 0);
              }
            }}
            onTabClose={handleTabClose}
            onNewTab={handleNewTab}
            onTabReorder={handleTabReorder}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onForward={handleForward}
            onRefresh={handleRefresh}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
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
            <div className="flex-1 h-full bg-white overflow-auto relative">
              {/* Render all proxy iframes but only show the active one */}
              {tabs.map((tab) => {
                if (tab.type === "proxy") {
                  return (
                    <iframe
                      key={tab.id}
                      ref={(el) => {
                        if (el) {
                          iframeRefs.current[tab.id] = el;
                        }
                      }}
                      src={urlToProxy(tab.url)}
                      className={cn(
                        "w-full h-full absolute inset-0",
                        tab.id === activeTabId ? "block" : "hidden",
                      )}
                      title={tab.title}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    />
                  );
                }
                return null;
              })}

              {/* Show special pages for active tab */}
              {activeTab?.url === ABOUT_PAGES.BLANK && <NewTabPage onNavigate={handleNavigate} />}
              {activeTab?.url === ABOUT_PAGES.FIREFOX_VIEW && (
                <div className="flex items-center justify-center h-full bg-[#f9f9fb]">
                  <div className="text-center">
                    <h1 className="text-2xl font-light text-gray-700 mb-4">Firefox View</h1>
                    <p className="text-gray-500">
                      Recently closed tabs and synced tabs would appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </BrowserShell>
        </div>
      </div>
    </div>
  );
}
