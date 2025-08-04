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

      // Debug logging
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        console.log("Key pressed:", {
          key: event.key,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
        });
      }

      // Check each shortcut
      (Object.entries(handlers) as Array<[ShortcutId, (() => void) | undefined]>).forEach(
        ([shortcutId, handler]) => {
          if (!handler) return;

          const shortcutDef = mockupShortcuts[shortcutId];
          if (!shortcutDef) return;

          // Check if the key matches
          let keyMatches = false;

          // For shortcuts with Alt modifier, we need to be more careful about key matching
          // because Alt can transform the character (especially on macOS)
          if (event.altKey && shortcutDef.modifiers?.includes("alt")) {
            // Try multiple matching strategies

            // 1. Direct key match (for keys that don't transform)
            if (
              event.key === shortcutDef.key ||
              event.key.toLowerCase() === shortcutDef.key.toLowerCase()
            ) {
              keyMatches = true;
            }
            // 2. For single letters, check the code (handles Alt+letter transformations)
            else if (
              /^[a-zA-Z]$/.test(shortcutDef.key) &&
              event.code.toLowerCase() === `key${shortcutDef.key.toLowerCase()}`
            ) {
              keyMatches = true;
            }
            // 3. For digits, check if the code matches
            else if (/^[0-9]$/.test(shortcutDef.key) && event.code === `Digit${shortcutDef.key}`) {
              keyMatches = true;
            }
            // 4. For special keys, check common transformations
            else if (shortcutDef.key === "+" && (event.key === "=" || event.code === "Equal")) {
              keyMatches = true;
            } else if (shortcutDef.key === "-" && (event.key === "-" || event.code === "Minus")) {
              keyMatches = true;
            } else if (shortcutDef.key === "/" && (event.key === "/" || event.code === "Slash")) {
              keyMatches = true;
            }
          } else {
            // For non-Alt shortcuts, use regular key matching
            keyMatches =
              event.key.toLowerCase() === shortcutDef.key.toLowerCase() ||
              event.key === shortcutDef.key;
          }

          if (!keyMatches) {
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
