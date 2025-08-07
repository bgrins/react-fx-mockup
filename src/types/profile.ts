// Define the structure of browser state
export interface BrowserState {
  windowType: "classic" | "smart";
  // Future: we can add more browser state here like:
  // sidebarOpen?: boolean;
  // sidebarExpanded?: boolean;
  // zoomLevel?: number;
  // etc.
}

// Import Shortcut type
import type { Shortcut } from "~/constants/shortcuts";

// Define the structure of a profile
export interface Profile {
  name: string;
  shortcuts: Shortcut[];
}
