import type { ReactNode } from "react";

export enum TabType {
  PROXY = "proxy",
  STUB = "stub",
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  displayUrl?: string; // URL to display in the address bar (different from actual URL)
  favicon?: ReactNode;
  isPinned?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  type?: TabType;
  history?: string[];
  historyIndex?: number;
  containerColor?: string;
  attention?: boolean;
}

export type TabEventHandler = (tabId: string) => void;

export type TabAction = "new" | "close" | "reload" | "duplicate" | "pin" | "unpin" | "move";

export interface TabContainer {
  id: string;
  name: string;
  color: string;
  icon: string;
}
