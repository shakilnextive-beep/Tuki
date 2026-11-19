// ডায়াগ্রাম ও ইনফোগ্রাফিক (M1/M2/M3/M4/T1 মাপা ধরন)। ধাপ কথার তালে: প্রতিটার at = সেই শব্দের ফ্রেম।
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha, fontStack, bodyFont, Rich} from './theme';
import {enter, f30, prog, breathe} from './motion';
import {E} from './easing';
import {useU} from './layout';
import {Icon, IconName} from './icons';
import {Typewriter} from './text';
import {toBnDigits} from './fonts';

const fam = (t: any, _s?: string) => fontStack(t);

// উল্লম্ব গ্লো টাইমলাইন (M1 ৯–৩৮s): গ্লো লাইন ওপর থেকে বাড়ে, বিন্দু পপ, লেখা টাইপ হয়
export const VerticalTimeline: React.FC<{steps: {text: string; at: number}[]; gap?: number; size?: number}> = ({steps, gap = 9, size = 3.2}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const shown = steps.filter((s) => frame >= s.at).length;
  const lineH = Math.max(0, shown - 0.5) * (H * gap) / 100 + u(4);
  return (
    <div style={{position: 'relative', paddingLeft: u(6)}}>
      <div style={{position: 'absolute', left: u(1.6), top: 0, width: u(0.5), height: lineH, borderRadius: u(0.3), background: `linear-gradient(${t.palette.light}, ${alpha(t.palette.accent, 0.4)})`, boxShadow: `0 0 ${u(2)}px ${alpha(t.palette.accent, 0.8)}`}} />
      {steps.map((s, i) => frame >= s.at && (
        <div key={i} style={{position: 'absolute', top: (i * H * gap) / 100, left: 0, display: 'flex', alignItems: 'center', gap: u(2.4)}}>
          <div style={{...enter.iconPop(frame - s.at, fps, H, 6), width: u(3.6), height: u(3.6), borderRadius: '50%', background: t.palette.light, boxShadow: `0 0 ${u(1.6)}px ${alpha(t.palette.light, 0.9)}`}} />
          <Typewriter text={s.text} at={s.at + f30(3, fps)} size={size} cps={45} cursor={false} />
        </div>
      ))}
    </div>
  );
};

// স্টেপ ফ্লো (M3 ১০৩–১১২s): আইকন টাইল → তীর → ...; শেষ/সক্রিয় ধাপ গ্লো
export const StepFlow: React.FC<{steps: {label: string; icon: IconName; at: number}[]; activeLast?: boolean; size?: number}> = ({steps, activeLast = true, size = 11}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const shown = steps.filter((s) => frame >= s.at);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: u(1.4)}}>
      {steps.map((s, i) => {
        if (frame < s.at) return null;
        const active = activeLast && i === shown.length - 1 && i === steps.length - 1;
        const b = active ? breathe(frame, fps, H) : {glow: 1, dy: 0};
        return (
          <React.Fragment key={i}>
            {i > 0 && <div style={{opacity: prog(frame - s.at, f30(6, fps), E.fadeIn)}}><Icon name="arrow" size={u(2.4)} color={alpha(t.palette.text, 0.5)} /></div>}
            <div style={{...enter.riseIn(frame - s.at, fps, H), width: u(size), height: u(size), borderRadius: u(1.8), background: alpha(t.palette.light, active ? 0.1 : 0.06), border: `1px solid ${active ? alpha(t.palette.accent, 0.7) : alpha(t.palette.light, 0.12)}`, boxShadow: active ? `0 0 ${u(3) * b.glow}px ${alpha(t.palette.accent, 0.45)}` : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u(1)}}>
              <Icon name={s.icon} size={u(size * 0.38)} />
              <span style={{...bodyFont(t), fontSize: u(size * 0.15), color: t.palette.text, textAlign: 'center'}}><Rich text={s.label} /></span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// হাব-স্পোক (M3 ৭৫–৮১s): মাঝে হাব, চারপাশে নোড, লাইন ড্র
export const HubSpoke: React.FC<{hub: string; hubAt: number; nodes: {label: string; icon?: IconName; x: number; y: number; at: number}[]; size?: number}> = ({hub, hubAt, nodes, size = 50}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const S = u(size);
  return (
    <div style={{position: 'relative', width: S * 1.8, height: S}}>
      <svg width={S * 1.8} height={S} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {nodes.map((n, i) => {
          const p = prog(frame - Math.max(n.at, hubAt), f30(12, fps), E.inOut);
          return <line key={i} x1={S * 0.9} y1={S / 2} x2={S * 0.9 + (n.x / 100) * S * 0.9 * p} y2={S / 2 + (n.y / 100) * S * 0.5 * p} stroke={alpha(t.palette.accent, 0.5)} strokeWidth={u(0.3)} />;
        })}
      </svg>
      {nodes.map((n, i) => frame >= n.at && (
        <div key={i} style={{position: 'absolute', left: S * 0.9 + (n.x / 100) * S * 0.9, top: S / 2 + (n.y / 100) * S * 0.5, transform: 'translate(-50%,-50%)'}}>
          <div style={{...enter.iconPop(frame - n.at, fps, H, 8), display: 'flex', alignItems: 'center', gap: u(0.8), padding: `${u(0.8)}px ${u(1.6)}px`, borderRadius: u(1.2), background: alpha(t.palette.light, 0.07), border: `1px solid ${alpha(t.palette.light, 0.14)}`}}>
            {n.icon && <Icon name={n.icon} size={u(2.4)} />}
            <span style={{...bodyFont(t), fontSize: u(2.4), color: t.palette.text}}><Rich text={n.label} /></span>
          </div>
        </div>
      ))}
      {frame >= hubAt && (
        <div style={{position: 'absolute', left: S * 0.9, top: S / 2, transform: 'translate(-50%,-50%)'}}>
          <div style={{...enter.iconPop(frame - hubAt, fps, H, 10), width: u(14), height: u(14), borderRadius: '50%', background: alpha(t.palette.primary, 0.35), border: `1px solid ${alpha(t.palette.accent, 0.6)}`, boxShadow: `0 0 ${u(4)}px ${alpha(t.palette.accent, 0.5)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...bodyFont(t), fontSize: u(3), color: t.palette.text}}><Rich text={hub} /></div>
        </div>
      )}
    </div>
  );
};

// আগে → পরে (M4/M3): বাঁ কার্ড নিষ্ক্রিয়, তীর, ডান কার্ড সক্রিয় + ✓ ব্যাজ
export const BeforeAfter: React.FC<{before: React.ReactNode; after: React.ReactNode; at: number; afterAt: number; w?: number; h?: number; check?: boolean}> = ({before, after, at, afterAt, w = 36, h = 36, check = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const card = (active: boolean): React.CSSProperties => ({width: (W * w) / 100, height: (H * h) / 100, borderRadius: u(2), background: t.mode === 'dark' ? alpha(t.palette.light, active ? 0.09 : 0.04) : t.palette.light, border: `1px solid ${active ? alpha(t.palette.accent, 0.6) : alpha(t.palette.light, 0.15)}`, boxShadow: active ? `0 0 ${u(3)}px ${alpha(t.palette.accent, 0.35)}` : `0 ${u(0.8)}px ${u(2)}px ${alpha(t.palette.dark, 0.2)}`, padding: u(2.4), boxSizing: 'border-box', position: 'relative'});
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: u(3)}}>
      <div style={{...card(false), ...enter.riseIn(frame - at, fps, H), opacity: frame >= afterAt ? 0.7 : prog(frame - at, f30(13, fps), E.rise)}}>{before}</div>
      <div style={{width: u(6), height: u(6), borderRadius: '50%', background: alpha(t.palette.light, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: prog(frame - afterAt + f30(6, fps), f30(6, fps), E.out)}}><Icon name="arrow" size={u(3.2)} color={t.palette.text} /></div>
      {frame >= afterAt && (
        <div style={{...card(true), ...enter.riseIn(frame - afterAt, fps, H)}}>
          {after}
          {check && <div style={{position: 'absolute', top: -u(2), right: -u(2), ...enter.iconPop(frame - afterAt - f30(10, fps), fps, H, 6), width: u(5), height: u(5), borderRadius: '50%', background: t.palette.positive || t.palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name="check" size={u(3)} color={t.palette.light} stroke={3} /></div>}
        </div>
      )}
    </div>
  );
};

// ডিপার্চার-বোর্ড সারি (M2 ৩৪–৫৩s): নম্বর | নাম (অ্যাকসেন্ট) | বর্ণনা | স্ট্যাটাস
export const ListRows: React.FC<{title?: string; rows: {name: string; desc?: string; status?: string; at: number}[]; w?: number}> = ({title, rows, w = 90}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  return (
    <div style={{width: (W * w) / 100}}>
      {title && <div style={{display: 'flex', alignItems: 'center', gap: u(1.2), marginBottom: u(2.4), ...enter.wordFade(frame, fps)}}><div style={{width: u(0.6), height: u(4), background: t.palette.accent}} /><span style={{...bodyFont(t), fontSize: u(4), color: t.palette.text}}><Rich text={title} /></span></div>}
      {rows.map((r, i) => frame >= r.at && (
        <div key={i} style={{...enter.cardSlideIn(frame - r.at, fps, W), display: 'grid', gridTemplateColumns: '6% 30% 1fr 14%', alignItems: 'center', padding: `${u(1)}px 0`, borderBottom: `1px solid ${alpha(t.palette.light, 0.08)}`}}>
          <span style={{fontFamily: fontStack(t), fontSize: u(2.4), color: alpha(t.palette.text, 0.6)}}>{t.digits === 'bn' ? toBnDigits(String(i + 1).padStart(2, '0')) : String(i + 1).padStart(2, '0')}</span>
          <span style={{...bodyFont(t), fontSize: u(2.8), color: t.palette.accent}}><Rich text={r.name} /></span>
          <span style={{fontFamily: fam(t, r.desc || ''), fontSize: u(2.4), color: alpha(t.palette.text, 0.7)}}>{r.desc}</span>
          <span style={{fontFamily: fam(t, r.status || ''), fontSize: u(2.2), color: t.palette.positive || t.palette.accent, textAlign: 'right'}}>{r.status && <>● {r.status}</>}</span>
        </div>
      ))}
    </div>
  );
};

// চেকলিস্ট (M2 ৬–১৪s, ৯৮–১১০s): ✓ সারি
export const Checklist: React.FC<{items: {text: string; at: number}[]; size?: number}> = ({items, size = 3.2}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W} = useU();
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: u(1.8)}}>
      {items.map((it, i) => frame >= it.at && (
        <div key={i} style={{...enter.cardSlideIn(frame - it.at, fps, W), display: 'flex', alignItems: 'center', gap: u(1.6)}}>
          <div style={{width: u(size * 1.3), height: u(size * 1.3), borderRadius: u(0.8), background: alpha(t.palette.positive || t.palette.accent, 0.18), display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name="check" size={u(size)} color={t.palette.positive || t.palette.accent} stroke={3} /></div>
          <span style={{...bodyFont(t), fontSize: u(size), color: t.palette.text}}><Rich text={it.text} /></span>
        </div>
      ))}
    </div>
  );
};

// তুলনা (স্তর খ): দুই কলাম উল্টো দিক থেকে ১২ ফ্রেম, সারি ৪ ফ্রেম স্ট্যাগার
export const Compare: React.FC<{left: {title: string; rows: string[]}; right: {title: string; rows: string[]}; at: number}> = ({left, right, at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W} = useU();
  const col = (c: {title: string; rows: string[]}, dir: number, good: boolean) => {
    const p = prog(frame - at, f30(12, fps), E.cardSlide);
    return (
      <div style={{flex: 1, opacity: p, transform: `translateX(${(1 - p) * 0.05 * W * dir}px)`, borderRadius: u(2), padding: u(2.4), background: t.mode === 'dark' ? alpha(t.palette.light, 0.06) : t.palette.light, border: `1px solid ${good ? alpha(t.palette.accent, 0.6) : alpha(t.palette.light, 0.15)}`}}>
        <div style={{...bodyFont(t), fontSize: u(3.6), color: good ? t.palette.accent : t.palette.text, marginBottom: u(1.6)}}><Rich text={c.title} /></div>
        {c.rows.map((r, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: u(1), opacity: prog(frame - at - f30(12, fps) - i * f30(4, fps), f30(6, fps), E.fadeIn), padding: `${u(0.8)}px 0`}}>
            <Icon name={good ? 'check' : 'cross'} size={u(2.6)} color={good ? t.palette.positive || t.palette.accent : t.palette.negative || alpha(t.palette.text, 0.5)} stroke={3} />
            <span style={{fontFamily: fam(t, r), fontSize: u(2.8), color: t.palette.text}}>{r}</span>
          </div>
        ))}
      </div>
    );
  };
  return <div style={{display: 'flex', gap: u(3), width: '100%'}}>{col(left, -1, false)}{col(right, 1, true)}</div>;
};

// গ্যান্ট টাইমলাইন + প্লেহেড (M3 ৬২–৭৪s)
export const Timeline: React.FC<{items: {label: string; from: number; to: number; at: number}[]; at: number; playFrom: number; playTo: number; w?: number}> = ({items, at, playFrom, playTo, w = 70}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const cw = (W * w) / 100;
  const ph = prog(frame - playFrom, playTo - playFrom, E.linear);
  return (
    <div style={{...enter.riseIn(frame - at, fps, H), position: 'relative', width: cw, height: u(6) * items.length + u(4), borderRadius: u(1.6), background: alpha(t.palette.light, 0.04), border: `1px solid ${alpha(t.palette.light, 0.1)}`}}>
      {items.map((it, i) => frame >= it.at && (
        <div key={i} style={{...enter.cardSlideIn(frame - it.at, fps, W), position: 'absolute', top: u(2) + i * u(6), left: (it.from / 100) * cw, width: ((it.to - it.from) / 100) * cw, height: u(4), borderRadius: u(1), background: alpha(t.palette.primary, 0.4), border: `1px solid ${alpha(t.palette.accent, 0.4)}`, display: 'flex', alignItems: 'center', padding: `0 ${u(1)}px`, fontFamily: fam(t, it.label), fontSize: u(2.2), color: t.palette.text}}>{it.label}</div>
      ))}
      <div style={{position: 'absolute', top: 0, bottom: 0, left: ph * cw, width: u(0.3), background: t.palette.accent, boxShadow: `0 0 ${u(1)}px ${t.palette.accent}`}} />
    </div>
  );
};

// ঘড়ি + পাই-ফিল (T1 ৫২–৫৮s): কাঁটা ঘোরে, পাই ভরে
export const ClockPie: React.FC<{at: number; fromMin: number; toMin: number; dur?: number; size?: number; label?: string}> = ({at, fromMin, toMin, dur = 2, size = 40, label}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const p = prog(frame - at, Math.round(dur * fps), E.inOut);
  const m = fromMin + (toMin - fromMin) * p;
  const D = u(size);
  const a0 = (fromMin / 60) * 2 * Math.PI, a1 = (m / 60) * 2 * Math.PI;
  const pt = (a: number, r: number) => [50 + r * Math.sin(a), 50 - r * Math.cos(a)];
  const [x0, y0] = pt(a0, 40), [x1, y1] = pt(a1, 40);
  return (
    <div style={{textAlign: 'center'}}>
      <svg viewBox="0 0 100 100" width={D} height={D}>
        <circle cx="50" cy="50" r="46" fill={t.palette.light} stroke={t.palette.dark} strokeWidth="3" />
        {a1 - a0 > 0.01 && <path d={`M50,50 L${x0},${y0} A40,40 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`} fill={alpha(t.palette.negative || t.palette.accent, 0.35)} />}
        {Array.from({length: 12}).map((_, i) => { const [a, b] = pt((i / 12) * 2 * Math.PI, 42), [c, d] = pt((i / 12) * 2 * Math.PI, 38); return <line key={i} x1={a} y1={b} x2={c} y2={d} stroke={t.palette.dark} strokeWidth="1.5" />; })}
        <line x1="50" y1="50" x2={pt(a1, 34)[0]} y2={pt(a1, 34)[1]} stroke={t.palette.negative || t.palette.accent} strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="50" r="2.5" fill={t.palette.dark} />
      </svg>
      {label && <div style={{fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(4), color: t.palette.text}}>{label}</div>}
    </div>
  );
};

// ম্যাপ রুট (T1 ৬৪–৬৬s): ডটেড রুট ড্র + চিপ
export const RouteMap: React.FC<{at: number; from: [number, number]; to: [number, number]; dur?: number; chips?: string[]; w?: number; h?: number; children?: React.ReactNode}> = ({at, from, to, dur = 1.2, chips = [], w = 80, h = 60, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const cw = (W * w) / 100, ch = (H * h) / 100;
  const p = prog(frame - at, Math.round(dur * fps), E.inOut);
  const [x0, y0] = [from[0] / 100 * cw, from[1] / 100 * ch], [x1, y1] = [to[0] / 100 * cw, to[1] / 100 * ch];
  const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - ch * 0.15;
  return (
    <div style={{position: 'relative', width: cw, height: ch}}>
      {children}
      <svg width={cw} height={ch} style={{position: 'absolute', inset: 0}}>
        <path d={`M${x0},${y0} Q${cx},${cy} ${x1},${y1}`} fill="none" stroke={t.palette.negative || t.palette.accent} strokeWidth={u(0.6)} strokeDasharray={`${u(1.2)} ${u(1)}`} pathLength={undefined} style={{clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}} />
        <circle cx={x0} cy={y0} r={u(1.2)} fill={t.palette.accent} /><circle cx={x1} cy={y1} r={u(1.2) * p} fill={t.palette.accent} />
      </svg>
      <div style={{position: 'absolute', left: cx, top: cy, transform: 'translate(-50%,-120%)', display: 'flex', gap: u(1)}}>
        {chips.map((c, i) => <span key={i} style={{...enter.iconPop(frame - at - Math.round(dur * fps) - i * f30(4, fps), fps, H, 6), padding: `${u(0.5)}px ${u(1.2)}px`, borderRadius: u(1), background: t.palette.dark, color: t.palette.light, fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(2.6)}}>{c}</span>)}
      </div>
    </div>
  );
};

