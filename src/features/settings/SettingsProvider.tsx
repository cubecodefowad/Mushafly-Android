import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAppDatabase } from "../../data/AppDatabaseProvider";
import { readSettingsJson, writeSettingsJson } from "../../database/user-repository";
import type { ReaderSettings } from "../../types/quran";
import { DEFAULT_SETTINGS, parseSettings } from "./settings";

type SettingsContextValue = {
  settings: ReaderSettings;
  loaded: boolean;
  storageError: string | null;
  update: (patch: Partial<ReaderSettings>) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAppDatabase();
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!user) {
      setLoaded(false);
      hydrated.current = false;
      return;
    }

    let cancelled = false;
    hydrated.current = false;
    setLoaded(false);
    setStorageError(null);

    (async () => {
      try {
        const raw = await readSettingsJson(user);
        let parsed = DEFAULT_SETTINGS;
        if (raw) {
          try {
            parsed = parseSettings(JSON.parse(raw));
          } catch {
            parsed = DEFAULT_SETTINGS;
          }
        }
        if (!cancelled) {
          setSettings(parsed);
          setLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSettings(DEFAULT_SETTINGS);
          setStorageError(
            error instanceof Error ? error.message : "Reading settings could not be loaded.",
          );
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !loaded) return;
    if (!hydrated.current) {
      // The first pass after hydration must not write defaults back over the
      // value we just read. This is the same hydration race fixed in the web app.
      hydrated.current = true;
      return;
    }
    writeSettingsJson(user, JSON.stringify(settings)).catch((error: unknown) => {
      setStorageError(
        error instanceof Error ? error.message : "The preference could not be saved.",
      );
    });
  }, [settings, loaded, user]);

  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((current) => parseSettings({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, loaded, storageError, update, reset }),
    [settings, loaded, storageError, update, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used inside SettingsProvider");
  return value;
}
