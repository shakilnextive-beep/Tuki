// লেআউট সহায়ক — সব মাপ ফ্রেমের শতাংশে (references/layouts.md)।
import {useVideoConfig} from 'remotion';

export type Aspect = '16:9' | '9:16' | '1:1' | '4:5' | 'other';
export const aspectOf = (W: number, H: number): Aspect => {
  const r = W / H;
  if (Math.abs(r - 16 / 9) < 0.03) return '16:9';
  if (Math.abs(r - 9 / 16) < 0.03) return '9:16';
  if (Math.abs(r - 1) < 0.03) return '1:1';
  if (Math.abs(r - 4 / 5) < 0.03) return '4:5';
  return 'other';
};

// u(p) = min(W,H)-এর p% × অনুপাত-গুণক (লেখা ও আইকনের সাইজ); w(p) = W-এর p%; h(p) = H-এর p%
// গুণক (আন্দাজ): উল্লম্ব ভিডিওতে লেখা প্রস্থের তুলনায় বড় — মাপা: T2/T5-এ T1(১:১)-এর চেয়ে ১.২–২.২×
export const U_SCALE: Record<Aspect, number> = {'16:9': 1, '1:1': 1, '4:5': 1.2, '9:16': 1.45, other: 1.2};
export const useU = () => {
  const {width: W, height: H} = useVideoConfig();
  const aspect = aspectOf(W, H);
  const m = Math.min(W, H) * U_SCALE[aspect];
  return {W, H, aspect, u: (p: number) => (m * p) / 100, w: (p: number) => (W * p) / 100, h: (p: number) => (H * p) / 100};
};

// সেফ জোন (H/W-এর %): ৯:১৬-এ মাঝের ৭৫% উল্লম্ব, ডানে ১০% রিল UI
export const SAFE: Record<Aspect, {top: number; bottom: number; left: number; right: number}> = {
  '9:16': {top: 12.5, bottom: 12.5, left: 5, right: 10},
  '4:5': {top: 6, bottom: 8, left: 5, right: 5},
  '1:1': {top: 5, bottom: 5, left: 5, right: 5},
  '16:9': {top: 5, bottom: 6, left: 5, right: 5},
  other: {top: 8, bottom: 8, left: 5, right: 5},
};

// মাপা ক্যাপশন অবস্থান (y %H) — layouts.md
export const CAPTION_Y: Record<Aspect, {small: number; big: number; box: number}> = {
  '9:16': {small: 74, big: 79, box: 60},
  '4:5': {small: 66, big: 71, box: 58},
  '1:1': {small: 71, big: 76, box: 70},
  '16:9': {small: 80, big: 84, box: 80},
  other: {small: 72, big: 77, box: 65},
};

// মুখ-বাক্স (শনাক্ত মুখ % এককে) থেকে বর্জিত এলাকা: প্রস্থে ×১.৬, উচ্চতায় ×১.৮
export type Box = {x: number; y: number; w: number; h: number}; // সব %, x/y = বাঁ-ওপর
export const faceKeepOut = (face: Box): Box => {
  const cx = face.x + face.w / 2, cy = face.y + face.h / 2, w = face.w * 1.6, h = face.h * 1.8;
  return {x: cx - w / 2, y: cy - h / 2, w, h};
};
export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// লেআউট প্রিসেট (layouts.md L1–L8), প্রতিটা অনুপাতে এলাকা (%)
export const LAYOUT = {
  splitDocFace: { // L5/L6 (P3)
    '16:9': {doc: {x: 3, y: 2, w: 36, h: 93}, face: {x: 55, y: 12, w: 40, h: 76}},
    '9:16': {doc: {x: 8, y: 12, w: 84, h: 40}, face: {x: 15, y: 55, w: 70, h: 32}},
  },
  mockupSide: { // L7 (M1/M4)
    '16:9': {device: {x: 62, y: 3, w: 24, h: 92}, text: {x: 5, y: 15, w: 50, h: 70}},
    '9:16': {device: {x: 20, y: 40, w: 60, h: 48}, text: {x: 8, y: 13, w: 84, h: 25}},
  },
  overHead: { // L2 (T2): মাথার ওপরের এলাকা
    '9:16': {area: {x: 5, y: 8, w: 90, h: 20}},
    '16:9': {area: {x: 5, y: 6, w: 90, h: 18}},
  },
} as const;
