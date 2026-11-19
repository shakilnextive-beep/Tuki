// ইজিং — references/animation.md-এর মাপা মান। নাম বদলালে সেখানেও বদলাও।
import {Easing} from 'remotion';

export const BEZ = {
  cardSlide: [0.05, -0.15, 0.21, 0.96], // মাপা: T1 লিস্ট কার্ড x
  rise: [0.33, 1, 0.68, 1],             // মাপা: M3 গ্লাস কার্ড y (easeOutCubic)
  fadeIn: [0.37, 0, 0.63, 1],           // মাপা: T1 কার্ড opacity (easeInOutSine)
  pop: [0.25, 0.1, 0.25, 1],            // মাপা: T1 বড় শব্দ পপ ("ease")
  ring: [0.65, 0, 0.35, 1],             // মাপা: M3 প্রোগ্রেস রিং (easeInOutCubic)
  drop: [0.52, 0.36, 0.33, 0.8],        // মাপা: M2 শিরোনাম শব্দ ড্রপের y (rmse 0.006)
  push: [0.4, 0, 0.6, 1],               // ধীর push-in (মাপা প্রায় লিনিয়ার; ডিফল্টে নরম দুই প্রান্ত)
  out: [0.16, 1, 0.3, 1],               // ডিফল্ট
  inOut: [0.83, 0, 0.17, 1],            // ডিফল্ট
  in: [0.7, 0, 0.84, 0],                // ডিফল্ট (এক্সিট)
} as const;

const b = (k: keyof typeof BEZ) => Easing.bezier(...(BEZ[k] as unknown as [number, number, number, number]));

export const E = {
  cardSlide: b('cardSlide'),
  rise: b('rise'),
  fadeIn: b('fadeIn'),
  pop: b('pop'),
  ring: b('ring'),
  drop: b('drop'),
  push: b('push'),
  out: b('out'),
  inOut: b('inOut'),
  in: b('in'),
  linear: (x: number) => x, // শুধু মাপা ব্যতিক্রমে (P1 কাউন্টার, T2 push) — অন্যথা নয়
};

// স্প্রিং (ডিফল্ট)। আমার মাপা ওভারশুট খুব কম (≤১%), তাই snappy/smooth পছন্দ।
export const SPRING = {
  snappy: {damping: 14, stiffness: 160, mass: 0.6},
  smooth: {damping: 20, stiffness: 90, mass: 1},
  bouncy: {damping: 11, stiffness: 170, mass: 0.7},
};
