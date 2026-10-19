import { useCallback, useEffect, useState } from "react";
import { useAppDatabase } from "../../data/AppDatabaseProvider";
import type { Surah, SurahMeta, TranslationLanguage } from "../../types/quran";
import {
  getVersePreview,
  getSurah,
  listSurahs,
  type VersePreview,
} from "./repository";

type AsyncState<T> =
  | { status: "idle" | "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: string };

const idle = { status: "idle" as const, data: null, error: null };

export function useSurahList() {
  const { quran, status: databaseStatus } = useAppDatabase();
  const [state, setState] = useState<AsyncState<SurahMeta[]>>(idle);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!quran) return;
    let cancelled = false;
    setState({ status: "loading", data: null, error: null });
    listSurahs(quran)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "The surah list could not be loaded.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [quran, revision]);

  const retry = useCallback(() => setRevision((value) => value + 1), []);
  return {
    ...state,
    loading: state.status === "loading" || state.status === "idle",
    databaseStatus,
    retry,
  };
}

export function useSurah(number: number) {
  const { quran } = useAppDatabase();
  const [state, setState] = useState<AsyncState<Surah>>(idle);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!quran || !Number.isInteger(number) || number < 1 || number > 114) return;
    let cancelled = false;
    setState({ status: "loading", data: null, error: null });
    getSurah(quran, number)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "The surah could not be loaded.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [quran, number, revision]);

  const retry = useCallback(() => setRevision((value) => value + 1), []);
  return { ...state, loading: state.status === "loading", retry };
}

export function useVersePreview(
  surahNumber: number | null,
  verseNumber: number | null,
  language: TranslationLanguage,
) {
  const { quran } = useAppDatabase();
  const [state, setState] = useState<AsyncState<VersePreview>>(idle);

  useEffect(() => {
    if (!quran || !surahNumber || !verseNumber) {
      setState(idle);
      return;
    }
    let cancelled = false;
    setState({ status: "loading", data: null, error: null });
    getVersePreview(quran, surahNumber, verseNumber, language)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setState({
            status: "error",
            data: null,
            error: `Verse ${surahNumber}:${verseNumber} is missing from the local data.`,
          });
          return;
        }
        setState({ status: "ready", data, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "The verse could not be loaded.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [quran, surahNumber, verseNumber, language]);

  return state;
}
