import type { ReactNode } from "react";
import type { Tab } from "./tab";

export interface BrowserShellProps {
  children: ReactNode;
  tabs?: Tab[];
  activeTabId?: string;
  currentUrl?: string;
  onTabClick?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: (url?: string) => void;
  onNavigate?: (url: string) => void;
  onTabReorder?: (draggedTabId: string, targetTabId: string, dropBefore: boolean) => void;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onSidebarToggle?: () => void;
  ref?: React.Ref<any>;
  className?: string;
}

export interface TabStripProps {
  tabs: Tab[];
  activeTabId?: string;
  onTabClick?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: (url?: string) => void;
  onTabReorder?: (draggedTabId: string, targetTabId: string, dropBefore: boolean) => void;
  smartWindowMode?: boolean;
  isFirefoxViewActive?: boolean;
}

export interface ToolbarProps {
  url?: string;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  onNavigate?: (url: string) => void;
  onNewTab?: (url?: string) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onSidebarToggle?: () => void;
  className?: string;
}

export interface AddressBarProps {
  url?: string;
  onNavigate?: (url: string) => void;
  ref?: React.Ref<any>;
  className?: string;
}

export interface WindowControlsProps {
  platform?: "macOS" | "windows";
}

export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  accelerator?: string;
  enabled?: boolean;
  visible?: boolean;
  type?: "normal" | "separator" | "checkbox" | "radio";
  checked?: boolean;
  submenu?: ContextMenuItem[];
  onClick?: () => void;
}

export type ToolbarButton =
  | "sidebar"
  | "back"
  | "forward"
  | "reload"
  | "downloads"
  | "account"
  | "extensions"
  | "menu"
  | "bookmarks"
  | "history"
  | "find";
