// ব্যাকড্রপ (references/motion-scenes.md)। সব রঙ থিম থেকে; গতি ধীর (২০–৪০s পর্যায়)।
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, OffthreadVideo} from 'remotion';
import {useTheme, alpha, fontStack} from './theme';
import {graphemes} from './text';

// গাঢ় + ঝাপসা আলোর দাগ (M2/M3), ঐচ্ছিক গ্রিড
export const DarkGlow: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const k = (frame / fps) * ((2 * Math.PI) / 30);
  return (
    <AbsoluteFill style={{background: t.palette.dark, overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: '70%', height: '90%', left: `${-10 + 6 * Math.sin(k)}%`, top: `${-30 + 5 * Math.cos(k)}%`, background: `radial-gradient(circle, ${alpha(t.palette.primary, 0.55)}, transparent 65%)`, filter: 'blur(40px)'}} />
      <div style={{position: 'absolute', width: '60%', height: '80%', right: `${-15 + 5 * Math.cos(k)}%`, bottom: `${-30 + 6 * Math.sin(k)}%`, background: `radial-gradient(circle, ${alpha(t.palette.accent, 0.28)}, transparent 65%)`, filter: 'blur(50px)'}} />
      {grid && <AbsoluteFill style={{backgroundImage: `linear-gradient(${alpha(t.palette.light, 0.04)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(t.palette.light, 0.04)} 1px, transparent 1px)`, backgroundSize: '5% 8.9%'}} />}
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

// উজ্জ্বল গ্রেডিয়েন্ট (M1 streaks / M4 shapes / P3 light)
export const Gradient: React.FC<{variant?: 'streaks' | 'shapes' | 'light'; angle?: number}> = ({variant = 'streaks', angle = 120}) => {
  const frame = useCurrentFrame();
  const {fps, width: W} = useVideoConfig();
  const t = useTheme();
  const s = frame / fps;
  if (variant === 'light') return <AbsoluteFill style={{background: `linear-gradient(${angle}deg, ${t.palette.light}, ${alpha(t.palette.accent, 0.35)})`}} />;
  return (
    <AbsoluteFill style={{background: `linear-gradient(${angle + Math.sin(s / 6) * 6}deg, ${t.palette.primary}, ${t.palette.accent2 || t.palette.accent})`, overflow: 'hidden'}}>
      {variant === 'streaks' && [0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: '-20%', top: `${20 + i * 22}%`, width: '140%', height: '30%', borderRadius: '50%', border: `${2 + i}px solid ${alpha(t.palette.light, 0.18 - i * 0.04)}`, transform: `rotate(${-18 + i * 6 + Math.sin(s / 5 + i) * 3}deg)`, filter: 'blur(1px)'}} />
      ))}
      {variant === 'shapes' && [0, 1, 2, 3].map((i) => (
        <div key={i} style={{position: 'absolute', left: `${(i * 31 + s * 2) % 110 - 10}%`, top: `${(i * 23) % 80}%`, width: W * 0.12, height: W * 0.12, borderRadius: W * 0.03, border: `2px solid ${alpha(t.palette.light, 0.1)}`, transform: `rotate(${i * 20 + s * 4}deg)`}} />
      ))}
      <Vignette strength={0.25} />
    </AbsoluteFill>
  );
};

// কাগজ/বেইজ (T1)
export const Paper: React.FC = () => {
  const t = useTheme();
  return (
    <AbsoluteFill style={{background: t.palette.light}}>
      <Grain amount={0.05} />
      <Vignette strength={0.35} />
    </AbsoluteFill>
  );
};

// বেগুনি কাইনেটিক অক্ষর (P3 ৬৮–১৮৫s)
export const KineticLetters: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const g = graphemes(text);
  return (
    <AbsoluteFill style={{background: t.palette.dark, overflow: 'hidden'}}>
      {[0, 1, 2].map((row) => (
        <div key={row} style={{position: 'absolute', top: `${row * 34 - 5}%`, left: `${-((frame / fps) * (6 + row * 2)) % 50 - 10}%`, whiteSpace: 'nowrap', fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: '28vmin', color: alpha(t.palette.primary, 0.22), transform: 'rotate(-8deg)'}}>{(g.join('') + ' ').repeat(4)}</div>
      ))}
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

// ফুটেজ ঝাপসা + প্রধান রঙে গ্রেড (রঙের নিয়ম ৪, ডিফল্ট)
export const BlurredFootage: React.FC<{src: string; startFrom?: number; grade?: number}> = ({src, startFrom = 0, grade = 0.65}) => {
  const t = useTheme();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: 'blur(36px)', transform: 'scale(1.15)'}}><OffthreadVideo src={src} startFrom={startFrom} muted /></AbsoluteFill>
      <AbsoluteFill style={{background: t.palette.primary, opacity: grade, mixBlendMode: 'multiply'}} />
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.4}) => {
  const t = useTheme();
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at center, transparent 55%, ${alpha(t.palette.dark, strength)} 100%)`, pointerEvents: 'none'}} />;
};

// সূক্ষ্ম গ্রেন (ডিফল্ট ২–৩%)
export const Grain: React.FC<{amount?: number}> = ({amount = 0.03}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: amount, pointerEvents: 'none', mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%"><filter id={`g${frame % 4}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 7} /></filter><rect width="100%" height="100%" filter={`url(#g${frame % 4})`} /></svg>
    </AbsoluteFill>
  );
};
