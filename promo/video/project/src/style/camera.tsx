// মূল ভিডিওর জুম (references/secondary.md §৫)। শুধু ফুটেজ লেয়ারকে মোড়াও — কার্ড/লেখা/ক্যাপশন এর বাইরে রাখো।
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {f, prog} from './motion';
import {E} from './easing';

export type ZoomKey =
  | {kind: 'push'; at: number; to: number; dur: number}   // ধীর push-in: ৩–৮s, ১০৪–১০৬% (ডিফল্ট); P1 মাপা ~১০% ৪.৫s
  | {kind: 'punch'; at: number; to: number; dur: number}  // punch-in: ০.৫–১s, ১০৪–১০৮%
  | {kind: 'out'; at: number; dur: number}                // ১০০%-এ ফেরা (১০০%-এর নিচে নয়)
  | {kind: 'cut'; at: number; to: number};                // হার্ড-কাট punch-in (P1 মাপা ×১.২১), তাৎক্ষণিক

// keys = সময়ক্রমে; center = মুখের কেন্দ্র (% ফ্রেম); maxScale = উৎসের রেজোলিউশন সীমা (১০৮০p ~১.০৮, ৪K ~১.১৫)
export const CameraZoom: React.FC<{keys: ZoomKey[]; center?: {x: number; y: number}; maxScale?: number; children: React.ReactNode}> = ({keys, center = {x: 50, y: 40}, maxScale = 1.08, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let s = 1;
  for (const k of keys) {
    if (frame < k.at) break;
    if (k.kind === 'cut') { s = k.to; continue; }
    const from = s;
    const target = k.kind === 'out' ? 1 : k.to;
    // নরম ইজ দুই প্রান্তে, লিনিয়ার নয়, ওভারশুট নয়
    const p = prog(frame - k.at, f(k.dur, fps), k.kind === 'push' ? E.push : E.inOut);
    s = from + (target - from) * p;
  }
  s = Math.max(1, Math.min(maxScale, s));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${center.x}% ${center.y}%`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// সহায়ক: নিয়ম যাচাই — জুমের মাঝে ২–৩s ফাঁক, মুখ-প্রধান অংশে ৬–৮s-এর বেশি স্থির নয়
export const checkZoomPlan = (keys: ZoomKey[], fps: number, faceSegments: {start: number; end: number}[]) => {
  const issues: string[] = [];
  const ends = keys.map((k) => ({start: k.at, end: k.at + ('dur' in k ? f(k.dur, fps) : 0)}));
  for (let i = 1; i < ends.length; i++) if (ends[i].start - ends[i - 1].end < f(2, fps) && keys[i].kind !== 'out') issues.push(`জুম ${i}: আগের জুম শেষের ২s-এর মধ্যে`);
  for (const seg of faceSegments) {
    const inside = ends.filter((e) => e.start >= seg.start && e.start <= seg.end).map((e) => e.start).sort((a, b) => a - b);
    const pts = [seg.start, ...inside, seg.end];
    for (let i = 1; i < pts.length; i++) if (pts[i] - pts[i - 1] > f(8, fps)) issues.push(`ফ্রেম ${pts[i - 1]}–${pts[i]}: ৮s-এর বেশি স্থির`);
  }
  return issues;
};
