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
import * as Network from "expo-network";
import type { SurahMeta, Verse } from "../../types/quran";
import { useSettings } from "../settings/SettingsProvider";
import {
  AUDIO_TIMEOUT_MESSAGE,
  OFFLINE_AUDIO_MESSAGE,
  canStreamAudio,
} from "./connectivity";
import { recitationUrl } from "./reciters";

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

const LOAD_TIMEOUT_MS = 12_000;

function audioError(status: AudioStatus, local: string | null): string | null {
  if (local) return local;
  if (status.error) {
    return "The recitation could not be played. Check your connection and try again.";
  }
  return null;
}

async function hasConnection(): Promise<boolean> {
  try {
    return canStreamAudio(await Network.getNetworkStateAsync());
  } catch {
    // If the network state itself cannot be read, let the player try; the
    // timeout produces an explicit error instead of an endless spinner.
    return true;
  }
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
  const reciterRef = useRef(settings.reciter);
  const playRef = useRef<(surah: SurahMeta, verse: Verse, queue: Verse[]) => void>(() => {});
  const requestRef = useRef(0);

  currentRef.current = current;
  currentTimeRef.current = status.currentTime;
  autoAdvanceRef.current = settings.autoAdvanceAudio;
  reciterRef.current = settings.reciter;

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
      const request = ++requestRef.current;
      const url = recitationUrl(
        reciterRef.current,
        surah.number,
        verse.number,
        verse.audio?.url ?? null,
      );

      if (!url) {
        setCurrent({ surah, verse, queue });
        setLocalError(
          verse.audioUnavailableReason ?? "The source has no recitation for this verse.",
        );
        return;
      }

      // Show the track immediately so any failure has somewhere to appear.
      setLocalError(null);
      setCurrent({ surah, verse, queue });

      void (async () => {
        if (!(await hasConnection())) {
          if (request !== requestRef.current) return;
          player.pause();
          setLocalError(OFFLINE_AUDIO_MESSAGE);
          return;
        }
        if (request !== requestRef.current) return;
        try {
          player.replace({ uri: url });
          player.play();
        } catch {
          if (request !== requestRef.current) return;
          player.pause();
          setLocalError(AUDIO_TIMEOUT_MESSAGE);
        }
      })();
    },
    [player],
  );
  playRef.current = playVerse;

  const toggle = useCallback(() => {
    const track = currentRef.current;
    if (!track) return;
    if (localError) {
      // Retrying from the play control re-checks the connection instead of
      // leaving the player spinning forever.
      playRef.current(track.surah, track.verse, track.queue);
      return;
    }
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [localError, player, status.playing]);

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
    requestRef.current++;
    player.pause();
    void player.seekTo(0).catch(() => {});
    setCurrent(null);
    setLocalError(null);
  }, [player]);

  // Switching reciter mid-verse would otherwise leave the old file playing
  // under the new name, so playback stops and waits for a new press. This
  // mirrors the website, where the audio element is unloaded on the change.
  const previousReciter = useRef(settings.reciter);
  useEffect(() => {
    if (previousReciter.current === settings.reciter) return;
    previousReciter.current = settings.reciter;
    stop();
  }, [settings.reciter, stop]);

  const error = audioError(status, localError);
  const loading = Boolean(current) && !status.isLoaded && !error;

  // A stream that never reports "loaded" or an error must not spin forever.
  useEffect(() => {
    if (!current || status.isLoaded || error) return;
    const timer = setTimeout(() => {
      setLocalError((existing) => existing ?? AUDIO_TIMEOUT_MESSAGE);
      player.pause();
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [current, error, player, status.isLoaded]);

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

  const playing = Boolean(current) && status.playing;

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
