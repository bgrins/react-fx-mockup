import type {
  KeyboardShortcutDefinition,
  ShortcutId,
  Platform,
  ShortcutCategory,
} from "~/types/browser";

/**
 * Firefox keyboard shortcut definitions
 * These are the base definitions that get platform-specific modifications
 */
export const firefoxKeyboardShortcuts: Record<ShortcutId, KeyboardShortcutDefinition> = {
  // Navigation
  back: { id: "back", name: "Go Back", key: "ArrowLeft", modifiers: ["alt"] },
  forward: { id: "forward", name: "Go Forward", key: "ArrowRight", modifiers: ["alt"] },
  home: { id: "home", name: "Go Home", key: "Home", modifiers: ["alt"] },
  reload: { id: "reload", name: "Reload", key: "r", modifiers: ["ctrl"] },
  stop: { id: "stop", name: "Stop", key: "Escape" },

  // Tabs
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

  // Tab selection
  selectTab1: { id: "select-tab-1", name: "Select Tab 1", key: "1", modifiers: ["ctrl"] },
  selectTab2: { id: "select-tab-2", name: "Select Tab 2", key: "2", modifiers: ["ctrl"] },
  selectTab3: { id: "select-tab-3", name: "Select Tab 3", key: "3", modifiers: ["ctrl"] },
  selectTab4: { id: "select-tab-4", name: "Select Tab 4", key: "4", modifiers: ["ctrl"] },
  selectTab5: { id: "select-tab-5", name: "Select Tab 5", key: "5", modifiers: ["ctrl"] },
  selectTab6: { id: "select-tab-6", name: "Select Tab 6", key: "6", modifiers: ["ctrl"] },
  selectTab7: { id: "select-tab-7", name: "Select Tab 7", key: "7", modifiers: ["ctrl"] },
  selectTab8: { id: "select-tab-8", name: "Select Tab 8", key: "8", modifiers: ["ctrl"] },
  selectLastTab: { id: "select-last-tab", name: "Select Last Tab", key: "9", modifiers: ["ctrl"] },

  // Find
  find: { id: "find", name: "Find in Page", key: "f", modifiers: ["ctrl"] },
  findNext: { id: "find-next", name: "Find Next", key: "g", modifiers: ["ctrl"] },
  findPrevious: {
    id: "find-previous",
    name: "Find Previous",
    key: "g",
    modifiers: ["ctrl", "shift"],
  },

  // Bookmarks
  bookmarkPage: { id: "bookmark-page", name: "Bookmark Page", key: "d", modifiers: ["ctrl"] },
  showBookmarksSidebar: {
    id: "show-bookmarks-sidebar",
    name: "Show Bookmarks Sidebar",
    key: "b",
    modifiers: ["ctrl"],
  },

  // History
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
  pageInfo: { id: "page-info", name: "Page Info", key: "i", modifiers: ["alt"] },

  // Zoom
  zoomIn: { id: "zoom-in", name: "Zoom In", key: "+", modifiers: ["ctrl"] },
  zoomOut: { id: "zoom-out", name: "Zoom Out", key: "-", modifiers: ["ctrl"] },
  resetZoom: { id: "reset-zoom", name: "Reset Zoom", key: "0", modifiers: ["ctrl"] },

  // Settings
  toggleSettings: { id: "toggle-settings", name: "Toggle Settings", key: "/", modifiers: ["ctrl"] },
};

/**
 * Shortcut categories for organization in UI
 */
export const shortcutCategories: ShortcutCategory[] = [
  {
    name: "Navigation",
    shortcuts: ["back", "forward", "home", "reload", "stop"],
  },
  {
    name: "Tabs",
    shortcuts: ["newTab", "closeTab", "nextTab", "previousTab", "pinTab", "duplicateTab"],
  },
  {
    name: "Tab Selection",
    shortcuts: [
      "selectTab1",
      "selectTab2",
      "selectTab3",
      "selectTab4",
      "selectTab5",
      "selectTab6",
      "selectTab7",
      "selectTab8",
      "selectLastTab",
    ],
  },
  {
    name: "Tab Movement",
    shortcuts: ["moveTabLeft", "moveTabRight", "moveTabStart", "moveTabEnd"],
  },
  {
    name: "Find",
    shortcuts: ["find", "findNext", "findPrevious"],
  },
  {
    name: "Bookmarks",
    shortcuts: ["bookmarkPage", "showBookmarksSidebar"],
  },
  {
    name: "History",
    shortcuts: ["showHistorySidebar"],
  },
  {
    name: "UI",
    shortcuts: ["focusAddressBar", "toggleSidebar", "pageInfo"],
  },
  {
    name: "Zoom",
    shortcuts: ["zoomIn", "zoomOut", "resetZoom"],
  },
  {
    name: "Settings",
    shortcuts: ["toggleSettings"],
  },
];

/**
 * Get platform-specific keyboard shortcuts
 * Converts "ctrl" to "cmd" on macOS for most shortcuts
 */
export function getPlatformShortcuts(
  platform: Platform,
): Record<ShortcutId, KeyboardShortcutDefinition> {
  if (platform !== "macOS") {
    return firefoxKeyboardShortcuts;
  }

  // Convert ctrl to cmd for macOS, except for specific shortcuts that use ctrl on all platforms
  const ctrlOnlyShortcuts: ShortcutId[] = [
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

  const macShortcuts: Record<ShortcutId, KeyboardShortcutDefinition> = {} as any;

  (
    Object.entries(firefoxKeyboardShortcuts) as Array<[ShortcutId, KeyboardShortcutDefinition]>
  ).forEach(([key, shortcut]) => {
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
  });

  return macShortcuts;
}

/**
 * Get keyboard shortcuts remapped for mockup environment
 * Converts Ctrl/Cmd shortcuts to Alt to avoid browser conflicts
 */
export function getMockupShortcuts(): Record<ShortcutId, KeyboardShortcutDefinition> {
  // First get platform-specific shortcuts
  const platform: Platform = navigator.platform.toLowerCase().includes("mac")
    ? "macOS"
    : navigator.platform.toLowerCase().includes("win")
      ? "windows"
      : "linux";

  const platformShortcuts = getPlatformShortcuts(platform);

  // List of shortcuts that should be remapped from Ctrl/Cmd to Alt in the mockup
  const browserReservedShortcuts: ShortcutId[] = [
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

  const mockupShortcuts: Record<ShortcutId, KeyboardShortcutDefinition> = {} as any;

  (Object.entries(platformShortcuts) as Array<[ShortcutId, KeyboardShortcutDefinition]>).forEach(
    ([key, shortcut]) => {
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
    },
  );

  return mockupShortcuts;
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcutDefinition, platform: Platform): string {
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
    "/": "?", // Display ? for / key since ? requires Shift
  };

  result += keyDisplay[shortcut.key] || shortcut.key.toUpperCase();

  return result;
}
