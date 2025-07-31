import React from "react";

interface DebugInfo {
  currentTab?: {
    url: string;
    proxyUrl?: string;
    realUrl?: string;
    title: string;
    type?: "proxy" | "stub";
  };
}

interface DebugContextType {
  debugInfo: DebugInfo;
  setDebugInfo: (info: DebugInfo) => void;
}

const DebugContext = React.createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [debugInfo, setDebugInfo] = React.useState<DebugInfo>({});

  return (
    <DebugContext.Provider value={{ debugInfo, setDebugInfo }}>{children}</DebugContext.Provider>
  );
}

export function useDebug() {
  const context = React.useContext(DebugContext);
  if (!context) {
    throw new Error("useDebug must be used within a DebugProvider");
  }
  return context;
}
