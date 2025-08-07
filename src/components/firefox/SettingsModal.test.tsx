import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SettingsModal } from "./SettingsModal";
import { DebugProvider } from "../../contexts/DebugContext";
import { ProfileProvider } from "../../contexts/ProfileContext";

// Mock the Link component from tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, onClick, className }: any) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

// Mock useSqliteVec hook to prevent Worker not defined error
vi.mock("~/hooks/useSqliteVec", () => ({
  useSqliteVec: () => ({
    isInitialized: false,
    selectArrays: vi.fn(),
    exec: vi.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock fetch to prevent network requests in tests
global.fetch = vi.fn();

// Mock window properties
Object.defineProperty(window, "screen", {
  value: { width: 1920, height: 1080 },
  writable: true,
});

Object.defineProperty(window, "innerWidth", {
  value: 1024,
  writable: true,
});

Object.defineProperty(window, "innerHeight", {
  value: 768,
  writable: true,
});

Object.defineProperty(navigator, "userAgent", {
  value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  writable: true,
});

Object.defineProperty(navigator, "platform", {
  value: "MacIntel",
  writable: true,
});

Object.defineProperty(navigator, "cookieEnabled", {
  value: true,
  writable: true,
});

const renderWithProviders = (component: React.ReactElement) => {
  // Since SettingsModal uses Link from tanstack/router, we need to provide a router context
  // For simplicity, we'll just render the component directly with DebugProvider and ProfileProvider
  return render(
    <ProfileProvider>
      <DebugProvider>{component}</DebugProvider>
    </ProfileProvider>
  );
};

describe("SettingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock to return null by default (no stored profiles)
    localStorageMock.getItem.mockReturnValue(null);
    // Mock fetch to reject immediately to prevent network requests
    (global.fetch as any).mockRejectedValue(new Error('Network request blocked in tests'));
  });

  it("should not render when isOpen is false", () => {
    renderWithProviders(<SettingsModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText("Settings & Help")).toBe(null);
  });

  it("should render when isOpen is true", () => {
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Settings & Help")).toBeTruthy();
  });

  it("should display all main sections", () => {
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText("Starting States")).toBeTruthy();
    expect(screen.getByText("Infer Access Key")).toBeTruthy();
    expect(screen.getByText("Keyboard Shortcuts")).toBeTruthy();
    expect(screen.getByText("System Diagnostics")).toBeTruthy();
  });

  it("should have System Diagnostics expanded by default", () => {
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    
    // Check if System Information section is visible
    expect(screen.getByText("System Information")).toBeTruthy();
    expect(screen.getByText("Platform")).toBeTruthy();
    expect(screen.getByText("macOS")).toBeTruthy();
  });

  it("should close when clicking the close button", () => {
    const onClose = vi.fn();
    renderWithProviders(<SettingsModal isOpen={true} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should close when pressing Escape key", () => {
    const onClose = vi.fn();
    renderWithProviders(<SettingsModal isOpen={true} onClose={onClose} />);
    
    fireEvent.keyDown(window, { key: "Escape" });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should display Toggle Settings shortcut", () => {
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    
    // Find and click the Settings section to expand it (though it's in the second grid)
    // The shortcut should be visible in the Settings section
    const settingsSection = screen.getByText("Settings");
    expect(settingsSection).toBeTruthy();
    
    // Check that Toggle Settings is displayed with the correct shortcut
    expect(screen.getByText("Toggle Settings")).toBeTruthy();
    
    // Check for the shortcut key display (⌘? on macOS)
    const shortcutElements = screen.getAllByText(/⌘\?|Ctrl\+\?/);
    expect(shortcutElements.length).toBeGreaterThan(0);
  });

  it("should toggle sections when clicking section headers", () => {
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    
    // Find the Keyboard Shortcuts toggle button
    const shortcutsButton = screen.getByRole("button", { name: /Keyboard Shortcuts/i });
    
    // Should be expanded by default - check for Navigation section
    expect(screen.getByText("Navigation")).toBeTruthy();
    
    // Click to collapse
    fireEvent.click(shortcutsButton);
    
    // Navigation section should be hidden
    expect(screen.queryByText("Navigation")).toBe(null);
    
    // Click to expand again
    fireEvent.click(shortcutsButton);
    
    // Navigation section should be visible again
    expect(screen.getByText("Navigation")).toBeTruthy();
  });

  it("should save access key when submitting form", () => {
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    
    const input = screen.getByPlaceholderText("Enter your Infer access key");
    const saveButton = screen.getByText("Save");
    
    fireEvent.change(input, { target: { value: "test-key-123" } });
    fireEvent.click(saveButton);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith("infer-access-key", "test-key-123");
  });

  it("should clear access key when clicking Clear button", () => {
    // Override the default mock for this test only
    localStorageMock.getItem.mockImplementation((key) => 
      key === "infer-access-key" ? "existing-key" : null
    );
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    
    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("infer-access-key");
  });

  it("should display browser features correctly", () => {
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    
    // Check for browser features section
    expect(screen.getByText("Browser Features")).toBeTruthy();
    expect(screen.getByText("Local Storage")).toBeTruthy();
    expect(screen.getByText("Service Workers")).toBeTruthy();
    expect(screen.getByText("WebGL")).toBeTruthy();
    expect(screen.getByText("Cookies")).toBeTruthy();
  });

  it("should display starting states", () => {
    renderWithProviders(<SettingsModal isOpen={true} onClose={() => {}} />);
    
    // Check for the starting states section
    expect(screen.getByText("Starting States")).toBeTruthy();
    expect(screen.getByText("Fresh browser state")).toBeTruthy();
    expect(screen.getByText("Split View")).toBeTruthy();
    expect(screen.getByText("Two tabs side by side")).toBeTruthy();
  });
});