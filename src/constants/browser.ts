/**
 * Browser-related constants
 * Import types from ~/types/browser for type definitions
 */

export const ABOUT_PAGES = {
  BLANK: "about:blank",
  FIREFOX_VIEW: "about:firefoxview",
} as const;

export const DEFAULT_TAB_TITLE = "New Tab";

export const PROXY_MESSAGE_TYPES = {
  READY: "PROXY_TUNNEL_READY",
  COMMAND: "PROXY_TUNNEL_COMMAND",
  RESPONSE: "PROXY_TUNNEL_RESPONSE",
  NAVIGATION: "PROXY_TUNNEL_NAVIGATION",
  KEYBOARD: "PROXY_TUNNEL_KEYBOARD",
} as const;

// Re-export types from the new location for backward compatibility
export { TabType, type Tab } from "~/types/browser";
