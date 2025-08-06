import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TabStrip } from "./TabStrip";
import { FirefoxView } from "./FirefoxView";
import { ABOUT_PAGES } from "~/constants/browser";
import type { Tab } from "~/types/browser";

// Mock icons
vi.mock("~/components/icons", () => ({
  PlusIcon: () => <div data-testid="plus-icon">+</div>,
  CloseIcon: () => <div data-testid="close-icon">×</div>,
}));

// Mock dropdown components
vi.mock("~/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => 
    <div data-testid="dropdown-item" onClick={onClick}>{children}</div>,
}));

// Mock OpenGraph components
vi.mock("./OpenGraphPreview", () => ({
  OpenGraphPreview: () => <div data-testid="opengraph-preview">OpenGraph Preview</div>,
}));

// Mock utils
vi.mock("~/utils/opengraph", () => ({
  extractOpenGraphFromHTML: vi.fn(() => ({
    title: "Test Title",
    description: "Test Description",
    image: "https://example.com/image.jpg",
    url: "https://example.com"
  })),
}));

describe("Smart Window Functionality", () => {
  const mockTabs: Tab[] = [
    {
      id: "firefox-view",
      title: "Firefox View",
      url: ABOUT_PAGES.FIREFOX_VIEW,
      isActive: false,
      isPinned: true,
      favicon: <div>FV</div>,
      history: [],
      historyIndex: 0,
    },
    {
      id: "regular-tab",
      title: "Regular Tab",
      url: "https://example.com",
      isActive: false,
      isPinned: false,
      favicon: <div>RT</div>,
      history: [],
      historyIndex: 0,
    },
  ];

  const defaultProps = {
    tabs: mockTabs,
    activeTabId: "firefox-view",
    onTabClick: vi.fn(),
    onTabClose: vi.fn(),
    onNewTab: vi.fn(),
    onTabReorder: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TabStrip Smart Window Behavior", () => {
    it("should show new tab button in classic mode", () => {
      render(
        <TabStrip
          {...defaultProps}
          smartWindowMode={false}
          isFirefoxViewActive={false}
        />
      );

      expect(screen.getByTestId("plus-icon")).toBeTruthy();
    });

    it("should show new tab button in smart mode when Firefox View is NOT active", () => {
      render(
        <TabStrip
          {...defaultProps}
          activeTabId="regular-tab"
          smartWindowMode={true}
          isFirefoxViewActive={false}
        />
      );

      expect(screen.getByTestId("plus-icon")).toBeTruthy();
    });

    it("should hide new tab button in smart mode when Firefox View IS active", () => {
      render(
        <TabStrip
          {...defaultProps}
          smartWindowMode={true}
          isFirefoxViewActive={true}
        />
      );

      expect(screen.queryByTestId("plus-icon")).toBe(null);
    });

    it("should handle tab clicks correctly", () => {
      const onTabClick = vi.fn();
      const { container } = render(
        <TabStrip
          {...defaultProps}
          onTabClick={onTabClick}
          smartWindowMode={true}
          isFirefoxViewActive={true}
        />
      );

      const firefoxViewTab = container.querySelector('[data-tab-id="firefox-view"]');
      fireEvent.click(firefoxViewTab!);

      expect(onTabClick).toHaveBeenCalledWith("firefox-view");
    });
  });

  describe("FirefoxView Smart Window Features", () => {
    const firefoxViewProps = {
      tabs: mockTabs,
      activeTabId: "firefox-view",
      onTabClick: vi.fn(),
      onTabClose: vi.fn(),
      onNavigate: vi.fn(),
      onNewTab: vi.fn(),
      iframeRefs: { current: {} },
      onSmartWindowToggle: vi.fn(),
      onSidebarToggle: vi.fn(),
    };

    it("should show classic Firefox View layout when not in smart mode", () => {
      render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={false}
        />
      );

      expect(screen.getByText("Firefox View")).toBeTruthy();
      expect(screen.queryByText("Smart Window")).toBe(null);
      expect(screen.queryByTestId("dropdown-menu")).toBe(null);
    });

    it("should show Smart Window layout with embedded toolbar", () => {
      render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
        />
      );

      expect(screen.getByText("Smart Window")).toBeTruthy();
      expect(screen.getByText("Exit")).toBeTruthy();
    });

    it("should show search input in Smart Window mode", () => {
      render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
        />
      );

      expect(screen.getByPlaceholderText("Search or enter address")).toBeTruthy();
    });

    it("should not show search input in classic mode", () => {
      render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={false}
        />
      );

      expect(screen.queryByPlaceholderText("Search or enter address")).toBe(null);
    });

    it("should show embedded toolbar icons only in Smart Window mode", () => {
      const { rerender } = render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={false}
        />
      );

      // Should not show toolbar in classic mode
      expect(screen.queryByTestId("dropdown-menu")).toBe(null);

      rerender(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
        />
      );

      // Should show embedded toolbar in Smart Window mode
      expect(screen.getByTestId("dropdown-menu")).toBeTruthy();
    });

    it("should call onSmartWindowToggle when exit button is clicked", () => {
      const onSmartWindowToggle = vi.fn();
      render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
          onSmartWindowToggle={onSmartWindowToggle}
        />
      );

      const exitButton = screen.getByText("Exit");
      fireEvent.click(exitButton);

      expect(onSmartWindowToggle).toHaveBeenCalledTimes(1);
    });

    it("should focus search when dropdown Focus Search is clicked", async () => {
      render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search or enter address");
      const focusSearchItem = screen.getByText("Focus Search");
      
      fireEvent.click(focusSearchItem);

      await waitFor(() => {
        expect(document.activeElement).toBe(searchInput);
      });
    });

    it("should have gradient background in Smart Window mode", () => {
      const { container } = render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
        />
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("bg-gradient-to-br");
      expect(mainDiv.className).toContain("from-blue-50");
      expect(mainDiv.className).toContain("via-purple-50");
      expect(mainDiv.className).toContain("to-pink-50");
    });

    it("should have standard background in classic mode", () => {
      const { container } = render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={false}
        />
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("bg-[#f9f9fb]");
      expect(mainDiv.className).not.toContain("bg-gradient-to-br");
    });

    it("should handle search form submission", () => {
      const onNavigate = vi.fn();
      const onNewTab = vi.fn();
      
      render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
          onNavigate={onNavigate}
          onNewTab={onNewTab}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search or enter address");
      const form = searchInput.closest("form");

      fireEvent.change(searchInput, { target: { value: "test search" } });
      fireEvent.submit(form!);

      expect(onNewTab).toHaveBeenCalledWith("https://duckduckgo.com/?q=test%20search");
    });

    it("should NEVER navigate Firefox View tab in Smart Window mode", () => {
      const onNavigate = vi.fn();
      const onNewTab = vi.fn();
      
      render(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
          onNavigate={onNavigate}
          onNewTab={onNewTab}
        />
      );

      // Test search submission
      const searchInput = screen.getByPlaceholderText("Search or enter address");
      const form = searchInput.closest("form");
      fireEvent.change(searchInput, { target: { value: "example.com" } });
      fireEvent.submit(form!);

      // Should create new tab instead of navigating current tab
      expect(onNewTab).toHaveBeenCalledWith("https://example.com");

      // Test quick action click
      const quickActionButton = screen.getByText("🔧 Firefox Source Code");
      fireEvent.click(quickActionButton);

      // Should create another new tab
      expect(onNewTab).toHaveBeenCalledTimes(2);
      expect(onNewTab).toHaveBeenLastCalledWith("https://github.com/mozilla-firefox/firefox");

      // Verify onNavigate is NEVER called directly by Firefox View
      expect(onNavigate).toHaveBeenCalledTimes(0);
    });
  });

  describe("Smart Window Integration", () => {
    it("should properly coordinate TabStrip and FirefoxView behaviors", () => {
      const onTabClick = vi.fn();
      const onSmartWindowToggle = vi.fn();

      // Render TabStrip in Smart Window mode with Firefox View active
      const { rerender } = render(
        <TabStrip
          {...defaultProps}
          onTabClick={onTabClick}
          smartWindowMode={true}
          isFirefoxViewActive={true}
        />
      );

      // New tab button should be hidden
      expect(screen.queryByTestId("plus-icon")).toBe(null);

      // Render FirefoxView in Smart Window mode
      rerender(
        <FirefoxView
          tabs={mockTabs}
          activeTabId="firefox-view"
          onTabClick={onTabClick}
          onTabClose={vi.fn()}
          onNavigate={vi.fn()}
          onNewTab={vi.fn()}
          iframeRefs={{ current: {} }}
          smartWindowMode={true}
          onSmartWindowToggle={onSmartWindowToggle}
          onSidebarToggle={vi.fn()}
        />
      );

      // Should show Smart Window UI
      expect(screen.getByText("Smart Window")).toBeTruthy();
      expect(screen.getByText("Exit")).toBeTruthy();
      expect(screen.getByPlaceholderText("Search or enter address")).toBeTruthy();
    });
  });
});