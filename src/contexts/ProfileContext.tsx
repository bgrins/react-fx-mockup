import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { parse } from "csv/browser/esm/sync";
import { defaultShortcuts, type Shortcut } from "~/constants/shortcuts";

const MAX_SHORTCUTS = 18;

// Define the structure of browser state
export interface BrowserState {
  windowType: "classic" | "smart";
  // Future: we can add more browser state here like:
  // sidebarOpen?: boolean;
  // sidebarExpanded?: boolean;
  // zoomLevel?: number;
  // etc.
}

// Define the structure of a profile
interface Profile {
  name: string;
  shortcuts: Shortcut[];
}

// Define the context value
interface ProfileContextValue {
  profiles: Profile[];
  selectedProfile: Profile | null;
  selectProfile: (profileName: string) => void;
  browserState: BrowserState;
  updateBrowserState: (updates: Partial<BrowserState>) => void;
  resetBrowserState: () => void;
}

// Create the context
const ProfileContext = createContext<ProfileContextValue | null>(null);

// Default browser state
const defaultBrowserState: BrowserState = {
  windowType: "classic",
};

// Helper to get initial browser state
const getInitialBrowserState = (): BrowserState => {
  if (typeof window === "undefined") return defaultBrowserState;

  try {
    const storedProfileName = localStorage.getItem("selected-profile") || "Default";
    const browserStateKey = `firefox-browser-state-${storedProfileName}`;
    const stored = localStorage.getItem(browserStateKey);
    if (stored) {
      const parsed = JSON.parse(stored) as BrowserState;
      return { ...defaultBrowserState, ...parsed };
    }
  } catch (error) {
    console.error("Failed to load initial browser state:", error);
  }
  return defaultBrowserState;
};

// Create the provider component
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [browserState, setBrowserState] = useState<BrowserState>(getInitialBrowserState);

  const loadProfile = async (profileName: string) => {
    try {
      const response = await fetch(`/src/profiles/${profileName}.csv`);
      const csvText = await response.text();
      const data = parse(csvText, { columns: true, cast: true });

      // Sort by frecency and get top unique domains
      const sortedData = (data as any[]).sort((a, b) => b.frecency - a.frecency);
      const topShortcuts: Shortcut[] = [];
      const domains = new Set<string>();

      for (const row of sortedData) {
        if (row.title.startsWith("Follow-up")) continue;
        if (row.domain && !domains.has(row.domain)) {
          topShortcuts.push({
            id: row.visit_id,
            title: row.title,
            url: row.url,
            favicon: row.favicon || `https://${row.domain}/favicon.ico`,
          });
          domains.add(row.domain);
        }

        if (topShortcuts.length >= MAX_SHORTCUTS) {
          break;
        }
      }

      const newProfile: Profile = {
        name: profileName,
        shortcuts: topShortcuts,
      };

      setProfiles((prevProfiles) => {
        if (prevProfiles.find((p) => p.name === profileName)) {
          return prevProfiles;
        }
        return [...prevProfiles, newProfile];
      });
      setSelectedProfile(newProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  // On mount, setup default profile and load from localStorage if available
  useEffect(() => {
    const defaultProfile: Profile = {
      name: "Default",
      shortcuts: defaultShortcuts,
    };

    // Initialize with default profile
    setProfiles([defaultProfile]);

    const storedProfileName =
      typeof window !== "undefined" ? localStorage.getItem("selected-profile") : null;
    if (storedProfileName && storedProfileName !== "Default") {
      loadProfile(storedProfileName);
    } else {
      setSelectedProfile(defaultProfile);
    }
  }, []);

  const selectProfile = (profileName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selected-profile", profileName);
    }
    const profile = profiles.find((p) => p.name === profileName);
    if (profile) {
      setSelectedProfile(profile);
    } else {
      loadProfile(profileName);
    }
  };

  // Get the localStorage key for browser state of the current profile
  const getBrowserStateKey = useCallback(() => {
    const profileName = selectedProfile?.name || "Default";
    return `firefox-browser-state-${profileName}`;
  }, [selectedProfile]);

  // Load browser state from localStorage
  const loadBrowserState = useCallback(() => {
    if (typeof window === "undefined") return defaultBrowserState;

    try {
      const stored = localStorage.getItem(getBrowserStateKey());
      if (stored) {
        const parsed = JSON.parse(stored) as BrowserState;
        return { ...defaultBrowserState, ...parsed };
      }
    } catch (error) {
      console.error("Failed to load browser state:", error);
    }
    return defaultBrowserState;
  }, [getBrowserStateKey]);

  // Save browser state to localStorage
  const saveBrowserState = (state: BrowserState) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(getBrowserStateKey(), JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save browser state:", error);
    }
  };

  // Update browser state
  const updateBrowserState = (updates: Partial<BrowserState>) => {
    const newState = { ...browserState, ...updates };
    setBrowserState(newState);
    saveBrowserState(newState);
  };

  // Reset browser state for current profile
  const resetBrowserState = () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem(getBrowserStateKey());
    setBrowserState(defaultBrowserState);
  };

  // Load browser state when profile changes
  useEffect(() => {
    if (selectedProfile) {
      const newState = loadBrowserState();
      setBrowserState(newState);
    }
  }, [selectedProfile, loadBrowserState]);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        selectedProfile,
        selectProfile,
        browserState,
        updateBrowserState,
        resetBrowserState,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

// Create a custom hook to use the profile context
export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
