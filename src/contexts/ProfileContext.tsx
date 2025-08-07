import React, { createContext, useContext, useState, useEffect } from "react";
import Papa from "papaparse";
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

  useEffect(() => {
    // Load the default shortcuts as the initial profile
    const defaultProfile: Profile = {
      name: "Default",
      shortcuts: defaultShortcuts,
    };
    setProfiles([defaultProfile]);
    setSelectedProfile(defaultProfile);
  }, []);

  const loadProfile = async (profileName: string) => {
    try {
      const response = await fetch(`/src/profiles/${profileName}.csv`);
      const csvText = await response.text();
      const { data } = Papa.parse(csvText, { header: true, dynamicTyping: true });

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

      setProfiles((prevProfiles) => [...prevProfiles, newProfile]);
      setSelectedProfile(newProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const selectProfile = (profileName: string) => {
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
