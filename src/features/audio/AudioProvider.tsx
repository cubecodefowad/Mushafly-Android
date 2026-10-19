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
import { AppState } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioStatus,
} from "expo-audio";
import type { SurahMeta, Verse } from "../../types/quran";
import { useSettings } from "../settings/SettingsProvider";

export type AudioTrack = {
  surah: SurahMeta;
  verse: Verse;
  queue: Verse[];
};

type AudioContextValue = {
  current: AudioTrack | null;
  error: string | null;
  playing: boolean;
  loading: boolean;
  playVerse: (surah: SurahMeta, verse: Verse, queue: Verse[]) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  stop: () => void;
};

type AudioProgressValue = {
  status: AudioStatus;
  seek: (seconds: number) => Promise<void>;
};

const AudioContext = createContext<AudioContextValue | null>(null);
const AudioProgressContext = createContext<AudioProgressValue | null>(null);

function audioError(status: AudioStatus, local: string | null): string | null {
  if (local) return local;
  return status.error ?? null;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const player = useAudioPlayer(null, { updateInterval: 400 });
  const status = useAudioPlayerStatus(player);
  const [current, setCurrent] = useState<AudioTrack | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const currentRef = useRef<AudioTrack | null>(null);
  const currentTimeRef = useRef(0);
  const autoAdvanceRef = useRef(settings.autoAdvanceAudio);
  const playRef = useRef<(surah: SurahMeta, verse: Verse, queue: Verse[]) => void>(() => {});

  currentRef.current = current;
  currentTimeRef.current = status.currentTime;
  autoAdvanceRef.current = settings.autoAdvanceAudio;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: false,
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {
      // Playback still works with platform defaults if the session cannot be
      // configured; this is not fatal to reading.
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        // Background playback is intentionally not enabled, so the player is
        // paused rather than left running behind a foreground-service prompt.
        player.pause();
      }
    });
    return () => subscription.remove();
  }, [player]);

  const playVerse = useCallback(
    (surah: SurahMeta, verse: Verse, queue: Verse[]) => {
      if (!verse.audio) {
        setLocalError(
          verse.audioUnavailableReason ?? "The source has no recitation for this verse.",
        );
        return;
      }
      try {
        setLocalError(null);
        player.replace({ uri: verse.audio.url });
        player.play();
        setCurrent({ surah, verse, queue });
      } catch (cause) {
        setLocalError(
          cause instanceof Error ? cause.message : "The recitation could not be started.",
        );
      }
    },
    [player],
  );
  playRef.current = playVerse;

  const toggle = useCallback(() => {
    if (!currentRef.current) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, status.playing]);

  const seek = useCallback(
    async (seconds: number) => {
      if (!Number.isFinite(seconds)) return;
      try {
        await player.seekTo(Math.max(0, seconds));
      } catch {
        // Seeking is best-effort on streamed audio; the readout uses the native
        // player's position.
      }
    },
    [player],
  );

  const next = useCallback(() => {
    const track = currentRef.current;
    if (!track) return;
    const index = track.queue.findIndex((entry) => entry.number === track.verse.number);
    const candidate = index >= 0 ? track.queue[index + 1] : undefined;
    if (candidate?.audio) {
      playRef.current(track.surah, candidate, track.queue);
    }
  }, []);

  const previous = useCallback(() => {
    const track = currentRef.current;
    if (!track) return;
    if (currentTimeRef.current > 3) {
      void seek(0);
      return;
    }
    const index = track.queue.findIndex((entry) => entry.number === track.verse.number);
    const candidate = index > 0 ? track.queue[index - 1] : undefined;
    if (candidate?.audio) {
      playRef.current(track.surah, candidate, track.queue);
    } else {
      void seek(0);
    }
  }, [seek]);

  const stop = useCallback(() => {
    player.pause();
    void player.seekTo(0).catch(() => {});
    setCurrent(null);
    setLocalError(null);
  }, [player]);

  useEffect(() => {
    if (!status.didJustFinish) return;
    const track = currentRef.current;
    if (!track) return;
    if (!autoAdvanceRef.current) {
      player.pause();
      return;
    }
    const index = track.queue.findIndex((entry) => entry.number === track.verse.number);
    const candidate = index >= 0 ? track.queue[index + 1] : undefined;
    if (candidate?.audio) {
      playRef.current(track.surah, candidate, track.queue);
    } else {
      player.pause();
    }
  }, [status.didJustFinish, player]);

  const error = audioError(status, localError);
  const playing = Boolean(current) && status.playing;
  const loading = Boolean(current) && !status.isLoaded && !error;

  const state = useMemo<AudioContextValue>(
    () => ({
      current,
      error,
      playing,
      loading,
      playVerse,
      toggle,
      next,
      previous,
      stop,
    }),
    [current, error, playing, loading, playVerse, toggle, next, previous, stop],
  );

  const progress = useMemo<AudioProgressValue>(() => ({ status, seek }), [status, seek]);

  return (
    <AudioProgressContext.Provider value={progress}>
      <AudioContext.Provider value={state}>{children}</AudioContext.Provider>
    </AudioProgressContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const value = useContext(AudioContext);
  if (!value) throw new Error("useAudio must be used inside AudioProvider");
  return value;
}

export function useAudioProgress(): AudioProgressValue {
  const value = useContext(AudioProgressContext);
  if (!value) throw new Error("useAudioProgress must be used inside AudioProvider");
  return value;
}
