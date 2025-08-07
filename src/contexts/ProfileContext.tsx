import React, { createContext, useContext, useState, useEffect } from "react";
import { parse } from "csv/browser/esm/sync";
import { defaultShortcuts, type Shortcut } from "~/constants/shortcuts";

const MAX_SHORTCUTS = 18;

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
}

// Create the context
const ProfileContext = createContext<ProfileContextValue | null>(null);

// Create the provider component
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

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

  return (
    <ProfileContext.Provider value={{ profiles, selectedProfile, selectProfile }}>
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
