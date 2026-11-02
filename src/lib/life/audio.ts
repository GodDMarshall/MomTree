// An original, generative score for Life Unfolds, synthesised in the browser with the Web Audio API.
// Nothing is pre-recorded, so there is no licensing to manage. Sound is always off until the visitor
// turns it on; a "calm" mode removes the heartbeat and textures and keeps only soft harmony.

type Layer = "pad" | "piano" | "heart" | "micro" | "pulse" | "strings";

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

// One chord per chapter (MIDI notes), D major world with gentle colour changes.
const CHORDS: number[][] = [
  [50, 57, 62, 66, 69], // 1  D maj9-ish
  [47, 54, 59, 62, 66], // 2  B minor
  [43, 50, 55, 59, 62], // 3  G major 7
  [40, 47, 52, 55, 59], // 4  E minor 9
  [43, 50, 54, 59, 62], // 5  G maj7
  [45, 52, 57, 61, 64], // 6  A
  [50, 57, 62, 66, 69], // 7  D, home
];
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81]; // D major pentatonic, two octaves

// Layer weights per chapter (1–7), interpolated by scroll position.
const WEIGHTS: Record<Layer, number[]> = {
  pad: [0.55, 0.5, 0.38, 0.38, 0.42, 0.5, 0.55],
  piano: [0.8, 0.45, 0.28, 0.42, 0.35, 0.6, 0.9],
  heart: [0.55, 0, 0, 0, 0, 0.5, 0],
  micro: [0, 0.15, 0.75, 0.55, 0.2, 0, 0],
  pulse: [0, 0.2, 0.45, 0.4, 0.45, 0.1, 0],
  strings: [0, 0, 0, 0, 0.1, 0.6, 0.85],
};
const CHAPTER_STARTS = [0, 11, 26, 42.5, 62.5, 76.5, 88.5];

function chapterPosition(u: number) {
  let i = 0;
  while (i < CHAPTER_STARTS.length - 1 && u >= CHAPTER_STARTS[i + 1]) i++;
  const start = CHAPTER_STARTS[i];
  const end = CHAPTER_STARTS[i + 1] ?? 100;
  const t = Math.min(1, Math.max(0, (u - start) / (end - start)));
  return { i, t };
}

export class StoryAudio {
  private ac?: AudioContext;
  private master?: GainNode;
  private reverbSend?: GainNode;
  private layers = {} as Record<Layer, GainNode>;
  private padOsc: OscillatorNode[] = [];
  private stringOsc: OscillatorNode[] = [];
  private microFilter?: BiquadFilterNode;
  private timer?: number;
  private nextPiano = 0;
  private nextBeat = 0;
  private nextPing = 0;
  private chapter = 0;
  private u = 0;
  private volume = 0.6;
  private calm = false;
  private enabled = false;
  private resolved = false;
  private weights: Record<Layer, number> = { pad: 0, piano: 0, heart: 0, micro: 0, pulse: 0, strings: 0 };

  get isEnabled() {
    return this.enabled;
  }

  private build() {
    const ac = new AudioContext({ latencyHint: "playback" });
    this.ac = ac;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.4;
    this.master = ac.createGain();
    this.master.gain.value = 0;
    comp.connect(this.master).connect(ac.destination);

    // Reverb: a generated impulse response with a long, soft tail.
    const conv = ac.createConvolver();
    const len = Math.floor(ac.sampleRate * 3.6);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    conv.buffer = ir;
    this.reverbSend = ac.createGain();
    this.reverbSend.gain.value = 0.55;
    this.reverbSend.connect(conv).connect(comp);

    (Object.keys(WEIGHTS) as Layer[]).forEach((k) => {
      const g = ac.createGain();
      g.gain.value = 0;
      g.connect(comp);
      g.connect(this.reverbSend!);
      this.layers[k] = g;
    });

    // Pad: two slightly detuned voices per chord tone through a warm low-pass.
    const padLP = ac.createBiquadFilter();
    padLP.type = "lowpass";
    padLP.frequency.value = 900;
    padLP.Q.value = 0.4;
    padLP.connect(this.layers.pad);
    CHORDS[0].forEach((n, i) => {
      for (const det of [-6, 6]) {
        const o = ac.createOscillator();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = NOTE(n);
        o.detune.value = det;
        const g = ac.createGain();
        g.gain.value = i === 0 ? 0.16 : 0.07;
        o.connect(g).connect(padLP);
        o.start();
        this.padOsc.push(o);
      }
    });

    // Strings: detuned sawtooth voices, filtered soft.
    const strLP = ac.createBiquadFilter();
    strLP.type = "lowpass";
    strLP.frequency.value = 1300;
    strLP.Q.value = 0.6;
    strLP.connect(this.layers.strings);
    CHORDS[5].slice(1).forEach((n) => {
      for (const det of [-8, 0, 7]) {
        const o = ac.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = NOTE(n);
        o.detune.value = det;
        const g = ac.createGain();
        g.gain.value = 0.022;
        o.connect(g).connect(strLP);
        o.start();
        this.stringOsc.push(o);
      }
    });

    // Micro textures: band-passed noise drifting in pitch, like a quiet laboratory.
    const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const ns = ac.createBufferSource();
    ns.buffer = noise;
    ns.loop = true;
    this.microFilter = ac.createBiquadFilter();
    this.microFilter.type = "bandpass";
    this.microFilter.frequency.value = 1400;
    this.microFilter.Q.value = 9;
    const ng = ac.createGain();
    ng.gain.value = 0.05;
    ns.connect(this.microFilter).connect(ng).connect(this.layers.micro);
    ns.start();

    // Organic pulse: a low sine breathing slowly.
    const po = ac.createOscillator();
    po.frequency.value = 92;
    const pg = ac.createGain();
    pg.gain.value = 0;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.45;
    const lfoG = ac.createGain();
    lfoG.gain.value = 0.06;
    lfo.connect(lfoG).connect(pg.gain);
    po.connect(pg).connect(this.layers.pulse);
    po.start();
    lfo.start();

    document.addEventListener("visibilitychange", this.onVisibility);
  }

  async enable() {
    if (!this.ac) this.build();
    const ac = this.ac!;
    await ac.resume();
    this.enabled = true;
    this.master!.gain.cancelScheduledValues(ac.currentTime);
    this.master!.gain.setTargetAtTime(this.volume * 0.5, ac.currentTime, 0.8);
    this.applyWeights(true);
    if (!this.timer) this.timer = window.setInterval(this.schedule, 90);
  }

  disable() {
    this.enabled = false;
    const ac = this.ac;
    if (!ac || !this.master) return;
    this.master.gain.cancelScheduledValues(ac.currentTime);
    this.master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
    window.clearInterval(this.timer);
    this.timer = undefined;
    window.setTimeout(() => {
      if (!this.enabled) void ac.suspend();
    }, 1200);
  }

  /** Called when the story leaves or re-enters the screen: fades out without forgetting the choice. */
  setPresence(present: boolean) {
    const ac = this.ac;
    if (!ac || !this.master || !this.enabled) return;
    if (present) {
      void ac.resume();
      this.master.gain.setTargetAtTime(this.volume * 0.5, ac.currentTime, 0.6);
    } else {
      this.master.gain.setTargetAtTime(0, ac.currentTime, 0.4);
    }
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    const ac = this.ac;
    if (ac && this.master && this.enabled) this.master.gain.setTargetAtTime(this.volume * 0.5, ac.currentTime, 0.15);
  }

  setCalm(calm: boolean) {
    this.calm = calm;
    this.applyWeights();
  }

  setProgress(u: number) {
    this.u = u;
    const { i } = chapterPosition(u);
    if (i !== this.chapter) {
      this.chapter = i;
      this.retune(i);
    }
    this.applyWeights();
    if (!this.resolved && u >= 91 && this.enabled) {
      this.resolved = true;
      this.resolve();
    }
    if (u < 85) this.resolved = false;
  }

  dispose() {
    window.clearInterval(this.timer);
    document.removeEventListener("visibilitychange", this.onVisibility);
    void this.ac?.close();
  }

  // ---------------------------------------------------------------------------------------------
  private onVisibility = () => {
    if (!this.ac) return;
    if (document.hidden) void this.ac.suspend();
    else if (this.enabled) void this.ac.resume();
  };

  private applyWeights(immediate = false) {
    const ac = this.ac;
    if (!ac) return;
    const { i, t } = chapterPosition(this.u);
    const j = Math.min(6, i + 1);
    const blend = Math.max(0, (t - 0.8) / 0.2); // crossfade in the last fifth of each chapter
    (Object.keys(WEIGHTS) as Layer[]).forEach((k) => {
      let w = WEIGHTS[k][i] * (1 - blend) + WEIGHTS[k][j] * blend;
      if (this.calm && (k === "heart" || k === "pulse")) w = 0;
      if (this.calm && k === "micro") w *= 0.25;
      this.weights[k] = w;
      const level = k === "heart" ? w * 0.9 : w;
      this.layers[k].gain.setTargetAtTime(level, ac.currentTime, immediate ? 0.05 : 0.9);
    });
    if (this.microFilter) this.microFilter.frequency.setTargetAtTime(900 + Math.sin(this.u * 0.4) * 500 + 600, ac.currentTime, 1.2);
  }

  private retune(i: number) {
    const ac = this.ac;
    if (!ac) return;
    const chord = CHORDS[i];
    this.padOsc.forEach((o, k) => o.frequency.setTargetAtTime(NOTE(chord[Math.floor(k / 2)]), ac.currentTime, 1.4));
    const upper = chord.slice(1);
    this.stringOsc.forEach((o, k) => o.frequency.setTargetAtTime(NOTE(upper[Math.floor(k / 3)] ?? upper[0]), ac.currentTime, 1.8));
  }

  private schedule = () => {
    const ac = this.ac;
    if (!ac || !this.enabled) return;
    const now = ac.currentTime;
    const ahead = now + 0.2;

    // Piano: sparse, unhurried notes from the scale, denser when the layer is louder.
    if (this.weights.piano > 0.05 && this.nextPiano < ahead) {
      const t = Math.max(now + 0.02, this.nextPiano);
      const n = SCALE[Math.floor(Math.random() * SCALE.length)];
      this.pianoNote(t, n, 0.22 * this.weights.piano);
      if (Math.random() < 0.3) this.pianoNote(t + 0.12, n - 12, 0.12 * this.weights.piano);
      this.nextPiano = t + (3.4 - this.weights.piano * 2) * (0.7 + Math.random() * 0.6);
    }

    // Heartbeat: the mother's at rest in chapter 1; a faster, lighter rhythm in chapter 6.
    if (this.weights.heart > 0.05 && this.nextBeat < ahead) {
      const t = Math.max(now + 0.02, this.nextBeat);
      const fast = this.chapter >= 5;
      this.thump(t, fast ? 0.35 : 0.6, fast ? 92 : 58);
      this.thump(t + (fast ? 0.12 : 0.2), fast ? 0.22 : 0.42, fast ? 84 : 52);
      this.nextBeat = t + (fast ? 60 / 150 : 60 / 68);
    }

    // Glass-like pings in the microscopic chapters.
    if (!this.calm && this.weights.micro > 0.2 && this.nextPing < ahead) {
      const t = Math.max(now + 0.02, this.nextPing);
      this.ping(t, 1700 + Math.random() * 1900, 0.05 * this.weights.micro);
      this.nextPing = t + 0.9 + Math.random() * 2.2;
    }
  };

  private pianoNote(t: number, midi: number, amp: number) {
    const ac = this.ac!;
    const f = NOTE(midi);
    const env = ac.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(amp, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, t + 3.2);
    env.connect(this.layers.piano);
    [1, 2, 3].forEach((h, i) => {
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.value = f * h;
      o.detune.value = (Math.random() - 0.5) * 4;
      const g = ac.createGain();
      g.gain.value = [1, 0.28, 0.08][i];
      o.connect(g).connect(env);
      o.start(t);
      o.stop(t + 3.3);
    });
  }

  private thump(t: number, amp: number, freq: number) {
    const ac = this.ac!;
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.68, t + 0.12);
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 170;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.22);
    o.connect(lp).connect(g).connect(this.layers.heart);
    o.start(t);
    o.stop(t + 0.25);
  }

  private ping(t: number, freq: number, amp: number) {
    const ac = this.ac!;
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.6);
    o.connect(g).connect(this.reverbSend!);
    o.start(t);
    o.stop(t + 0.65);
  }

  /** The final resolution: a gentle rising arpeggio home to D, and the optional baby coo. */
  private resolve() {
    const ac = this.ac!;
    const t = ac.currentTime + 0.1;
    [62, 66, 69, 74, 78].forEach((n, i) => this.pianoNote(t + i * 0.38, n, 0.2));
    if (StoryAudio.cooUrl && !this.calm) void this.playSample(StoryAudio.cooUrl, t + 1.6, 0.35);
  }

  /**
   * A baby's coo cannot be convincingly synthesised. Set this to the path of a properly licensed
   * recording (for example "/audio/coo.mp3") to have it play softly at the end of the story.
   */
  static cooUrl: string | null = null;

  private async playSample(url: string, when: number, gain: number) {
    const ac = this.ac!;
    try {
      const buf = await ac.decodeAudioData(await (await fetch(url)).arrayBuffer());
      const src = ac.createBufferSource();
      src.buffer = buf;
      const g = ac.createGain();
      g.gain.value = gain;
      src.connect(g).connect(this.reverbSend!);
      g.connect(this.layers.strings);
      src.start(Math.max(when, ac.currentTime));
    } catch {
      /* the sample is optional */
    }
  }
}
