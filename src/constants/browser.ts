import React from "react";

export enum TabType {
  PROXY = "proxy",
  STUB = "stub",
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: React.ReactNode;
  isPinned?: boolean;
  isActive?: boolean;
  type?: TabType;
  history?: string[];
  historyIndex?: number;
}

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
} as const;
