// টেক্সট অ্যানিমেশন। সব সময় লোকাল ফ্রেমে (Sequence-এর ভেতরে useCurrentFrame)।
// বাংলা অক্ষর ভাগ: Intl.Segmenter (grapheme) — যুক্তাক্ষর/কার-চিহ্ন ভাঙবে না।
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha, grad, bodyFont, keyFont, Rich, fontStack} from './theme';
import {enter, exit, f30, prog} from './motion';
import {E} from './easing';
import {useU} from './layout';

export type TimedWord = {text: string; at: number; key?: boolean}; // at = ফ্রেম (transcript-এর শব্দ শুরুর সময়)

export const graphemes = (s: string): string[] => {
  const Seg = (Intl as any).Segmenter;
  return Seg ? Array.from(new Seg('bn', {granularity: 'grapheme'}).segment(s), (x: any) => x.segment) : Array.from(s);
};

const fam = (t: any, _s?: string) => fontStack(t);

// --- word-by-word (+ কীওয়ার্ড বক্স) — M4/M2/M1 মাপা; mode 'blur' = স্তর খ ডিফল্ট
export const WordByWord: React.FC<{
  words: TimedWord[]; size?: number; mode?: 'fade' | 'drop' | 'blur'; keyStyle?: 'box' | 'color' | 'gradient';
  align?: 'left' | 'center'; color?: string; weight?: 'heavy' | 'regular'; maxWidth?: number; exitAt?: number;
}> = ({words, size = 5, mode = 'fade', keyStyle = 'box', align = 'left', color, weight = 'regular', maxWidth = 90, exitAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const ex = exitAt !== undefined && frame >= exitAt ? exit.fade(frame - exitAt, fps, 6) : null;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: `${u(size * 0.12)}px ${u(size * 0.28)}px`, maxWidth: `${maxWidth}%`, opacity: ex ? ex.opacity : 1, filter: ex?.filter}}>
      {words.map((w, i) => {
        const lt = frame - w.at;
        if (lt < 0) return <span key={i} style={{opacity: 0, fontSize: u(size), ...(w.key ? keyFont(t) : bodyFont(t))}}>{w.text}</span>;
        const m = mode === 'drop' ? enter.wordDrop(lt, fps, H) : mode === 'blur' ? enter.wordBlur(lt, fps, H) : enter.wordFade(lt, fps);
        const boxP = w.key && keyStyle === 'box' ? prog(lt - f30(3, fps), f30(5, fps), E.cardSlide) : 0; // বক্স শব্দের ৩ ফ্রেম পরে, ৫ ফ্রেমে
        const keyColor = w.key && keyStyle === 'color' ? t.palette.accent : undefined;
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', ...m, fontSize: u(size), lineHeight: 1.25, ...(w.key || weight === 'heavy' ? keyFont(t) : bodyFont(t)), color: w.key && keyStyle === 'box' ? t.palette.textOnAccent : keyColor || color || t.palette.text, padding: w.key && keyStyle === 'box' ? `0 ${u(size * 0.12)}px` : undefined}}>
            {w.key && keyStyle === 'box' && (
              <span style={{position: 'absolute', inset: `${-u(size * 0.02)}px 0`, background: t.palette.accent, borderRadius: u(size * 0.12), transformOrigin: 'left center', transform: `scaleX(${boxP})`, zIndex: -1}} />
            )}
            {w.key && keyStyle === 'gradient'
              ? <span style={{background: grad(t, 180), WebkitBackgroundClip: 'text', color: 'transparent'}}>{w.text}</span>
              : w.text}
          </span>
        );
      })}
    </div>
  );
};

// --- বড় একক kinetic শব্দ (T3 "কিন্তু", T2 বড় সংখ্যা) / sequence (স্তর খ kinetic typography)
export const KineticWord: React.FC<{text: string; at?: number; size?: number; variant?: 'accent' | 'numeral' | 'light'; letters?: boolean; exitAt?: number}> = ({text, at = 0, size = 18, variant = 'accent', letters = true, exitAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const lt = frame - at;
  if (lt < 0) return null;
  const ex = exitAt !== undefined && frame >= exitAt ? exit.word(frame - exitAt, fps) : null;
  const color = variant === 'light' ? t.palette.light : t.palette.accent;
  const glow = variant === 'numeral' ? `0 0 ${u(2)}px ${alpha(t.palette.accent, 0.8)}, 0 0 ${u(5)}px ${alpha(t.palette.accent, 0.5)}` : `0 ${u(0.5)}px 0 ${alpha(t.palette.dark, 0.55)}, 0 ${u(1)}px ${u(2.5)}px ${alpha(t.palette.dark, 0.6)}` /* T3 মাপা: গাঢ় নিচের কিনারা-ছায়া */;
  const g = graphemes(text);
  return (
    <div style={{...keyFont(t), fontSize: u(size), lineHeight: 1.1, color, textShadow: glow, whiteSpace: 'nowrap', ...(ex || {})}}>
      {letters
        ? g.map((c, i) => <span key={i} style={{display: 'inline-block', ...enter.wordPop(lt - i * f30(2, fps), fps, H)}}>{c}</span>)
        : <span style={{display: 'inline-block', ...enter.wordPop(lt, fps, H)}}>{text}</span>}
    </div>
  );
};

// --- টাইপরাইটার (M2/M3 টার্মিনাল, M4 URL): cps = অক্ষর/সেকেন্ড (মাপা ~৩০–৬০)
export const Typewriter: React.FC<{text: string; at?: number; cps?: number; size?: number; mono?: boolean; color?: string; cursor?: boolean}> = ({text, at = 0, cps = 40, size = 3, mono = false, color, cursor = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const g = graphemes(text);
  const n = Math.max(0, Math.min(g.length, Math.floor(((frame - at) / fps) * cps)));
  const blink = Math.floor(frame / (fps * 0.5)) % 2 === 0;
  return (
    <span style={{fontFamily: mono ? 'monospace' : fam(t, text), fontSize: u(size), color: color || t.palette.text, fontWeight: t.fonts.regular, whiteSpace: 'pre-wrap'}}>
      {g.slice(0, n).join('')}
      {cursor && <span style={{opacity: blink || n < g.length ? 1 : 0, color: t.palette.accent}}>|</span>}
    </span>
  );
};

// --- letter-by-letter (T4 মাপা: ~১ ফ্রেম/অক্ষর, প্রতিটা ২–৩ ফ্রেমে ফেড+স্কেল)
export const LetterReveal: React.FC<{text: string; at?: number; size?: number; color?: string; perChar?: number; heavy?: boolean}> = ({text, at = 0, size = 8, color, perChar = 1, heavy = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  return (
    <div style={{...(heavy ? keyFont(t) : bodyFont(t)), fontSize: u(size), color: color || t.palette.text, lineHeight: 1.05, whiteSpace: 'nowrap'}}>
      {graphemes(text).map((c, i) => {
        const p = prog(frame - at - i * f30(perChar, fps), f30(3, fps), E.out);
        return <span key={i} style={{display: 'inline-block', opacity: p, transform: `scale(${0.6 + 0.4 * p})`}}>{c === ' ' ? ' ' : c}</span>;
      })}
    </div>
  );
};

// --- line/mask reveal (স্তর খ): লাইন মাস্কের নিচ থেকে ওঠে, ১০ ফ্রেম, লাইন ৪ ফ্রেম পরপর
export const MaskReveal: React.FC<{lines: string[]; at?: number; size?: number; color?: string}> = ({lines, at = 0, size = 6, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  return (
    <div>
      {lines.map((l, i) => {
        const p = prog(frame - at - i * f30(4, fps), f30(10, fps), E.rise);
        return (
          <div key={i} style={{overflow: 'hidden', paddingBottom: u(size * 0.15)}}>
            <div style={{transform: `translateY(${(1 - p) * 110}%)`, ...bodyFont(t), fontSize: u(size), lineHeight: 1.2, color: color || t.palette.text}}><Rich text={l} /></div>
          </div>
        );
      })}
    </div>
  );
};

// --- কীওয়ার্ড বক্স / মার্কার (একক শব্দে), M4 মাপা
export const KeywordBox: React.FC<{text: string; at?: number; size?: number; variant?: 'box' | 'marker'}> = ({text, at = 0, size = 5, variant = 'box'}) => (
  <WordByWord words={[{text, at, key: true}]} size={size} keyStyle={variant === 'box' ? 'box' : 'box'} />
);

// --- animated underline / সোয়াশ (M4 ৬৯.৯s, P2): ৬–৮ ফ্রেম
export const AnimatedUnderline: React.FC<{at?: number; width?: number; thickness?: number; swoosh?: boolean; children: React.ReactNode}> = ({at = 0, width = 100, thickness = 0.6, swoosh = false, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const p = prog(frame - at, f30(8, fps), E.rise);
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      {children}
      <svg style={{position: 'absolute', left: 0, bottom: -u(thickness * 1.5), width: `${width}%`, height: u(thickness * 4), overflow: 'visible'}} viewBox="0 0 100 10" preserveAspectRatio="none">
        <path d={swoosh ? 'M0,8 Q50,0 100,4' : 'M0,5 L100,5'} stroke={t.palette.accent} strokeWidth={thickness * 4} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
};

// --- text scale pop (স্তর খ): স্কেল ০.৮→১, ৬ ফ্রেম
export const ScalePop: React.FC<{at?: number; children: React.ReactNode}> = ({at = 0, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = prog(frame - at, f30(6, fps), E.out);
  return <div style={{opacity: p, transform: `scale(${0.8 + 0.2 * p})`}}>{children}</div>;
};

// --- slide-up reveal (স্তর খ): y ৩%H→০, ৯ ফ্রেম
export const SlideUpReveal: React.FC<{at?: number; children: React.ReactNode}> = ({at = 0, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {H} = useU();
  const p = prog(frame - at, f30(9, fps), E.rise);
  return <div style={{opacity: p, transform: `translateY(${(1 - p) * 0.03 * H}px)`}}>{children}</div>;
};

// --- স্ট্রাইকথ্রু (M3 চিপ, M2 দাম): লাইন ৬ ফ্রেম বাঁ→ডান
export const Strike: React.FC<{at?: number; color?: string; children: React.ReactNode}> = ({at = 0, color, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const p = prog(frame - at, f30(6, fps), E.cardSlide);
  return (
    <span style={{position: 'relative', display: 'inline-block', opacity: interpolate(p, [0, 1], [1, 0.6])}}>
      {children}
      <span style={{position: 'absolute', left: '-4%', top: '52%', height: '0.12em', width: '108%', background: color || t.palette.negative || t.palette.accent, transformOrigin: 'left', transform: `scaleX(${p})`, borderRadius: 4}} />
    </span>
  );
};

// --- glitch/scramble (স্তর খ, শুধু টেক-বিষয়ে): ১২ ফ্রেমে বাঁ থেকে স্থির
export const Scramble: React.FC<{text: string; at?: number; size?: number; frames30?: number}> = ({text, at = 0, size = 5, frames30 = 12}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const g = graphemes(text);
  const pool = /[ঀ-৿]/.test(text) ? 'কখগঘচছজঝটঠডঢতথদধনপফবভমযরলশসহ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&';
  const p = prog(frame - at, f30(frames30, fps), E.out);
  const fixed = Math.floor(p * g.length);
  const out = g.map((c, i) => (i < fixed || c === ' ' ? c : pool[(i * 7 + frame * 3) % pool.length])).join('');
  return <span style={{...keyFont(t), fontSize: u(size), color: t.palette.text, opacity: frame < at ? 0 : 1}}>{out}</span>;
};
