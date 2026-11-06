import { readMuted } from "@/lib/mute-store";

/**
 * Sonidos sintetizados con Web Audio API.
 * No hay archivos de audio: nada que licenciar.
 */

type Tone = "sine" | "triangle" | "square";

const masters = new WeakMap<AudioContext, GainNode>();

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const holder = window as Window & { __tramoAudio?: AudioContext };
  if (holder.__tramoAudio) return holder.__tramoAudio;
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  holder.__tramoAudio = new Ctor();
  return holder.__tramoAudio;
}

function master(audio: AudioContext) {
  const existing = masters.get(audio);
  if (existing) return existing;
  const gain = audio.createGain();
  gain.gain.value = 0.42;
  gain.connect(audio.destination);
  masters.set(audio, gain);
  return gain;
}

export function unlockAudio() {
  const audio = getContext();
  if (audio && audio.state === "suspended") void audio.resume();
}

async function withAudio(play: (audio: AudioContext, dest: AudioNode, time: number) => void) {
  if (readMuted()) return;
  const audio = getContext();
  if (!audio) return;
  try {
    if (audio.state === "suspended") await audio.resume();
    if (readMuted() || audio.state !== "running") return;
    play(audio, master(audio), audio.currentTime);
  } catch {
    // Si el navegador bloquea el audio, el tablero sigue funcionando.
  }
}

function tone(
  audio: AudioContext,
  dest: AudioNode,
  time: number,
  frequency: number,
  duration: number,
  type: Tone,
  volume: number,
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + duration + 0.02);
}

function noiseClick(audio: AudioContext, dest: AudioNode, time: number, duration: number, volume: number, frequency: number) {
  const length = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    const fade = 1 - index / data.length;
    data[index] = (Math.random() * 2 - 1) * fade * fade;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, time);
  filter.Q.value = 0.8;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  source.start(time);
  source.stop(time + duration + 0.02);
}

/** Ficha que cae en el tapete. */
export function playChip() {
  void withAudio((audio, dest, time) => {
    noiseClick(audio, dest, time, 0.045, 0.55, 2800);
    noiseClick(audio, dest, time + 0.05, 0.04, 0.35, 1800);
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1680, time);
    osc.frequency.exponentialRampToValueAtTime(720, time + 0.14);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.18);
  });
}

/** Fanfarria corta al llegar a Respondió o Demo agendada. */
export function playJackpot() {
  void withAudio((audio, dest, time) => {
    noiseClick(audio, dest, time, 0.05, 0.4, 2400);
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      tone(audio, dest, time + index * 0.08, frequency, 0.2, "square", 0.09);
    });
    notes.forEach((frequency) => {
      tone(audio, dest, time + 0.36, frequency, 0.55, "triangle", 0.07);
    });
    tone(audio, dest, time + 0.36, 1568, 0.4, "sine", 0.05);
  });
}

/** Ficha que sale de la mesa. */
export function playRemove() {
  void withAudio((audio, dest, time) => {
    noiseClick(audio, dest, time, 0.06, 0.28, 900);
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.16);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.2, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.2);
  });
}
