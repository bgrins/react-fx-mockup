import { createFileRoute } from "@tanstack/react-router";
import { BrowserShell } from "~/components/firefox/BrowserShell";
import {
  SkyscannerFavicon,
  YouTubeFavicon,
  FirefoxViewIcon,
  DynamicFavicon,
} from "~/components/firefox/Favicons";
import { urlToProxy } from "~/utils/proxy";
import { useDebug } from "~/contexts/useDebug";
import { useBrowserScale } from "~/hooks/useBrowserScale";
import React from "react";
import type { Tab } from "~/types/browser";
import { TabType } from "~/types/browser";

export const Route = createFileRoute("/split-view")({
  component: SplitViewPage,
});

function SplitViewPage(): React.ReactElement {
  const [activeTabId, setActiveTabId] = React.useState("airbnb-2");
  const { setDebugInfo } = useDebug();
  const [tabs, setTabs] = React.useState<Tab[]>([
    {
      id: "firefox",
      title: "Firefox View",
      url: "about:firefoxview",
      favicon: <FirefoxViewIcon />,
      isPinned: true,
    },
    {
      id: "skyscanner",
      title: "Skyscanner: Compare Cheap Flights & Book Airline Tickets to ...",
      url: "https://www.skyscanner.com",
      favicon: <DynamicFavicon url="https://www.skyscanner.com" fallback={<SkyscannerFavicon />} />,
      type: TabType.PROXY,
    },
    {
      id: "airbnb-1",
      title: 'Villa il Vecchio courtyard "pergola" - Villas for Rent in Rodos, Greece - Airbnb',
      url: "/pages/villa-il-vecchio.html",
      favicon: <DynamicFavicon url="https://www.airbnb.com" />,
      type: TabType.STUB,
    },
    {
      id: "airbnb-2",
      title: "Saint George Studio - Cottages for Rent in Psinthos, Greece - Airbnb",
      url: "/pages/st-george.html",
      favicon: <DynamicFavicon url="https://www.airbnb.com" />,
      isActive: true,
      type: TabType.STUB,
    },
    {
      id: "airbnb-3",
      title: "Airbnb | Vacation rentals, cabins, beach houses, unique homes & experiences",
      url: "https://www.airbnb.com",
      favicon: <DynamicFavicon url="https://www.airbnb.com" />,
      type: TabType.PROXY,
    },
    {
      id: "youtube",
      title: "Cheap flights from Toronto to Tokyo | Skyscanner",
      url: "https://www.youtube.com",
      favicon: <YouTubeFavicon />,
    },
    {
      id: "github",
      title: "GitHub: Let's build from here",
      url: "https://github.com",
      favicon: <DynamicFavicon url="https://github.com" />,
      type: TabType.PROXY,
    },
    {
      id: "stackoverflow",
      title: "Stack Overflow - Where Developers Learn, Share, & Build Careers",
      url: "https://stackoverflow.com",
      favicon: <DynamicFavicon url="https://stackoverflow.com" />,
      type: TabType.PROXY,
    },
  ]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

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

  // Calculate scale for mobile
  const { containerStyle, browserStyle } = useBrowserScale();
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-5 flex items-start justify-center overflow-hidden">
      <div className="relative" style={containerStyle}>
        <div ref={containerRef} className="flex flex-col absolute" style={browserStyle}>
          <BrowserShell
            tabs={tabs}
            activeTabId={activeTabId}
            currentUrl={activeTab?.url ?? ""}
            onTabClick={setActiveTabId}
            onTabClose={(id) => {
              // Don't close pinned tabs
              const tabToClose = tabs.find((t) => t.id === id);
              if (tabToClose?.isPinned) return;

              // Remove the tab
              const newTabs = tabs.filter((t) => t.id !== id);
              setTabs(newTabs);

              // If we closed the active tab, switch to another tab
              if (id === activeTabId && newTabs.length > 0) {
                const closedIndex = tabs.findIndex((t) => t.id === id);
                const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
                const newActiveTab = newTabs[newActiveIndex];
                if (newActiveTab) {
                  setActiveTabId(newActiveTab.id);
                }
              }
            }}
            onNewTab={() => {
              const newTabId = `tab-${Date.now()}`;
              const newTab: Tab = {
                id: newTabId,
                title: "New Tab",
                url: "about:blank",
              };
              setTabs([...tabs, newTab]);
              setActiveTabId(newTabId);
            }}
            onNavigate={(url) => {
              console.log("Navigate to:", url);
            }}
            onNewTabBelow={() => {
              console.log("New tab below");
            }}
            onCompareTabs={() => {
              console.log("Compare tabs");
            }}
            onCloseBothTabs={() => {
              console.log("Close both tabs");
            }}
            showSplitView={activeTabId === "airbnb-1" || activeTabId === "airbnb-2"}
            className="flex-1 min-h-0"
          >
            {/* Split view for Airbnb tabs */}
            {(activeTabId === "airbnb-1" || activeTabId === "airbnb-2") && (
              <div className="flex h-full w-full gap-1 p-1 bg-gray-100">
                <div className="flex-1 bg-white rounded-lg overflow-hidden">
                  <iframe
                    src="/pages/villa-il-vecchio.html"
                    className="w-full h-full border-0"
                    title="Villa il Vecchio"
                  />
                </div>
                <div className="flex-1 bg-white rounded-lg overflow-hidden relative">
                  <iframe
                    src="/pages/st-george.html"
                    className="w-full h-full border-0"
                    title="Saint George Studio"
                  />
                </div>
              </div>
            )}

            {/* Regular views for other tabs */}
            {activeTabId.startsWith("airbnb") && activeTab?.type === "proxy" && (
              <iframe src={urlToProxy(activeTab.url)} className="w-full h-full" />
            )}
            {!activeTabId.startsWith("airbnb") && activeTab?.type === "proxy" && (
              <iframe src={urlToProxy(activeTab.url)} className="w-full h-full" />
            )}
            {activeTabId === "youtube" && !activeTab?.type && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>YouTube content would go here</p>
              </div>
            )}
            {activeTabId === "firefox" && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Firefox View content would go here</p>
              </div>
            )}
            {activeTabId.startsWith("tab-") && (
              <div className="flex items-center justify-center h-full bg-white">
                <div className="text-center">
                  <h1 className="text-2xl font-light text-gray-700 mb-4">New Tab</h1>
                  <p className="text-gray-500">Start browsing or enter a URL in the address bar</p>
                </div>
              </div>
            )}
          </BrowserShell>
        </div>
      </div>
    </div>
  );
}
