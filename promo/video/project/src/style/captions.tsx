// ক্যাপশন — নিজের opacity প্রতি ফ্রেমে graphicWindows থেকে ঠিক করে (ক্যাপশন ও গ্রাফিক্সের নিয়ম)।
// স্টাইল: twoTier (T1/T2/T3), glassBox (T5), stacked (T4)। গ্রুপ = transcript-এর ১–৪ শব্দ, ০.৬–১.৫s।
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha, bodyFont, keyFont, fontStack} from './theme';
import {enter, exit, f30, prog} from './motion';
import {E} from './easing';
import {CAPTION_Y, useU} from './layout';
import {GraphicWindow, captionOpacity} from './graphicWindows';
import {graphemes} from './text';

export type CapWord = {text: string; start: number; end: number}; // ফ্রেম
export type CapGroup = {small: CapWord[]; big?: CapWord; start: number; end: number};

// transcript শব্দ → গ্রুপ (ভারী শব্দ = big)। heavy(): কোন শব্দ বড় হবে (সংখ্যা/নাম/ক্রিয়া) — কল করার সময় দাও
export const groupWords = (words: CapWord[], heavy: (w: string, i: number) => boolean, maxWords = 4, maxSec = 1.5, fps = 30): CapGroup[] => {
  const groups: CapGroup[] = [];
  let cur: CapWord[] = [];
  const flush = () => {
    if (!cur.length) return;
    const bi = cur.findIndex((w, i) => heavy(w.text, i));
    const big = bi >= 0 ? cur[bi] : undefined;
    groups.push({small: cur.filter((_, i) => i !== bi), big, start: cur[0].start, end: cur[cur.length - 1].end});
    cur = [];
  };
  for (const w of words) {
    cur.push(w);
    const dur = (w.end - cur[0].start) / fps;
    if (cur.length >= maxWords || dur >= maxSec || /[।?!,]$/.test(w.text)) flush();
  }
  flush();
  return groups;
};

const Group: React.FC<{g: CapGroup; style: 'twoTier' | 'glassBox' | 'stacked'}> = ({g, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H, aspect} = useU();
  const Y = CAPTION_Y[aspect];
  const exitStart = g.end - f30(4, fps);
  const ex = frame >= exitStart ? exit.word(frame - exitStart, fps) : null;
  const shadow = `0 ${u(0.3)}px ${u(1.2)}px ${alpha(t.palette.dark, 0.6)}`;
  if (style === 'glassBox') {
    const p = prog(frame - g.start, f30(5, fps), E.fadeIn); // T5 মাপা: বক্স ৪–৬ ফ্রেম, প্রথম শব্দের সাথে
    const words = [...g.small, ...(g.big ? [g.big] : [])].sort((a, b) => a.start - b.start);
    return (
      <div style={{position: 'absolute', left: '50%', top: `${Y.box}%`, transform: `translate(-50%,-50%) scale(${0.98 + 0.02 * p})`, opacity: p * (ex ? ex.opacity : 1), padding: `${u(1.6)}px ${u(3)}px`, borderRadius: u(2), background: alpha(t.palette.light, 0.12), border: `1px solid ${alpha(t.palette.light, 0.3)}`, backdropFilter: 'blur(12px)', maxWidth: '78%', textAlign: 'center'}}>
        {words.map((w, i) => (
          <span key={i} style={{...(w === g.big ? keyFont(t) : bodyFont(t)), fontSize: u(3.6), color: w === g.big ? t.palette.accent : t.palette.text, opacity: prog(frame - w.start, f30(3, fps), E.fadeIn), marginRight: u(1)}}>{w.text}</span>
        ))}
      </div>
    );
  }
  if (style === 'stacked') {
    const lines = [g.small.map((w) => w.text).join(' '), g.big?.text].filter(Boolean) as string[];
    return (
      <div style={{position: 'absolute', left: 0, right: 0, top: `${Y.small - 8}%`, textAlign: 'center', opacity: ex ? ex.opacity : 1}}>
        {lines.map((l, li) => (
          <div key={li} style={{...(li === lines.length - 1 ? keyFont(t) : bodyFont(t)), fontSize: u(li === lines.length - 1 ? 11 : 7), lineHeight: 1.05, color: li === lines.length - 1 ? t.palette.accent : t.palette.text, textShadow: shadow}}>
            {graphemes(l).map((c, i) => {
              const p = prog(frame - g.start - li * f30(6, fps) - i * f30(1, fps), f30(3, fps), E.out);
              return <span key={i} style={{display: 'inline-block', opacity: p, transform: `scale(${0.6 + 0.4 * p})`}}>{c === ' ' ? ' ' : c}</span>;
            })}
          </div>
        ))}
      </div>
    );
  }
  // twoTier
  return (
    <div style={{position: 'absolute', left: '6%', right: '6%', top: `${Y.small}%`, display: 'flex', flexDirection: 'column', alignItems: 'center', ...(ex || {})}}>
      <div style={{display: 'flex', gap: u(0.8), flexWrap: 'wrap', justifyContent: 'center'}}>
        {g.small.map((w, i) => (
          <span key={i} style={{...bodyFont(t), fontSize: u(3.2), color: t.palette.text, textShadow: shadow, ...enter.wordFade(frame - w.start, fps)}}>{w.text}</span>
        ))}
      </div>
      {g.big && (
        <div style={{...keyFont(t), fontSize: u(8.5), lineHeight: 1.15, color: t.palette.text, textShadow: shadow, ...enter.wordPop(frame - g.big.start, fps, H)}}>{g.big.text}</div>
      )}
    </div>
  );
};

export const Captions: React.FC<{groups: CapGroup[]; windows: GraphicWindow[]; style?: 'twoTier' | 'glassBox' | 'stacked'}> = ({groups, windows, style = 'twoTier'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const o = captionOpacity(frame, windows, fps);
  const g = groups.find((x) => frame >= x.start && frame < x.end);
  if (!g || o <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: o, pointerEvents: 'none'}}>
      <Group g={g} style={style} />
    </AbsoluteFill>
  );
};
