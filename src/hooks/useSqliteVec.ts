import { useCallback, useEffect, useRef, useState } from "react";

class SQLiteWorkerDB {
  private worker: Worker;
  private messageId: number;
  private pendingMessages: Map<
    number,
    { resolve: (value: any) => void; reject: (reason: any) => void }
  >;

  constructor() {
    this.worker = new Worker("/sqlite-worker.js", { type: "module" });
    this.messageId = 0;
    this.pendingMessages = new Map();

    this.worker.addEventListener("message", (event) => {
      const { id, type, data } = event.data;
      const resolve = this.pendingMessages.get(id);
      if (resolve) {
        this.pendingMessages.delete(id);
        if (type === "error") {
          resolve.reject(new Error(data.error));
        } else {
          resolve.resolve({ type, data });
        }
      }
    });
  }

  private async sendMessage(type: string, data: any = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pendingMessages.set(id, { resolve, reject });
      this.worker.postMessage({ type, data, id });
    });
  }

  async init(dbName = "/vec-demo.db") {
    return this.sendMessage("init", { dbName });
  }

  async exec(sql: string) {
    const result = await this.sendMessage("exec", { sql });
    return (result as any).data.result;
  }

  async selectArray(sql: string) {
    const result = await this.sendMessage("selectArray", { sql });
    return (result as any).data.result;
  }

  async selectArrays(sql: string) {
    const result = await this.sendMessage("selectArrays", { sql });
    return (result as any).data.result;
  }

  async close() {
    const result = await this.sendMessage("close");
    this.worker.terminate();
    return result;
  }
}

export interface SqliteVecHookReturn {
  db: SQLiteWorkerDB | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  exec: (sql: string) => Promise<any>;
  selectArray: (sql: string) => Promise<any[]>;
  selectArrays: (sql: string) => Promise<any[][]>;
}

export function useSqliteVec(dbName?: string): SqliteVecHookReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<SQLiteWorkerDB | null>(null);

  useEffect(() => {
    // Only run on client-side to avoid SSR issues
    if (typeof window === "undefined") return;

    const initDB = async () => {
      if (dbRef.current) return;

      setIsInitializing(true);
      setError(null);

      try {
        const db = new SQLiteWorkerDB();
        const initResult = await db.init(dbName);

        if ((initResult as any).type === "success") {
          console.log("✅ Successfully created OPFS database");
        } else if ((initResult as any).type === "fallback") {
          console.log("⚠️ " + (initResult as any).data.message);
        }

        dbRef.current = db;
        setIsInitialized(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        console.error("Failed to initialize SQLite database:", e);
      } finally {
        setIsInitializing(false);
      }
    };

    initDB();

    return () => {
      if (dbRef.current) {
        dbRef.current.close().catch(console.error);
        dbRef.current = null;
      }
    };
  }, [dbName]);

  const exec = useCallback(async (sql: string) => {
    if (!dbRef.current) {
      throw new Error("Database not initialized");
    }
    return dbRef.current.exec(sql);
  }, []);

  const selectArray = useCallback(async (sql: string) => {
    if (!dbRef.current) {
      throw new Error("Database not initialized");
    }
    return dbRef.current.selectArray(sql);
  }, []);

  const selectArrays = useCallback(async (sql: string) => {
    if (!dbRef.current) {
      throw new Error("Database not initialized");
    }
    return dbRef.current.selectArrays(sql);
  }, []);

  return {
    db: dbRef.current,
    isInitialized,
    isInitializing,
    error,
    exec,
    selectArray,
    selectArrays,
  };
}
