// Synthesises the background music and small sound effects as WAV files (no samples, no copyright).
// node tools/make-audio.js → public/audio/music.wav, sfx-*.wav
const fs = require('fs');
const path = require('path');
const SR = 44100;
const out = path.join(__dirname, '..', 'public', 'audio');

function writeWav(file, L, R) {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(path.join(out, file), buf);
}
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

// ---------- music: 104 BPM, warm pad + soft pluck arpeggio + light beat, 38 s ----------
{
  const DUR = Number(process.env.DUR || 38), n = DUR * SR, L = new Float32Array(n), R = new Float32Array(n);
  const bpm = 104, beat = 60 / bpm, bar = beat * 4;
  // I – V – vi – IV in C major (bright, friendly)
  const chords = [[48, 55, 60, 64, 67], [43, 50, 55, 59, 62], [45, 52, 57, 60, 64], [41, 48, 53, 57, 60]];
  const add = (i, v, pan = 0) => { if (i >= 0 && i < n) { L[i] += v * (1 - pan) ; R[i] += v * (1 + pan); } };
  for (let b = 0; b * bar < DUR; b++) {
    const ch = chords[b % 4], t0 = b * bar;
    // pad: detuned saws softened (sum of few harmonics), slow attack/release
    for (const m of ch.slice(1)) {
      for (const det of [-0.08, 0.08]) {
        const f = mtof(m + det), s0 = Math.floor(t0 * SR), len = Math.floor(bar * SR * 1.1);
        for (let k = 0; k < len; k++) {
          const t = k / SR, env = Math.min(1, t / 0.6) * Math.min(1, (bar * 1.1 - t) / 0.5);
          const ph = 2 * Math.PI * f * t;
          const v = (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * 0.018 * env;
          add(s0 + k, v, det > 0 ? 0.25 : -0.25);
        }
      }
    }
    // bass on beats 1 and 3
    for (const bt of [0, 2]) {
      const f = mtof(ch[0] - 12), s0 = Math.floor((t0 + bt * beat) * SR), len = Math.floor(beat * 1.6 * SR);
      for (let k = 0; k < len; k++) { const t = k / SR; add(s0 + k, Math.sin(2 * Math.PI * f * t) * 0.12 * Math.exp(-t * 2.2) * Math.min(1, t / 0.01)); }
    }
    // pluck arpeggio in 8ths (starts after the hook, from bar 2)
    if (b >= 1) for (let e = 0; e < 8; e++) {
      const m = ch[[2, 3, 4, 3, 2, 3, 4, 3][e]] + 12, f = mtof(m), s0 = Math.floor((t0 + e * beat / 2) * SR), len = Math.floor(0.5 * SR);
      for (let k = 0; k < len; k++) { const t = k / SR; const v = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * 0.035 * Math.exp(-t * 7) * Math.min(1, t / 0.003); add(s0 + k, v, e % 2 ? 0.35 : -0.35); }
    }
    // soft kick on every beat + shaker on off-beats (from bar 2, stops for the end card tail)
    if (b >= 1 && t0 < DUR - 5) for (let q = 0; q < 4; q++) {
      const s0 = Math.floor((t0 + q * beat) * SR);
      for (let k = 0; k < 0.25 * SR; k++) { const t = k / SR; const f = 50 + 70 * Math.exp(-t * 30); add(s0 + k, Math.sin(2 * Math.PI * f * t) * 0.16 * Math.exp(-t * 14)); }
      const s1 = Math.floor((t0 + q * beat + beat / 2) * SR);
      let lp = 0;
      for (let k = 0; k < 0.07 * SR; k++) { const t = k / SR; const x = rnd(); const hp = x - lp; lp = x; add(s1 + k, hp * 0.025 * Math.exp(-t * 60), 0.2); }
    }
  }
  // gentle overall fade-out over the last 2.5 s
  for (let i = n - 2.5 * SR; i < n; i++) { const g = (n - i) / (2.5 * SR); L[i] *= g; R[i] *= g; }
  writeWav(process.env.MUSIC || 'music.wav', L, R);
}

// ---------- sound effects ----------
const fx = (name, dur, fn) => {
  const n = Math.floor(dur * SR), L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = fn(i / SR, i); L[i] = v; R[i] = v; }
  writeWav(`sfx-${name}.wav`, L, R);
};
let lp = 0;
fx('click', 0.08, (t) => { const x = rnd(); lp += (x - lp) * 0.35; return (lp * 0.6 + Math.sin(2 * Math.PI * 1800 * t) * 0.4) * Math.exp(-t * 90); });
fx('key', 0.1, (t) => { const x = rnd(); lp += (x - lp) * 0.2; return (lp * 0.7 + Math.sin(2 * Math.PI * 420 * t) * 0.5) * Math.exp(-t * 55); });
fx('pop', 0.18, (t) => Math.sin(2 * Math.PI * (500 + 700 * Math.exp(-t * 25)) * t) * Math.exp(-t * 22));
fx('ding', 0.9, (t) => (Math.sin(2 * Math.PI * 1318.5 * t) * 0.6 + Math.sin(2 * Math.PI * 1975.5 * t) * 0.3) * Math.exp(-t * 4.5) * Math.min(1, t / 0.004));
fx('unlock', 0.35, (t) => { const a = t < 0.12 ? Math.exp(-t * 60) : Math.exp(-(t - 0.12) * 40); const x = rnd(); lp += (x - lp) * 0.3; return (lp * 0.5 + Math.sin(2 * Math.PI * (t < 0.12 ? 900 : 1300) * t) * 0.5) * a; });
fx('whoosh', 0.75, (t) => { const x = rnd(); const c = 0.03 + 0.25 * Math.sin(Math.PI * t / 0.75); lp += (x - lp) * c; return lp * Math.sin(Math.PI * t / 0.75) ** 2 * 1.4; });
fx('type', 0.9, (t) => { const k = Math.floor(t / 0.09); const lt = t - k * 0.09; const x = rnd(); lp += (x - lp) * 0.25; return (lp * 0.7 + Math.sin(2 * Math.PI * 380 * lt) * 0.4) * Math.exp(-lt * 70) * 0.8; });
console.log('audio written to', out);
