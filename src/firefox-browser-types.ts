/**
 * Firefox Browser UI TypeScript Types
 *
 * Core types for building Firefox-like browser UI components.
 * These types focus on browser behavior, navigation, and UI structure.
 */

import type { ReactNode } from "react";

// ============================================================================
// Core Browser Types
// ============================================================================

/**
 * Represents a browser tab
 */
export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: ReactNode;
  isPinned?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  containerColor?: string;
  attention?: boolean;
}

/**
 * Main browser shell container props
 */
export interface BrowserShellProps {
  children: ReactNode;
  tabs?: Tab[];
  activeTabId?: string;
  currentUrl?: string;
  onTabClick?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: () => void;
  onNavigate?: (url: string) => void;
  onNewTabBelow?: () => void;
  onCompareTabs?: () => void;
  onCloseBothTabs?: () => void;
  showSplitView?: boolean;
  className?: string;
}

/**
 * Tab strip component props
 */
export interface TabStripProps {
  tabs: Tab[];
  activeTabId?: string;
  onTabClick?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: () => void;
}

/**
 * Browser toolbar props
 */
export interface ToolbarProps {
  url?: string;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  onNavigate?: (url: string) => void;
  onNewTab?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onNewTabBelow?: () => void;
  onCompareTabs?: () => void;
  onCloseBothTabs?: () => void;
  showSplitView?: boolean;
  className?: string;
}

/**
 * Toolbar icon button props
 */
export interface ToolbarIconProps {
  icon: ReactNode;
  onClick?: () => void;
  badge?: boolean;
}

/**
 * Address bar component props
 */
export interface AddressBarProps {
  url?: string;
  onNavigate?: (url: string) => void;
  showSecurity?: boolean;
  onNewTabBelow?: () => void;
  onCompareTabs?: () => void;
  onCloseBothTabs?: () => void;
  showSplitView?: boolean;
  className?: string;
}

/**
 * Window control buttons props
 */
export interface WindowControlsProps {
  platform?: "macOS" | "windows";
}

// ============================================================================
// Browser State Types
// ============================================================================

/**
 * Navigation state for a tab
 */
export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  currentUrl: string;
  isLoading?: boolean;
  loadingProgress?: number;
}

/**
 * Security information for the current page
 */
export interface SecurityState {
  isSecure: boolean;
  hasValidCertificate?: boolean;
  permissions?: SitePermissions;
}

/**
 * Site permissions
 */
export interface SitePermissions {
  camera?: "granted" | "denied" | "prompt";
  microphone?: "granted" | "denied" | "prompt";
  location?: "granted" | "denied" | "prompt";
  notifications?: "granted" | "denied" | "prompt";
}

/**
 * Complete browser state
 */
export interface BrowserState {
  tabs: Tab[];
  activeTabId: string;
  navigation: Record<string, NavigationState>;
  security: Record<string, SecurityState>;
  splitView?: SplitViewState;
  bookmarks: Bookmark[];
  history: HistoryEntry[];
  findInPage?: FindState;
  sidebarOpen: boolean;
  sidebarPanel?: "bookmarks" | "history";
  zoomLevel?: number;
}

/**
 * Split view state
 */
export interface SplitViewState {
  enabled: boolean;
  leftTabId?: string;
  rightTabId?: string;
  orientation?: "horizontal" | "vertical";
}

/**
 * Individual tab state
 */
export interface TabState {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  history: string[];
  lastVisited?: Date;
  scrollPosition?: number;
  zoomLevel?: number;
  findInPageQuery?: string;
}

// ============================================================================
// Download Types
// ============================================================================

/**
 * Download item
 */
export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  totalBytes: number;
  receivedBytes: number;
  state: "pending" | "active" | "paused" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  error?: string;
  danger?: "safe" | "uncommon" | "dangerous" | "sensitive";
}

/**
 * Bookmark types
 */
export interface Bookmark {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  index: number;
  dateAdded: Date;
  lastModified: Date;
  type: "bookmark" | "folder" | "separator";
  children?: Bookmark[];
  tags?: string[];
}

/**
 * Browser history entry
 */
export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: Date;
  typedCount: number;
  favicon?: string;
}

/**
 * Find in page state
 */
export interface FindState {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  highlightAll: boolean;
  currentMatch: number;
  totalMatches: number;
  visible: boolean;
}

/**
 * Context menu item
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  accelerator?: string;
  enabled?: boolean;
  visible?: boolean;
  type?: "normal" | "separator" | "checkbox" | "radio";
  checked?: boolean;
  submenu?: ContextMenuItem[];
  onClick?: () => void;
}

/**
 * Browser notification
 */
export interface BrowserNotification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  origin?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// ============================================================================
// Firefox Theme Types
// ============================================================================

/**
 * Firefox theme configuration
 */
export interface FirefoxTheme {
  colors: {
    primary: string;
    toolbar: string;
    tabstrip: string;
    text: {
      primary: string;
      secondary: string;
      deemphasized: string;
    };
    border: {
      default: string;
      transparent: string;
    };
    button: {
      background: string;
      hover: string;
      active: string;
      primary: string;
    };
    icon: {
      default: string;
      active: string;
      disabled: string;
    };
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xsmall: number;
      small: number;
      body: number;
      large: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
}

/**
 * Default Firefox theme based on Figma design
 */
export const defaultFirefoxTheme: FirefoxTheme = {
  colors: {
    primary: "#0062fa",
    toolbar: "#f9f9fb",
    tabstrip: "#f0f0f4",
    text: {
      primary: "#15141a",
      secondary: "#5B5B66",
      deemphasized: "rgba(21, 20, 26, 0.69)",
    },
    border: {
      default: "#cfcfd8",
      transparent: "transparent",
    },
    button: {
      background: "rgba(21, 20, 26, 0.07)",
      hover: "rgba(21, 20, 26, 0.12)",
      active: "rgba(21, 20, 26, 0.16)",
      primary: "#0062fa",
    },
    icon: {
      default: "#5b5b66",
      active: "#15141a",
      disabled: "rgba(91, 91, 102, 0.5)",
    },
  },
  spacing: {
    small: 4,
    medium: 8,
    large: 16,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  },
  typography: {
    fontFamily: "SF Pro, system-ui, -apple-system, sans-serif",
    fontSize: {
      xsmall: 11,
      small: 13,
      body: 15,
      large: 18,
    },
    lineHeight: {
      tight: 1,
      normal: 1.2,
      relaxed: 1.5,
    },
  },
};

// ============================================================================
// Keyboard Shortcut Types
// ============================================================================

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  id: string;
  name: string;
  key: string;
  modifiers?: ("ctrl" | "alt" | "shift" | "meta")[];
  when?: string;
  action: () => void;
}

/**
 * Common Firefox keyboard shortcuts
 * Note: "mod" represents Cmd on macOS and Ctrl on Windows/Linux
 *
 * IMPORTANT: In the mockup environment, browser-reserved shortcuts that would
 * normally use Ctrl/Cmd (like Ctrl+T for new tab) should be remapped to use Alt
 * to avoid conflicts with the actual browser. Use getMockupShortcuts() to get
 * these remapped shortcuts.
 */
export const firefoxKeyboardShortcuts: Record<string, Omit<KeyboardShortcut, "action">> = {
  // Navigation (feasible with iframe history)
  back: { id: "back", name: "Go Back", key: "ArrowLeft", modifiers: ["alt"] },
  forward: { id: "forward", name: "Go Forward", key: "ArrowRight", modifiers: ["alt"] },
  home: { id: "home", name: "Go Home", key: "Home", modifiers: ["alt"] },
  reload: { id: "reload", name: "Reload", key: "r", modifiers: ["ctrl"] },
  stop: { id: "stop", name: "Stop", key: "Escape" },

  // Tabs (basic tab management)
  newTab: { id: "new-tab", name: "New Tab", key: "t", modifiers: ["ctrl"] },
  closeTab: { id: "close-tab", name: "Close Tab", key: "w", modifiers: ["ctrl"] },
  nextTab: { id: "next-tab", name: "Next Tab", key: "Tab", modifiers: ["ctrl"] },
  previousTab: {
    id: "previous-tab",
    name: "Previous Tab",
    key: "Tab",
    modifiers: ["ctrl", "shift"],
  },
  moveTabLeft: {
    id: "move-tab-left",
    name: "Move Tab Left",
    key: "PageUp",
    modifiers: ["ctrl", "shift"],
  },
  moveTabRight: {
    id: "move-tab-right",
    name: "Move Tab Right",
    key: "PageDown",
    modifiers: ["ctrl", "shift"],
  },
  moveTabStart: {
    id: "move-tab-start",
    name: "Move Tab to Start",
    key: "Home",
    modifiers: ["ctrl", "shift"],
  },
  moveTabEnd: {
    id: "move-tab-end",
    name: "Move Tab to End",
    key: "End",
    modifiers: ["ctrl", "shift"],
  },
  pinTab: { id: "pin-tab", name: "Pin Tab", key: "p", modifiers: ["ctrl", "shift"] },
  duplicateTab: {
    id: "duplicate-tab",
    name: "Duplicate Tab",
    key: "d",
    modifiers: ["ctrl", "shift"],
  },

  // Tab selection (1-8 for tabs, 9 for last)
  selectTab1: { id: "select-tab-1", name: "Select Tab 1", key: "1", modifiers: ["ctrl"] },
  selectTab2: { id: "select-tab-2", name: "Select Tab 2", key: "2", modifiers: ["ctrl"] },
  selectTab3: { id: "select-tab-3", name: "Select Tab 3", key: "3", modifiers: ["ctrl"] },
  selectTab4: { id: "select-tab-4", name: "Select Tab 4", key: "4", modifiers: ["ctrl"] },
  selectTab5: { id: "select-tab-5", name: "Select Tab 5", key: "5", modifiers: ["ctrl"] },
  selectTab6: { id: "select-tab-6", name: "Select Tab 6", key: "6", modifiers: ["ctrl"] },
  selectTab7: { id: "select-tab-7", name: "Select Tab 7", key: "7", modifiers: ["ctrl"] },
  selectTab8: { id: "select-tab-8", name: "Select Tab 8", key: "8", modifiers: ["ctrl"] },
  selectLastTab: { id: "select-last-tab", name: "Select Last Tab", key: "9", modifiers: ["ctrl"] },

  // Find (basic find functionality)
  find: { id: "find", name: "Find in Page", key: "f", modifiers: ["ctrl"] },
  findNext: { id: "find-next", name: "Find Next", key: "g", modifiers: ["ctrl"] },
  findPrevious: {
    id: "find-previous",
    name: "Find Previous",
    key: "g",
    modifiers: ["ctrl", "shift"],
  },

  // Bookmarks (visual only)
  bookmarkPage: { id: "bookmark-page", name: "Bookmark Page", key: "d", modifiers: ["ctrl"] },
  showBookmarksSidebar: {
    id: "show-bookmarks-sidebar",
    name: "Show Bookmarks Sidebar",
    key: "b",
    modifiers: ["ctrl"],
  },

  // History (visual only)
  showHistorySidebar: {
    id: "show-history-sidebar",
    name: "Show History Sidebar",
    key: "h",
    modifiers: ["ctrl"],
  },

  // UI
  focusAddressBar: {
    id: "focus-address-bar",
    name: "Focus Address Bar",
    key: "l",
    modifiers: ["ctrl"],
  },
  toggleSidebar: { id: "toggle-sidebar", name: "Toggle Sidebar", key: "b", modifiers: ["ctrl"] },

  // Zoom (CSS-based zoom)
  zoomIn: { id: "zoom-in", name: "Zoom In", key: "+", modifiers: ["ctrl"] },
  zoomOut: { id: "zoom-out", name: "Zoom Out", key: "-", modifiers: ["ctrl"] },
  resetZoom: { id: "reset-zoom", name: "Reset Zoom", key: "0", modifiers: ["ctrl"] },
};

/**
 * Helper to get platform-specific keyboard shortcuts
 * Converts "ctrl" to "cmd" on macOS for most shortcuts
 */
export function getPlatformShortcuts(
  platform: Platform,
): Record<string, Omit<KeyboardShortcut, "action">> {
  if (platform !== "macOS") {
    return firefoxKeyboardShortcuts;
  }

  // Convert ctrl to cmd for macOS, except for specific shortcuts that use ctrl on all platforms
  const ctrlOnlyShortcuts = [
    "nextTab",
    "previousTab",
    "selectTab1",
    "selectTab2",
    "selectTab3",
    "selectTab4",
    "selectTab5",
    "selectTab6",
    "selectTab7",
    "selectTab8",
    "selectLastTab",
  ];

  const macShortcuts: Record<string, Omit<KeyboardShortcut, "action">> = {};

  for (const [key, shortcut] of Object.entries(firefoxKeyboardShortcuts)) {
    if (
      shortcut.modifiers &&
      shortcut.modifiers.includes("ctrl") &&
      !ctrlOnlyShortcuts.includes(key)
    ) {
      macShortcuts[key] = {
        ...shortcut,
        modifiers: shortcut.modifiers.map((mod) => (mod === "ctrl" ? "meta" : mod)) as (
          | "ctrl"
          | "alt"
          | "shift"
          | "meta"
        )[],
      };
    } else {
      macShortcuts[key] = shortcut;
    }
  }

  return macShortcuts;
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(
  shortcut: Omit<KeyboardShortcut, "action">,
  platform: Platform,
): string {
  const modifierSymbols: Record<Platform, Record<string, string>> = {
    macOS: {
      meta: "⌘",
      ctrl: "⌃",
      alt: "⌥",
      shift: "⇧",
    },
    windows: {
      meta: "Win+",
      ctrl: "Ctrl+",
      alt: "Alt+",
      shift: "Shift+",
    },
    linux: {
      meta: "Super+",
      ctrl: "Ctrl+",
      alt: "Alt+",
      shift: "Shift+",
    },
  };

  const symbols = modifierSymbols[platform];
  let result = "";

  if (shortcut.modifiers) {
    // Ensure consistent modifier order
    const modifierOrder: ("ctrl" | "alt" | "shift" | "meta")[] = ["ctrl", "alt", "shift", "meta"];
    const sortedModifiers = shortcut.modifiers.sort(
      (a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b),
    );

    for (const mod of sortedModifiers) {
      result += symbols[mod] || "";
    }
  }

  // Handle special key names
  const keyDisplay: Record<string, string> = {
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    ArrowDown: "↓",
    Escape: "Esc",
    Delete: "Del",
    " ": "Space",
  };

  result += keyDisplay[shortcut.key] || shortcut.key.toUpperCase();

  return result;
}

/**
 * Get keyboard shortcuts remapped for mockup environment
 * Converts Ctrl/Cmd shortcuts to Alt to avoid browser conflicts
 */
export function getMockupShortcuts(): Record<string, Omit<KeyboardShortcut, "action">> {
  // List of shortcuts that should be remapped from Ctrl/Cmd to Alt in the mockup
  const browserReservedShortcuts = [
    "newTab",
    "closeTab",
    "find",
    "findNext",
    "findPrevious",
    "bookmarkPage",
    "reload",
    "focusAddressBar",
    "zoomIn",
    "zoomOut",
    "resetZoom",
  ];

  const mockupShortcuts: Record<string, Omit<KeyboardShortcut, "action">> = {};

  for (const [key, shortcut] of Object.entries(firefoxKeyboardShortcuts)) {
    if (browserReservedShortcuts.includes(key) && shortcut.modifiers) {
      // Replace ctrl/meta with alt for browser-reserved shortcuts
      mockupShortcuts[key] = {
        ...shortcut,
        modifiers: shortcut.modifiers.map((mod) =>
          mod === "ctrl" || mod === "meta" ? "alt" : mod,
        ) as ("ctrl" | "alt" | "shift" | "meta")[],
        name: shortcut.name + " (Alt in mockup)",
      };
    } else {
      mockupShortcuts[key] = shortcut;
    }
  }

  return mockupShortcuts;
}

/**
 * Example usage for mockup environment:
 *
 * const shortcuts = getMockupShortcuts();
 * // shortcuts.newTab will now be Alt+T instead of Ctrl+T
 * // shortcuts.find will now be Alt+F instead of Ctrl+F
 *
 * To display the shortcut:
 * formatShortcut(shortcuts.newTab, platform) // "Alt+T"
 */

// ============================================================================
// Extension Types
// ============================================================================

/**
 * Browser extension
 */
export interface Extension {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  permissions: string[];
  isBuiltin?: boolean;
  homepage?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export type TabEventHandler = (tabId: string) => void;
export type NavigationEventHandler = (url: string) => void;
export type SimpleEventHandler = () => void;

// ============================================================================
// Utility Types
// ============================================================================

export type Platform = "macOS" | "windows" | "linux";

export type TabAction = "new" | "close" | "reload" | "duplicate" | "pin" | "unpin" | "move";

export type NavigationAction = "back" | "forward" | "reload" | "stop" | "home";

export type ToolbarButton =
  | "sidebar"
  | "back"
  | "forward"
  | "reload"
  | "downloads"
  | "account"
  | "extensions"
  | "menu"
  | "bookmarks"
  | "history"
  | "find";

export type BrowserMode = "normal" | "private" | "troubleshoot";

export type DevToolsPanel =
  | "inspector"
  | "console"
  | "debugger"
  | "network"
  | "performance"
  | "memory"
  | "storage";

/**
 * Container tab configuration (Multi-Account Containers)
 */
export interface TabContainer {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ============================================================================
// Icon Component Types
// ============================================================================

export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

// ============================================================================
// Browser Actions
// ============================================================================

export interface BrowserActions {
  // Tab management (feasible in mockup)
  createTab: (url?: string) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  moveTab: (tabId: string, newIndex: number) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  duplicateTab: (tabId: string) => void;

  // Navigation (limited by iframe capabilities)
  navigate: (tabId: string, url: string) => void;
  goBack: (tabId: string) => void;
  goForward: (tabId: string) => void;
  reload: (tabId: string) => void;
  stop: (tabId: string) => void;
  goHome: (tabId: string) => void;

  // Split view
  enableSplitView: (leftTabId: string, rightTabId: string) => void;
  disableSplitView: () => void;
  compareTabs: (tabId1: string, tabId2: string) => void;

  // Bookmarks (visual only - stored in local state)
  addBookmark: (url: string, title: string, parentId?: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  editBookmark: (bookmarkId: string, updates: Partial<Bookmark>) => void;

  // Find in page (basic implementation)
  findInPage: (query: string, options?: Partial<FindState>) => void;
  findNext: () => void;
  findPrevious: () => void;
  closeFindBar: () => void;

  // UI controls
  toggleSidebar: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

// ============================================================================
// Type Guards
// ============================================================================

export const isTab = (obj: any): obj is Tab => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "title" in obj &&
    "url" in obj &&
    typeof (obj as any).id === "string" &&
    typeof (obj as any).title === "string" &&
    typeof (obj as any).url === "string"
  );
};

export const isPinnedTab = (tab: Tab): boolean => {
  return tab.isPinned === true;
};

export const isActiveTab = (tab: Tab): boolean => {
  return tab.isActive === true;
};
