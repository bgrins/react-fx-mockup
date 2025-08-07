import { createContext } from "react";
import type { BrowserState, Profile } from "~/types/profile";

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
export const ProfileContext = createContext<ProfileContextValue | null>(null);
