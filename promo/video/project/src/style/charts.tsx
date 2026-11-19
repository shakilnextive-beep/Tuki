// চার্ট (স্তর খ — ডিফল্ট; আমার ভিডিওতে আলাদা চার্ট সিন নেই)। মাপা ইজিং ব্যবহার।
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha, fontStack} from './theme';
import {f30, prog} from './motion';
import {E} from './easing';
import {useU} from './layout';
import {fmtNum} from './fonts';

type Datum = {label: string; value: number; highlight?: boolean};
const labelFont = (t: any, _s?: string) => fontStack(t);

// bar: বার নিচ থেকে ১৫ ফ্রেম E.rise, বার প্রতি ৪ ফ্রেম স্ট্যাগার; মান কাউন্টারে
export const BarChart: React.FC<{data: Datum[]; at: number; width?: number; height?: number; unit?: string; stagger30?: number; atEach?: number[]}> = ({data, at, width = 70, height = 45, unit = '', stagger30 = 4, atEach}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const max = Math.max(...data.map((d) => d.value));
  const cw = (W * width) / 100, ch = (H * height) / 100;
  const pg = prog(frame - at, f30(6, fps), E.fadeIn);
  return (
    <div style={{width: cw, height: ch, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: cw * 0.04, borderBottom: `${u(0.3)}px solid ${alpha(t.palette.text, 0.35 * pg)}`, paddingBottom: u(0.4)}}>
      {data.map((d, i) => {
        const st = atEach ? atEach[i] : at + i * f30(stagger30, fps);
        const p = prog(frame - st, f30(15, fps), E.rise);
        const bh = (ch * 0.82 * d.value) / max;
        return (
          <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%'}}>
            <div style={{fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(3.2), color: d.highlight ? t.palette.accent : t.palette.text, opacity: p, marginBottom: u(0.8)}}>{fmtNum(d.value * p, t.digits)}{unit}</div>
            <div style={{width: '100%', height: bh * p, borderRadius: `${u(1)}px ${u(1)}px 0 0`, background: d.highlight ? t.palette.accent : alpha(t.palette.text, 0.35), boxShadow: d.highlight ? `0 0 ${u(2)}px ${alpha(t.palette.accent, 0.5)}` : undefined}} />
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: -u(5), display: 'flex', gap: cw * 0.04, opacity: pg}}>
        {data.map((d, i) => <div key={i} style={{flex: 1, textAlign: 'center', fontFamily: labelFont(t, d.label), fontSize: u(2.6), color: alpha(t.palette.text, 0.85)}}>{d.label}</div>)}
      </div>
    </div>
  );
};

// line: গ্রিড ৬ ফ্রেম ফেড, লাইন ২০ ফ্রেম E.inOut, শেষ বিন্দু পপ + মান চিপ
export const LineChart: React.FC<{data: Datum[]; at: number; width?: number; height?: number; unit?: string}> = ({data, at, width = 70, height = 45, unit = ''}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const cw = (W * width) / 100, ch = (H * height) / 100;
  const max = Math.max(...data.map((d) => d.value)), min = Math.min(0, ...data.map((d) => d.value));
  const pts = data.map((d, i) => [(i / (data.length - 1)) * cw, ch - ((d.value - min) / (max - min)) * ch * 0.85]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const pg = prog(frame - at, f30(6, fps), E.fadeIn);
  const pl = prog(frame - at - f30(6, fps), f30(20, fps), E.inOut);
  const pe = prog(frame - at - f30(26, fps), f30(6, fps), E.out);
  const last = pts[pts.length - 1];
  return (
    <div style={{position: 'relative', width: cw, height: ch}}>
      <svg width={cw} height={ch} style={{overflow: 'visible'}}>
        {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={0} x2={cw} y1={ch * g} y2={ch * g} stroke={alpha(t.palette.text, 0.12 * pg)} strokeWidth={1} />)}
        <path d={path} fill="none" stroke={t.palette.accent} strokeWidth={u(0.7)} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pl} style={{filter: `drop-shadow(0 0 ${u(0.8)}px ${alpha(t.palette.accent, 0.6)})`}} />
        <circle cx={last[0]} cy={last[1]} r={u(1.3) * pe} fill={t.palette.accent} />
      </svg>
      <div style={{position: 'absolute', left: last[0], top: last[1] - u(7), transform: `translateX(-50%) scale(${pe})`, padding: `${u(0.5)}px ${u(1.2)}px`, borderRadius: u(1), background: t.palette.accent, color: t.palette.textOnAccent, fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(3)}}>{fmtNum(data[data.length - 1].value, t.digits)}{unit}</div>
      <div style={{position: 'absolute', top: ch + u(1.5), left: 0, right: 0, display: 'flex', justifyContent: 'space-between', opacity: pg}}>
        {data.map((d, i) => <span key={i} style={{fontFamily: labelFont(t, d.label), fontSize: u(2.4), color: alpha(t.palette.text, 0.8)}}>{d.label}</span>)}
      </div>
    </div>
  );
};

// donut/pie: স্লাইস ১২ ফ্রেম E.ring, স্লাইস প্রতি ৪ ফ্রেম; innerRatio 0 = pie
export const DonutChart: React.FC<{data: Datum[]; at: number; size?: number; innerRatio?: number; centerLabel?: string}> = ({data, at, size = 30, innerRatio = 0.62, centerLabel}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const total = data.reduce((s, d) => s + d.value, 0);
  const D = u(size), R = 50, r = R * innerRatio;
  const cols = [t.palette.accent, t.palette.primary, t.palette.accent2 || alpha(t.palette.text, 0.6), alpha(t.palette.text, 0.35), alpha(t.palette.text, 0.2)];
  let acc = 0;
  const arc = (a0: number, a1: number) => {
    const p = (a: number, rad: number) => [50 + rad * Math.sin(a), 50 - rad * Math.cos(a)];
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [x2, y2] = p(a1, r), [x3, y3] = p(a0, r);
    return r > 0 ? `M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${large} 0 ${x3},${y3} Z` : `M50,50 L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`;
  };
  return (
    <div style={{position: 'relative', width: D, height: D}}>
      <svg viewBox="0 0 100 100" width={D} height={D}>
        {data.map((d, i) => {
          const p = prog(frame - at - i * f30(4, fps), f30(12, fps), E.ring);
          const a0 = (acc / total) * Math.PI * 2;
          acc += d.value;
          const a1 = a0 + (d.value / total) * Math.PI * 2 * p;
          return p > 0.001 ? <path key={i} d={arc(a0, Math.max(a0 + 0.0001, a1))} fill={d.highlight ? t.palette.accent : cols[i % cols.length]} /> : null;
        })}
      </svg>
      {centerLabel && innerRatio > 0 && <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: D * 0.16, color: t.palette.text}}>{centerLabel}</div>}
    </div>
  );
};
