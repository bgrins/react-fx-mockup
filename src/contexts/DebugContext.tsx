import React from "react";
import { DebugContext, type DebugInfo } from "./useDebug";

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [debugInfo, setDebugInfo] = React.useState<DebugInfo>({});

  return (
    <DebugContext.Provider value={{ debugInfo, setDebugInfo }}>{children}</DebugContext.Provider>
  );
}
