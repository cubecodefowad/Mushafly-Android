import {
  AUDIO_TIMEOUT_MESSAGE,
  OFFLINE_AUDIO_MESSAGE,
  canStreamAudio,
} from "../../src/features/audio/connectivity";

describe("recitation connectivity", () => {
  it("treats a disconnected device as offline", () => {
    expect(canStreamAudio({ isConnected: false, isInternetReachable: false })).toBe(false);
    expect(canStreamAudio({ isConnected: false, isInternetReachable: null })).toBe(false);
  });

  it("treats an unreachable network as offline", () => {
    expect(canStreamAudio({ isConnected: true, isInternetReachable: false })).toBe(false);
  });

  it("allows a play attempt when reachability is unknown", () => {
    expect(canStreamAudio({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(canStreamAudio({ isConnected: null, isInternetReachable: null })).toBe(true);
    expect(canStreamAudio(null)).toBe(true);
  });

  it("always explains the failure rather than leaving a spinner", () => {
    expect(OFFLINE_AUDIO_MESSAGE).toMatch(/offline/i);
    expect(OFFLINE_AUDIO_MESSAGE).toMatch(/internet connection/i);
    expect(AUDIO_TIMEOUT_MESSAGE).toMatch(/did not start/i);
    expect(AUDIO_TIMEOUT_MESSAGE).toMatch(/check your connection/i);
  });
});
