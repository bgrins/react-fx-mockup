import React, { useState, useEffect, useCallback } from "react";
import { defaultShortcuts, type Shortcut } from "~/constants/shortcuts";
import type { BrowserState, Profile } from "~/types/profile";
import { ProfileContext } from "./ProfileContext.context";
import { useSqliteVec } from "~/hooks/useSqliteVec";

const MAX_SHORTCUTS = 18;

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
  const { isInitialized, selectArrays, exec } = useSqliteVec();
  const [availableProfiles, setAvailableProfiles] = useState<string[]>(["Default"]);

  const ensureSyntheticProfilesTable = useCallback(async () => {
    if (!isInitialized) return false;

    try {
      // Check if table exists by trying to query it
      await selectArrays(`SELECT COUNT(*) FROM synthetic_profiles LIMIT 1`);
      return true; // Table exists and is accessible
    } catch (_error) {
      // Table doesn't exist, let's create and populate it
      console.log("synthetic_profiles table doesn't exist, creating and loading data...");

      try {
        // Fetch the CSV file
        const response = await fetch("/synthetic_profiles.csv");
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV file: ${response.status}`);
        }

        const csvContent = await response.text();

        // Parse CSV using the same library as SqliteVecDemo
        const { parse } = await import("csv/browser/esm/sync");
        const rows = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
        }) as Array<{
          persona: string;
          visit_id: string;
          visit_time: string;
          visit_description: string;
          place_id: string;
          url: string;
          title: string;
          domain: string;
          visit_count: string;
          interest: string;
          title_name: string;
        }>;

        console.log(`Parsed ${rows.length} rows from CSV`);

        // Create table
        await exec(`
          CREATE TABLE IF NOT EXISTS synthetic_profiles (
            id INTEGER PRIMARY KEY,
            persona TEXT,
            visit_id INTEGER,
            visit_time TEXT,
            visit_description TEXT,
            place_id INTEGER,
            url TEXT,
            title TEXT,
            domain TEXT,
            visit_count INTEGER,
            interest TEXT,
            title_name TEXT
          );
        `);

        // Clear existing data
        await exec("DELETE FROM synthetic_profiles;");
        console.log("Table created and cleared");

        // Insert data in batches
        const batchSize = 100;

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);

          const insertValues = batch.map((row) => {
            const escapeString = (str: string) => (str ? `'${str.replace(/'/g, "''")}'` : "NULL");
            const parseInt0 = (str: string) =>
              str && str !== "" ? parseInt(str) || "NULL" : "NULL";

            return `(${escapeString(row.persona)}, ${parseInt0(row.visit_id)}, ${escapeString(row.visit_time)}, ${escapeString(row.visit_description)}, ${parseInt0(row.place_id)}, ${escapeString(row.url)}, ${escapeString(row.title)}, ${escapeString(row.domain)}, ${parseInt0(row.visit_count)}, ${escapeString(row.interest)}, ${escapeString(row.title_name)})`;
          });

          const batchSQL = `
            INSERT INTO synthetic_profiles (persona, visit_id, visit_time, visit_description, place_id, url, title, domain, visit_count, interest, title_name)
            VALUES ${insertValues.join(", ")};
          `;

          await exec(batchSQL);
        }

        // Check final record count
        const countResult = await selectArrays("SELECT COUNT(*) as count FROM synthetic_profiles");
        const recordCount = countResult[0];
        console.log(`✅ Auto-loaded ${recordCount} synthetic profile records for ProfileContext`);

        return true;
      } catch (loadError) {
        console.error("Failed to auto-load synthetic profiles:", loadError);
        return false;
      }
    }
  }, [isInitialized, selectArrays, exec]);

  const loadProfile = useCallback(
    async (profileName: string) => {
      if (!isInitialized) {
        console.warn("SQLite not initialized yet, skipping profile load");
        return;
      }

      // Ensure the synthetic_profiles table exists and is populated before trying to load profile
      const tableReady = await ensureSyntheticProfilesTable();
      if (!tableReady) {
        console.warn(
          `Could not ensure synthetic_profiles table is ready for profile: ${profileName}`,
        );
        return;
      }

      try {
        console.log(`Loading profile: ${profileName}`);

        // Query the synthetic_profiles table for the specified persona/profile
        const profileData = await selectArrays(`
        SELECT DISTINCT domain, title, url, visit_count, title_name
        FROM synthetic_profiles 
        WHERE persona = '${profileName}'
        ORDER BY visit_count DESC, visit_time DESC
      `);

        if (!profileData || profileData.length === 0) {
          console.warn(`No data found for profile: ${profileName}`);
          return;
        }

        console.log(`Found ${profileData.length} records for ${profileName}`);

        // Process the data similar to the CSV approach
        const topShortcuts: Shortcut[] = [];
        const domains = new Set<string>();

        for (const row of profileData) {
          const [domain, title, url, , titleName] = row;

          // Skip entries that start with "Follow-up"
          if (title && title.toString().startsWith("Follow-up")) continue;

          // Only add unique domains
          if (domain && !domains.has(domain.toString())) {
            topShortcuts.push({
              id: url, // Use URL as ID since we don't have visit_id in this query
              title: title?.toString() || titleName?.toString() || "Untitled",
              url: url?.toString() || "",
              favicon: `https://${domain}/favicon.ico`,
            });
            domains.add(domain.toString());
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
        console.error("Failed to load profile from sqlite-vec:", error);
      }
    },
    [isInitialized, selectArrays, ensureSyntheticProfilesTable],
  );

  const loadAvailableProfiles = useCallback(async () => {
    if (!isInitialized) return;

    // Ensure the synthetic_profiles table exists and is populated
    const tableReady = await ensureSyntheticProfilesTable();
    if (!tableReady) {
      console.warn("Could not ensure synthetic_profiles table is ready");
      setAvailableProfiles(["Default"]);
      return;
    }

    try {
      // Query to get all unique persona names from the database
      const result = await selectArrays(`
        SELECT DISTINCT persona 
        FROM synthetic_profiles 
        ORDER BY persona ASC
      `);

      if (result && result.length > 0) {
        const profileNames = result.map((row) => row[0] as string).filter(Boolean);
        setAvailableProfiles(["Default", ...profileNames]);
        console.log(`Found available profiles: ${profileNames.join(", ")}`);
      }
    } catch (error) {
      console.error("Failed to load available profiles:", error);
      // Keep default if query fails
      setAvailableProfiles(["Default"]);
    }
  }, [isInitialized, selectArrays, ensureSyntheticProfilesTable]);

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
    if (storedProfileName && storedProfileName !== "Default" && isInitialized) {
      loadProfile(storedProfileName);
    } else {
      setSelectedProfile(defaultProfile);
    }

    // Load available profiles when database is ready
    if (isInitialized) {
      loadAvailableProfiles();
    }
  }, [isInitialized, loadProfile, loadAvailableProfiles]);

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
        availableProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
