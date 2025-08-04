import { useEffect, useState } from "react";
import type { ShortcutHandlers, ShortcutId } from "~/types/browser";
import { getMockupShortcuts } from "~/lib/keyboard-shortcuts";

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
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
      (Object.entries(handlers) as Array<[ShortcutId, (() => void) | undefined]>).forEach(
        ([shortcutId, handler]) => {
          if (!handler) return;

          const shortcutDef = mockupShortcuts[shortcutId];
          if (!shortcutDef) return;

          // Check if the key matches
          if (
            event.key.toLowerCase() !== shortcutDef.key.toLowerCase() &&
            event.key !== shortcutDef.key
          ) {
            return;
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
          }
        },
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, enabled, preventDefault]);

  return { showHelp, setShowHelp };
}

// Re-export commonly used functions for convenience
export { formatShortcut, getMockupShortcuts } from "~/lib/keyboard-shortcuts";
