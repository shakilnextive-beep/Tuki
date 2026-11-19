// Tuki announcement: approved palette A (Light warm) + font choice. Only source of colours/fonts for this video.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Theme, EMPTY_THEME, useTheme, alpha, bodyFont, keyFont} from './style/theme';
import {FontGate} from './style/fonts';
import {E} from './style/easing';
import {prog, f30} from './style/motion';
import {useU} from './style/layout';

export const THEME: Theme = {
  ...EMPTY_THEME,
  palette: {
    primary: '#E8721C', // Tuki orange (logo)
    accent: '#B8460A', // keyword text, chips (5.0:1 on light)
    accent2: '#E8721C',
    dark: '#1B1D22',
    light: '#FBF6F1', // cards, panels
    text: '#1B1D22',
    textOnAccent: '#FBF6F1',
  },
  fonts: {bn: 'Li Ador Noirrit', en: 'Li Ador Noirrit', heavy: 700, regular: 400, keyword: 'bold'},
  mode: 'light',
  digits: 'bn',
};
export const NEUTRAL = '#EFE6DD'; // palette A neutral: backdrop

export const FONT_FILES = [
  {family: 'Li Ador Noirrit', weight: 400, file: 'fonts/Li Ador Noirrit Regular.ttf'},
  {family: 'Li Ador Noirrit', weight: 600, file: 'fonts/Li Ador Noirrit SemiBold.ttf'},
  {family: 'Li Ador Noirrit', weight: 700, file: 'fonts/Li Ador Noirrit Bold.ttf'},
];
export const Fonts: React.FC<{children: React.ReactNode}> = ({children}) => (
  <FontGate
    files={FONT_FILES}
    families={[{family: 'Li Ador Noirrit', weight: 400, script: 'bn'}, {family: 'Li Ador Noirrit', weight: 700, script: 'bn'}, {family: 'Li Ador Noirrit', weight: 400, script: 'latin'}]}
  >
    {children}
  </FontGate>
);

// Voice starts OFF seconds into the video. sec() turns a voice time into a video frame.
export const OFF = 0.4;
export const useSec = () => {
  const {fps} = useVideoConfig();
  return (s: number) => Math.round((s + OFF) * fps);
};

// Soft cream backdrop with two drifting orange lights and a faint dot grid (motion backdrop type (b), light theme).
export const Backdrop: React.FC<{strength?: number}> = ({strength = 1}) => {
  const frame = useCurrentFrame();
  const t = useTheme();
  const {W, H} = useU();
  const a = frame / 30;
  const blob = (x: number, y: number, r: number, o: number) => (
    <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(t.palette.primary, o)} 0%, transparent 68%)`}} />
  );
  return (
    <AbsoluteFill style={{background: NEUTRAL, overflow: 'hidden'}}>
      {blob(W * (0.12 + 0.03 * Math.sin(a * 0.4)), H * (0.08 + 0.04 * Math.cos(a * 0.3)), W * 0.38, 0.22 * strength)}
      {blob(W * (0.92 + 0.03 * Math.cos(a * 0.35)), H * (0.98 + 0.03 * Math.sin(a * 0.5)), W * 0.42, 0.18 * strength)}
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${alpha(t.palette.dark, 0.07)} 1.2px, transparent 1.4px)`, backgroundSize: `${W / 64}px ${W / 64}px`}} />
    </AbsoluteFill>
  );
};

// Orange full-screen backdrop for the reveal and end card.
export const OrangeBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useTheme();
  const {W, H} = useU();
  const a = frame / 30;
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${t.palette.primary} 0%, ${t.palette.accent} 100%)`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: W * (0.25 + 0.04 * Math.sin(a * 0.5)) - W * 0.35, top: -H * 0.3, width: W * 0.7, height: W * 0.7, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(t.palette.light, 0.22)} 0%, transparent 65%)`}} />
    </AbsoluteFill>
  );
};

// A scene lives between start and end (frames). It fades in from blur and dissolves out through blur (transition: blur).
export const Scene: React.FC<{start: number; end: number; children: React.ReactNode; enterBlur?: boolean; exitBlur?: boolean}> = ({start, end, children, enterBlur = true, exitBlur = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= end) return null;
  const D = f30(7, fps);
  const pin = enterBlur ? prog(frame - start, D, E.out) : 1;
  const pout = exitBlur ? prog(frame - (end - D), D, E.in) : 0;
  const k = Math.max(1 - pin, pout);
  return <AbsoluteFill style={{opacity: 1 - (exitBlur ? pout : 0) * 0.9, filter: k > 0.01 ? `blur(${k * 24}px)` : undefined, transform: `scale(${1 + pout * 0.04})`}}>{children}</AbsoluteFill>;
};

// Shape wipe: an orange circle grows from a point and reveals its children (used for the two big moments).
export const Iris: React.FC<{start: number; x?: number; y?: number; children: React.ReactNode}> = ({start, x = 50, y = 50, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = prog(frame - start, f30(12, fps), E.inOut);
  if (frame < start) return null;
  return <AbsoluteFill style={{clipPath: `circle(${p * 120}% at ${x}% ${y}%)`}}>{children}</AbsoluteFill>;
};

// Words that arrive one by one, each from blur (default "wordBlur"); keywords marked with **…**.
export type W = {t: string; at: number}; // at = voice seconds
export const BlurLine: React.FC<{words: W[]; size: number; color?: string; keyColor?: string; align?: 'center' | 'left'; exitAt?: number; gap?: number}> = ({words, size, color, keyColor, align = 'center', exitAt, gap = 0.28}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const sec = useSec();
  const ex = exitAt !== undefined ? prog(frame - sec(exitAt), f30(5, fps), E.in) : 0;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: u(size * gap), fontSize: u(size), lineHeight: 1.25, color: color || t.palette.text, opacity: 1 - ex, filter: ex > 0 ? `blur(${ex * 10}px)` : undefined}}>
      {words.map((w, i) => {
        const lt = frame - sec(w.at);
        const p = prog(lt, f30(7, fps), E.rise);
        const isKey = w.t.startsWith('**');
        const txt = isKey ? w.t.slice(2, -2) : w.t;
        return (
          <span key={i} style={{...(isKey ? keyFont(t) : bodyFont(t)), color: isKey ? keyColor || t.palette.accent : undefined, opacity: p, display: 'inline-block', transform: `translateY(${(1 - p) * 0.012 * H}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined}}>
            {txt}
          </span>
        );
      })}
    </div>
  );
};
// Split a sentence into words timed evenly from `at` with `step` seconds between them.
export const timed = (s: string, at: number, step = 0.16): W[] => s.split(' ').map((t, i) => ({t, at: at + i * step}));
