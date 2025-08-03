import { useEffect, useState } from "react";
import {
  KeyboardShortcut,
  getMockupShortcuts,
  formatShortcut,
  Platform,
} from "../firefox-browser-types";

type ShortcutHandler = () => void;

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: Record<string, ShortcutHandler>,
  options: UseKeyboardShortcutsOptions = {},
) {
  const { enabled = true, preventDefault = true } = options;
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Get mockup shortcuts
      const mockupShortcuts = getMockupShortcuts();

      // Check each shortcut
      for (const [shortcutId, handler] of Object.entries(shortcuts)) {
        const shortcutDef = mockupShortcuts[shortcutId];
        if (!shortcutDef) {
          continue;
        }

        // Check if the key matches
        if (
          event.key.toLowerCase() !== shortcutDef.key.toLowerCase() &&
          event.key !== shortcutDef.key
        ) {
          continue;
        }

        // Check modifiers
        const requiredModifiers = shortcutDef.modifiers || [];
        const hasCtrl = requiredModifiers.includes("ctrl");
        const hasAlt = requiredModifiers.includes("alt");
        const hasShift = requiredModifiers.includes("shift");
        const hasMeta = requiredModifiers.includes("meta");

        const modifiersMatch =
          event.ctrlKey === hasCtrl &&
          event.altKey === hasAlt &&
          event.shiftKey === hasShift &&
          event.metaKey === hasMeta;

        if (modifiersMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          handler();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled, preventDefault]);

  return { showHelp, setShowHelp };
}

// Hook to get all registered shortcuts for display
export function useRegisteredShortcuts(): KeyboardShortcut[] {
  const mockupShortcuts = getMockupShortcuts();
  const registeredShortcuts: KeyboardShortcut[] = [];

  // Convert to array with formatted display
  for (const [, shortcut] of Object.entries(mockupShortcuts)) {
    registeredShortcuts.push({
      ...shortcut,
      action: () => {}, // Placeholder, actual actions are provided by components
    });
  }

  return registeredShortcuts;
}

// Get formatted shortcut display string
export function useFormattedShortcut(shortcutId: string): string {
  const mockupShortcuts = getMockupShortcuts();
  const shortcut = mockupShortcuts[shortcutId];

  if (!shortcut) return "";

  const platform: Platform = navigator.platform.toLowerCase().includes("mac")
    ? "macOS"
    : navigator.platform.toLowerCase().includes("win")
      ? "windows"
      : "linux";

  return formatShortcut(shortcut, platform);
}
