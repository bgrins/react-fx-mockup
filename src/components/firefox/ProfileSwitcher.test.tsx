import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ProfileSwitcher } from "./ProfileSwitcher"
import { ProfileProvider } from "~/contexts/ProfileContext"

// Mock the useSqliteVec hook
const mockSelectArrays = vi.fn()
const mockIsInitialized = vi.fn()
const mockExec = vi.fn()

vi.mock("~/hooks/useSqliteVec", () => ({
  useSqliteVec: () => ({
    isInitialized: mockIsInitialized(),
    selectArrays: mockSelectArrays,
    exec: mockExec,
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
global.localStorage = localStorageMock as Storage

describe("ProfileSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "selected-profile") return "Default"
      if (key.startsWith("firefox-browser-state-")) return null
      return null
    })

    mockSelectArrays.mockReset()
    mockExec.mockReset()
    mockIsInitialized.mockReset()
  })

  it("should render profile switcher with default profile", async () => {
    mockIsInitialized.mockReturnValue(false)

    render(
      <ProfileProvider>
        <ProfileSwitcher />
      </ProfileProvider>
    )

    // Wait for the component to render and check for the profile initial
    await waitFor(() => {
      expect(screen.getByText("D")).toBeDefined() // Profile initial
    })
  })

  it("should have correct button attributes", async () => {
    mockIsInitialized.mockReturnValue(false)

    render(
      <ProfileProvider>
        <ProfileSwitcher />
      </ProfileProvider>
    )

    const trigger = screen.getByRole("button")
    
    // Check that the button has the correct attributes for a dropdown trigger
    await waitFor(() => {
      expect(trigger.getAttribute("aria-haspopup")).toBe("menu")
      expect(trigger.getAttribute("title")).toContain("Current profile: Default")
    })
  })

  it("should render profile initial in circular avatar", async () => {
    mockIsInitialized.mockReturnValue(false)

    render(
      <ProfileProvider>
        <ProfileSwitcher />
      </ProfileProvider>
    )

    // Check for the styled avatar div with profile initial
    await waitFor(() => {
      const avatarDiv = screen.getByText("D").parentElement
      expect(avatarDiv?.className).toContain("rounded-full")
      expect(avatarDiv?.className).toContain("bg-gradient-to-br")
    })
  })
})