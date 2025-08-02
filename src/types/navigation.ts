export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface NavigationEvent {
  url: string;
  navigationType?: NavigationType;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export type NavigationType =
  | "initial"
  | "popstate"
  | "pushstate"
  | "replacestate"
  | "beforeunload"
  | "link"
  | "form"
  | "reload";

export interface ParsedUrl {
  fullUrl: string;
  displayUrl: string;
  isLocalFile: boolean;
  localPath?: string;
  hostname?: string;
}

export interface TabHistoryEntry {
  url: string;
  timestamp: number;
}

export interface NavigationHandler {
  onNavigate: (url: string, navigationType?: NavigationType) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
}

export interface ProxyNavigationState extends NavigationState {
  lastNavigationType?: NavigationType;
}
