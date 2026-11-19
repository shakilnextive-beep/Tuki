// UI মকআপ (M1–M4 মাপা ধরন + স্তর খ ডিফল্ট)। স্ক্রিন রেকর্ডিং children হিসেবে দাও (<OffthreadVideo/> বা <Img/>)।
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha, fontStack} from './theme';
import {enter, f30, prog} from './motion';
import {E} from './easing';
import {useU} from './layout';
import {Icon} from './icons';
import {Typewriter} from './text';

// ফোন ফ্রেম (M1): গাঢ় বেজেল, নচ, নিচে নরম ছায়ার উপবৃত্ত
export const PhoneFrame: React.FC<{at: number; heightPct?: number; children?: React.ReactNode}> = ({at, heightPct = 90, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {H, u} = useU();
  const h = (H * heightPct) / 100, w = h * 0.47;
  const m = enter.riseIn(frame - at, fps, H);
  return (
    <div style={{...m, position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', left: '8%', right: '8%', bottom: -h * 0.04, height: h * 0.05, borderRadius: '50%', background: alpha(t.palette.dark, 0.35), filter: `blur(${u(1.5)}px)`}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: w * 0.13, background: t.palette.dark, padding: w * 0.035, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.4)}`}}>
        <div style={{width: '100%', height: '100%', borderRadius: w * 0.1, overflow: 'hidden', background: t.palette.light, position: 'relative'}}>
          {children}
          <div style={{position: 'absolute', top: w * 0.025, left: '50%', transform: 'translateX(-50%)', width: w * 0.28, height: w * 0.06, borderRadius: w * 0.03, background: t.palette.dark}} />
        </div>
      </div>
    </div>
  );
};

// ব্রাউজার উইন্ডো (M4/M2): ট্রাফিক-লাইট ডট + URL বার
export const BrowserWindow: React.FC<{at: number; url?: string; urlAt?: number; w?: number; h?: number; children?: React.ReactNode}> = ({at, url = '', urlAt, w = 70, h = 70, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H, W} = useU();
  const m = enter.riseIn(frame - at, fps, H);
  return (
    <div style={{...m, width: (W * w) / 100, height: (H * h) / 100, borderRadius: u(1.6), overflow: 'hidden', background: t.palette.light, boxShadow: `0 ${u(1.5)}px ${u(4)}px ${alpha(t.palette.dark, 0.35)}`, display: 'flex', flexDirection: 'column'}}>
      <div style={{height: u(5), display: 'flex', alignItems: 'center', gap: u(0.9), padding: `0 ${u(1.6)}px`, background: alpha(t.palette.dark, 0.06)}}>
        {[0.9, 0.6, 0.35].map((a, i) => <div key={i} style={{width: u(1.2), height: u(1.2), borderRadius: '50%', background: alpha(t.palette.dark, a * 0.5)}} />)}
        <div style={{flex: 1, marginLeft: u(2), height: u(3), borderRadius: u(1.5), background: t.palette.light, border: `1px solid ${alpha(t.palette.dark, 0.12)}`, display: 'flex', alignItems: 'center', padding: `0 ${u(1.2)}px`, gap: u(0.8)}}>
          <Icon name="lock" size={u(1.6)} color={alpha(t.palette.dark, 0.6)} />
          {urlAt !== undefined ? <Typewriter text={url} at={urlAt} size={1.8} color={t.palette.dark} /> : <span style={{fontFamily: fontStack(t), fontSize: u(1.8), color: t.palette.dark}}>{url}</span>}
        </div>
      </div>
      <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>{children}</div>
    </div>
  );
};

// সার্চ/URL বার (M4 ১৩–২৪s): পিল, টাইপিং
export const SearchBar: React.FC<{text: string; at: number; typeAt: number; width?: number; placeholder?: string}> = ({text, at, typeAt, width = 50, placeholder = ''}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const m = enter.iconPop(frame - at, fps, H, 10);
  return (
    <div style={{...m, width: (W * width) / 100, height: u(7), borderRadius: u(3.5), background: t.palette.light, boxShadow: `0 ${u(0.8)}px ${u(2.4)}px ${alpha(t.palette.dark, 0.25)}`, display: 'flex', alignItems: 'center', gap: u(1.4), padding: `0 ${u(2.6)}px`}}>
      <Icon name="lock" size={u(2.6)} color={alpha(t.palette.dark, 0.55)} />
      {frame < typeAt ? <span style={{fontFamily: fontStack(t), fontSize: u(3), color: alpha(t.palette.dark, 0.4)}}>{placeholder}</span> : <Typewriter text={text} at={typeAt} size={3.2} color={t.palette.dark} cps={14} />}
    </div>
  );
};

// টার্মিনাল (M2/M3): গাঢ় উইন্ডো, লাইন একে একে টাইপ
export const Terminal: React.FC<{at: number; lines: {text: string; at: number; prompt?: boolean}[]; w?: number; h?: number; title?: string}> = ({at, lines, w = 60, h = 50, title = 'Terminal'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const m = enter.riseIn(frame - at, fps, H);
  return (
    <div style={{...m, width: (W * w) / 100, height: (H * h) / 100, borderRadius: u(1.4), background: alpha(t.palette.dark, 0.92), border: `1px solid ${alpha(t.palette.light, 0.12)}`, overflow: 'hidden'}}>
      <div style={{height: u(4), display: 'flex', alignItems: 'center', gap: u(0.8), padding: `0 ${u(1.4)}px`, borderBottom: `1px solid ${alpha(t.palette.light, 0.08)}`}}>
        {[0, 1, 2].map((i) => <div key={i} style={{width: u(1), height: u(1), borderRadius: '50%', background: alpha(t.palette.light, 0.25)}} />)}
        <span style={{marginLeft: u(1), fontFamily: 'monospace', fontSize: u(1.6), color: alpha(t.palette.light, 0.5)}}>{title}</span>
      </div>
      <div style={{padding: u(2), display: 'flex', flexDirection: 'column', gap: u(0.8)}}>
        {lines.filter((l) => frame >= l.at).map((l, i) => (
          <div key={i} style={{fontFamily: 'monospace', fontSize: u(2.2), color: l.prompt ? t.palette.accent : t.palette.light}}>
            {l.prompt && '> '}<Typewriter text={l.text} at={l.at} mono cps={30} size={2.2} color={l.prompt ? t.palette.accent : t.palette.light} cursor={i === lines.filter((x) => frame >= x.at).length - 1} />
          </div>
        ))}
      </div>
    </div>
  );
};

// চ্যাট বক্স (M3 Gemini/ChatGPT): শিরোনাম + ইনপুট বাক্সে টাইপিং + চিপ
export const ChatBox: React.FC<{at: number; title: string; text: string; typeAt: number; chips?: {text: string; at: number}[]; w?: number}> = ({at, title, text, typeAt, chips = [], w = 70}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const m = enter.riseIn(frame - at, fps, H);
  return (
    <div style={{...m, width: (W * w) / 100, borderRadius: u(2), background: alpha(t.palette.light, 0.05), border: `1px solid ${alpha(t.palette.light, 0.12)}`, padding: u(2.4)}}>
      <div style={{textAlign: 'center', fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(3.2), color: t.palette.accent, marginBottom: u(2)}}>{title}</div>
      <div style={{minHeight: u(14), borderRadius: u(1.6), background: alpha(t.palette.light, 0.06), padding: u(1.8)}}>
        <div style={{display: 'flex', gap: u(1), marginBottom: u(1.2)}}>
          {chips.filter((c) => frame >= c.at).map((c, i) => (
            <span key={i} style={{...enter.iconPop(frame - c.at, fps, H, 6), padding: `${u(0.4)}px ${u(1.2)}px`, borderRadius: u(1.4), background: alpha(t.palette.accent, 0.18), color: t.palette.accent, fontFamily: fontStack(t), fontSize: u(1.8)}}>{c.text}</span>
          ))}
        </div>
        <Typewriter text={text} at={typeAt} size={2.4} cps={22} />
      </div>
    </div>
  );
};

// কার্সর (স্তর খ): E.inOut-এ চলা, ক্লিকে স্কেল ০.৯ ৩ ফ্রেম + রিপল ১০ ফ্রেম
export const Cursor: React.FC<{path: {x: number; y: number; at: number; click?: boolean}[]}> = ({path}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  if (frame < path[0].at) return null;
  let x = path[0].x, y = path[0].y, scale = 1, ripple = -1;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const mv = Math.max(f30(12, fps), b.at - a.at);
    const p = prog(frame - (b.at - mv), mv, E.inOut);
    if (frame >= b.at - mv) { x = a.x + (b.x - a.x) * p; y = a.y + (b.y - a.y) * p; }
    if (b.click && frame >= b.at) { const ct = frame - b.at; scale = ct < f30(3, fps) ? 0.9 : 1; ripple = ct; }
  }
  const rp = ripple >= 0 ? prog(ripple, f30(10, fps), E.out) : -1;
  return (
    <div style={{position: 'absolute', left: (W * x) / 100, top: (H * y) / 100, transform: `scale(${scale})`, transformOrigin: 'top left'}}>
      {rp >= 0 && rp < 1 && <div style={{position: 'absolute', left: -u(3), top: -u(3), width: u(6), height: u(6), borderRadius: '50%', border: `${u(0.4)}px solid ${t.palette.accent}`, transform: `scale(${0.3 + rp})`, opacity: 1 - rp}} />}
      <svg width={u(4)} height={u(4)} viewBox="0 0 24 24"><path d="M4 2l16 8-7 2-3 8z" fill={t.palette.light} stroke={t.palette.dark} strokeWidth={1.5} strokeLinejoin="round" /></svg>
    </div>
  );
};

// টোস্ট নোটিফিকেশন (স্তর খ): ওপর থেকে ৯ ফ্রেম, holdSec, ৬ ফ্রেম এক্সিট
export const Toast: React.FC<{text: string; at: number; holdSec?: number}> = ({text, at, holdSec = 2}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const end = at + f30(9, fps) + Math.round(holdSec * fps);
  if (frame < at || frame > end + f30(6, fps)) return null;
  const pin = prog(frame - at, f30(9, fps), E.rise), pout = prog(frame - end, f30(6, fps), E.in);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: u(1.4), padding: `${u(1.4)}px ${u(2.4)}px`, borderRadius: u(2), background: alpha(t.palette.light, 0.92), boxShadow: `0 ${u(0.8)}px ${u(2.4)}px ${alpha(t.palette.dark, 0.3)}`, opacity: pin * (1 - pout), transform: `translateY(${(pin - 1) * 0.04 * H - pout * 0.02 * H}px)`}}>
      <Icon name="check" size={u(3)} />
      <span style={{fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(2.8), color: t.palette.dark}}>{text}</span>
    </div>
  );
};

// স্প্রেডশিট (T1 ১৪৮–১৫৪s): সারি টাইপ হয়
export const Sheet: React.FC<{at: number; title: string; header: string[]; rows: {cells: string[]; at: number}[]; w?: number}> = ({at, title, header, rows, w = 70}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const m = enter.riseIn(frame - at, fps, H);
  return (
    <div style={{...m, width: (W * w) / 100, borderRadius: u(1.2), overflow: 'hidden', background: t.palette.light, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.35)}`}}>
      <div style={{background: t.palette.primary, color: t.palette.light, fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(2.2), padding: `${u(1)}px ${u(1.6)}px`, textAlign: 'center'}}>{title}</div>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${header.length}, 1fr)`}}>
        {header.map((h, i) => <div key={i} style={{padding: u(1.2), fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(2.4), color: t.palette.dark, borderBottom: `1px solid ${alpha(t.palette.dark, 0.15)}`}}>{h}</div>)}
        {rows.map((r) => r.cells.map((c, j) => (
          <div key={`${r.at}-${j}`} style={{padding: u(1.2), fontFamily: fontStack(t), fontSize: u(2.4), color: t.palette.dark, borderBottom: `1px solid ${alpha(t.palette.dark, 0.08)}`}}>
            {frame >= r.at + j * f30(10, fps) && <Typewriter text={c} at={r.at + j * f30(10, fps)} size={2.4} color={t.palette.dark} cps={25} cursor={false} />}
          </div>
        )))}
      </div>
    </div>
  );
};

