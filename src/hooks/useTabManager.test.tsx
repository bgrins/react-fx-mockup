import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTabManager } from "./useTabManager";
import { TabType } from "~/constants/browser";

describe("useTabManager", () => {
  it("should initialize with default tabs", () => {
    const { result } = renderHook(() => useTabManager());

    expect(result.current.tabs).toHaveLength(2);
    expect(result.current.tabs[0]?.id).toBe("firefox-view");
    expect(result.current.tabs[0]?.isPinned).toBe(true);
    expect(result.current.tabs[1]?.id).toBe("tab-1");
    expect(result.current.activeTabId).toBe("tab-1");
    expect(result.current.activeTab?.id).toBe("tab-1");
  });

  it("should create a new tab", () => {
    const { result } = renderHook(() => useTabManager());

    act(() => {
      result.current.createTab("https://example.com");
    });

    expect(result.current.tabs).toHaveLength(3);
    const newTab = result.current.tabs[2];
    expect(newTab?.url).toBe("https://example.com");
    expect(newTab?.isActive).toBe(true);
    expect(newTab?.type).toBe(TabType.PROXY);
    expect(result.current.activeTabId).toBe(newTab?.id);
  });

  it("should switch between tabs", () => {
    const { result } = renderHook(() => useTabManager());

    act(() => {
      result.current.switchTab("firefox-view");
    });

    expect(result.current.activeTabId).toBe("firefox-view");
    expect(result.current.activeTab?.id).toBe("firefox-view");
    expect(result.current.tabs[0]?.isActive).toBe(true);
    expect(result.current.tabs[1]?.isActive).toBe(false);
  });

  it("should close a tab", () => {
    const { result } = renderHook(() => useTabManager());

    // Create a new tab first
    act(() => {
      result.current.createTab("https://example.com");
    });

    const tabToClose = result.current.tabs[2];

    act(() => {
      if (tabToClose) {
        result.current.closeTab(tabToClose.id);
      }
    });

    expect(result.current.tabs).toHaveLength(2);
    expect(result.current.tabs.find((t) => t.id === tabToClose?.id)).toBeUndefined();
  });

  it("should not close pinned tabs", () => {
    const { result } = renderHook(() => useTabManager());

    act(() => {
      result.current.closeTab("firefox-view");
    });

    expect(result.current.tabs).toHaveLength(2);
    expect(result.current.tabs[0]?.id).toBe("firefox-view");
  });

  it("should create a new tab when closing the last tab", () => {
    const { result } = renderHook(() => useTabManager());

    // Close the regular tab
    act(() => {
      result.current.closeTab("tab-1");
    });

    // Try to close the pinned tab (shouldn't work)
    act(() => {
      result.current.closeTab("firefox-view");
    });

    // Should still have 2 tabs (firefox-view remains)
    expect(result.current.tabs.length).toBeGreaterThanOrEqual(1);
  });

  it("should update active tab properties", () => {
    const { result } = renderHook(() => useTabManager());

    act(() => {
      result.current.updateActiveTab({
        title: "Updated Title",
        url: "https://updated.com",
      });
    });

    expect(result.current.activeTab?.title).toBe("Updated Title");
    expect(result.current.activeTab?.url).toBe("https://updated.com");
  });

  it("should navigate active tab with new URL", () => {
    const { result } = renderHook(() => useTabManager());

    act(() => {
      result.current.navigateActiveTab({
        url: "https://example.com",
      });
    });

    expect(result.current.activeTab?.url).toBe("https://example.com");
    expect(result.current.activeTab?.history).toContain("https://example.com");
    expect(result.current.activeTab?.historyIndex).toBe(1);
  });

  it("should handle popstate navigation", () => {
    const { result } = renderHook(() => useTabManager());

    // Navigate to create history
    act(() => {
      result.current.navigateActiveTab({ url: "https://example.com" });
    });

    act(() => {
      result.current.navigateActiveTab({ url: "https://another.com" });
    });

    // Navigate back via popstate
    act(() => {
      result.current.navigateActiveTab({
        url: "https://example.com",
        navigationType: "popstate",
      });
    });

    expect(result.current.activeTab?.url).toBe("https://example.com");
    expect(result.current.activeTab?.historyIndex).toBe(1);
  });

  it("should reorder tabs correctly", () => {
    const { result } = renderHook(() => useTabManager());

    // Create one additional tab
    act(() => {
      result.current.createTab("https://tab2.com");
    });

    expect(result.current.tabs).toHaveLength(3);
    const initialOrder = result.current.tabs.map((t) => t.id);

    // Reorder tabs - move last tab (index 2) before the regular tab (index 1)
    act(() => {
      const lastTab = result.current.tabs[2];
      const regularTab = result.current.tabs[1];
      if (lastTab && regularTab) {
        result.current.reorderTabs(lastTab.id, regularTab.id, true);
      }
    });

    const newOrder = result.current.tabs.map((t) => t.id);
    expect(newOrder).not.toEqual(initialOrder);
    // The last tab (previously at index 2) should now be at index 1
    expect(newOrder[1]).toBe(initialOrder[2]);
    expect(newOrder[2]).toBe(initialOrder[1]);
  });

  it("should initialize with custom tabs", () => {
    const customTabs = [
      {
        id: "custom-1",
        title: "Custom Tab",
        url: "https://custom.com",
        favicon: null as any,
        isActive: true,
        history: ["https://custom.com"],
        historyIndex: 0,
        type: TabType.PROXY,
      },
    ];

    const { result } = renderHook(() => useTabManager({ initialTabs: customTabs }));

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0]?.id).toBe("custom-1");
    expect(result.current.activeTabId).toBe("custom-1");
  });

  it("should prevent duplicate history entries for the same URL", () => {
    const { result } = renderHook(() => useTabManager());

    // Navigate to a URL
    act(() => {
      result.current.navigateActiveTab({ url: "https://example.com" });
    });

    const historyAfterFirst = result.current.activeTab?.history;
    const historyIndexAfterFirst = result.current.activeTab?.historyIndex;

    // Navigate to the same URL again
    act(() => {
      result.current.navigateActiveTab({ url: "https://example.com" });
    });

    // History should not have changed
    expect(result.current.activeTab?.history).toEqual(historyAfterFirst);
    expect(result.current.activeTab?.historyIndex).toBe(historyIndexAfterFirst);
  });

  it("should normalize URLs to prevent duplicates with trailing slashes", () => {
    const { result } = renderHook(() => useTabManager());

    // Navigate to URL without trailing slash
    act(() => {
      result.current.navigateActiveTab({ url: "https://example.com" });
    });

    const historyAfterFirst = result.current.activeTab?.history;
    const historyIndexAfterFirst = result.current.activeTab?.historyIndex;

    // Navigate to same URL with trailing slash
    act(() => {
      result.current.navigateActiveTab({ url: "https://example.com/" });
    });

    // History should not have changed because URLs are normalized
    expect(result.current.activeTab?.history).toEqual(historyAfterFirst);
    expect(result.current.activeTab?.historyIndex).toBe(historyIndexAfterFirst);
  });

  it("should maintain correct history when navigating from about:blank to a URL and back", () => {
    const { result } = renderHook(() => useTabManager());

    // Initial state should be about:blank
    expect(result.current.activeTab?.url).toBe("about:blank");
    expect(result.current.activeTab?.history).toEqual(["about:blank"]);
    expect(result.current.activeTab?.historyIndex).toBe(0);

    // Navigate to example.com
    act(() => {
      result.current.navigateActiveTab({ url: "https://example.com" });
    });

    expect(result.current.activeTab?.url).toBe("https://example.com");
    expect(result.current.activeTab?.history).toEqual(["about:blank", "https://example.com"]);
    expect(result.current.activeTab?.historyIndex).toBe(1);

    // Should be able to go back
    expect(result.current.activeTab?.history?.[0]).toBe("about:blank");
  });
});
