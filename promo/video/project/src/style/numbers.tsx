// সংখ্যা — references/icons-and-numbers.md। সব মান transcript থেকে।
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha, grad, fontStack} from './theme';
import {enter, f30, prog} from './motion';
import {E} from './easing';
import {useU} from './layout';
import {Icon} from './icons';
import {fmtNum, toBnDigits} from './fonts';
import {Strike} from './text';

const numFont = (t: any) => fontStack(t);

// গ্লো কাউন্টার (P1 মাপা: ১.৪৭s প্রায় লিনিয়ার; অন্য প্রোফাইলে easing='ring' বা 'out')
export const Counter: React.FC<{to: number; from?: number; at: number; dur?: number; easing?: 'linear' | 'out' | 'ring'; suffix?: string; prefix?: string; size?: number; label?: string; glow?: boolean; group?: boolean | 'indian' | 'western'}> = ({to, from = 0, at, dur = 1.47, easing = 'linear', suffix = '', prefix = '', size = 12, label, glow = true, group = 'indian'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  if (frame < at) return null;
  const p = prog(frame - at, Math.round(dur * fps), easing === 'linear' ? E.linear : easing === 'ring' ? E.ring : E.out);
  const v = from + (to - from) * p;
  const pl = frame - at - Math.round(dur * fps) - f30(6, fps);
  return (
    <div style={{textAlign: 'center', ...enter.iconPop(frame - at, fps, H, 6)}}>
      <div style={{fontFamily: numFont(t), fontWeight: t.fonts.heavy, fontSize: u(size), lineHeight: 1, color: t.palette.accent, textShadow: glow ? `0 0 ${u(1.5)}px ${alpha(t.palette.accent, 0.7)}, 0 ${u(0.6)}px ${u(1.2)}px ${alpha(t.palette.dark, 0.5)}` : undefined, fontVariantNumeric: 'tabular-nums'}}>
        {prefix}{fmtNum(v, t.digits, group)}{suffix && (t.digits === 'bn' ? toBnDigits(suffix) : suffix)}
      </div>
      {label && pl >= 0 && <div style={{...enter.wordPop(pl, fps, H), fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(size * 0.42), color: t.palette.positive || t.palette.text}}>{label}</div>}
    </div>
  );
};

// রেঞ্জ কাউন্টার (M3 "১৫–২০")
export const RangeCounter: React.FC<{a: number; b: number; at: number; dur?: number; size?: number}> = ({a, b, at, dur = 1, size = 14}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const p = prog(frame - at, Math.round(dur * fps), E.out);
  const fmt = (n: number) => fmtNum(n, t.digits, false).padStart(2, t.digits === 'bn' ? '০' : '0');
  return (
    <div style={{fontFamily: numFont(t), fontWeight: t.fonts.heavy, fontSize: u(size), lineHeight: 1, whiteSpace: 'nowrap'}}>
      <span style={{background: grad(t, 180), WebkitBackgroundClip: 'text', color: 'transparent'}}>{fmt(a * p)}</span>
      <span style={{color: t.palette.text}}>–{fmt(b * p)}</span>
    </div>
  );
};

// ডিজিট রোল (M4): শুধু বদলানো অঙ্ক ওপর থেকে ৩ ফ্রেমে রোল
export const DigitRoll: React.FC<{from: number; to: number; at: number; size?: number}> = ({from, to, at, size = 24}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const a = fmtNum(from, t.digits, false), b = fmtNum(to, t.digits, false);
  const n = Math.max(a.length, b.length);
  const A = a.padStart(n, ' '), B = b.padStart(n, ' ');
  const p = prog(frame - at, f30(3, fps), E.out);
  return (
    <div style={{display: 'flex', fontFamily: numFont(t), fontWeight: t.fonts.heavy, fontSize: u(size), lineHeight: 1, color: t.palette.light, textShadow: `0 ${u(0.8)}px ${u(2)}px ${alpha(t.palette.dark, 0.35)}`}}>
      {Array.from({length: n}).map((_, i) => (
        A[i] === B[i] ? <span key={i}>{B[i]}</span> : (
          <span key={i} style={{position: 'relative', display: 'inline-block', overflow: 'hidden', height: '1.05em'}}>
            <span style={{display: 'block', transform: `translateY(${-100 + p * 100}%)`}}>{B[i]}</span>
            <span style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${p * 100}%)`}}>{A[i]}</span>
          </span>
        )
      ))}
    </div>
  );
};

// "+১" ব্যাজ (M4): ৫ ফ্রেম পপ স্কেল ০.৫→১, কনফেটি
export const PlusBadge: React.FC<{text: string; at: number; size?: number; confetti?: boolean}> = ({text, at, size = 8, confetti = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  if (frame < at) return null;
  const p = prog(frame - at, f30(5, fps), E.out);
  const cp = prog(frame - at, f30(24, fps), E.out);
  return (
    <div style={{position: 'relative', width: u(size), height: u(size)}}>
      {confetti && Array.from({length: 14}).map((_, i) => {
        const ang = (i / 14) * Math.PI * 2 + i, r = u(size) * (0.6 + cp * 1.4);
        const cols = [t.palette.accent, t.palette.primary, t.palette.light, t.palette.accent2 || t.palette.accent];
        return <div key={i} style={{position: 'absolute', left: '50%', top: '50%', width: u(0.7), height: u(0.35), background: cols[i % 4], opacity: 1 - cp, transform: `translate(${Math.cos(ang) * r}px, ${Math.sin(ang) * r + cp * u(3)}px) rotate(${i * 40 + frame * 8}deg)`}} />;
      })}
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: t.palette.accent, color: t.palette.textOnAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(size * 0.42), transform: `scale(${0.5 + 0.5 * p})`, opacity: p}}>{t.digits === 'bn' ? toBnDigits(text) : text}</div>
    </div>
  );
};

// প্রোগ্রেস রিং (M3: ০→৯৯% ৩.৩s E.ring), মাঝে % সংখ্যা
export const ProgressRing: React.FC<{to: number; at: number; dur?: number; size?: number; stroke?: number}> = ({to, at, dur = 3.3, size = 22, stroke = 6}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const p = prog(frame - at, Math.round(dur * fps), E.ring);
  const v = (to * p) / 100;
  const D = u(size), r = 50 - stroke;
  return (
    <div style={{position: 'relative', width: D, height: D}}>
      <svg viewBox="0 0 100 100" width={D} height={D} style={{transform: 'rotate(-90deg)', overflow: 'visible'}}>
        <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t.palette.light} /><stop offset="1" stopColor={t.palette.accent} /></linearGradient></defs>
        <circle cx="50" cy="50" r={r} stroke={alpha(t.palette.dark, 0.35)} strokeWidth={stroke} fill="none" />
        <circle cx="50" cy="50" r={r} stroke="url(#rg)" strokeWidth={stroke} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - v} style={{filter: `drop-shadow(0 0 ${stroke * 0.6}px ${alpha(t.palette.accent, 0.7)})`}} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: numFont(t), fontWeight: t.fonts.heavy, fontSize: D * 0.22, color: t.palette.text}}>
        {fmtNum(to * p, t.digits, false)}<span style={{fontSize: D * 0.12, opacity: 0.7}}>%</span>
      </div>
    </div>
  );
};

// প্রোগ্রেস বার (M4 লোডিং ~১s) বা সেগমেন্ট বার (M3: ১০ ব্লক রিংয়ের সাথে)
export const ProgressBar: React.FC<{to?: number; at: number; dur?: number; width?: number; segments?: number; icon?: boolean; showPct?: boolean}> = ({to = 100, at, dur = 1, width = 60, segments = 0, icon = true, showPct = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W} = useU();
  const p = prog(frame - at, Math.round(dur * fps), segments ? E.ring : E.inOut) * (to / 100);
  const bw = (W * width) / 100;
  if (segments) {
    return (
      <div style={{display: 'flex', gap: u(1), width: bw}}>
        {Array.from({length: segments}).map((_, i) => (
          <div key={i} style={{flex: 1, height: u(2.6), borderRadius: u(0.6), background: p * segments > i ? alpha(t.palette.accent, 0.55) : alpha(t.palette.light, 0.08), transition: 'none'}} />
        ))}
      </div>
    );
  }
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: u(2)}}>
      {icon && <Icon name="bolt" size={u(5)} fill />}
      <div style={{width: bw, height: u(2.2), borderRadius: u(1.1), background: alpha(t.palette.light, 0.25), overflow: 'hidden'}}>
        <div style={{width: `${p * 100}%`, height: '100%', borderRadius: u(1.1), background: t.palette.light}} />
      </div>
      {showPct && <div style={{fontFamily: numFont(t), fontWeight: t.fonts.heavy, fontSize: u(3.4), color: t.palette.light, minWidth: u(9)}}>{fmtNum(p * 100, t.digits, false)}%</div>}
    </div>
  );
};

// স্ট্যাট টাইল (M2): টাইল আগে খালি, সংখ্যা ৬–৮ ফ্রেম ড্রপ, লেবেল ৪ ফ্রেম পরে
export const StatTiles: React.FC<{items: {value: string; label: string; at: number}[]; appearAt: number}> = ({items, appearAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  return (
    <div style={{display: 'flex', gap: u(2), opacity: prog(frame - appearAt, f30(8, fps), E.fadeIn)}}>
      {items.map((it, i) => {
        const pv = prog(frame - it.at, f30(7, fps), E.out);
        const pl = prog(frame - it.at - f30(4, fps), f30(5, fps), E.fadeIn);
        return (
          <div key={i} style={{width: u(19), height: u(27), borderRadius: u(2), background: alpha(t.palette.light, 0.06), border: `1px solid ${alpha(t.palette.light, 0.1)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: u(1)}}>
            <div style={{fontFamily: numFont(t), fontWeight: t.fonts.heavy, fontSize: u(9), color: t.palette.accent, lineHeight: 1, opacity: pv, transform: `translateY(${(pv - 1) * 0.06 * H}px)`}}>{t.digits === 'bn' ? toBnDigits(it.value) : it.value}</div>
            <div style={{fontFamily: fontStack(t), fontWeight: t.fonts.regular, fontSize: u(2.6), color: alpha(t.palette.text, 0.8), opacity: pl, textAlign: 'center', padding: `0 ${u(1)}px`}}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// দাম কাটা → নতুন দাম (M2)
export const PriceStrike: React.FC<{oldPrice: string; newPrice: string; badge?: string; at: number; newAt: number; size?: number}> = ({oldPrice, newPrice, badge, at, newAt, size = 12}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  if (frame < at) return null;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: u(3)}}>
      <div style={{fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(size * 0.42), color: alpha(t.palette.text, 0.6), ...enter.wordFade(frame - at, fps)}}>
        <Strike at={at + f30(8, fps)}>{oldPrice}</Strike>
      </div>
      <div style={{opacity: prog(frame - newAt + f30(6, fps), f30(6, fps), E.out)}}><Icon name="arrow" size={u(size * 0.35)} /></div>
      {frame >= newAt && (
        <div style={{position: 'relative', ...enter.wordPop(frame - newAt, fps, H)}}>
          {badge && <div style={{position: 'absolute', top: -u(size * 0.32), left: '40%', padding: `${u(0.4)}px ${u(1)}px`, borderRadius: u(0.6), background: t.palette.accent, color: t.palette.textOnAccent, fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(size * 0.17), whiteSpace: 'nowrap'}}>{badge}</div>}
          <div style={{fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(size), lineHeight: 1, color: t.palette.positive || t.palette.accent}}>{newPrice}</div>
        </div>
      )}
    </div>
  );
};

// আইকন গণনা (T1: মানুষ-আইকন গ্রিড বাড়ে)
export const IconCount: React.FC<{count: number; at: number; perIcon?: number; cols?: number; size?: number; highlightFrom?: number}> = ({count, at, perIcon = 3, cols = 5, size = 7, highlightFrom}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  return (
    <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, ${u(size)}px)`, gap: u(1.6)}}>
      {Array.from({length: count}).map((_, i) => (
        <div key={i} style={enter.iconPop(frame - at - i * f30(perIcon, fps), fps, H, 8)}>
          <Icon name="user" size={u(size)} color={highlightFrom !== undefined && i >= highlightFrom ? t.palette.accent : t.palette.text} />
        </div>
      ))}
    </div>
  );
};

