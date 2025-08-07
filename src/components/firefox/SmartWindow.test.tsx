import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TabStrip } from "./TabStrip";
import { FirefoxView } from "./FirefoxView";
import { ProfileProvider } from "~/contexts/ProfileContext";
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

// Helper function to wrap components with ProfileProvider
const renderWithProfileProvider = (component: React.ReactElement) => {
  return render(
    <ProfileProvider>
      {component}
    </ProfileProvider>
  );
};

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

    describe("Smart/Classic Toggle", () => {
      it("should show Smart/Classic toggle when onSmartWindowToggle is provided", () => {
        const onSmartWindowToggle = vi.fn();
        render(
          <TabStrip
            {...defaultProps}
            smartWindowMode={false}
            onSmartWindowToggle={onSmartWindowToggle}
          />
        );

        expect(screen.getByText("Classic")).toBeTruthy();
        expect(screen.getByText("Smart")).toBeTruthy();
      });

      it("should not show toggle when onSmartWindowToggle is not provided", () => {
        render(
          <TabStrip
            {...defaultProps}
            smartWindowMode={false}
          />
        );

        expect(screen.queryByText("Classic")).toBe(null);
        expect(screen.queryByText("Smart")).toBe(null);
      });

      it("should highlight Classic button in classic mode", () => {
        const onSmartWindowToggle = vi.fn();
        render(
          <TabStrip
            {...defaultProps}
            smartWindowMode={false}
            onSmartWindowToggle={onSmartWindowToggle}
          />
        );

        const classicButton = screen.getByText("Classic").closest("button");
        const smartButton = screen.getByText("Smart").closest("button");

        expect(classicButton?.className).toContain("bg-blue-500");
        expect(classicButton?.className).toContain("text-white");
        expect(smartButton?.className).toContain("text-gray-600");
        expect(smartButton?.hasAttribute("disabled")).toBe(false);
      });

      it("should highlight Smart button in smart mode", () => {
        const onSmartWindowToggle = vi.fn();
        render(
          <TabStrip
            {...defaultProps}
            smartWindowMode={true}
            onSmartWindowToggle={onSmartWindowToggle}
          />
        );

        const classicButton = screen.getByText("Classic").closest("button");
        const smartButton = screen.getByText("Smart").closest("button");

        expect(smartButton?.className).toContain("bg-orange-500");
        expect(smartButton?.className).toContain("text-white");
        expect(classicButton?.className).toContain("text-gray-600");
        expect(classicButton?.hasAttribute("disabled")).toBe(false);
      });

      it("should call onSmartWindowToggle when Smart button is clicked", () => {
        const onSmartWindowToggle = vi.fn();
        render(
          <TabStrip
            {...defaultProps}
            smartWindowMode={false}
            onSmartWindowToggle={onSmartWindowToggle}
          />
        );

        const smartButton = screen.getByText("Smart");
        fireEvent.click(smartButton);

        expect(onSmartWindowToggle).toHaveBeenCalledTimes(1);
      });

      it("should call onSmartWindowToggle when Classic button is clicked", () => {
        const onSmartWindowToggle = vi.fn();
        render(
          <TabStrip
            {...defaultProps}
            smartWindowMode={true}
            onSmartWindowToggle={onSmartWindowToggle}
          />
        );

        const classicButton = screen.getByText("Classic");
        fireEvent.click(classicButton);

        expect(onSmartWindowToggle).toHaveBeenCalledTimes(1);
      });

      it("should disable and not call toggle for active state", () => {
        const onSmartWindowToggle = vi.fn();
        
        // Test Classic button when in classic mode
        render(
          <TabStrip
            {...defaultProps}
            smartWindowMode={false}
            onSmartWindowToggle={onSmartWindowToggle}
          />
        );

        const classicButton = screen.getByText("Classic").closest("button");
        expect(classicButton?.hasAttribute("disabled")).toBe(true);
        
        fireEvent.click(classicButton!);
        expect(onSmartWindowToggle).not.toHaveBeenCalled();
      });
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
    };

    it("should show classic Firefox View layout when not in smart mode", () => {
      renderWithProfileProvider(
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
      renderWithProfileProvider(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
        />
      );

      // Should show embedded toolbar and search input instead of title
      expect(screen.getByPlaceholderText("Search or enter address")).toBeTruthy();
      expect(screen.queryByText("Exit")).toBe(null); // Exit button removed
      expect(screen.queryByText("Smart Window AI-powered browsing")).toBe(null); // Label removed
    });

    it("should show search input in Smart Window mode", () => {
      renderWithProfileProvider(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
        />
      );

      expect(screen.getByPlaceholderText("Search or enter address")).toBeTruthy();
    });

    it("should not show search input in classic mode", () => {
      renderWithProfileProvider(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={false}
        />
      );

      expect(screen.queryByPlaceholderText("Search or enter address")).toBe(null);
    });

    it("should show embedded toolbar icons only in Smart Window mode", () => {
      const { rerender } = renderWithProfileProvider(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={false}
        />
      );

      // Should not show toolbar in classic mode
      expect(screen.queryByTestId("dropdown-menu")).toBe(null);

      rerender(
        <ProfileProvider>
          <FirefoxView
            {...firefoxViewProps}
            smartWindowMode={true}
          />
        </ProfileProvider>
      );

      // Should show embedded toolbar in Smart Window mode
      expect(screen.getByTestId("dropdown-menu")).toBeTruthy();
    });

    it("should focus search when dropdown Focus Search is clicked", async () => {
      renderWithProfileProvider(
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

    it("should have transparent background in Smart Window mode (gradient handled by BrowserShell)", () => {
      const { container } = renderWithProfileProvider(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={true}
        />
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("bg-transparent");
      expect(mainDiv.className).not.toContain("bg-gradient-to-br");
    });

    it("should have transparent background in classic mode", () => {
      const { container } = renderWithProfileProvider(
        <FirefoxView
          {...firefoxViewProps}
          smartWindowMode={false}
        />
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("bg-transparent");
      expect(mainDiv.className).not.toContain("bg-gradient-to-br");
    });

    it("should handle search form submission", () => {
      const onNavigate = vi.fn();
      const onNewTab = vi.fn();
      
      renderWithProfileProvider(
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
      
      renderWithProfileProvider(
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

      // Test that onNewTab was called only once for the search
      expect(onNewTab).toHaveBeenCalledTimes(1);

      // Verify onNavigate is NEVER called directly by Firefox View
      expect(onNavigate).toHaveBeenCalledTimes(0);
    });

    describe("Embedded Toolbar Behavior", () => {
      it("should not show sidebar button in FirefoxView embedded toolbar", () => {
        renderWithProfileProvider(
          <FirefoxView
            {...firefoxViewProps}
            smartWindowMode={true}
          />
        );

        // With new approach, sidebar button is not in FirefoxView toolbar - it's always in sidebar
        const sidebarButton = screen.queryByTitle("Sidebar");
        expect(sidebarButton).toBe(null);
      });

      it("should show embedded toolbar icons in Smart Window mode", () => {
        renderWithProfileProvider(
          <FirefoxView
            {...firefoxViewProps}
            smartWindowMode={true}
          />
        );

        // Should show embedded toolbar in Smart Window mode
        expect(screen.getByTestId("dropdown-menu")).toBeTruthy();
      });

      it("should not show embedded toolbar in classic mode", () => {
        renderWithProfileProvider(
          <FirefoxView
            {...firefoxViewProps}
            smartWindowMode={false}
          />
        );

        // Should not show embedded toolbar in classic mode
        expect(screen.queryByTestId("dropdown-menu")).toBe(null);
      });
    });
  });

  describe("Smart Window Integration", () => {
    it("should properly coordinate TabStrip and FirefoxView behaviors", () => {
      const onTabClick = vi.fn();
      const onSmartWindowToggle = vi.fn();

      // Render TabStrip in Smart Window mode with Firefox View active and toggle
      const { rerender } = render(
        <TabStrip
          {...defaultProps}
          onTabClick={onTabClick}
          smartWindowMode={true}
          isFirefoxViewActive={true}
          onSmartWindowToggle={onSmartWindowToggle}
        />
      );

      // New tab button should be hidden, but toggle should be visible
      expect(screen.queryByTestId("plus-icon")).toBe(null);
      expect(screen.getByText("Smart")).toBeTruthy();
      expect(screen.getByText("Classic")).toBeTruthy();

      // Render FirefoxView in Smart Window mode
      rerender(
        <ProfileProvider>
          <FirefoxView
            tabs={mockTabs}
            activeTabId="firefox-view"
            onTabClick={onTabClick}
            onTabClose={vi.fn()}
            onNavigate={vi.fn()}
            onNewTab={vi.fn()}
            iframeRefs={{ current: {} }}
            smartWindowMode={true}
          />
        </ProfileProvider>
      );

      // Should show Smart Window UI elements (no Exit button since it's now in TabStrip)
      expect(screen.queryByText("Exit")).toBe(null);
      expect(screen.getByPlaceholderText("Search or enter address")).toBeTruthy();
    });

    it("should toggle between modes correctly", () => {
      const onSmartWindowToggle = vi.fn();
      render(
        <TabStrip
          {...defaultProps}
          smartWindowMode={false}
          onSmartWindowToggle={onSmartWindowToggle}
        />
      );

      // Should be in classic mode initially
      const classicButton = screen.getByText("Classic").closest("button");
      const smartButton = screen.getByText("Smart").closest("button");
      
      expect(classicButton?.className).toContain("bg-blue-500");
      expect(smartButton?.className).not.toContain("bg-orange-500");

      // Click Smart to switch modes
      fireEvent.click(smartButton!);
      expect(onSmartWindowToggle).toHaveBeenCalledTimes(1);
    });
  });

  // Shared mock props for sidebar tests
  const mockSidebarProps = {
    isOpen: false,
    onClose: vi.fn(),
    onSidebarToggle: vi.fn(),
    smartWindowMode: true,
    isExpanded: false,
    isFirefoxViewActive: false,
  };

  describe("Sidebar Section Click Behavior in Smart Window Mode", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should expand sidebar when clicking a section in Smart Window mode", async () => {
      const { Sidebar } = await import("./Sidebar");
      const onSidebarToggle = vi.fn();
      
      render(
        <Sidebar
          {...mockSidebarProps}
          onSidebarToggle={onSidebarToggle}
          smartWindowMode={true}
          isExpanded={false}
        />
      );

      // Click on Settings section
      const settingsButton = screen.getByTitle("Settings");
      fireEvent.click(settingsButton);

      // Should call onSidebarToggle to expand sidebar
      expect(onSidebarToggle).toHaveBeenCalledTimes(1);
    });

    it("should collapse sidebar when clicking the same section again in Smart Window mode", async () => {
      const { Sidebar } = await import("./Sidebar");
      const onSidebarToggle = vi.fn();
      
      render(
        <Sidebar
          {...mockSidebarProps}
          onSidebarToggle={onSidebarToggle}
          smartWindowMode={true}
          isExpanded={true}
        />
      );

      // First click to open Settings (when sidebar is already expanded)
      const settingsButton = screen.getByTitle("Settings");
      fireEvent.click(settingsButton);

      // Should NOT call onSidebarToggle since sidebar is already expanded
      expect(onSidebarToggle).toHaveBeenCalledTimes(0);

      // Click Settings again to close the section
      fireEvent.click(settingsButton);

      // Should call onSidebarToggle to collapse sidebar
      expect(onSidebarToggle).toHaveBeenCalledTimes(1);
    });

    it("should switch sections without extra toggle when sidebar is already expanded", async () => {
      const { Sidebar } = await import("./Sidebar");
      const onSidebarToggle = vi.fn();
      
      render(
        <Sidebar
          {...mockSidebarProps}
          onSidebarToggle={onSidebarToggle}
          smartWindowMode={true}
          isExpanded={true}
        />
      );

      // Click Settings to activate it
      const settingsButton = screen.getByTitle("Settings");
      fireEvent.click(settingsButton);

      // Should not call onSidebarToggle since sidebar is already expanded
      expect(onSidebarToggle).toHaveBeenCalledTimes(0);

      // Click Page Info to switch sections
      const pageInfoButton = screen.getByTitle("Page Info");
      fireEvent.click(pageInfoButton);

      // Should not call onSidebarToggle since we're just switching sections
      expect(onSidebarToggle).toHaveBeenCalledTimes(0);
    });

    it("should not call onSidebarToggle in classic mode", async () => {
      const { Sidebar } = await import("./Sidebar");
      const onSidebarToggle = vi.fn();
      
      render(
        <Sidebar
          {...mockSidebarProps}
          onSidebarToggle={onSidebarToggle}
          smartWindowMode={false}
          isOpen={true}
        />
      );

      // Click Settings in classic mode
      const settingsButton = screen.getByTitle("Settings");
      fireEvent.click(settingsButton);

      // Should not call onSidebarToggle in classic mode
      expect(onSidebarToggle).toHaveBeenCalledTimes(0);

      // Click Settings again to close section
      fireEvent.click(settingsButton);

      // Still should not call onSidebarToggle in classic mode
      expect(onSidebarToggle).toHaveBeenCalledTimes(0);
    });

    it("should handle Page Info section clicks in Smart Window mode", async () => {
      const { Sidebar } = await import("./Sidebar");
      const onSidebarToggle = vi.fn();
      
      render(
        <Sidebar
          {...mockSidebarProps}
          onSidebarToggle={onSidebarToggle}
          smartWindowMode={true}
          isExpanded={false}
        />
      );

      // Click Page Info section
      const pageInfoButton = screen.getByTitle("Page Info");
      fireEvent.click(pageInfoButton);

      // Should call onSidebarToggle to expand sidebar
      expect(onSidebarToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("Sidebar Toggle Button Visibility", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should show sidebar toggle button in Smart Window mode + Firefox View", async () => {
      const { Sidebar } = await import("./Sidebar");
      
      render(
        <Sidebar
          {...mockSidebarProps}
          smartWindowMode={true}
          isFirefoxViewActive={true}
        />
      );

      // Should show the sidebar toggle button
      const sidebarToggleButton = screen.getByTitle("Sidebar");
      expect(sidebarToggleButton).toBeTruthy();
    });

    it("should NOT show sidebar toggle button in Smart Window mode when NOT Firefox View", async () => {
      const { Sidebar } = await import("./Sidebar");
      
      render(
        <Sidebar
          {...mockSidebarProps}
          smartWindowMode={true}
          isFirefoxViewActive={false}
        />
      );

      // Should NOT show the sidebar toggle button
      const sidebarToggleButton = screen.queryByTitle("Sidebar");
      expect(sidebarToggleButton).toBe(null);
    });

    it("should NOT show sidebar toggle button in classic mode", async () => {
      const { Sidebar } = await import("./Sidebar");
      
      render(
        <Sidebar
          {...mockSidebarProps}
          smartWindowMode={false}
          isFirefoxViewActive={true}
        />
      );

      // Should NOT show the sidebar toggle button in classic mode
      const sidebarToggleButton = screen.queryByTitle("Sidebar");
      expect(sidebarToggleButton).toBe(null);
    });

    it("should NOT show sidebar toggle button when onSidebarToggle is not provided", async () => {
      const { Sidebar } = await import("./Sidebar");
      
      render(
        <Sidebar
          {...mockSidebarProps}
          onSidebarToggle={undefined}
          smartWindowMode={true}
          isFirefoxViewActive={true}
        />
      );

      // Should NOT show the sidebar toggle button when no handler provided
      const sidebarToggleButton = screen.queryByTitle("Sidebar");
      expect(sidebarToggleButton).toBe(null);
    });
  });

  describe("Sidebar Background Color", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should have semitransparent background in Smart Window mode + Firefox View", async () => {
      const { Sidebar } = await import("./Sidebar");
      
      const { container } = render(
        <Sidebar
          {...mockSidebarProps}
          smartWindowMode={true}
          isFirefoxViewActive={true}
        />
      );

      // Should have single layer semitransparent background
      const sidebarContainer = container.firstChild as HTMLElement;
      expect(sidebarContainer.className).toContain("bg-white/30");
    });

    it("should have semitransparent background in Smart Window mode when NOT Firefox View", async () => {
      const { Sidebar } = await import("./Sidebar");
      
      const { container } = render(
        <Sidebar
          {...mockSidebarProps}
          smartWindowMode={true}
          isFirefoxViewActive={false}
        />
      );

      // Should have single layer semitransparent background
      const sidebarContainer = container.firstChild as HTMLElement;
      expect(sidebarContainer.className).toContain("bg-white/30");
      expect(sidebarContainer.className).not.toContain("bg-[#f9f9fb]");
    });

    it("should have normal background in classic mode", async () => {
      const { Sidebar } = await import("./Sidebar");
      
      const { container } = render(
        <Sidebar
          {...mockSidebarProps}
          smartWindowMode={false}
          isFirefoxViewActive={true}
        />
      );

      // Should have normal background color in classic mode
      const sidebarContainer = container.firstChild as HTMLElement;
      expect(sidebarContainer.className).toContain("bg-[#f9f9fb]");
      expect(sidebarContainer.className).not.toContain("bg-white/30");
    });
  });
});