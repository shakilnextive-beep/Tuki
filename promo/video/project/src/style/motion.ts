// এন্ট্রান্স/এক্সিট/লুপ — সব ফ্রেম fps থেকে। মান references/animation.md থেকে।
import {interpolate} from 'remotion';
import {E} from './easing';

export const f = (seconds: number, fps: number) => Math.round(seconds * fps);
// ৩০fps-এ মাপা ফ্রেম → বর্তমান fps
export const f30 = (frames30: number, fps: number) => Math.max(1, Math.round((frames30 / 30) * fps));

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const prog = (t: number, dur: number, ease: (x: number) => number) => interpolate(t, [0, dur], [0, 1], {...clamp, easing: ease});

export type MotionStyle = {opacity: number; transform: string; filter?: string};
const st = (o: number, x = 0, y = 0, s = 1, blur = 0, unit: 'vw' | '%' = '%'): MotionStyle => ({
  opacity: o,
  transform: `translate(${x}${unit === 'vw' ? 'vw' : '%'}, ${y}%) scale(${s})`,
  filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
});

// t = এলিমেন্টের লোকাল ফ্রেম (ঢোকা শুরু = 0); W,H = ফ্রেমের px (দূরত্ব %W/%H থেকে px)
export const enter = {
  // T1 লিস্ট কার্ড: বাঁ থেকে ৫.৫%W, ১২ ফ্রেম, opacity ১৩ ফ্রেম, ব্লার→শার্প ১২ ফ্রেম
  cardSlideIn(t: number, fps: number, W: number) {
    const px = prog(t, f30(12, fps), E.cardSlide), po = prog(t, f30(13, fps), E.fadeIn), pb = prog(t, f30(12, fps), E.out);
    return {opacity: po, transform: `translateX(${(1 - px) * -0.055 * W}px)`, filter: pb < 1 ? `blur(${(1 - pb) * 10}px)` : undefined};
  },
  // M3 গ্লাস কার্ড: নিচ থেকে ৪.৪%H, ১৩ ফ্রেম, ব্লার ৬ ফ্রেম
  riseIn(t: number, fps: number, H: number) {
    const p = prog(t, f30(13, fps), E.rise), pb = prog(t, f30(6, fps), E.out);
    return {opacity: p, transform: `translateY(${(1 - p) * 0.044 * H}px)`, filter: pb < 1 ? `blur(${(1 - pb) * 8}px)` : undefined};
  },
  // M1 ফিচার কার্ড: স্কেল ১.৩→১ ৯ ফ্রেম + থিতু y ১.৪%H ৮ ফ্রেম (ঝলক আলাদা: transitions.FlashWhite)
  flashPop(t: number, fps: number, H: number) {
    const ps = prog(t, f30(9, fps), E.out), pd = prog(t - f30(9, fps), f30(8, fps), E.rise);
    return {opacity: Math.min(1, ps * 1.5), transform: `translateY(${(1 - pd) * 0.014 * H}px) scale(${1.3 - 0.3 * ps})`, filter: ps < 1 ? `brightness(${1 + (1 - ps) * 0.8})` : undefined};
  },
  // T2 আইকন/লোগো পপ: নিচ থেকে ৫%H, স্কেল ০.৯২→১, ১০ ফ্রেম (মাপা পরিসর ৪–১৬)
  iconPop(t: number, fps: number, H: number, frames30 = 10) {
    const p = prog(t, f30(frames30, fps), E.rise);
    return {opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 0.05 * H}px) scale(${0.92 + 0.08 * p})`};
  },
  // M2 শিরোনাম শব্দ ড্রপ (মাপা): ওপর থেকে ৫.৩%H, স্কেল ০.৫৬→১, ৯ ফ্রেম; y = E.drop, opacity/স্কেল = E.fadeIn
  wordDrop(t: number, fps: number, H: number) {
    const d = f30(9, fps), py = prog(t, d, E.drop), pa = prog(t, d, E.fadeIn);
    return {opacity: pa, transform: `translateY(${(py - 1) * 0.053 * H}px) scale(${0.56 + 0.44 * pa})`};
  },
  // T1 বড় কীওয়ার্ড পপ: ৫ ফ্রেম, স্কেল ১.০৮→১, y ০.৫%H, ব্লার
  wordPop(t: number, fps: number, H: number) {
    const p = prog(t, f30(5, fps), E.pop);
    return {opacity: p, transform: `translateY(${(1 - p) * 0.005 * H}px) scale(${1.08 - 0.08 * p})`, filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined};
  },
  // word-by-word শব্দ: ২ ফ্রেম ফেড (M4, T1 ছোট লাইন)
  wordFade(t: number, fps: number) {
    return {opacity: prog(t, f30(2, fps), E.fadeIn), transform: 'none'};
  },
  // ডিফল্ট: ব্লার-ইন শব্দ ৬ ফ্রেম, y ১%H
  wordBlur(t: number, fps: number, H: number) {
    const p = prog(t, f30(6, fps), E.rise);
    return {opacity: p, transform: `translateY(${(1 - p) * 0.01 * H}px)`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined};
  },
};

// এক্সিট — এন্ট্রান্সের চেয়ে দ্রুত। t = এক্সিট শুরু থেকে লোকাল ফ্রেম
export const exit = {
  fade(t: number, fps: number, frames30 = 5) {
    const p = prog(t, f30(frames30, fps), E.in);
    return {opacity: 1 - p, transform: 'none', filter: p > 0 ? `blur(${p * 6}px)` : undefined};
  },
  word(t: number, fps: number) { // T1 বড় শব্দ: ৩–৪ ফ্রেম ফেড + ব্লার + সামান্য প্রসারণ
    const p = prog(t, f30(4, fps), E.in);
    return {opacity: 1 - p, transform: `scale(${1 + 0.04 * p})`, filter: p > 0 ? `blur(${p * 8}px)` : undefined};
  },
  card(t: number, fps: number, W: number, dir = 1) { // ডিফল্ট ৭ ফ্রেম
    const p = prog(t, f30(7, fps), E.in);
    return {opacity: 1 - p, transform: `translateX(${p * 0.025 * W * dir}px)`};
  },
};

// নিশ্বাস-গতি: M3 মাপা — উজ্জ্বলতা ±১৫%, পর্যায় ~১.৬s, y ±০.৪%H
export const breathe = (frame: number, fps: number, H: number, period = 1.6, amp = 1) => {
  const ph = (2 * Math.PI * frame) / (period * fps);
  return {glow: 1 + 0.15 * amp * Math.sin(ph), dy: 0.004 * H * amp * Math.sin(ph + 1.2)};
};

// এন্ট্রান্স + hold + এক্সিট একসাথে: start/end লোকাল নয়, সিকোয়েন্সের ফ্রেম
export const lifecycle = (frame: number, start: number, end: number, enterFn: (t: number) => any, exitFn: (t: number) => any, exitFrames = 6) => {
  if (frame < start || frame >= end) return {opacity: 0, transform: 'none'};
  if (frame >= end - exitFrames) return exitFn(frame - (end - exitFrames));
  return enterFn(frame - start);
};
