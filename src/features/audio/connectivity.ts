/**
 * Recitation is streamed, so a play request needs a connection. Android
 * sometimes reports `null` reachability while online, so only an explicit
 * negative counts as offline; a stream that still fails is caught by the load
 * timeout in AudioProvider.
 */
export type ConnectivityState = {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

export function canStreamAudio(state: ConnectivityState | null | undefined): boolean {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export const OFFLINE_AUDIO_MESSAGE =
  "You are offline. Recitation is streamed and needs an internet connection.";

export const AUDIO_TIMEOUT_MESSAGE =
  "The recitation did not start. Check your connection and try again.";
