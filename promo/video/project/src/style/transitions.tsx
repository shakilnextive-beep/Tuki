// ট্রানজিশন (references/secondary.md §১)। ব্যবহার: <Transition from={<A/>} to={<B/>} at={কাটের ফ্রেম} /> নয় —
// প্রতিটা ট্রানজিশন একটা ওভারলে/র‍্যাপার: `progress` = ট্রানজিশনের লোকাল অগ্রগতি। সহজ ব্যবহারের জন্য <TransitionPair> আছে।
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha} from './theme';
import {f30, prog} from './motion';
import {E} from './easing';
import {useU} from './layout';

type Kind = 'shape' | 'diagonal' | 'iris' | 'donut' | 'flash' | 'spin' | 'leak' | 'whip' | 'mosaic' | 'blur' | 'scale' | 'fadeThrough' | 'mask';
// মাপা দৈর্ঘ্য (৩০fps ফ্রেম)
export const TRANSITION_FRAMES: Record<Kind, number> = {shape: 10, diagonal: 18, iris: 10, donut: 24, flash: 9, spin: 16, leak: 8, whip: 6, mosaic: 10, blur: 6, scale: 8, fadeThrough: 12, mask: 12};

// A থেকে B: at = মাঝখানের ফ্রেম (কাট বিন্দু)। A ও B দুটোই পুরো সময় রেন্ডার হয়; ট্রানজিশন শুধু মাঝে।
export const TransitionPair: React.FC<{kind: Kind; at: number; a: React.ReactNode; b: React.ReactNode; color?: string}> = ({kind, at, a, b, color}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const D = f30(TRANSITION_FRAMES[kind], fps);
  const start = at - Math.floor(D / 2);
  const p = prog(frame - start, D, E.inOut); // ০→১
  const showB = frame >= at;
  const fill = color || t.palette.light;
  const cover = (node: React.ReactNode) => <AbsoluteFill style={{pointerEvents: 'none'}}>{node}</AbsoluteFill>;
  const base = <AbsoluteFill>{showB ? b : a}</AbsoluteFill>;
  if (frame < start || frame > start + D) return base;

  switch (kind) {
    case 'shape': { // M4: বিশাল গোল-কোণা চারকোনা তির্যকভাবে ঝাঁপিয়ে ঢাকে
      const size = Math.max(W, H) * 1.6;
      const x = W * (1.1 - 1.6 * p), y = H * (1.1 - 1.6 * p);
      return <>{base}{cover(<div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size * 0.12, background: fill, transform: 'rotate(-12deg)', boxShadow: `0 0 ${u(4)}px ${alpha(t.palette.dark, 0.25)}`}} />)}</>;
    }
    case 'diagonal': { // M3: প্যারালেলোগ্রাম বাঁ→ডান, গ্রেডিয়েন্ট
      const x = -W * 0.6 + p * W * 2.2;
      return <>{base}{cover(<div style={{position: 'absolute', top: -H * 0.1, height: H * 1.2, left: x - W * 0.6, width: W * 0.9, transform: 'skewX(-15deg)', background: `linear-gradient(90deg, ${t.palette.accent}, ${t.palette.accent2 || t.palette.primary})`}} />)}</>;
    }
    case 'iris':
    case 'donut': { // M1 ডোনাট / P3 বৃত্ত: বড় হয়ে ঢাকে, মাঝখানে B দেখা যায়
      const R = Math.hypot(W, H) * 0.6 * p;
      const hole = kind === 'donut' ? Math.max(0, R * (p * 1.4 - 0.4)) : 0;
      return <>{base}{cover(<div style={{position: 'absolute', left: W / 2 - R, top: H / 2 - R, width: R * 2, height: R * 2, borderRadius: '50%', background: `radial-gradient(circle, transparent ${hole}px, ${fill} ${hole + 1}px)`, opacity: p > 0.9 ? (1 - p) * 10 : 1}} />)}</>;
    }
    case 'flash': // M1: সাদা ঝলক
      return <>{base}{cover(<AbsoluteFill style={{background: fill, opacity: Math.sin(Math.PI * p)}} />)}</>;
    case 'leak': // P3: কমলা/ম্যাজেন্টা আলো
      return <>{base}{cover(<AbsoluteFill style={{background: `radial-gradient(ellipse at ${20 + 60 * p}% 40%, ${alpha(t.palette.accent, 0.95)}, ${alpha(t.palette.accent2 || t.palette.primary, 0.6)} 40%, transparent 75%)`, mixBlendMode: 'screen', opacity: Math.sin(Math.PI * p)}} />)}</>;
    case 'spin': { // P3: ঘূর্ণন + ব্লার
      const ang = (p < 0.5 ? p : p - 1) * 70, bl = Math.sin(Math.PI * p) * 18;
      return <AbsoluteFill style={{transform: `rotate(${ang}deg) scale(${1 + Math.sin(Math.PI * p) * 0.3})`, filter: `blur(${bl}px)`}}>{showB ? b : a}</AbsoluteFill>;
    }
    case 'whip': { // P2: অনুভূমিক মোশন ব্লার
      const dx = (p < 0.5 ? -p : 1 - p) * W * 0.4, bl = Math.sin(Math.PI * p) * 30;
      return <AbsoluteFill style={{transform: `translateX(${dx}px)`, filter: `blur(${bl}px)`}}>{showB ? b : a}</AbsoluteFill>;
    }
    case 'blur': case 'scale': { // T1 ব্লার-ডিপ / স্কেল
      const k = Math.sin(Math.PI * p);
      return <AbsoluteFill style={{filter: `blur(${k * 20}px)`, transform: kind === 'scale' ? `scale(${1 + k * 0.1})` : undefined, opacity: 1 - k * 0.3}}>{showB ? b : a}</AbsoluteFill>;
    }
    case 'fadeThrough': {
      const k = Math.sin(Math.PI * p);
      return <>{base}{cover(<AbsoluteFill style={{background: color || t.palette.dark, opacity: k}} />)}</>;
    }
    case 'mosaic': { // T1: নানা সাইজের ব্লক তির্যক ধারায় খোলে (A→কালো→B, এখানে সরাসরি B)
      const cells = 12, cw = W / cells, rows = Math.ceil(H / cw);
      return (
        <>
          <AbsoluteFill>{a}</AbsoluteFill>
          <AbsoluteFill style={{clipPath: 'none'}}>
            {Array.from({length: cells * rows}).map((_, i) => {
              const cx = i % cells, cy = Math.floor(i / cells);
              const d = (cx / cells + cy / rows) / 2, r = ((i * 7919) % 13) / 13 * 0.25;
              const q = Math.max(0, Math.min(1, (p - d * 0.6 - r * 0.4) / 0.25));
              return q > 0 ? <div key={i} style={{position: 'absolute', left: cx * cw + (cw * (1 - q)) / 2, top: cy * cw + (cw * (1 - q)) / 2, width: cw * q, height: cw * q, overflow: 'hidden'}}><div style={{position: 'absolute', left: -(cx * cw + (cw * (1 - q)) / 2), top: -(cy * cw + (cw * (1 - q)) / 2), width: W, height: H}}>{b}</div></div> : null;
            })}
          </AbsoluteFill>
        </>
      );
    }
    case 'mask': { // P2 ধাঁচ: নরম কিনারার মাস্ক বাঁ→ডান
      return <><AbsoluteFill>{a}</AbsoluteFill><AbsoluteFill style={{WebkitMaskImage: `linear-gradient(100deg, black ${p * 120 - 20}%, transparent ${p * 120}%)`}}>{b}</AbsoluteFill></>;
    }
  }
  return base;
};
