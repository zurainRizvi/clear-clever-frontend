let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

function playTone(frequency: number, durationSec: number, volume: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().then(() => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + durationSec);
  }).catch(() => {
    // Audio blocked or unavailable — silent fallback
  });
}

/** Soft rising tone when mic starts listening. */
export function playMicStartTone() {
  playTone(880, 0.12, 0.08);
}

/** Soft falling tone when mic stops. */
export function playMicStopTone() {
  playTone(620, 0.14, 0.07);
}
