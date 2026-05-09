type AmbientNodes = {
  noise: AudioBufferSourceNode;
  noiseFilter: BiquadFilterNode;
  noiseGain: GainNode;
  oscL: OscillatorNode;
  oscR: OscillatorNode;
  lfoL: OscillatorNode;
  lfoR: OscillatorNode;
  lfoLGain: GainNode;
  lfoRGain: GainNode;
  pannerL: StereoPannerNode;
  pannerR: StereoPannerNode;
  master: GainNode;
};

const STORAGE_KEY = "sfx.enabled";

const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
};

const loadEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const saveEnabled = (value: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    /* ignore */
  }
};

let ctx: AudioContext | null = null;
let masterOut: GainNode | null = null;
let ambient: AmbientNodes | null = null;
let enabled = loadEnabled();

const ensureContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  masterOut = ctx.createGain();
  masterOut.gain.value = 0.9;
  masterOut.connect(ctx.destination);
  return ctx;
};

const resume = async (c: AudioContext): Promise<void> => {
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      /* ignore */
    }
  }
};

const createNoiseBuffer = (c: AudioContext, color: "white" | "pink"): AudioBuffer => {
  const length = c.sampleRate * 2;
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  if (color === "white") {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
};

const playHover = (): void => {
  const c = ensureContext();
  if (!c || !masterOut) return;
  void resume(c);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(2200, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.06, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
  osc.connect(gain).connect(masterOut);
  osc.start(t);
  osc.stop(t + 0.08);
};

const playClick = (): void => {
  const c = ensureContext();
  if (!c || !masterOut) return;
  void resume(c);
  const t = c.currentTime;
  const sum = c.createGain();
  sum.gain.value = 1;
  sum.connect(masterOut);

  const oscA = c.createOscillator();
  const gainA = c.createGain();
  oscA.type = "square";
  oscA.frequency.setValueAtTime(800, t);
  gainA.gain.setValueAtTime(0, t);
  gainA.gain.linearRampToValueAtTime(0.1, t + 0.002);
  gainA.gain.exponentialRampToValueAtTime(0.0001, t + 0.092);
  oscA.connect(gainA).connect(sum);
  oscA.start(t);
  oscA.stop(t + 0.1);

  const oscB = c.createOscillator();
  const gainB = c.createGain();
  oscB.type = "sine";
  oscB.frequency.setValueAtTime(1200, t);
  gainB.gain.setValueAtTime(0, t);
  gainB.gain.linearRampToValueAtTime(0.07, t + 0.002);
  gainB.gain.exponentialRampToValueAtTime(0.0001, t + 0.092);
  oscB.connect(gainB).connect(sum);
  oscB.start(t);
  oscB.stop(t + 0.1);
};

const playSwitch = (): void => {
  const c = ensureContext();
  if (!c || !masterOut) return;
  void resume(c);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.18);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(gain).connect(masterOut);
  osc.start(t);
  osc.stop(t + 0.22);
};

const playPop = (): void => {
  const c = ensureContext();
  if (!c || !masterOut) return;
  void resume(c);
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = createNoiseBuffer(c, "white");
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2000;
  filter.Q.value = 8;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.05, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  src.connect(filter).connect(gain).connect(masterOut);
  src.start(t);
  src.stop(t + 0.06);
};

const startAmbient = (): void => {
  if (ambient) return;
  const c = ensureContext();
  if (!c || !masterOut) return;
  void resume(c);

  const master = c.createGain();
  master.gain.value = 0;
  master.connect(masterOut);

  const noise = c.createBufferSource();
  noise.buffer = createNoiseBuffer(c, "pink");
  noise.loop = true;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 400;
  const noiseGain = c.createGain();
  noiseGain.gain.value = 0.6;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);

  const pannerL = c.createStereoPanner();
  pannerL.pan.value = -0.7;
  const pannerR = c.createStereoPanner();
  pannerR.pan.value = 0.7;

  const oscL = c.createOscillator();
  oscL.type = "sine";
  oscL.frequency.value = 110;
  const oscR = c.createOscillator();
  oscR.type = "sine";
  oscR.frequency.value = 165;

  const lfoL = c.createOscillator();
  lfoL.type = "sine";
  lfoL.frequency.value = 0.1;
  const lfoLGain = c.createGain();
  lfoLGain.gain.value = 2;
  lfoL.connect(lfoLGain).connect(oscL.frequency);

  const lfoR = c.createOscillator();
  lfoR.type = "sine";
  lfoR.frequency.value = 0.13;
  const lfoRGain = c.createGain();
  lfoRGain.gain.value = 2;
  lfoR.connect(lfoRGain).connect(oscR.frequency);

  const oscLGain = c.createGain();
  oscLGain.gain.value = 0.4;
  const oscRGain = c.createGain();
  oscRGain.gain.value = 0.4;

  oscL.connect(oscLGain).connect(pannerL).connect(master);
  oscR.connect(oscRGain).connect(pannerR).connect(master);

  const t = c.currentTime;
  master.gain.setValueAtTime(0, t);
  master.gain.linearRampToValueAtTime(0.015, t + 1.2);

  noise.start();
  oscL.start();
  oscR.start();
  lfoL.start();
  lfoR.start();

  ambient = { noise, noiseFilter, noiseGain, oscL, oscR, lfoL, lfoR, lfoLGain, lfoRGain, pannerL, pannerR, master };
};

const stopAmbient = (): void => {
  if (!ambient || !ctx) return;
  const a = ambient;
  ambient = null;
  const t = ctx.currentTime;
  a.master.gain.cancelScheduledValues(t);
  a.master.gain.setValueAtTime(a.master.gain.value, t);
  a.master.gain.linearRampToValueAtTime(0.0001, t + 0.6);
  const stopAt = t + 0.7;
  try {
    a.noise.stop(stopAt);
    a.oscL.stop(stopAt);
    a.oscR.stop(stopAt);
    a.lfoL.stop(stopAt);
    a.lfoR.stop(stopAt);
  } catch {
    /* ignore */
  }
};

const dispatchToggle = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("sfx:toggle", { detail: { enabled } }));
};

const guard = (fn: () => void): (() => void) => () => {
  if (!enabled) return;
  fn();
};

export const sfx = {
  get enabled(): boolean {
    return enabled;
  },
  set enabled(value: boolean) {
    enabled = value;
    saveEnabled(value);
    if (!value) stopAmbient();
    dispatchToggle();
  },
  toggle(): void {
    enabled = !enabled;
    saveEnabled(enabled);
    if (!enabled) stopAmbient();
    dispatchToggle();
  },
  hover: guard(playHover),
  click: guard(playClick),
  switch: guard(playSwitch),
  pop: guard(playPop),
  startAmbient(): void {
    if (!enabled) return;
    startAmbient();
  },
  stopAmbient(): void {
    stopAmbient();
  },
};

if (typeof window !== "undefined") {
  (window as unknown as { sfx?: typeof sfx }).sfx = sfx;
}
