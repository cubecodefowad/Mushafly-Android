import { useCallback, useEffect, useState } from "react";
import { useAppDatabase } from "../../data/AppDatabaseProvider";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { SearchResult, TranslationLanguage } from "../../types/quran";
import { searchVerses } from "../quran/repository";

type SearchState = {
  results: SearchResult[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  activeQuery: string;
};

export function useSearch(query: string, language: TranslationLanguage) {
  const { quran } = useAppDatabase();
  const debounced = useDebouncedValue(query.trim(), 180);
  const [state, setState] = useState<SearchState>({
    results: [],
    status: "idle",
    error: null,
    activeQuery: "",
  });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!quran || debounced.length < 2) {
      setState({ results: [], status: "idle", error: null, activeQuery: debounced });
      return;
    }
    let cancelled = false;
    setState({
      results: [],
      status: "loading",
      error: null,
      activeQuery: debounced,
    });
    searchVerses(quran, debounced, language)
      .then((results) => {
        if (!cancelled) {
          setState({ results, status: "ready", error: null, activeQuery: debounced });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            results: [],
            status: "error",
            error: error instanceof Error ? error.message : "Search could not be completed.",
            activeQuery: debounced,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [quran, debounced, language, revision]);

  const retry = useCallback(() => setRevision((value) => value + 1), []);
  return { ...state, retry, debouncedQuery: debounced };
}
