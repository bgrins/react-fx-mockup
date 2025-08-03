import { createFileRoute } from "@tanstack/react-router";
import { BrowserShell } from "~/components/firefox/BrowserShell";
import { DynamicFavicon, FirefoxFavicon } from "~/components/firefox/Favicons";
import { NewTabPage } from "~/components/firefox/NewTabPage";
import { Sidebar } from "~/components/firefox/Sidebar";
import { urlToProxy } from "~/utils/proxy";
import { useDebug } from "~/contexts/DebugContext";
import { useProxyTunnel } from "~/hooks/useProxyTunnel";
import { useBrowserScale } from "~/hooks/useBrowserScale";
import { useTabManager } from "~/hooks/useTabManager";
import React from "react";
import type { AddressBarHandle } from "~/components/firefox/AddressBar";
import { ABOUT_PAGES, TabType } from "~/constants/browser";
import { cn } from "~/lib/utils";
import {
  parseNavigationUrl,
  shouldHandleNavigationLocally,
  canGoBack as checkCanGoBack,
  canGoForward as checkCanGoForward,
  getPreviousUrl,
  getNextUrl,
  getTabTypeForUrl,
} from "~/utils/navigation";
import { isLocalPath, getUrlForLocalPath } from "~/constants/urlShortcuts";

export const Route = createFileRoute("/")({
  component: Browser,
});

function Browser(): React.ReactElement {
  const addressBarRef = React.useRef<AddressBarHandle>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [pageContent, setPageContent] = React.useState<string>("");
  const [proxyNavigationState, setProxyNavigationState] = React.useState<{
    canGoBack: boolean;
    canGoForward: boolean;
  }>({ canGoBack: false, canGoForward: false });
  const { setDebugInfo } = useDebug();
  const iframeRefs = React.useRef<{ [key: string]: HTMLIFrameElement | null }>({});

  const {
    tabs,
    activeTab,
    activeTabId,
    updateActiveTab,
    navigateActiveTab,
    closeTab,
    createTab,
    switchTab,
    reorderTabs,
  } = useTabManager();

  // Memoize navigation states to ensure consistent values during SSR
  const canGoBack = React.useMemo(() => {
    return checkCanGoBack(activeTab, proxyNavigationState.canGoBack);
  }, [activeTab, proxyNavigationState.canGoBack]);

  const canGoForward = React.useMemo(() => {
    return checkCanGoForward(activeTab);
  }, [activeTab]);

  const handleNavigate = React.useCallback(
    (url: string, navigationType?: string) => {
      if (!url || !activeTab) return;

      console.log("[handleNavigate] Navigating to:", url);
      console.log("[handleNavigate] isLocalPath:", isLocalPath(url));

      try {
        // Check if this is a local path that needs to be served locally
        if (isLocalPath(url)) {
          // For local paths, we need to navigate to the actual local file
          // but show the corresponding real URL in the address bar
          const realUrl = getUrlForLocalPath(url);
          console.log("[handleNavigate] Local path detected, real URL:", realUrl);
          navigateActiveTab({
            url: url, // Navigate to the local file
            navigationType,
            displayUrl: realUrl || url, // Show the real URL in the address bar
          });
        } else {
          const parsedUrl = parseNavigationUrl(url);
          console.log("[handleNavigate] Parsed URL:", parsedUrl);
          navigateActiveTab({
            url: parsedUrl.fullUrl,
            navigationType,
            displayUrl: parsedUrl.displayUrl,
          });
        }
      } catch (error) {
        console.error("Navigation error:", error);
      }
    },
    [activeTab, navigateActiveTab],
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
      updateActiveTab({
        title: info.title || activeTab?.title,
      });
    },
    onPageContent: setPageContent,
    onNavigationStateChange: setProxyNavigationState,
    activeTabUrl: activeTab?.url,
    iframeRef: currentIframeRef,
    // Enable for proxy tabs and local files (stub tabs with local paths)
    enabled:
      (activeTab?.type === TabType.PROXY && activeTab?.url !== ABOUT_PAGES.BLANK) ||
      (activeTab?.type === TabType.STUB && isLocalPath(activeTab?.url || "")),
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
    if (!activeTab) return;

    const previous = getPreviousUrl(activeTab);
    if (!previous) return;

    const parsedUrl = parseNavigationUrl(previous.url);
    const shouldHandleLocally = shouldHandleNavigationLocally(activeTab, previous.url);

    if (!shouldHandleLocally) {
      // For proxy tabs going to non-about:blank URLs, send the goBack command
      sendCommand("goBack");

      // Update the local history index to track that we went back
      updateActiveTab({
        historyIndex: previous.index,
      });
    } else {
      // For non-proxy tabs or when going back to about:blank or local files, handle locally
      updateActiveTab({
        url: parsedUrl.displayUrl,
        historyIndex: previous.index,
        title: previous.url === ABOUT_PAGES.BLANK ? "New Tab" : `Loading...`,
        favicon:
          previous.url === ABOUT_PAGES.BLANK ? (
            <FirefoxFavicon />
          ) : (
            <DynamicFavicon url={parsedUrl.displayUrl} />
          ),
        type: getTabTypeForUrl(previous.url),
      });
    }
  };

  const handleForward = () => {
    if (!activeTab) return;

    const next = getNextUrl(activeTab);
    if (!next) return;

    const parsedUrl = parseNavigationUrl(next.url);
    const shouldHandleLocally = shouldHandleNavigationLocally(activeTab, next.url);

    // If we're currently on about:blank or going to a local file, handle locally
    if (!shouldHandleLocally && activeTab.url !== ABOUT_PAGES.BLANK) {
      // For proxy tabs that aren't on about:blank, send the goForward command
      sendCommand("goForward");

      // Update the local history index to track that we went forward
      updateActiveTab({
        historyIndex: next.index,
      });
    } else {
      // For non-proxy tabs or when navigating from about:blank or to local files, handle locally
      updateActiveTab({
        url: parsedUrl.displayUrl,
        historyIndex: next.index,
        title: next.url === ABOUT_PAGES.BLANK ? "New Tab" : `Loading...`,
        favicon:
          next.url === ABOUT_PAGES.BLANK ? (
            <FirefoxFavicon />
          ) : (
            <DynamicFavicon url={parsedUrl.displayUrl} />
          ),
        type: getTabTypeForUrl(next.url),
      });
    }
  };

  const handleRefresh = () => {
    if (!activeTab) return;

    if (activeTab.type === TabType.PROXY) {
      // Update tab to show loading state
      updateActiveTab({
        title: `Loading ${new URL(activeTab.url).hostname}...`,
      });

      // Send reload command through the proxy tunnel
      sendCommand("reload");
    }
  };

  const handleTabClose = (id: string) => {
    // Clean up iframe reference
    delete iframeRefs.current[id];

    const newActiveTabId = closeTab(id);

    // Focus the address bar if we created a new tab
    if (newActiveTabId && tabs.length === 1) {
      setTimeout(() => {
        addressBarRef.current?.focus();
      }, 0);
    }
  };

  const handleNewTab = () => {
    createTab();
    // Focus the address bar for the new tab
    setTimeout(() => {
      addressBarRef.current?.focus();
    }, 0);
  };

  const handleTabReorder = (draggedTabId: string, targetTabId: string, dropBefore: boolean) => {
    reorderTabs(draggedTabId, targetTabId, dropBefore);
  };

  // Calculate scale for mobile
  const { containerStyle, browserStyle } = useBrowserScale();
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-5 flex items-start justify-center overflow-hidden">
      <div className="relative" style={containerStyle}>
        <div ref={containerRef} className="flex flex-col absolute" style={browserStyle}>
          <BrowserShell
            ref={addressBarRef}
            tabs={tabs}
            activeTabId={activeTabId}
            currentUrl={activeTab?.displayUrl ?? activeTab?.url ?? ""}
            onTabClick={(tabId) => {
              switchTab(tabId);

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
                if (tab.type === TabType.PROXY) {
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
                        tab.id === activeTabId && tab.url !== ABOUT_PAGES.BLANK
                          ? "block"
                          : "hidden",
                      )}
                      title={tab.title}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    />
                  );
                }
                // Handle local files (STUB type with local path)
                if (tab.type === TabType.STUB && isLocalPath(tab.url)) {
                  return (
                    <iframe
                      key={tab.id}
                      ref={(el) => {
                        if (el) {
                          iframeRefs.current[tab.id] = el;
                        }
                      }}
                      src={tab.url} // Serve local file directly
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
