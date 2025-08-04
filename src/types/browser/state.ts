import type { Tab } from "./tab";
import type { NavigationState, SecurityState, Bookmark, HistoryEntry } from "./navigation";

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

export interface SplitViewState {
  enabled: boolean;
  leftTabId?: string;
  rightTabId?: string;
  orientation?: "horizontal" | "vertical";
}

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

export interface FindState {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  highlightAll: boolean;
  currentMatch: number;
  totalMatches: number;
  visible: boolean;
}

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

export type BrowserMode = "normal" | "private" | "troubleshoot";

export type DevToolsPanel =
  | "inspector"
  | "console"
  | "debugger"
  | "network"
  | "performance"
  | "memory"
  | "storage";
