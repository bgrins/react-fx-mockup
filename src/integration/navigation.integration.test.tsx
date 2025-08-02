import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTabManager } from "~/hooks/useTabManager";
import {
  parseNavigationUrl,
  shouldHandleNavigationLocally,
  canGoBack,
  canGoForward,
  getPreviousUrl,
  getNextUrl,
} from "~/utils/navigation";
import { ABOUT_PAGES, TabType } from "~/constants/browser";

describe("Navigation Integration Tests", () => {
  describe("Tab Manager with Navigation Utils", () => {
    it("should handle complete navigation flow with history", () => {
      const { result } = renderHook(() => useTabManager());

      // Start with default tabs
      expect(result.current.activeTab?.url).toBe(ABOUT_PAGES.BLANK);
      expect(canGoBack(result.current.activeTab, false)).toBe(false);
      expect(canGoForward(result.current.activeTab)).toBe(false);

      // Navigate to a website
      act(() => {
        const parsed = parseNavigationUrl("https://example.com");
        result.current.navigateActiveTab({
          url: parsed.fullUrl,
          displayUrl: parsed.displayUrl,
        });
      });

      expect(result.current.activeTab?.url).toBe("https://example.com");
      expect(result.current.activeTab?.type).toBe(TabType.PROXY);
      expect(canGoBack(result.current.activeTab, false)).toBe(true);

      // Navigate to another page
      act(() => {
        const parsed = parseNavigationUrl("https://another.com");
        result.current.navigateActiveTab({
          url: parsed.fullUrl,
          displayUrl: parsed.displayUrl,
        });
      });

      expect(result.current.activeTab?.history).toHaveLength(3);
      expect(result.current.activeTab?.historyIndex).toBe(2);

      // Go back
      const previousUrl = getPreviousUrl(result.current.activeTab!);
      expect(previousUrl?.url).toBe("https://example.com");

      act(() => {
        if (previousUrl) {
          const parsed = parseNavigationUrl(previousUrl.url);
          result.current.updateActiveTab({
            url: parsed.displayUrl,
            historyIndex: previousUrl.index,
          });
        }
      });

      expect(result.current.activeTab?.url).toBe("https://example.com");
      expect(canGoForward(result.current.activeTab)).toBe(true);

      // Go forward
      const nextUrl = getNextUrl(result.current.activeTab!);
      expect(nextUrl?.url).toBe("https://another.com");
    });

    it("should handle local file navigation correctly", () => {
      const { result } = renderHook(() => useTabManager());

      // Navigate to a local file with display URL
      const localUrl = "local:/pages/test.html#https://wikipedia.org";
      const parsed = parseNavigationUrl(localUrl);

      act(() => {
        result.current.navigateActiveTab({
          url: localUrl,
          isLocalFile: parsed.isLocalFile,
          displayUrl: parsed.displayUrl,
          localPath: parsed.localPath,
        });
      });

      expect(result.current.activeTab?.url).toBe("https://wikipedia.org");
      expect(result.current.activeTab?.type).toBe(TabType.LOCAL);
      expect(result.current.activeTab?.localPath).toBe("/pages/test.html");
      // Local tabs are not proxy tabs, so external navigation is handled locally
      expect(shouldHandleNavigationLocally(result.current.activeTab, "https://other.com")).toBe(
        true,
      );

      // Verify history contains the original local: URL format
      const history = result.current.activeTab?.history || [];
      expect(history[history.length - 1]).toBe(localUrl);
    });

    it("should handle mixed navigation between local and proxy tabs", () => {
      const { result } = renderHook(() => useTabManager());

      // Navigate to regular website
      act(() => {
        result.current.navigateActiveTab({
          url: "https://example.com",
        });
      });

      // Navigate to local file
      act(() => {
        const parsed = parseNavigationUrl("local:/pages/wiki.html#https://wiki.com");
        result.current.navigateActiveTab({
          url: "local:/pages/wiki.html#https://wiki.com",
          isLocalFile: true,
          displayUrl: parsed.displayUrl,
          localPath: parsed.localPath,
        });
      });

      // Navigate to another website
      act(() => {
        result.current.navigateActiveTab({
          url: "https://another.com",
        });
      });

      // Verify history
      const tab = result.current.activeTab!;
      expect(tab.history).toHaveLength(4); // blank, example, local, another
      expect(tab.history![1]).toBe("https://example.com");
      expect(tab.history![2]).toBe("local:/pages/wiki.html#https://wiki.com");
      expect(tab.history![3]).toBe("https://another.com");

      // Test navigation decisions
      expect(shouldHandleNavigationLocally(tab, ABOUT_PAGES.BLANK)).toBe(true);
      expect(shouldHandleNavigationLocally(tab, "local:/other.html")).toBe(true);
      expect(shouldHandleNavigationLocally(tab, "https://external.com")).toBe(false);
    });

    it("should handle tab switching and maintain separate histories", () => {
      const { result } = renderHook(() => useTabManager());

      // Create and navigate in first tab
      act(() => {
        result.current.navigateActiveTab({ url: "https://tab1-page1.com" });
        result.current.navigateActiveTab({ url: "https://tab1-page2.com" });
      });

      const tab1History = [...(result.current.activeTab?.history || [])];

      // Create new tab and navigate
      act(() => {
        result.current.createTab("https://tab2-page1.com");
      });

      act(() => {
        result.current.navigateActiveTab({ url: "https://tab2-page2.com" });
      });

      const tab2Id = result.current.activeTabId;
      const tab2History = [...(result.current.activeTab?.history || [])];

      // Switch back to first tab
      act(() => {
        result.current.switchTab("tab-1");
      });

      // Verify histories are independent
      expect(result.current.activeTab?.history).toEqual(tab1History);
      expect(result.current.activeTab?.history).not.toEqual(tab2History);

      // Switch to second tab
      act(() => {
        result.current.switchTab(tab2Id);
      });

      expect(result.current.activeTab?.history).toEqual(tab2History);
    });

    it("should handle popstate navigation correctly", () => {
      const { result } = renderHook(() => useTabManager());

      // Build up history
      const urls = [
        "https://page1.com",
        "https://page2.com",
        "https://page3.com",
        "https://page4.com",
      ];

      urls.forEach((url) => {
        act(() => {
          result.current.navigateActiveTab({ url });
        });
      });

      expect(result.current.activeTab?.historyIndex).toBe(4); // 0 is blank

      // Simulate popstate to page2
      act(() => {
        result.current.navigateActiveTab({
          url: "https://page2.com",
          navigationType: "popstate",
        });
      });

      expect(result.current.activeTab?.url).toBe("https://page2.com");
      expect(result.current.activeTab?.historyIndex).toBe(2);
      expect(canGoBack(result.current.activeTab, false)).toBe(true);
      expect(canGoForward(result.current.activeTab)).toBe(true);
    });

    it("should correctly determine navigation handling for different scenarios", () => {
      const { result } = renderHook(() => useTabManager());

      // Test with no tab
      expect(shouldHandleNavigationLocally(undefined, "https://example.com")).toBe(true);

      // Test with stub tab
      const stubTab = result.current.activeTab;
      expect(shouldHandleNavigationLocally(stubTab, "https://example.com")).toBe(true);
      expect(shouldHandleNavigationLocally(stubTab, ABOUT_PAGES.FIREFOX_VIEW)).toBe(true);

      // Navigate to make it a proxy tab
      act(() => {
        result.current.navigateActiveTab({ url: "https://example.com" });
      });

      const proxyTab = result.current.activeTab;
      expect(shouldHandleNavigationLocally(proxyTab, "https://other.com")).toBe(false);
      expect(shouldHandleNavigationLocally(proxyTab, ABOUT_PAGES.BLANK)).toBe(true);
      expect(shouldHandleNavigationLocally(proxyTab, "local:/file.html")).toBe(true);
    });

    it("should parse various URL formats correctly", () => {
      // Test regular URLs
      const regular = parseNavigationUrl("example.com");
      expect(regular.fullUrl).toBe("https://example.com");
      expect(regular.displayUrl).toBe("https://example.com");
      expect(regular.hostname).toBe("example.com");

      // Test URLs with protocol
      const withProtocol = parseNavigationUrl("http://example.com");
      expect(withProtocol.fullUrl).toBe("http://example.com");

      // Test local files with display URL
      const localWithDisplay = parseNavigationUrl("local:/pages/test.html#https://display.com");
      expect(localWithDisplay.fullUrl).toBe("/pages/test.html");
      expect(localWithDisplay.displayUrl).toBe("https://display.com");
      expect(localWithDisplay.localPath).toBe("/pages/test.html");
      expect(localWithDisplay.isLocalFile).toBe(true);

      // Test local files without display URL
      const localOnly = parseNavigationUrl("local:/pages/test.html");
      expect(localOnly.displayUrl).toBe("local:/pages/test.html");
      expect(localOnly.isLocalFile).toBe(true);
    });
  });
});
