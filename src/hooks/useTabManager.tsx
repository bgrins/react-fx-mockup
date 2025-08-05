import React from "react";
import { Tab, TabType, ABOUT_PAGES } from "~/constants/browser";
import { FirefoxFavicon, FirefoxViewIcon, DynamicFavicon } from "~/components/firefox/Favicons";
import { getTabTypeForUrl } from "~/utils/navigation";

interface UseTabManagerOptions {
  initialTabs?: Tab[];
}

interface TabNavigationOptions {
  url: string;
  navigationType?: string;
  displayUrl?: string;
}

export function useTabManager(options: UseTabManagerOptions = {}) {
  const defaultTabs: Tab[] = [
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
  ];

  const initialTabs = options.initialTabs || defaultTabs;
  const initialActiveTab = initialTabs.find((tab) => tab.isActive) || initialTabs[0];

  const [activeTabId, setActiveTabId] = React.useState(initialActiveTab?.id || "tab-1");
  const [tabs, setTabs] = React.useState<Tab[]>(initialTabs);

  const activeTab = React.useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  const updateTab = React.useCallback((tabId: string, updates: Partial<Tab>) => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)),
    );
  }, []);

  const updateActiveTab = React.useCallback(
    (updates: Partial<Tab>) => {
      if (activeTabId) {
        updateTab(activeTabId, updates);
      }
    },
    [activeTabId, updateTab],
  );

  const navigateTab = React.useCallback((tabId: string, options: TabNavigationOptions) => {
    console.log("[navigateTab] Navigating tab:", tabId, "with options:", options);

    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== tabId) return tab;

        const history = tab.history || [tab.url];
        const historyIndex = tab.historyIndex ?? 0;

        // For popstate navigation, find existing index
        if (options.navigationType === "popstate") {
          const existingIndex = history.findIndex((h) => h === options.url);
          if (existingIndex !== -1) {
            return {
              ...tab,
              url: options.url,
              historyIndex: existingIndex,
              title: `Loading...`,
              favicon: <DynamicFavicon url={options.url} />,
            };
          }
        }

        // For new navigation, add to history (but avoid duplicates)
        // Normalize URLs to avoid duplicates like example.com vs example.com/
        const normalizeUrl = (url: string) => {
          try {
            const u = new URL(url);
            // Remove trailing slash from pathname if it's just "/"
            if (u.pathname === "/") {
              return u.origin;
            }
            return url;
          } catch {
            return url;
          }
        };

        // Check if we're navigating to the same URL that's already at the current position
        const currentUrl = history[historyIndex];
        const normalizedNewUrl = normalizeUrl(options.url);
        const normalizedCurrentUrl = currentUrl ? normalizeUrl(currentUrl) : null;

        if (normalizedCurrentUrl === normalizedNewUrl) {
          // Don't add duplicate entry, just update other properties
          return {
            ...tab,
            title: `Loading...`,
            favicon: <DynamicFavicon url={options.displayUrl || options.url} />,
            displayUrl: options.displayUrl,
          };
        }

        // Add to history
        const newHistory = [...history.slice(0, historyIndex + 1), options.url];
        const newHistoryIndex = newHistory.length - 1;
        const newType = getTabTypeForUrl(options.url);

        console.log("[navigateTab] New tab state:", {
          url: options.url,
          displayUrl: options.displayUrl,
          type: newType,
          history: newHistory,
        });

        return {
          ...tab,
          url: options.url, // Always use the actual URL
          displayUrl: options.displayUrl, // Store display URL separately if provided
          title: `Loading...`,
          favicon: <DynamicFavicon url={options.displayUrl || options.url} />,
          type: newType, // Determine type based on actual URL
          history: newHistory,
          historyIndex: newHistoryIndex,
        };
      }),
    );
  }, []);

  const navigateActiveTab = React.useCallback(
    (options: TabNavigationOptions) => {
      if (activeTabId) {
        navigateTab(activeTabId, options);
      }
    },
    [activeTabId, navigateTab],
  );

  const closeTab = React.useCallback(
    (tabId: string) => {
      const tabToClose = tabs.find((t) => t.id === tabId);
      if (tabToClose?.isPinned) return;

      const newTabs = tabs.filter((t) => t.id !== tabId);

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
        return newTab.id;
      }

      // If we closed the active tab, switch to another tab
      if (tabId === activeTabId) {
        const closedIndex = tabs.findIndex((t) => t.id === tabId);
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
        const newActiveTab = newTabs[newActiveIndex];
        if (newActiveTab) {
          setActiveTabId(newActiveTab.id);
          setTabs(newTabs.map((tab) => ({ ...tab, isActive: tab.id === newActiveTab.id })));
          return newActiveTab.id;
        }
      } else {
        setTabs(newTabs);
      }

      return null;
    },
    [tabs, activeTabId],
  );

  const createTab = React.useCallback(
    (url: string = ABOUT_PAGES.BLANK) => {
      const newTabId = `tab-${Date.now()}`;
      const newTab: Tab = {
        id: newTabId,
        title: url === ABOUT_PAGES.BLANK ? "New Tab" : "Loading...",
        url,
        favicon: url === ABOUT_PAGES.BLANK ? <FirefoxFavicon /> : <DynamicFavicon url={url} />,
        isActive: true,
        history: [url],
        historyIndex: 0,
        type: url === ABOUT_PAGES.BLANK ? TabType.STUB : TabType.PROXY,
      };

      // Set all other tabs as inactive
      const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }));
      setTabs([...updatedTabs, newTab]);
      setActiveTabId(newTabId);
      return newTabId;
    },
    [tabs],
  );

  const switchTab = React.useCallback((tabId: string) => {
    setActiveTabId(tabId);
    setTabs((currentTabs) => currentTabs.map((tab) => ({ ...tab, isActive: tab.id === tabId })));
  }, []);

  const reorderTabs = React.useCallback(
    (draggedTabId: string, targetTabId: string, dropBefore: boolean) => {
      const draggedIndex = tabs.findIndex((t) => t.id === draggedTabId);
      const targetIndex = tabs.findIndex((t) => t.id === targetTabId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newTabs = [...tabs];
      const [draggedTab] = newTabs.splice(draggedIndex, 1);

      if (!draggedTab) return;

      // Calculate the new index based on drop position
      let newIndex = targetIndex;
      if (!dropBefore && draggedIndex < targetIndex) {
        newIndex = targetIndex;
      } else if (!dropBefore) {
        newIndex = targetIndex + 1;
      } else if (draggedIndex < targetIndex) {
        newIndex = targetIndex - 1;
      }

      newTabs.splice(newIndex, 0, draggedTab);
      setTabs(newTabs);
    },
    [tabs],
  );

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    updateTab,
    updateActiveTab,
    navigateTab,
    navigateActiveTab,
    closeTab,
    createTab,
    switchTab,
    reorderTabs,
  };
}
