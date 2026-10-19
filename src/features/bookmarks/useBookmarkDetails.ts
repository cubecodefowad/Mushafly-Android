import { useEffect, useState } from "react";
import { useAppDatabase } from "../../data/AppDatabaseProvider";
import type { TranslationLanguage } from "../../types/quran";
import { getVersePreviews, type VersePreview } from "../quran/repository";
import { useLibrary } from "./LibraryProvider";

export function useBookmarkDetails(language: TranslationLanguage) {
  const { quran } = useAppDatabase();
  const { bookmarks, loaded } = useLibrary();
  const [details, setDetails] = useState<Map<string, VersePreview>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quran || !loaded) return;
    if (bookmarks.length === 0) {
      setDetails(new Map());
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getVersePreviews(quran, bookmarks, language)
      .then((map) => {
        if (!cancelled) {
          setDetails(map);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Bookmark previews could not be loaded.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [quran, bookmarks, loaded, language]);

  return { details, loading, error };
}
