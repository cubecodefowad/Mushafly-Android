import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import { ensureQuranDatabase } from "./quran-db";
import { openUserDatabase } from "../database/user-db";

type DatabaseState =
  | { status: "loading"; quran: null; user: null; error: null }
  | { status: "ready"; quran: SQLiteDatabase; user: SQLiteDatabase; error: null }
  | { status: "error"; quran: null; user: null; error: string };

type DatabaseContextValue = DatabaseState & {
  retry: () => void;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

function messageFor(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The local Quran data could not be opened.";
}

export function AppDatabaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DatabaseState>({
    status: "loading",
    quran: null,
    user: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", quran: null, user: null, error: null });

    (async () => {
      let quran: SQLiteDatabase | null = null;
      let user: SQLiteDatabase | null = null;
      try {
        quran = await ensureQuranDatabase();
        user = await openUserDatabase();
        if (!cancelled) {
          setState({ status: "ready", quran, user, error: null });
        }
      } catch (error) {
        if (user) await user.closeAsync().catch(() => {});
        if (!cancelled) {
          setState({
            status: "error",
            quran: null,
            user: null,
            error: messageFor(error),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const value = useMemo<DatabaseContextValue>(() => ({ ...state, retry }), [state, retry]);

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useAppDatabase(): DatabaseContextValue {
  const value = useContext(DatabaseContext);
  if (!value) throw new Error("useAppDatabase must be used inside AppDatabaseProvider");
  return value;
}
