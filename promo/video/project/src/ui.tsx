// Tuki UI mock-ups (sample data only) + keycaps, cursor, chips. All colours from the theme.
import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha, bodyFont, keyFont} from './style/theme';
import {E} from './style/easing';
import {prog, f30} from './style/motion';
import {useU} from './style/layout';
import {useSec} from './brand';

// ---------- icons (SVG, theme colours) ----------
type IconName = 'mail' | 'note' | 'chat' | 'globe' | 'cmd' | 'shift' | 'up' | 'down' | 'enter' | 'clip' | 'bookmark' | 'lock' | 'unlock' | 'smile' | 'search' | 'keyboard' | 'x' | 'check' | 'symbol' | 'gif' | 'sticker' | 'download';
export const Icon: React.FC<{name: IconName; size: number; color: string; stroke?: number}> = ({name, size, color, stroke = 2}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const g: Record<IconName, React.ReactNode> = {
    mail: <><rect x="3" y="5.5" width="18" height="13" rx="2.5" {...p} /><path d="M4 7l8 6 8-6" {...p} /></>,
    note: <><rect x="5" y="3.5" width="14" height="17" rx="2.5" {...p} /><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" {...p} /></>,
    chat: <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4.5 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" {...p} />,
    globe: <><circle cx="12" cy="12" r="8.5" {...p} /><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" {...p} /></>,
    cmd: <path d="M9 9V6.5A2.5 2.5 0 1 0 6.5 9H17.5A2.5 2.5 0 1 0 15 6.5V17.5A2.5 2.5 0 1 0 17.5 15H6.5A2.5 2.5 0 1 0 9 17.5Z" {...p} />,
    shift: <path d="M12 4l8 8h-4.5v7h-7v-7H4z" {...p} />,
    up: <path d="M12 19V5M6 11l6-6 6 6" {...p} />,
    down: <path d="M12 5v14M6 13l6 6 6-6" {...p} />,
    enter: <path d="M19 5v7a3 3 0 0 1-3 3H6M10 11l-4 4 4 4" {...p} />,
    clip: <><rect x="5" y="4" width="14" height="17" rx="2.5" {...p} /><path d="M9 3h6v3.5H9z" {...p} /><path d="M8.5 11h7M8.5 15h5" {...p} /></>,
    bookmark: <path d="M7 4h10v16l-5-4-5 4z" {...p} />,
    lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" {...p} /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...p} /></>,
    unlock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" {...p} /><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7" {...p} /></>,
    smile: <><circle cx="12" cy="12" r="8.5" {...p} /><path d="M8.5 14.2c1.4 1.7 5.6 1.7 7 0M9 10h.01M15 10h.01" {...p} /></>,
    search: <><circle cx="11" cy="11" r="6.5" {...p} /><path d="M16 16l4.5 4.5" {...p} /></>,
    keyboard: <><rect x="3" y="6" width="18" height="12" rx="2.5" {...p} /><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" {...p} /></>,
    x: <path d="M7 7l10 10M17 7L7 17" {...p} />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" {...p} />,
    symbol: <path d="M6 18h12M8 6h8l-4 6 4 6" {...p} />,
    gif: <><rect x="3" y="6" width="18" height="12" rx="2.5" {...p} /><path d="M10 10.5H8.6a1.5 1.5 0 0 0 0 3H10V12M12.6 10.5v3M15.2 13.5v-3h2M15.2 12h1.4" {...p} /></>,
    sticker: <><path d="M5 5h14v8l-6 6H5z" {...p} /><path d="M13 19v-6h6" {...p} /></>,
    download: <><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" {...p} /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{g[name]}</svg>;
};

// ---------- keycap ----------
export const Keycap: React.FC<{label: string; at: number; press?: number; size: number}> = ({label, at, press, size}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const sec = useSec();
  const p = prog(frame - sec(at), f30(10, fps), E.rise);
  const pr = press !== undefined ? frame - sec(press) : -1;
  const down = pr >= 0 && pr < f30(8, fps) ? Math.sin((pr / f30(8, fps)) * Math.PI) : 0;
  const lit = pr >= 0;
  return (
    <div style={{width: u(size), height: u(size), borderRadius: u(size * 0.2), background: lit ? t.palette.primary : t.palette.light, color: lit ? t.palette.light : t.palette.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: u(size * 0.48), ...keyFont(t), boxShadow: `0 ${u(size * 0.08 * (1 - down))}px 0 ${alpha(t.palette.dark, 0.18)}, 0 ${u(1.5)}px ${u(3)}px ${alpha(t.palette.dark, 0.12)}`, border: `${u(0.15)}px solid ${alpha(t.palette.dark, 0.1)}`, opacity: p, transform: `translateY(${(1 - p) * 0.05 * H + down * u(size * 0.07)}px) scale(${0.92 + 0.08 * p})`}}>
      {label === 'win' ? <svg width={u(size * 0.42)} height={u(size * 0.42)} viewBox="0 0 20 20">{[[0, 0], [11, 0], [0, 11], [11, 11]].map(([x, y], i) => <rect key={i} x={x} y={y} width="9" height="9" rx="1.2" fill={lit ? t.palette.light : t.palette.text} />)}</svg> : label === '⌘' ? <Icon name="cmd" size={u(size * 0.5)} color={lit ? t.palette.light : t.palette.text} stroke={2.2} /> : label === '⇧' ? <Icon name="shift" size={u(size * 0.5)} color={lit ? t.palette.light : t.palette.text} stroke={2.2} /> : label}
    </div>
  );
};

// ---------- cursor (moves through points; clicks shrink it) ----------
export const Cursor: React.FC<{path: {x: number; y: number; at: number}[]; clicks?: number[]; size?: number}> = ({path, clicks = [], size = 3.2}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, w, h} = useU();
  const sec = useSec();
  if (frame < sec(path[0].at) - f30(6, fps)) return null;
  let x = path[0].x, y = path[0].y;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const p = prog(frame - sec(a.at), Math.max(1, sec(b.at) - sec(a.at)), E.inOut);
    if (frame >= sec(a.at)) { x = a.x + (b.x - a.x) * p; y = a.y + (b.y - a.y) * p; }
  }
  const appear = prog(frame - (sec(path[0].at) - f30(6, fps)), f30(6, fps), E.out);
  const c = clicks.map((cl) => frame - sec(cl)).find((d) => d >= 0 && d < f30(8, fps));
  const s = c !== undefined ? 1 - 0.18 * Math.sin((c / f30(8, fps)) * Math.PI) : 1;
  const ring = c !== undefined ? c / f30(8, fps) : -1;
  return (
    <div style={{position: 'absolute', left: w(x), top: h(y), opacity: appear, zIndex: 50}}>
      {ring >= 0 && <div style={{position: 'absolute', left: -u(2.4) * ring, top: -u(2.4) * ring, width: u(4.8) * ring, height: u(4.8) * ring, borderRadius: '50%', border: `${u(0.3)}px solid ${alpha(t.palette.primary, 1 - ring)}`}} />}
      <svg width={u(size)} height={u(size)} viewBox="0 0 24 24" style={{transform: `scale(${s})`, transformOrigin: '0 0', filter: `drop-shadow(0 ${u(0.3)}px ${u(0.5)}px ${alpha(t.palette.dark, 0.35)})`}}>
        <path d="M3 2l17 10.5-7.4 1.6L9.4 21z" fill={t.palette.light} stroke={t.palette.dark} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ---------- problem chip with ✕ badge (reference style) ----------
export const ProblemChip: React.FC<{icon: IconName; label: string; at: number; xAt: number; size: number}> = ({icon, label, at, xAt, size}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const sec = useSec();
  const p = prog(frame - sec(at), f30(12, fps), E.rise);
  const pb = prog(frame - sec(at), f30(8, fps), E.out);
  const px = prog(frame - sec(xAt), f30(8, fps), E.pop);
  const dim = px;
  return (
    <div style={{position: 'relative', display: 'inline-flex', alignItems: 'center', gap: u(size * 0.45), padding: `${u(size * 0.42)}px ${u(size * 1.2)}px ${u(size * 0.42)}px ${u(size * 0.42)}px`, borderRadius: u(size * 2), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(size), ...keyFont(t), opacity: p, transform: `translateY(${(1 - p) * 0.04 * H}px)`, filter: pb < 1 ? `blur(${(1 - pb) * 8}px)` : dim > 0 ? `saturate(${1 - dim * 0.5})` : undefined, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.accent, 0.35)}`}}>
      <div style={{width: u(size * 1.7), height: u(size * 1.7), borderRadius: '50%', background: t.palette.light, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Icon name={icon} size={u(size * 1.05)} color={t.palette.accent} stroke={2.2} />
      </div>
      <span style={{textDecoration: dim > 0.5 ? 'line-through' : 'none', textDecorationThickness: u(0.25)}}>{label}</span>
      {frame >= sec(xAt) && (
        <div style={{position: 'absolute', right: -u(size * 0.7), top: -u(size * 0.5), width: u(size * 1.5), height: u(size * 1.5), borderRadius: '50%', background: t.palette.dark, border: `${u(0.35)}px solid ${t.palette.light}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.4 + 0.6 * px})`, opacity: px}}>
          <Icon name="x" size={u(size * 0.9)} color={t.palette.light} stroke={3} />
        </div>
      )}
    </div>
  );
};

// ---------- feature pill (light card, accent icon) ----------
export const FeaturePill: React.FC<{icon: IconName; label: string; at: number; size: number}> = ({icon, label, at, size}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W} = useU();
  const sec = useSec();
  const px = prog(frame - sec(at), f30(12, fps), E.cardSlide), po = prog(frame - sec(at), f30(13, fps), E.fadeIn), pb = prog(frame - sec(at), f30(12, fps), E.out);
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: u(size * 0.6), padding: `${u(size * 0.5)}px ${u(size * 1)}px ${u(size * 0.5)}px ${u(size * 0.5)}px`, borderRadius: u(size * 1.2), background: t.palette.light, boxShadow: `0 ${u(0.8)}px ${u(2.5)}px ${alpha(t.palette.dark, 0.1)}`, border: `${u(0.12)}px solid ${alpha(t.palette.dark, 0.07)}`, fontSize: u(size), ...keyFont(t), color: t.palette.text, opacity: po, transform: `translateX(${(1 - px) * -0.055 * W}px)`, filter: pb < 1 ? `blur(${(1 - pb) * 10}px)` : undefined}}>
      <div style={{width: u(size * 1.8), height: u(size * 1.8), borderRadius: u(size * 0.5), background: alpha(t.palette.primary, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Icon name={icon} size={u(size * 1.1)} color={t.palette.accent} stroke={2.2} />
      </div>
      {label}
    </div>
  );
};

// ---------- Tuki logo ----------
export const Logo: React.FC<{size: number; shadow?: boolean}> = ({size, shadow = true}) => {
  const t = useTheme();
  const {u} = useU();
  return <Img src={staticFile('img/logo.png')} style={{width: u(size), height: u(size), filter: shadow ? `drop-shadow(0 ${u(1)}px ${u(2.5)}px ${alpha(t.palette.dark, 0.3)})` : undefined}} />;
};

// ---------- Tuki panel mock ----------
export type Tab = 'clips' | 'snips' | 'secret' | 'emoji' | 'gif';
const TABS: {k: Tab; label: string; icon: IconName}[] = [
  {k: 'clips', label: 'Clipboard', icon: 'clip'},
  {k: 'snips', label: 'Snippets', icon: 'bookmark'},
  {k: 'secret', label: 'Confidential', icon: 'lock'},
  {k: 'emoji', label: 'Emoji', icon: 'smile'},
  {k: 'gif', label: 'GIF', icon: 'gif'},
];
export const Panel: React.FC<{tab: Tab; width: number; children: React.ReactNode; search?: string}> = ({tab, width, children, search}) => {
  const t = useTheme();
  const {u} = useU();
  const s = width / 38; // scale relative to the design width (38u)
  const k = (v: number) => u(v * s);
  return (
    <div style={{width: u(width), height: u(width * 1.5), borderRadius: k(1.8), background: t.palette.light, boxShadow: `0 ${k(2)}px ${k(6)}px ${alpha(t.palette.dark, 0.18)}`, border: `${k(0.12)}px solid ${alpha(t.palette.dark, 0.08)}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...bodyFont(t), color: t.palette.text}}>
      <div style={{padding: `${k(1.3)}px ${k(1.3)}px 0`}}>
        <div style={{height: k(3.6), borderRadius: k(1), border: `${k(0.22)}px solid ${t.palette.primary}`, background: alpha(t.palette.dark, 0.04), display: 'flex', alignItems: 'center', gap: k(0.8), padding: `0 ${k(1)}px`, fontSize: k(1.35), color: alpha(t.palette.dark, 0.45)}}>
          <Icon name="search" size={k(1.6)} color={alpha(t.palette.dark, 0.45)} />
          {search || 'Search'}
        </div>
        <div style={{display: 'flex', marginTop: k(1), borderBottom: `${k(0.1)}px solid ${alpha(t.palette.dark, 0.1)}`}}>
          {TABS.map((x) => {
            const on = x.k === tab;
            return (
              <div key={x.k} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: k(0.3), padding: `${k(0.6)}px 0 ${k(0.8)}px`, color: on ? t.palette.accent : alpha(t.palette.dark, 0.55), fontSize: k(1.05), ...(on ? keyFont(t) : bodyFont(t)), position: 'relative'}}>
                <Icon name={x.icon} size={k(1.9)} color={on ? t.palette.accent : alpha(t.palette.dark, 0.55)} />
                {x.label}
                {on && <div style={{position: 'absolute', bottom: -k(0.1), left: '22%', right: '22%', height: k(0.25), borderRadius: k(0.2), background: t.palette.primary}} />}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{flex: 1, padding: k(1.3), display: 'flex', flexDirection: 'column', gap: k(0.8), position: 'relative'}}>{children}</div>
      <div style={{borderTop: `${k(0.1)}px solid ${alpha(t.palette.dark, 0.1)}`, padding: `${k(0.8)}px ${k(1.4)}px`, fontSize: k(1.1), color: alpha(t.palette.dark, 0.55), display: 'flex', gap: k(1.6)}}>
        <span style={{display: 'flex', alignItems: 'center', gap: k(0.3)}}><Icon name="up" size={k(1.3)} color={alpha(t.palette.dark, 0.55)} /><Icon name="down" size={k(1.3)} color={alpha(t.palette.dark, 0.55)} /> Move</span>
        <span style={{display: 'flex', alignItems: 'center', gap: k(0.3)}}><Icon name="enter" size={k(1.3)} color={alpha(t.palette.dark, 0.55)} /> Paste</span>
        <span>esc Close</span>
      </div>
    </div>
  );
};

// one list row inside the panel
export const Dots: React.FC<{n: number; size: number; color: string}> = ({n, size, color}) => (
  <span style={{display: 'inline-flex', gap: size * 0.6, alignItems: 'center', verticalAlign: 'middle'}}>{Array.from({length: n}).map((_, i) => <span key={i} style={{width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block'}} />)}</span>
);
export const Row: React.FC<{width: number; title: string; meta?: string; lead?: React.ReactNode; pinned?: boolean; hi?: number; masked?: number}> = ({width, title, meta, lead = 'Aa', pinned, hi = 0, masked}) => {
  const t = useTheme();
  const {u} = useU();
  const k = (v: number) => u(v * (width / 38));
  return (
    <div style={{...bodyFont(t), color: t.palette.text, display: 'flex', gap: k(1), alignItems: 'flex-start', padding: k(1.1), borderRadius: k(1.1), background: hi > 0 ? alpha(t.palette.primary, 0.12 * hi) : alpha(t.palette.dark, 0.03), border: `${k(0.15)}px solid ${hi > 0 ? alpha(t.palette.primary, hi) : alpha(t.palette.dark, 0.07)}`}}>
      <div style={{width: k(2.6), height: k(2.6), borderRadius: k(0.7), background: alpha(t.palette.dark, 0.06), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: k(1.1), color: alpha(t.palette.dark, 0.6)}}>{lead}</div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: k(1.4), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', height: masked ? k(2) : undefined, display: masked ? 'flex' : undefined, alignItems: 'center'}}>{masked ? <Dots n={masked} size={k(0.75)} color={t.palette.text} /> : title}</div>
        {meta && <div style={{fontSize: k(1.05), color: alpha(t.palette.dark, 0.5), marginTop: k(0.25)}}>{meta}</div>}
      </div>
      {pinned && <div style={{width: k(0.9), height: k(0.9), borderRadius: '50%', background: t.palette.primary, marginTop: k(0.6)}} />}
    </div>
  );
};

// ---------- Mac window (notes) ----------
export const MacWindow: React.FC<{width: number; height: number; title: string; children: React.ReactNode}> = ({width, height, title, children}) => {
  const t = useTheme();
  const {u} = useU();
  return (
    <div style={{width: u(width), height: u(height), borderRadius: u(1.4), background: t.palette.light, boxShadow: `0 ${u(1.6)}px ${u(5)}px ${alpha(t.palette.dark, 0.14)}`, border: `${u(0.12)}px solid ${alpha(t.palette.dark, 0.08)}`, overflow: 'hidden', ...bodyFont(t), color: t.palette.text}}>
      <div style={{height: u(4), display: 'flex', alignItems: 'center', gap: u(0.8), padding: `0 ${u(1.4)}px`, borderBottom: `${u(0.1)}px solid ${alpha(t.palette.dark, 0.08)}`, background: alpha(t.palette.dark, 0.03)}}>
        {[0.35, 0.25, 0.18].map((o, i) => <div key={i} style={{width: u(1.2), height: u(1.2), borderRadius: '50%', background: alpha(t.palette.dark, o)}} />)}
        <div style={{flex: 1, textAlign: 'center', fontSize: u(1.5), color: alpha(t.palette.dark, 0.55), marginRight: u(4)}}>{title}</div>
      </div>
      <div style={{padding: u(2.6), fontSize: u(2.2), lineHeight: 1.6}}>{children}</div>
    </div>
  );
};

// blinking text caret
export const Caret: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useTheme();
  const {u} = useU();
  return <span style={{display: 'inline-block', width: u(0.25), height: '1.1em', verticalAlign: 'text-bottom', background: t.palette.primary, opacity: Math.floor(frame / 15) % 2 ? 0 : 1, marginLeft: u(0.2)}} />;
};

// pop-in wrapper (iconPop / riseIn style)
export const Pop: React.FC<{at: number; children: React.ReactNode; dur?: number; from?: number; style?: React.CSSProperties}> = ({at, children, dur = 12, from = 0.92, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {H} = useU();
  const sec = useSec();
  const p = prog(frame - sec(at), f30(dur, fps), E.rise);
  const pb = prog(frame - sec(at), f30(7, fps), E.out);
  return <div style={{...style, opacity: p, transform: `${style?.transform || ''} translateY(${(1 - p) * 0.045 * H}px) scale(${from + (1 - from) * p})`, filter: pb < 1 ? `blur(${(1 - pb) * 8}px)` : undefined}}>{children}</div>;
};

export const useP = (at: number, dur = 10, ease = E.out) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sec = useSec();
  return prog(frame - sec(at), f30(dur, fps), ease);
};
export {interpolate};

// ---------- hook: puzzled person, shown as a soft shadow silhouette ----------
export const Silhouette: React.FC<{height: number; at: number}> = ({height, at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const p = prog(frame - sec(at), f30(16, fps), E.rise);
  const scratch = Math.sin(frame / 4) * 2 * Math.min(1, Math.max(0, (frame - sec(2.9)) / 10)); // hand scratches head on "where did it go?"
  const c = alpha(t.palette.dark, 0.88);
  const hh = u(height);
  return (
    <div style={{position: 'relative', width: hh * 0.8, height: hh, opacity: p, transform: `translateY(${(1 - p) * hh * 0.06}px)`, filter: `blur(${(1 - p) * 10 + 0.6}px) drop-shadow(0 ${u(2)}px ${u(4)}px ${alpha(t.palette.dark, 0.25)})`}}>
      <svg viewBox="0 0 400 500" width="100%" height="100%">
        {/* body + shoulders */}
        <path d="M40 500 C40 380 100 330 200 330 C300 330 360 380 360 500 Z" fill={c} />
        {/* neck */}
        <rect x="172" y="250" width="56" height="95" rx="24" fill={c} />
        {/* head */}
        <ellipse cx="200" cy="190" rx="78" ry="92" fill={c} />
        {/* raised arm scratching head */}
        <g transform={`rotate(${scratch} 310 350)`}>
          <path d="M305 352 L382 262 L300 128" stroke={c} strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <ellipse cx="292" cy="118" rx="30" ry="26" fill={c} />
        </g>
      </svg>
      {/* question marks */}
      {[{x: 0.78, y: 0.02, d: 3.1, s: 1}, {x: 0.92, y: 0.16, d: 3.3, s: 0.7}, {x: 0.6, y: -0.06, d: 3.5, s: 0.6}].map((q, i) => {
        const pq = prog(frame - sec(q.d), f30(9, fps), E.pop);
        return <div key={i} style={{position: 'absolute', left: hh * 0.8 * q.x, top: hh * q.y, fontSize: u(9 * q.s), color: t.palette.accent, ...keyFont(t), opacity: pq, transform: `translateY(${(1 - pq) * u(2) + Math.sin(frame / 9 + i) * u(0.4)}px) scale(${0.6 + 0.4 * pq})`}}>?</div>;
      })}
    </div>
  );
};

// ---------- 3D Mac (laptop) with the screen as children; tilt like the reference phone ----------
export const MacDevice: React.FC<{width: number; rotY?: number; rotX?: number; children: React.ReactNode}> = ({width, rotY = -18, rotX = 5, children}) => {
  const t = useTheme();
  const {u} = useU();
  const P = t.palette;
  // MacBook look: aluminium lid edge, thin black bezel with a notch, silver base with the thumb cut-out (greys mixed from the palette)
  const sw = u(width), sh = sw * 0.625, bez = sw * 0.016, edge = sw * 0.006;
  const alu1 = mix(P.dark, P.light, 0.14), alu2 = mix(P.dark, P.light, 0.32), alu3 = mix(P.dark, P.light, 0.5);
  return (
    <div style={{perspective: u(240)}}>
      <div style={{transform: `rotateY(${rotY}deg) rotateX(${rotX}deg)`, transformStyle: 'preserve-3d', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {/* lid: aluminium edge around the black bezel */}
        <div style={{padding: edge, borderRadius: `${bez * 2.6}px ${bez * 2.6}px ${edge * 2}px ${edge * 2}px`, background: `linear-gradient(${alu1}, ${alu2})`, boxShadow: `0 ${u(5)}px ${u(12)}px ${alpha(P.dark, 0.3)}`}}>
          <div style={{position: 'relative', padding: `${bez}px ${bez}px ${bez * 1.4}px`, borderRadius: `${bez * 2.2}px ${bez * 2.2}px ${edge}px ${edge}px`, background: P.dark}}>
            <div style={{position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: sw * 0.12, height: bez * 1.9, borderRadius: `0 0 ${bez}px ${bez}px`, background: P.dark, zIndex: 3}}>
              <div style={{position: 'absolute', left: '50%', top: '30%', width: bez * 0.5, height: bez * 0.5, borderRadius: '50%', transform: 'translateX(-50%)', background: mix(P.dark, P.light, 0.85)}} />
            </div>
            <div style={{width: sw, height: sh, borderRadius: bez * 0.7, overflow: 'hidden', position: 'relative', background: `linear-gradient(140deg, ${alpha(P.primary, 0.35)}, ${P.light} 50%, ${alpha(P.primary, 0.22)}), ${P.light}`}}>
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: sh * 0.045, background: alpha(P.light, 0.75), display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: sw * 0.012, paddingRight: sw * 0.015, fontSize: sh * 0.022, color: alpha(P.dark, 0.7), ...bodyFont(t)}}>
                <Img src={staticFile('img/logo.png')} style={{height: sh * 0.026}} /> <span>Thu 9:41</span>
              </div>
              {children}
            </div>
          </div>
        </div>
        {/* base: thin aluminium wedge with the thumb cut-out */}
        <div style={{position: 'relative', width: (sw + 2 * bez + 2 * edge) * 1.13, height: sh * 0.04, borderRadius: `${edge}px ${edge}px ${sh * 0.05}px ${sh * 0.05}px / ${edge}px ${edge}px ${sh * 0.04}px ${sh * 0.04}px`, background: `linear-gradient(${mix(P.dark, P.light, 0.08)} 0%, ${alu2} 55%, ${alu3} 100%)`, boxShadow: `inset 0 ${u(0.15)}px 0 ${alpha(P.light, 0.9)}`}}>
          <div style={{position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: '15%', height: '45%', borderRadius: `0 0 ${sh * 0.03}px ${sh * 0.03}px`, background: alu2}} />
        </div>
        <div style={{width: (sw + 2 * bez) * 1.08, height: sh * 0.09, marginTop: -sh * 0.02, borderRadius: '50%', background: `radial-gradient(ellipse at center, ${alpha(P.dark, 0.3)} 0%, transparent 70%)`, filter: `blur(${u(1.2)}px)`}} />
      </div>
    </div>
  );
};

// slow camera drift for the 3D device (degrees change over the scene)
export const useDrift = (from: number, to: number, a: number, b: number) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  return interpolate(frame, [sec(a), sec(b)], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.push});
};

// a card that pops out of the screen toward the viewer (big, tilted, orange outline)
export const PopOut: React.FC<{at: number; children: React.ReactNode; rot?: number}> = ({at, children, rot = 8}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  if (frame < sec(at)) return null;
  const p = prog(frame - sec(at), f30(14, fps), E.rise);
  const pb = prog(frame - sec(at), f30(8, fps), E.out);
  return (
    <div style={{perspective: u(200)}}>
      <div style={{opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * u(10)}px) rotateY(${rot * (1 - 0.4 * p)}deg) scale(${0.7 + 0.3 * p})`, filter: pb < 1 ? `blur(${(1 - pb) * 8}px)` : undefined, borderRadius: u(2.4), border: `${u(0.45)}px solid ${t.palette.primary}`, background: t.palette.light, boxShadow: `0 ${u(3)}px ${u(8)}px ${alpha(t.palette.dark, 0.22)}`, overflow: 'hidden'}}>
        {children}
      </div>
    </div>
  );
};

// ---------- hook illustration: person from behind at a desk with a Mac (flat style, palette colours) ----------
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v * k + y[i] * (1 - k)).toString(16).padStart(2, '0')).join('');
};
export const DeskScene: React.FC<{goneAt?: number; pose?: 'puzzled' | 'happy'; screen?: React.ReactNode; showQ?: boolean}> = ({goneAt = 999, pose = 'puzzled', screen, showQ = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const sec = useSec();
  const P = t.palette;
  const skin = mix(P.primary, P.light, 0.42);
  const desk = mix(P.dark, P.light, 0.82);
  const deskFront = mix(P.dark, P.light, 0.9);
  const shirt = P.accent;
  const hair = P.dark;
  const scratch = Math.sin(frame / 4) * 3 * Math.min(1, Math.max(0, (frame - sec(2.9)) / 10));
  const appear = prog(frame, f30(14, fps), E.rise);
  const gone = prog(frame - sec(goneAt), f30(8, fps), E.in);
  const sel = prog(frame - sec(0.3), f30(6, fps), E.out);
  // SVG drawn in a 1920×1080 space, scaled to the frame
  const sx = W / 1920;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: appear}}>
      <svg viewBox="0 0 1920 1080" width={W} height={H} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={P.primary} stopOpacity="0.28" /><stop offset="1" stopColor={P.primary} stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx="620" cy="400" rx="560" ry="360" fill="url(#glow)" />
        {/* shelf + books */}
        <rect x="70" y="250" width="330" height="16" rx="8" fill={desk} />
        {[[95, 120, P.accent], [130, 150, P.primary], [165, 110, mix(P.primary, P.light, 0.55)], [200, 140, P.dark], [235, 100, P.accent]].map(([x, h, c], i) => <rect key={i} x={x as number} y={250 - (h as number)} width="28" height={h as number} rx="5" fill={c as string} />)}
        <rect x="290" y="200" width="80" height="50" rx="10" fill={mix(P.dark, P.light, 0.35)} />
        {/* monitor */}
        <rect x="240" y="150" width="780" height="470" rx="26" fill={P.dark} />
        <rect x="262" y="172" width="736" height="410" rx="10" fill={P.light} />
        <rect x="590" y="620" width="80" height="80" fill={mix(P.dark, P.light, 0.7)} />
        <ellipse cx="630" cy="704" rx="120" ry="14" fill={mix(P.dark, P.light, 0.7)} />
        {/* desk */}
        <rect x="0" y="700" width="1150" height="44" rx="14" fill={desk} />
        <rect x="0" y="744" width="1150" height="340" fill={deskFront} />
        {/* keyboard + mouse + mug */}
        <rect x="470" y="684" width="300" height="18" rx="8" fill={mix(P.dark, P.light, 0.55)} />
        <ellipse cx="840" cy="692" rx="34" ry="12" fill={mix(P.dark, P.light, 0.55)} />
        <rect x="930" y="630" width="62" height="72" rx="12" fill={P.primary} />
        <path d="M992 648 a20 20 0 0 1 0 36" stroke={P.primary} strokeWidth="12" fill="none" />
        {/* person from behind: shirt, neck, head (hair), headphones, raised arm */}
        <path d="M200 1080 C200 900 280 820 420 820 C560 820 640 900 640 1080 Z" fill={shirt} />
        <rect x="385" y="770" width="70" height="70" rx="26" fill={skin} />
        <ellipse cx="420" cy="700" rx="102" ry="112" fill={hair} />
        <path d="M312 690 A110 112 0 0 1 528 690" stroke={P.primary} strokeWidth="22" fill="none" strokeLinecap="round" />
        <rect x="292" y="660" width="44" height="88" rx="20" fill={P.primary} />
        <rect x="504" y="660" width="44" height="88" rx="20" fill={P.primary} />
        {pose === 'puzzled' ? (
          <g transform={`rotate(${scratch} 600 880)`}>
            <path d="M590 880 L700 760 L560 615" stroke={shirt} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="552" cy="602" r="38" fill={skin} />
          </g>
        ) : (
          <g transform={`translate(0 ${Math.sin(frame / 5) * 6})`}>
            <path d="M262 880 L170 740 L230 560" stroke={shirt} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="234" cy="545" r="38" fill={skin} />
            <path d="M578 880 L670 740 L610 560" stroke={shirt} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="606" cy="545" r="38" fill={skin} />
          </g>
        )}
      </svg>
      {/* monitor screen content (scales with the drawing) */}
      {screen ? <div style={{position: 'absolute', left: 262 * sx, top: 172 * sx, width: 736 * sx, height: 410 * sx, overflow: 'hidden', borderRadius: 10 * sx}}>{screen}</div> : <div style={{position: 'absolute', left: 290 * sx, top: 200 * sx, width: 680 * sx, ...bodyFont(t), color: P.text}}>
        <div style={{display: 'flex', gap: 8 * sx, marginBottom: 18 * sx}}>{[0.35, 0.25, 0.18].map((o, i) => <div key={i} style={{width: 14 * sx, height: 14 * sx, borderRadius: '50%', background: alpha(P.dark, o)}} />)}</div>
        <div style={{fontSize: 34 * sx, ...keyFont(t)}}>ক্লায়েন্ট মিটিং</div>
        <div style={{fontSize: 28 * sx, marginTop: 10 * sx, color: alpha(P.dark, 0.7)}}>পার্সেল পাঠাবেন এই ঠিকানায়:</div>
        <div style={{fontSize: 30 * sx, marginTop: 14 * sx, display: 'inline-block', padding: `${4 * sx}px ${8 * sx}px`, borderRadius: 6 * sx, background: alpha(P.primary, 0.25 * sel * (1 - gone)), opacity: 1 - gone, filter: gone > 0 ? `blur(${gone * 10}px)` : undefined}}>House 12, Road 5, Dhanmondi</div>
        <div style={{fontSize: 30 * sx, marginTop: 14 * sx, height: 40 * sx}}>{gone > 0.5 && <span style={{color: alpha(P.dark, 0.35)}}>???</span>}<Caret /></div>
      </div>}
      {/* question marks above the head */}
      {showQ && [{x: 560, y: 470, d: 3.1, s: 1}, {x: 640, y: 540, d: 3.3, s: 0.7}, {x: 470, y: 450, d: 3.5, s: 0.6}].map((q, i) => {
        const pq = prog(frame - sec(q.d), f30(9, fps), E.pop);
        return <div key={i} style={{position: 'absolute', left: q.x * sx, top: q.y * sx, fontSize: u(9 * q.s), color: P.accent, ...keyFont(t), opacity: pq, transform: `translateY(${(1 - pq) * u(2) + Math.sin(frame / 9 + i) * u(0.4)}px) scale(${0.6 + 0.4 * pq})`}}>?</div>;
      })}
    </div>
  );
};

// ---------- camera: smooth zoom/pan on a layer. f = focus point (% of frame), s = zoom, t = where the focus lands ----------
export type CamKey = {at: number; dur?: number; f: [number, number]; s: number; t?: [number, number]};
export const Camera: React.FC<{keys: CamKey[]; children: React.ReactNode}> = ({keys, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, H} = useU();
  const sec = useSec();
  const val = (k: CamKey) => ({fx: k.f[0], fy: k.f[1], s: k.s, tx: (k.t || k.f)[0], ty: (k.t || k.f)[1]});
  let cur = val(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (frame < sec(k.at)) break;
    const p = prog(frame - sec(k.at), Math.max(1, Math.round((k.dur ?? 0.6) * fps)), E.inOut);
    const nx = val(k);
    cur = {fx: cur.fx + (nx.fx - cur.fx) * p, fy: cur.fy + (nx.fy - cur.fy) * p, s: cur.s + (nx.s - cur.s) * p, tx: cur.tx + (nx.tx - cur.tx) * p, ty: cur.ty + (nx.ty - cur.ty) * p};
  }
  const x = (cur.tx / 100) * W - (cur.fx / 100) * W * cur.s;
  const y = (cur.ty / 100) * H - (cur.fy / 100) * H * cur.s;
  return <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${cur.s})`}}>{children}</div>;
};
