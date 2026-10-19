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
import {
  addBookmark,
  getLastRead,
  isValidReference,
  listBookmarks,
  removeBookmark,
  saveLastRead,
} from "../../database/user-repository";
import type { BookmarkRecord, LastRead } from "../../types/quran";

type LibraryContextValue = {
  loaded: boolean;
  bookmarks: BookmarkRecord[];
  lastRead: LastRead | null;
  error: string | null;
  isBookmarked: (surahNumber: number, verseNumber: number) => boolean;
  toggleBookmark: (surahNumber: number, verseNumber: number) => Promise<boolean>;
  removeSavedBookmark: (surahNumber: number, verseNumber: number) => Promise<void>;
  saveReadingPosition: (surahNumber: number, verseNumber: number) => void;
  refresh: () => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

const refKey = (surah: number, verse: number) => `${surah}:${verse}`;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAppDatabase();
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const bookmarksRef = useRef<BookmarkRecord[]>([]);
  const lastReadRef = useRef<LastRead | null>(null);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  bookmarksRef.current = bookmarks;
  lastReadRef.current = lastRead;

  useEffect(() => {
    if (!user) {
      setLoaded(false);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    setError(null);
    (async () => {
      try {
        const [savedBookmarks, savedPosition] = await Promise.all([
          listBookmarks(user),
          getLastRead(user),
        ]);
        if (!cancelled) {
          setBookmarks(savedBookmarks);
          setLastRead(savedPosition);
          setLoaded(true);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Bookmarks could not be loaded.",
          );
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, revision]);

  const isBookmarked = useCallback(
    (surahNumber: number, verseNumber: number) =>
      bookmarks.some(
        (entry) =>
          entry.surahNumber === surahNumber && entry.verseNumber === verseNumber,
      ),
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    async (surahNumber: number, verseNumber: number): Promise<boolean> => {
      if (!user || !isValidReference(surahNumber, verseNumber)) return false;
      const currentlySaved = bookmarksRef.current.some(
        (entry) =>
          entry.surahNumber === surahNumber && entry.verseNumber === verseNumber,
      );
      const previous = bookmarksRef.current;

      if (currentlySaved) {
        setBookmarks((current) =>
          current.filter(
            (entry) =>
              entry.surahNumber !== surahNumber || entry.verseNumber !== verseNumber,
          ),
        );
        try {
          await removeBookmark(user, surahNumber, verseNumber);
          return false;
        } catch (cause) {
          setBookmarks(previous);
          setError(cause instanceof Error ? cause.message : "The bookmark could not be removed.");
          return true;
        }
      }

      const optimistic: BookmarkRecord = {
        surahNumber,
        verseNumber,
        createdAt: new Date().toISOString(),
      };
      setBookmarks((current) => {
        if (current.some((entry) => refKey(entry.surahNumber, entry.verseNumber) === refKey(surahNumber, verseNumber))) {
          return current;
        }
        return [optimistic, ...current];
      });
      try {
        const saved = await addBookmark(user, surahNumber, verseNumber, optimistic.createdAt);
        setBookmarks((current) =>
          current.map((entry) =>
            refKey(entry.surahNumber, entry.verseNumber) === refKey(surahNumber, verseNumber)
              ? saved
              : entry,
          ),
        );
        return true;
      } catch (cause) {
        setBookmarks(previous);
        setError(cause instanceof Error ? cause.message : "The bookmark could not be saved.");
        return false;
      }
    },
    [user],
  );

  const removeSavedBookmark = useCallback(
    async (surahNumber: number, verseNumber: number) => {
      if (!user) return;
      const previous = bookmarksRef.current;
      setBookmarks((current) =>
        current.filter(
          (entry) =>
            entry.surahNumber !== surahNumber || entry.verseNumber !== verseNumber,
        ),
      );
      try {
        await removeBookmark(user, surahNumber, verseNumber);
      } catch (cause) {
        setBookmarks(previous);
        setError(cause instanceof Error ? cause.message : "The bookmark could not be removed.");
      }
    },
    [user],
  );

  const saveReadingPosition = useCallback(
    (surahNumber: number, verseNumber: number) => {
      if (!user || !isValidReference(surahNumber, verseNumber)) return;
      const current = lastReadRef.current;
      if (
        current &&
        current.surahNumber === surahNumber &&
        current.verseNumber === verseNumber
      ) {
        return;
      }
      const optimistic: LastRead = {
        surahNumber,
        verseNumber,
        updatedAt: new Date().toISOString(),
      };
      lastReadRef.current = optimistic;
      setLastRead(optimistic);
      writeQueue.current = writeQueue.current
        .then(async () => {
          await saveLastRead(user, surahNumber, verseNumber, optimistic.updatedAt);
        })
        .catch((cause: unknown) => {
          setError(
            cause instanceof Error ? cause.message : "The reading position could not be saved.",
          );
        });
    },
    [user],
  );

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      loaded,
      bookmarks,
      lastRead,
      error,
      isBookmarked,
      toggleBookmark,
      removeSavedBookmark,
      saveReadingPosition,
      refresh,
    }),
    [
      loaded,
      bookmarks,
      lastRead,
      error,
      isBookmarked,
      toggleBookmark,
      removeSavedBookmark,
      saveReadingPosition,
      refresh,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider");
  return value;
}
