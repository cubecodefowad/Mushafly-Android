import type { Href } from "expo-router";
import type { SurahMeta } from "../types/quran";

export function surahHref(surahNumber: number, verseNumber?: number): Href {
  return {
    pathname: "/surah/[number]",
    params: {
      number: String(surahNumber),
      ...(verseNumber !== undefined ? { verse: String(verseNumber) } : {}),
    },
  } as Href;
}

export function referenceKey(surahNumber: number, verseNumber: number): string {
  return `${surahNumber}:${verseNumber}`;
}

export function surahLabel(meta: SurahMeta): string {
  return `${meta.name} · ${meta.number}`;
}

export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remaining = whole % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatCount(value: number): string {
  return value.toLocaleString();
}
