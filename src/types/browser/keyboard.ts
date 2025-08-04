export type Platform = "macOS" | "windows" | "linux";

export interface KeyboardShortcut {
  id: string;
  name: string;
  key: string;
  modifiers?: ("ctrl" | "alt" | "shift" | "meta")[];
  when?: string;
  action: () => void;
}

export type KeyboardShortcutDefinition = Omit<KeyboardShortcut, "action">;

/**
 * All available keyboard shortcut IDs in the application
 * This ensures type safety when registering shortcut handlers
 */
export type ShortcutId =
  // Navigation
  | "back"
  | "forward"
  | "home"
  | "reload"
  | "stop"
  // Tabs
  | "newTab"
  | "closeTab"
  | "nextTab"
  | "previousTab"
  | "moveTabLeft"
  | "moveTabRight"
  | "moveTabStart"
  | "moveTabEnd"
  | "pinTab"
  | "duplicateTab"
  // Tab selection
  | "selectTab1"
  | "selectTab2"
  | "selectTab3"
  | "selectTab4"
  | "selectTab5"
  | "selectTab6"
  | "selectTab7"
  | "selectTab8"
  | "selectLastTab"
  // Find
  | "find"
  | "findNext"
  | "findPrevious"
  // Bookmarks
  | "bookmarkPage"
  | "showBookmarksSidebar"
  // History
  | "showHistorySidebar"
  // UI
  | "focusAddressBar"
  | "toggleSidebar"
  | "pageInfo"
  // Zoom
  | "zoomIn"
  | "zoomOut"
  | "resetZoom"
  // Settings
  | "toggleSettings";

/**
 * Type-safe shortcut handlers map
 * Ensures all shortcuts have corresponding handlers
 */
export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

/**
 * Keyboard shortcut category for organization
 */
export interface ShortcutCategory {
  name: string;
  shortcuts: ShortcutId[];
}
