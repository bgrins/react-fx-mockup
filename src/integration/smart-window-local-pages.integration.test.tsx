import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBrowserCore } from "~/hooks/useBrowserCore";
import { DebugProvider } from "~/contexts/DebugContext";

// Mock the iframe refs and proxy tunnel behavior
const mockIframeRefs = {
  current: new Map(),
};

const mockHandleMessage = vi.fn();

// Mock the proxy tunnel hook to simulate local page behavior
const mockOnPageInfo = vi.fn();
vi.mock("~/hooks/useProxyTunnel", () => ({
  useProxyTunnel: (options: any) => {
    // Store the onPageInfo callback so we can call it in tests
    mockOnPageInfo.mockImplementation((info: any) => {
      if (options.onPageInfo) {
        options.onPageInfo(info);
      }
    });

    return {
      sendCommand: vi.fn(),
      requestPageInfo: vi.fn(),
      requestPageContent: vi.fn(),
    };
  },
}));

describe("Smart Window Mode Local Pages Integration", () => {
  let mockIframe: any;
  let mockContentWindow: any;
  let mockContentDocument: any;

  beforeEach(() => {
    // Mock iframe and its contentWindow/contentDocument
    mockContentDocument = {
      title: "Test Page - Updated Title",
      readyState: "complete",
      createElement: vi.fn().mockReturnValue({
        src: "/proxy-tunnel.js",
        async: true,
        onload: null,
        onerror: null,
      }),
      body: {
        appendChild: vi.fn(),
      },
    };

    mockContentWindow = {
      PROXY_TUNNEL_CONFIG: undefined,
      postMessage: vi.fn(),
    };

    mockIframe = {
      contentDocument: mockContentDocument,
      contentWindow: mockContentWindow,
      addEventListener: vi.fn((event, callback) => {
        if (event === "load") {
          // Simulate the load event being called
          setTimeout(callback, 0);
        }
      }),
    };

    // Mock the global window.addEventListener for message events
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = vi.fn((event, callback) => {
      if (event === "message") {
        mockHandleMessage.mockImplementation(callback);
      } else {
        originalAddEventListener(event, callback);
      }
    });

    // Mock the ref map
    mockIframeRefs.current.set("test-tab-id", mockIframe);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should update tab title for local pages in Smart Window mode", async () => {
    const { result } = renderHook(
      () =>
        useBrowserCore({
          smartWindowMode: true,
        }),
      {
        wrapper: DebugProvider,
      },
    );

    // Navigate to a local page (like Test Page)
    act(() => {
      result.current.handleNavigate("/test-page.html");
    });

    const activeTab = result.current.activeTab!;
    expect(activeTab.url).toBe("/test-page.html");
    expect(activeTab.displayUrl).toBe("https://example.com/test-page.html");

    // Simulate the proxy tunnel calling onPageInfo with the page title
    act(() => {
      mockOnPageInfo({
        title: "Test Page - Updated Title",
      });
    });

    // In Smart Window mode with local pages, the title should NOT be updated
    // This is the failing behavior we want to test
    const updatedTab = result.current.activeTab!;

    // The title should be updated to the page title for local pages in Smart Window mode
    expect(updatedTab.title).toBe("Test Page - Updated Title");
  });

  it("should update tab title for local pages in normal mode", async () => {
    const { result } = renderHook(
      () =>
        useBrowserCore({
          smartWindowMode: false, // Normal mode
        }),
      {
        wrapper: DebugProvider,
      },
    );

    // Navigate to a local page
    act(() => {
      result.current.handleNavigate("/test-page.html");
    });

    const activeTab = result.current.activeTab!;
    expect(activeTab.url).toBe("/test-page.html");

    // Simulate the proxy tunnel calling onPageInfo with the page title
    act(() => {
      mockOnPageInfo({
        title: "Test Page - Updated Title",
      });
    });

    // In normal mode, the title should be updated
    const updatedTab = result.current.activeTab!;
    expect(updatedTab.title).toBe("Test Page - Updated Title");
  });
});
