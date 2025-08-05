import { describe, it, expect } from "vitest";
import {
  parseNavigationUrl,
  shouldHandleNavigationLocally,
  getTabTypeForUrl,
  canGoBack,
  canGoForward,
  getPreviousUrl,
  getNextUrl,
} from "./navigation";
import { Tab, TabType, ABOUT_PAGES } from "~/constants/browser";

describe("parseNavigationUrl", () => {
  it("should parse regular URLs correctly", () => {
    const result = parseNavigationUrl("https://example.com/path");
    expect(result).toEqual({
      fullUrl: "https://example.com/path",
      displayUrl: "https://example.com/path",
      hostname: "example.com",
    });
  });

  it("should add https protocol to URLs without protocol", () => {
    const result = parseNavigationUrl("example.com");
    expect(result).toEqual({
      fullUrl: "https://example.com",
      displayUrl: "https://example.com",
      hostname: "example.com",
    });
  });

  it("should throw error for empty URL", () => {
    expect(() => parseNavigationUrl("")).toThrow("URL cannot be empty");
  });
});

describe("shouldHandleNavigationLocally", () => {
  it("should return true for undefined tab", () => {
    expect(shouldHandleNavigationLocally(undefined, "https://example.com")).toBe(true);
  });

  it("should return true for about: pages", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
    };
    expect(shouldHandleNavigationLocally(tab, ABOUT_PAGES.BLANK)).toBe(true);
    expect(shouldHandleNavigationLocally(tab, ABOUT_PAGES.FIREFOX_VIEW)).toBe(true);
  });

  it("should return true for non-proxy tabs", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: ABOUT_PAGES.BLANK,
      type: TabType.STUB,
    };
    expect(shouldHandleNavigationLocally(tab, "https://example.com")).toBe(true);
  });

  it("should return false for proxy tabs with regular URLs", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
    };
    expect(shouldHandleNavigationLocally(tab, "https://other.com")).toBe(false);
  });

  it("should return true for proxy tabs navigating to about: pages", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
    };
    expect(shouldHandleNavigationLocally(tab, "about:blank")).toBe(true);
    expect(shouldHandleNavigationLocally(tab, "about:newtab")).toBe(true);
  });

  it("should return true for proxy tabs navigating to local files", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
    };
    expect(shouldHandleNavigationLocally(tab, "/pages/test.html")).toBe(true);
    expect(shouldHandleNavigationLocally(tab, "file:///Users/test/doc.html")).toBe(true);
  });
});

describe("getTabTypeForUrl", () => {
  it("should return STUB for about:blank", () => {
    expect(getTabTypeForUrl(ABOUT_PAGES.BLANK)).toBe(TabType.STUB);
  });

  it("should return STUB for about:firefoxview", () => {
    expect(getTabTypeForUrl(ABOUT_PAGES.FIREFOX_VIEW)).toBe(TabType.STUB);
  });

  it("should return STUB for local paths", () => {
    expect(getTabTypeForUrl("/pages/firefox-wiki.html")).toBe(TabType.STUB);
    expect(getTabTypeForUrl("/pages/test.html")).toBe(TabType.STUB);
  });

  it("should return PROXY for regular URLs", () => {
    expect(getTabTypeForUrl("https://example.com")).toBe(TabType.PROXY);
  });
});

describe("canGoBack", () => {
  it("should return false for undefined tab", () => {
    expect(canGoBack(undefined, false)).toBe(false);
  });

  it("should return true if tab has local history", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.STUB,
      history: ["about:blank", "https://example.com"],
      historyIndex: 1,
    };
    expect(canGoBack(tab, false)).toBe(true);
  });

  it("should return false if tab is at first history entry", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "about:blank",
      type: TabType.STUB,
      history: ["about:blank"],
      historyIndex: 0,
    };
    expect(canGoBack(tab, false)).toBe(false);
  });

  it("should return true for proxy tab if proxy can go back", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
      history: ["https://example.com"],
      historyIndex: 0,
    };
    expect(canGoBack(tab, true)).toBe(true);
  });
});

describe("canGoForward", () => {
  it("should return false for undefined tab", () => {
    expect(canGoForward(undefined)).toBe(false);
  });

  it("should return true if tab has forward history", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "about:blank",
      type: TabType.STUB,
      history: ["about:blank", "https://example.com"],
      historyIndex: 0,
    };
    expect(canGoForward(tab)).toBe(true);
  });

  it("should return false if tab is at last history entry", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.STUB,
      history: ["about:blank", "https://example.com"],
      historyIndex: 1,
    };
    expect(canGoForward(tab)).toBe(false);
  });
});

describe("getPreviousUrl", () => {
  it("should return null if no history", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
    };
    expect(getPreviousUrl(tab)).toBe(null);
  });

  it("should return null if at first entry", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "about:blank",
      type: TabType.STUB,
      history: ["about:blank"],
      historyIndex: 0,
    };
    expect(getPreviousUrl(tab)).toBe(null);
  });

  it("should return previous URL and index", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
      history: ["about:blank", "https://example.com"],
      historyIndex: 1,
    };
    expect(getPreviousUrl(tab)).toEqual({
      url: "about:blank",
      index: 0,
    });
  });
});

describe("getNextUrl", () => {
  it("should return null if no history", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
    };
    expect(getNextUrl(tab)).toBe(null);
  });

  it("should return null if at last entry", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      type: TabType.PROXY,
      history: ["about:blank", "https://example.com"],
      historyIndex: 1,
    };
    expect(getNextUrl(tab)).toBe(null);
  });

  it("should return next URL and index", () => {
    const tab: Tab = {
      id: "1",
      title: "Test",
      url: "about:blank",
      type: TabType.STUB,
      history: ["about:blank", "https://example.com"],
      historyIndex: 0,
    };
    expect(getNextUrl(tab)).toEqual({
      url: "https://example.com",
      index: 1,
    });
  });
});
