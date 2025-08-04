export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  currentUrl: string;
  isLoading?: boolean;
  loadingProgress?: number;
}

export interface SecurityState {
  isSecure: boolean;
  hasValidCertificate?: boolean;
  permissions?: SitePermissions;
}

export interface SitePermissions {
  camera?: "granted" | "denied" | "prompt";
  microphone?: "granted" | "denied" | "prompt";
  location?: "granted" | "denied" | "prompt";
  notifications?: "granted" | "denied" | "prompt";
}

export type NavigationEventHandler = (url: string) => void;

export type NavigationAction = "back" | "forward" | "reload" | "stop" | "home";

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: Date;
  typedCount: number;
  favicon?: string;
}

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
