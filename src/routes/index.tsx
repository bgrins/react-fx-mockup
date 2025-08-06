import { createFileRoute } from "@tanstack/react-router";
import { BrowserShell } from "~/components/firefox/BrowserShell";
import {
  DynamicFavicon,
  FirefoxFavicon,
  FirefoxViewIcon,
  SparklyFirefoxViewIcon,
} from "~/components/firefox/Favicons";
import { NewTabPage } from "~/components/firefox/NewTabPage";
import { Sidebar } from "~/components/firefox/Sidebar";
import { SettingsModal } from "~/components/firefox/SettingsModal";
import { FirefoxView } from "~/components/firefox/FirefoxView";
import { urlToProxy } from "~/utils/proxy";
import { useDebug } from "~/contexts/useDebug";
import { useProxyTunnel } from "~/hooks/useProxyTunnel";
import { useBrowserScale } from "~/hooks/useBrowserScale";
import { useTabManager } from "~/hooks/useTabManager";
import { useKeyboardShortcuts } from "~/hooks/useKeyboardShortcuts";
import React from "react";
import type { AddressBarHandle } from "~/components/firefox/AddressBar";
import type { ShortcutHandlers } from "~/types/browser";
import { ABOUT_PAGES, TabType, PROXY_MESSAGE_TYPES } from "~/constants/browser";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
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
  const [smartWindowMode, setSmartWindowMode] = React.useState(false);
  const [pageContent, setPageContent] = React.useState<string>("");
  const [proxyNavigationState, setProxyNavigationState] = React.useState<{
    canGoBack: boolean;
    canGoForward: boolean;
  }>({ canGoBack: false, canGoForward: false });
  const { setDebugInfo } = useDebug();
  const iframeRefs = React.useRef<{ [key: string]: HTMLIFrameElement | null }>({});
  const [isClient, setIsClient] = React.useState(false);

  const {
    tabs,
    activeTab,
    activeTabId,
    updateTab,
    updateActiveTab,
    navigateActiveTab,
    closeTab,
    createTab,
    switchTab,
    reorderTabs,
  } = useTabManager({ smartWindowMode });

  // Set isClient to true after mount
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Update Firefox View tab icon when Smart Window mode changes
  React.useEffect(() => {
    updateTab("firefox-view", {
      favicon: smartWindowMode ? <SparklyFirefoxViewIcon /> : <FirefoxViewIcon />,
    });
  }, [smartWindowMode, updateTab]);

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
    if (sidebarOpen && activeTab) {
      const shouldRequestContent =
        (activeTab.type === TabType.PROXY && activeTab.url !== ABOUT_PAGES.BLANK) ||
        (activeTab.type === TabType.STUB && isLocalPath(activeTab.url || ""));

      if (shouldRequestContent) {
        requestPageInfo();
        requestPageContent();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen, activeTabId, activeTab?.type, activeTab?.url]);

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

    console.log("[handleBack] Previous URL:", previous.url);
    console.log("[handleBack] Current tab:", activeTab);
    console.log("[handleBack] Tab history:", activeTab.history);
    console.log("[handleBack] History index:", activeTab.historyIndex);
    const parsedUrl = parseNavigationUrl(previous.url);
    const shouldHandleLocally = shouldHandleNavigationLocally(activeTab, previous.url);
    console.log("[handleBack] Should handle locally:", shouldHandleLocally);

    if (!shouldHandleLocally) {
      // For proxy tabs going to non-about:blank URLs, send the goBack command
      // Use setTimeout to ensure the command is sent after any event propagation
      setTimeout(() => {
        sendCommand("goBack");
      }, 0);

      // Update the local history index to track that we went back
      updateActiveTab({
        historyIndex: previous.index,
      });
    } else {
      // For non-proxy tabs or when going back to about:blank or local files, handle locally
      // Check if this is a local path and get the display URL
      let displayUrl = parsedUrl.displayUrl;
      if (isLocalPath(previous.url)) {
        const realUrl = getUrlForLocalPath(previous.url);
        displayUrl = realUrl || previous.url;
      }

      updateActiveTab({
        url: previous.url,
        displayUrl: displayUrl,
        historyIndex: previous.index,
        title: previous.url === ABOUT_PAGES.BLANK ? "New Tab" : `Loading...`,
        favicon:
          previous.url === ABOUT_PAGES.BLANK ? (
            <FirefoxFavicon />
          ) : (
            <DynamicFavicon url={displayUrl} />
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
      // Check if this is a local path and get the display URL
      let displayUrl = parsedUrl.displayUrl;
      if (isLocalPath(next.url)) {
        const realUrl = getUrlForLocalPath(next.url);
        displayUrl = realUrl || next.url;
      }

      updateActiveTab({
        url: next.url,
        displayUrl: displayUrl,
        historyIndex: next.index,
        title: next.url === ABOUT_PAGES.BLANK ? "New Tab" : `Loading...`,
        favicon:
          next.url === ABOUT_PAGES.BLANK ? <FirefoxFavicon /> : <DynamicFavicon url={displayUrl} />,
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

  const handleNewTab = (url?: string) => {
    createTab(url);
    // Focus the address bar for the new tab only if no URL provided
    if (!url) {
      setTimeout(() => {
        addressBarRef.current?.focus();
      }, 0);
    }
  };

  const handleSmartWindowToggle = () => {
    const newSmartWindowMode = !smartWindowMode;
    setSmartWindowMode(newSmartWindowMode);

    // When entering Smart Window mode
    if (newSmartWindowMode) {
      // If the current tab is a new tab (about:blank), close it
      if (activeTab?.url === ABOUT_PAGES.BLANK) {
        closeTab(activeTab.id);

        // Clean up iframe reference for the closed tab
        if (activeTab.id !== "firefox-view") {
          // Don't clean up firefox-view
          delete iframeRefs.current[activeTab.id];
        }
      }

      // Switch to Firefox View
      switchTab("firefox-view");
    } else {
      // When exiting Smart Window mode
      // If currently on Firefox View, create a new tab and switch to it
      if (activeTab?.url === ABOUT_PAGES.FIREFOX_VIEW) {
        handleNewTab();
      }
    }
  };

  const handleTabReorder = (draggedTabId: string, targetTabId: string, dropBefore: boolean) => {
    reorderTabs(draggedTabId, targetTabId, dropBefore);
  };

  // Calculate scale for mobile
  const { containerStyle, browserStyle } = useBrowserScale();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Setup keyboard shortcuts with proper typing
  const shortcutHandlers: ShortcutHandlers = {
    // Navigation
    back: handleBack,
    forward: handleForward,
    home: () => {
      handleNavigate(ABOUT_PAGES.BLANK);
      toast("Home");
    },
    reload: handleRefresh,
    stop: () => toast("Stop"),

    // Tabs
    newTab: () => {
      // If in Firefox View Smart Window mode, focus search instead of creating new tab
      if (activeTab?.url === ABOUT_PAGES.FIREFOX_VIEW && smartWindowMode) {
        // Find the search input and focus it
        const searchInput = document.querySelector(
          'input[placeholder="Search or enter address"]',
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      } else {
        handleNewTab();
      }
    },
    closeTab: () => activeTabId && handleTabClose(activeTabId),
    nextTab: () => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      if (currentIndex >= 0 && currentIndex < tabs.length - 1) {
        switchTab(tabs[currentIndex + 1]!.id);
      }
    },
    previousTab: () => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      if (currentIndex > 0) {
        switchTab(tabs[currentIndex - 1]!.id);
      }
    },
    moveTabLeft: () => toast("Move Tab Left"),
    moveTabRight: () => toast("Move Tab Right"),
    moveTabStart: () => toast("Move Tab to Start"),
    moveTabEnd: () => toast("Move Tab to End"),
    pinTab: () => toast("Pin Tab"),
    duplicateTab: () => toast("Duplicate Tab"),

    // Tab selection by number
    selectTab1: () => tabs[0] && switchTab(tabs[0].id),
    selectTab2: () => tabs[1] && switchTab(tabs[1].id),
    selectTab3: () => tabs[2] && switchTab(tabs[2].id),
    selectTab4: () => tabs[3] && switchTab(tabs[3].id),
    selectTab5: () => tabs[4] && switchTab(tabs[4].id),
    selectTab6: () => tabs[5] && switchTab(tabs[5].id),
    selectTab7: () => tabs[6] && switchTab(tabs[6].id),
    selectTab8: () => tabs[7] && switchTab(tabs[7].id),
    selectLastTab: () => tabs.length > 0 && switchTab(tabs[tabs.length - 1]!.id),

    // Find
    find: () => toast("Find in Page"),
    findNext: () => toast("Find Next"),
    findPrevious: () => toast("Find Previous"),

    // Bookmarks
    bookmarkPage: () => toast("Bookmark Page"),
    showBookmarksSidebar: () => toast("Show Bookmarks Sidebar"),

    // History
    showHistorySidebar: () => toast("Show History Sidebar"),

    // UI
    focusAddressBar: () => addressBarRef.current?.focus(),
    toggleSidebar: () => setSidebarOpen(!sidebarOpen),
    toggleSettings: () => setShowHelp((prev) => !prev),
    pageInfo: () => {
      setSidebarOpen((prev) => !prev);
      // If opening sidebar, we'll need to trigger the Page Info section
      // This will be handled by the Sidebar component's effect
    },

    // Zoom
    zoomIn: () => toast("Zoom In"),
    zoomOut: () => toast("Zoom Out"),
    resetZoom: () => toast("Reset Zoom"),
  };

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcutHandlers);

  // Handle keyboard events forwarded from proxy iframes
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === PROXY_MESSAGE_TYPES.KEYBOARD) {
        // Create a synthetic keyboard event
        const keyboardEvent = new KeyboardEvent("keydown", {
          key: event.data.key,
          code: event.data.code,
          altKey: event.data.altKey,
          ctrlKey: event.data.ctrlKey,
          shiftKey: event.data.shiftKey,
          metaKey: event.data.metaKey,
          bubbles: true,
          cancelable: true,
        });

        // Dispatch the event on the window
        window.dispatchEvent(keyboardEvent);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-5 flex items-start justify-center overflow-hidden">
      <div className="relative" style={containerStyle}>
        <div ref={containerRef} className="flex flex-col absolute" style={browserStyle}>
          {isClient ? (
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
              hideToolbar={activeTab?.url === ABOUT_PAGES.FIREFOX_VIEW && smartWindowMode}
              smartWindowMode={smartWindowMode}
              isFirefoxViewActive={activeTab?.url === ABOUT_PAGES.FIREFOX_VIEW}
              className={cn("flex-1 min-h-0", smartWindowMode && "smart-window-mode")}
            >
              <div className="flex w-full h-full overflow-hidden">
                <div
                  className={cn(
                    "flex-shrink-0 transition-all duration-200 ease-in-out",
                    sidebarOpen ? "w-auto" : "w-0 overflow-hidden",
                  )}
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
                </div>
                <div
                  className={cn(
                    "flex-1 min-w-0 h-full bg-white overflow-hidden relative transition-all duration-200 ease-in-out",
                    sidebarOpen && "rounded-tl-lg",
                  )}
                >
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

                              // Inject proxy-tunnel.js after iframe loads
                              el.addEventListener(
                                "load",
                                () => {
                                  const iframeDoc = el.contentDocument;
                                  const iframeWin = el.contentWindow;

                                  if (iframeDoc && iframeWin) {
                                    // Set configuration on the iframe's window
                                    (iframeWin as any).PROXY_TUNNEL_CONFIG = {
                                      PROXY_DOMAIN: import.meta.env.VITE_PROXY_DOMAIN,
                                      ALLOWED_ORIGINS: ["*"],
                                    };

                                    // Create and inject the script tag
                                    const script = iframeDoc.createElement("script");
                                    script.src = "/proxy-tunnel.js";
                                    script.async = true;
                                    iframeDoc.body.appendChild(script);
                                  }
                                },
                                { once: true },
                              );
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
                  {activeTab?.url === ABOUT_PAGES.BLANK && !smartWindowMode && (
                    <NewTabPage
                      onNavigate={handleNavigate}
                      onSmartWindowToggle={handleSmartWindowToggle}
                    />
                  )}
                  {activeTab?.url === ABOUT_PAGES.BLANK && smartWindowMode && (
                    <div className="flex items-center justify-center h-full bg-[#f9f9fb]">
                      <div className="max-w-6xl mx-auto w-full p-8">
                        <div className="text-center mb-8">
                          <h1 className="text-3xl font-light text-gray-700 mb-4">
                            Smart Window Mode
                          </h1>
                          <p className="text-gray-500 mb-6">
                            AI-powered browsing experience with enhanced features
                          </p>
                          <button
                            onClick={handleSmartWindowToggle}
                            className={cn(
                              "px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700",
                              "rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
                              "font-medium text-sm",
                            )}
                          >
                            Exit Smart Window
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Smart Search</h3>
                            <p className="text-gray-600 text-sm">
                              Enhanced search with AI-powered suggestions and context
                            </p>
                          </div>
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                              Page Analysis
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Automatic page summaries and key information extraction
                            </p>
                          </div>
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                              Smart Bookmarks
                            </h3>
                            <p className="text-gray-600 text-sm">
                              AI-organized bookmarks with automatic categorization
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab?.url === ABOUT_PAGES.FIREFOX_VIEW && (
                    <FirefoxView
                      tabs={tabs}
                      activeTabId={activeTabId}
                      onTabClick={(tabId) => {
                        switchTab(tabId);
                      }}
                      onTabClose={handleTabClose}
                      onNavigate={handleNavigate}
                      onNewTab={handleNewTab}
                      iframeRefs={iframeRefs}
                      smartWindowMode={smartWindowMode}
                      onSmartWindowToggle={handleSmartWindowToggle}
                      onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                    />
                  )}
                </div>
              </div>
            </BrowserShell>
          ) : null}
        </div>
      </div>
      <SettingsModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
