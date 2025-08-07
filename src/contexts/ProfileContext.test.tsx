import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import { ProfileProvider } from "./ProfileContext";
import { useProfile } from "~/hooks/useProfile";

// Mock the useSqliteVec hook
const mockSelectArrays = vi.fn();
const mockIsInitialized = vi.fn();
const mockExec = vi.fn();

vi.mock("~/hooks/useSqliteVec", () => ({
  useSqliteVec: () => ({
    isInitialized: mockIsInitialized(),
    selectArrays: mockSelectArrays,
    exec: mockExec,
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

// Test component to access the context
function TestComponent() {
  const { availableProfiles, selectedProfile, profiles } = useProfile();

  return (
    <div>
      <div data-testid="available-profiles-count">{availableProfiles.length}</div>
      <div data-testid="available-profiles">{availableProfiles.join(", ")}</div>
      <div data-testid="selected-profile">{selectedProfile?.name || "none"}</div>
      <div data-testid="loaded-profiles-count">{profiles.length}</div>
    </div>
  );
}

describe("ProfileContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage properly - getItem should return null for browser state keys
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "selected-profile") return null; // Default to no stored profile
      if (key.startsWith("firefox-browser-state-")) return null; // No stored browser state
      return null;
    });

    // Reset all mocks
    mockSelectArrays.mockReset();
    mockExec.mockReset();
    mockIsInitialized.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should start with only Default profile when database is not initialized", async () => {
    mockIsInitialized.mockReturnValue(false);

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("available-profiles-count").textContent).toBe("1");
      expect(screen.getByTestId("available-profiles").textContent).toBe("Default");
      expect(screen.getByTestId("selected-profile").textContent).toBe("Default");
      expect(screen.getByTestId("loaded-profiles-count").textContent).toBe("1");
    });
  });

  it("should load available profiles from database when initialized", async () => {
    mockIsInitialized.mockReturnValue(true);

    // First call checks if table exists (should succeed to simulate existing table)
    mockSelectArrays.mockResolvedValueOnce([[1]]); // Table exists

    // Second call gets the available profiles
    mockSelectArrays.mockResolvedValueOnce([
      ["Anna"],
      ["Jessica"],
      ["John"],
      ["Mina"],
      ["Peter"],
      ["Robert"],
      ["Theo"],
      ["Youssef"],
    ]);

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(mockSelectArrays).toHaveBeenCalledWith(
        `SELECT COUNT(*) FROM synthetic_profiles LIMIT 1`,
      );
    });

    await waitFor(() => {
      expect(mockSelectArrays).toHaveBeenCalledWith(`
        SELECT DISTINCT persona 
        FROM synthetic_profiles 
        ORDER BY persona ASC
      `);
    });

    await waitFor(() => {
      expect(screen.getByTestId("available-profiles-count").textContent).toBe("9"); // Default + 8 profiles
      expect(screen.getByTestId("available-profiles").textContent).toBe(
        "Default, Anna, Jessica, John, Mina, Peter, Robert, Theo, Youssef",
      );
    });
  });

  it("should handle database query errors gracefully", async () => {
    mockIsInitialized.mockReturnValue(true);

    // Mock database error when checking for table (triggers auto-load)
    mockSelectArrays.mockRejectedValueOnce(new Error("Database error"));

    // Mock fetch error to simulate CSV loading failure
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Fetch failed"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to auto-load synthetic profiles:",
        expect.any(Error),
      );
      expect(screen.getByTestId("available-profiles-count").textContent).toBe("1"); // Should fallback to Default only
      expect(screen.getByTestId("available-profiles").textContent).toBe("Default");
    });

    consoleSpy.mockRestore();
  });

  it("should load specific profile data from database", async () => {
    mockIsInitialized.mockReturnValue(true);
    // Override the mock for this test to return "Theo" for selected-profile
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "selected-profile") return "Theo";
      if (key.startsWith("firefox-browser-state-")) return null;
      return null;
    });

    // 1st call: Check if table exists for loadAvailableProfiles
    mockSelectArrays.mockResolvedValueOnce([[1]]); // Table exists

    // 2nd call: Get available profiles query
    mockSelectArrays.mockResolvedValueOnce([
      ["Anna"],
      ["Jessica"],
      ["John"],
      ["Mina"],
      ["Peter"],
      ["Robert"],
      ["Theo"],
      ["Youssef"],
    ]);

    // 3rd call: Check if table exists for loadProfile (Theo)
    mockSelectArrays.mockResolvedValueOnce([[1]]); // Table exists

    // 4th call: Get profile data query for Theo
    mockSelectArrays.mockResolvedValueOnce([
      ["example.com", "Example Site", "https://example.com", 5, "Example"],
      ["google.com", "Google", "https://google.com", 10, "Google Search"],
    ]);

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>,
    );

    await waitFor(() => {
      // Should first check if table exists for loadAvailableProfiles
      expect(mockSelectArrays).toHaveBeenCalledWith(
        `SELECT COUNT(*) FROM synthetic_profiles LIMIT 1`,
      );
    });

    await waitFor(() => {
      // Should call query for available profiles
      expect(mockSelectArrays).toHaveBeenCalledWith(`
        SELECT DISTINCT persona 
        FROM synthetic_profiles 
        ORDER BY persona ASC
      `);
    });

    await waitFor(() => {
      // Should call query for Theo's profile data
      expect(mockSelectArrays).toHaveBeenCalledWith(`
        SELECT DISTINCT domain, title, url, visit_count, title_name
        FROM synthetic_profiles 
        WHERE persona = 'Theo'
        ORDER BY visit_count DESC, visit_time DESC
      `);
    });

    await waitFor(() => {
      expect(screen.getByTestId("selected-profile").textContent).toBe("Theo");
      expect(screen.getByTestId("loaded-profiles-count").textContent).toBe("2"); // Default + Theo
    });
  });

  it("should handle empty database results", async () => {
    mockIsInitialized.mockReturnValue(true);

    // First call: Table exists but is empty
    mockSelectArrays.mockResolvedValueOnce([[0]]); // Table exists but empty

    // Second call: Empty database result for profiles
    mockSelectArrays.mockResolvedValueOnce([]);

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("available-profiles-count").textContent).toBe("1"); // Should keep Default
      expect(screen.getByTestId("available-profiles").textContent).toBe("Default");
    });
  });
});
