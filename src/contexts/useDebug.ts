import React from "react";

export interface DebugInfo {
  currentTab?: {
    url: string;
    proxyUrl?: string;
    realUrl?: string;
    title: string;
    type?: "proxy" | "stub" | "local";
  };
}

export interface DebugContextType {
  debugInfo: DebugInfo;
  setDebugInfo: (info: DebugInfo) => void;
}

export const DebugContext = React.createContext<DebugContextType | undefined>(undefined);

export function useDebug() {
  const context = React.useContext(DebugContext);
  if (!context) {
    throw new Error("useDebug must be used within a DebugProvider");
  }
  return context;
}
