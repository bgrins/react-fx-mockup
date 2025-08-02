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
import { ABOUT_PAGES, TabType, Tab } from "~/constants/browser";
import { cn } from "~/lib/utils";

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
      type: TabType.STUB,
    },
    {
      id: "tab-1",
      title: "New Tab",
      url: ABOUT_PAGES.BLANK,
      favicon: <FirefoxFavicon />,
      isActive: true,
      history: [ABOUT_PAGES.BLANK],
      historyIndex: 0,
      type: TabType.STUB,
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
      if (activeTab.type === TabType.PROXY) {
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
    const result = (() => {
      if (!activeTab) return false;

      // Check if we have local history to navigate forward
      const hasLocalForwardHistory = !!(
        activeTab.history && (activeTab.historyIndex ?? 0) < activeTab.history.length - 1
      );

      // For all tabs (including proxy), we rely on local history tracking
      // because the browser doesn't provide a way to detect forward navigation capability
      return hasLocalForwardHistory;
    })();

    console.log("[INDEX] canGoForward computed:", result, {
      activeTab: activeTab?.id,
      type: activeTab?.type,
      proxyState: proxyNavigationState.canGoForward,
      localHistory: activeTab?.history,
      historyIndex: activeTab?.historyIndex,
      historyLength: activeTab?.history?.length,
      hasLocalForward:
        activeTab?.history &&
        activeTab?.historyIndex !== undefined &&
        activeTab.historyIndex < activeTab.history.length - 1,
    });

    return result;
  }, [activeTab]);

  const handleNavigate = React.useCallback(
    (url: string, navigationType?: string) => {
      if (!url || !activeTab) return;

      // Check if this is a local file with a display URL
      let fullUrl = url;
      let displayUrl = url;
      let isLocalFile = false;

      if (url.startsWith("local:")) {
        // Extract the local path and display URL
        const [localPath, hashUrl] = url.substring(6).split("#");
        fullUrl = localPath || "";
        displayUrl = hashUrl || url;
        isLocalFile = true;
      } else if (!url.match(/^https?:\/\//)) {
        // Ensure URL has a protocol
        fullUrl = `https://${url}`;
        displayUrl = fullUrl;
      }

      try {
        const urlObj = isLocalFile ? { hostname: new URL(displayUrl).hostname } : new URL(fullUrl);

        console.log("[INDEX] handleNavigate called:", {
          url: fullUrl,
          navigationType,
          currentUrl: activeTab.url,
          currentHistory: activeTab.history,
          currentIndex: activeTab.historyIndex,
        });

        // Update the active tab with the new URL and history
        setTabs(
          tabs.map((tab) => {
            if (tab.id === activeTabId) {
              const history = tab.history || [tab.url];
              const historyIndex = tab.historyIndex ?? 0;

              // For popstate navigation (back/forward in iframe), update the URL but find the correct index
              if (navigationType === "popstate") {
                // Find if this URL already exists in our history
                const existingIndex = history.findIndex((h) => h === fullUrl);
                if (existingIndex !== -1) {
                  // URL exists in history, just update the index
                  return {
                    ...tab,
                    url: fullUrl,
                    historyIndex: existingIndex,
                    title: `Loading ${urlObj.hostname}...`,
                    favicon: <DynamicFavicon url={fullUrl} />,
                  };
                }
              }

              // For new navigation, add to history
              // Store the original URL format in history (including local: prefix)
              const historyUrl = isLocalFile ? url : fullUrl;
              const newHistory = [...history.slice(0, historyIndex + 1), historyUrl];
              const newHistoryIndex = newHistory.length - 1;

              return {
                ...tab,
                url: isLocalFile ? displayUrl : fullUrl,
                title: `Loading ${urlObj.hostname}...`,
                favicon: <DynamicFavicon url={displayUrl} />,
                type: isLocalFile ? TabType.LOCAL : TabType.PROXY,
                localPath: isLocalFile ? fullUrl : undefined,
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
        activeTab.type === TabType.PROXY && activeTab.url !== ABOUT_PAGES.BLANK
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
    // Enable for both proxy AND local tabs to capture navigation from local files
    enabled:
      (activeTab?.type === TabType.PROXY || activeTab?.type === TabType.LOCAL) &&
      activeTab?.url !== ABOUT_PAGES.BLANK,
  });

  // Request page content when sidebar is opened or tab changes
  React.useEffect(() => {
    if (sidebarOpen && activeTab?.type === TabType.PROXY) {
      requestPageInfo();
      requestPageContent();
    }
  }, [sidebarOpen, activeTabId, activeTab?.type, requestPageInfo, requestPageContent]);

  // Reset proxy navigation state when switching tabs
  React.useEffect(() => {
    if (activeTab?.type !== TabType.PROXY) {
      setProxyNavigationState({ canGoBack: false, canGoForward: false });
    }
  }, [activeTabId, activeTab?.type]);

  const handleBack = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex === undefined) return;

    const newIndex = activeTab.historyIndex - 1;
    if (newIndex < 0) return;

    const previousUrl = activeTab.history[newIndex];
    if (!previousUrl) return;

    // Check if the previous URL is a local file
    const isLocalFile = previousUrl.startsWith("local:");
    let displayUrl = previousUrl;
    let localPath = undefined;

    if (isLocalFile) {
      const [path, hashUrl] = previousUrl.substring(6).split("#");
      localPath = path;
      displayUrl = hashUrl || previousUrl;
    }

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
      "isLocalFile:",
      isLocalFile,
      "displayUrl:",
      displayUrl,
      "localPath:",
      localPath,
    );

    // If we're going back to about:blank or a local file, handle it locally
    // since the proxy iframe can't navigate to these
    const shouldHandleLocally =
      activeTab.type !== TabType.PROXY || previousUrl === ABOUT_PAGES.BLANK || isLocalFile;

    console.log("[INDEX] About to check navigation - Debug values:", {
      previousUrl,
      ABOUT_PAGES_BLANK: ABOUT_PAGES.BLANK,
      areEqual: previousUrl === ABOUT_PAGES.BLANK,
      typeofPreviousUrl: typeof previousUrl,
      typeofABOUT_BLANK: typeof ABOUT_PAGES.BLANK,
    });

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

      // Update the local history index to track that we went back
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                historyIndex: newIndex,
              }
            : tab,
        ),
      );
    } else {
      // For non-proxy tabs or when going back to about:blank or local files, handle locally
      console.log("[INDEX] Handling back navigation locally");
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                url: isLocalFile ? displayUrl : previousUrl,
                historyIndex: newIndex,
                title: previousUrl === ABOUT_PAGES.BLANK ? "New Tab" : `Loading...`,
                favicon:
                  previousUrl === ABOUT_PAGES.BLANK ? (
                    <FirefoxFavicon />
                  ) : (
                    <DynamicFavicon url={isLocalFile ? displayUrl : previousUrl} />
                  ),
                type:
                  previousUrl === ABOUT_PAGES.BLANK
                    ? TabType.STUB
                    : isLocalFile
                      ? TabType.LOCAL
                      : tab.type,
                localPath: isLocalFile ? localPath : undefined,
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

    // Check if the next URL is a local file
    const isLocalFile = nextUrl.startsWith("local:");
    let displayUrl = nextUrl;
    let localPath = undefined;

    if (isLocalFile) {
      const [path, hashUrl] = nextUrl.substring(6).split("#");
      localPath = path;
      displayUrl = hashUrl || nextUrl;
    }

    console.log("[INDEX] handleForward:", {
      activeTab: activeTab.id,
      type: activeTab.type,
      history: JSON.stringify(activeTab.history),
      historyIndex: activeTab.historyIndex,
      newIndex,
      nextUrl,
      isLocalFile,
      displayUrl,
      localPath,
      currentUrl: activeTab.url,
    });

    // If we're currently on about:blank or going to a local file, handle locally
    // since we need to transition from stub to proxy/local tab
    if (activeTab.type === TabType.PROXY && activeTab.url !== ABOUT_PAGES.BLANK && !isLocalFile) {
      // For proxy tabs that aren't on about:blank, send the goForward command
      sendCommand("goForward");

      // Update the local history index to track that we went forward
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                historyIndex: newIndex,
              }
            : tab,
        ),
      );
    } else {
      // For non-proxy tabs or when navigating from about:blank or to local files, handle locally
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                url: isLocalFile ? displayUrl : nextUrl,
                historyIndex: newIndex,
                title: nextUrl === ABOUT_PAGES.BLANK ? "New Tab" : `Loading...`,
                favicon:
                  nextUrl === ABOUT_PAGES.BLANK ? (
                    <FirefoxFavicon />
                  ) : (
                    <DynamicFavicon url={isLocalFile ? displayUrl : nextUrl} />
                  ),
                type:
                  nextUrl === ABOUT_PAGES.BLANK
                    ? TabType.STUB
                    : isLocalFile
                      ? TabType.LOCAL
                      : TabType.PROXY,
                localPath: isLocalFile ? localPath : undefined,
              }
            : tab,
        ),
      );
    }
  };

  const handleRefresh = () => {
    if (!activeTab) return;

    if (activeTab.type === TabType.PROXY) {
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
        type: TabType.STUB,
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
      type: TabType.STUB,
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
                if (tab.type === TabType.PROXY || tab.type === TabType.LOCAL) {
                  return (
                    <iframe
                      key={tab.id}
                      ref={(el) => {
                        if (el) {
                          iframeRefs.current[tab.id] = el;
                        }
                      }}
                      src={tab.type === TabType.LOCAL ? tab.localPath : urlToProxy(tab.url)}
                      className={cn(
                        "w-full h-full absolute inset-0",
                        tab.id === activeTabId && tab.url !== ABOUT_PAGES.BLANK
                          ? "block"
                          : "hidden",
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
