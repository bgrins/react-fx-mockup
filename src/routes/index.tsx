import { createFileRoute } from "@tanstack/react-router";
import { BrowserShell } from "~/components/firefox/BrowserShell";
import { SplitView } from "~/components/airbnb/SplitView";
import {
  AirbnbFavicon,
  SkyscannerFavicon,
  YouTubeFavicon,
  FirefoxViewIcon,
} from "~/components/firefox/Favicons";
import { mockProperties } from "~/data/mockProperties";
import React from "react";

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: React.ReactNode;
  isPinned?: boolean;
  isActive?: boolean;
}

export const Route = createFileRoute("/")({
  component: Home,
});

function Home(): React.ReactElement {
  const [activeTabId, setActiveTabId] = React.useState("airbnb-2");
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
      favicon: <SkyscannerFavicon />,
    },
    {
      id: "airbnb-1",
      title: 'Villa il Vecchio courtyard "pergola" - Villas for Rent in Rodos, Greece - Airbnb',
      url: "https://www.airbnb.com/rooms/1370154278151273293",
      favicon: <AirbnbFavicon />,
    },
    {
      id: "airbnb-2",
      title: "Saint George Studio - Cottages for Rent in Psinthos, Greece - Airbnb",
      url: "https://www.airbnb.com/rooms/1370154278151273293",
      favicon: <AirbnbFavicon />,
      isActive: true,
    },
    {
      id: "youtube",
      title: "Cheap flights from Toronto to Tokyo | Skyscanner",
      url: "https://www.youtube.com",
      favicon: <YouTubeFavicon />,
    },
  ]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 lg:p-12 overflow-hidden">
      <div className="h-full max-w-[1600px] mx-auto flex flex-col">
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
            const newTab = {
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
          className="flex-1 min-h-0"
        >
          {activeTabId.startsWith("airbnb") && (
            <SplitView
              leftProperty={mockProperties.villaRodos}
              rightProperty={mockProperties.saintGeorgeStudio}
            />
          )}
          {activeTabId === "skyscanner" && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Skyscanner content would go here</p>
            </div>
          )}
          {activeTabId === "youtube" && (
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
  );
}
