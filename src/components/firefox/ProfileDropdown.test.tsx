import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SettingsModal } from "./SettingsModal";
import { ProfileProvider } from "~/contexts/ProfileContext";
import { DebugProvider } from "~/contexts/DebugContext";

// Mock the Link component from tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, onClick, className }: any) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

// Mock the useSqliteVec hook to simulate database with multiple profiles
const mockSelectArrays = vi.fn();
const mockIsInitialized = vi.fn().mockReturnValue(true);

vi.mock("~/hooks/useSqliteVec", () => ({
  useSqliteVec: () => ({
    isInitialized: mockIsInitialized(),
    selectArrays: mockSelectArrays,
    exec: vi.fn(),
    selectArray: vi.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockImplementation((key: string) => {
    if (key === "selected-profile") return null;
    if (key.startsWith("firefox-browser-state-")) return null;
    if (key === "infer-access-key") return "";
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock navigator for platform detection
Object.defineProperty(navigator, "platform", {
  value: "MacIntel",
  writable: true,
});

describe("Profile Dropdown Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the database to return multiple profiles
    mockSelectArrays.mockResolvedValue([
      ["Anna"],
      ["Jessica"], 
      ["John"],
      ["Mina"],
      ["Peter"],
      ["Robert"],
      ["Theo"],
      ["Youssef"],
    ]);
  });

  it("should show all available profiles in settings modal dropdown", async () => {
    render(
      <DebugProvider>
        <ProfileProvider>
          <SettingsModal isOpen={true} onClose={() => {}} />
        </ProfileProvider>
      </DebugProvider>
    );

    // Wait for the profiles to be loaded
    await waitFor(() => {
      expect(mockSelectArrays).toHaveBeenCalledWith(`
        SELECT DISTINCT persona 
        FROM synthetic_profiles 
        ORDER BY persona ASC
      `);
    });

    // Wait a bit more for the component to update
    await waitFor(() => {
      const profileSelect = screen.getByLabelText("Select Profile:");
      expect(profileSelect).toBeTruthy();
      
      // Check that the dropdown has the expected number of options
      const options = profileSelect.querySelectorAll("option");
      
      // Should have Default + 8 profiles = 9 options
      expect(options.length).toBe(9);
      
      // Check specific profile names in the dropdown
      const defaultOption = [...options].find(option => option.value === "Default");
      expect(defaultOption).toBeTruthy();
      expect(defaultOption?.textContent).toBe("Default");
      
      const annaOption = [...options].find(option => option.value === "Anna");
      expect(annaOption).toBeTruthy();
      expect(annaOption?.textContent).toBe("Anna's Profile");
      
      const theoOption = [...options].find(option => option.value === "Theo");
      expect(theoOption).toBeTruthy();
      expect(theoOption?.textContent).toBe("Theo's Profile");
      
      const youssefOption = [...options].find(option => option.value === "Youssef");
      expect(youssefOption).toBeTruthy();
      expect(youssefOption?.textContent).toBe("Youssef's Profile");
    }, { timeout: 2000 });
  });

  it("should gracefully handle database errors", async () => {
    // Mock database error
    mockSelectArrays.mockRejectedValue(new Error("Database error"));
    
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <DebugProvider>
        <ProfileProvider>
          <SettingsModal isOpen={true} onClose={() => {}} />
        </ProfileProvider>
      </DebugProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to load available profiles:", expect.any(Error));
      
      const profileSelect = screen.getByLabelText("Select Profile:");
      const options = profileSelect.querySelectorAll("option");
      
      // Should fallback to only Default option
      expect(options.length).toBe(1);
      const defaultOption = [...options].find(option => option.value === "Default");
      expect(defaultOption).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });
});