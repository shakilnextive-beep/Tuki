// লাইন আইকন (ইমোজি নয়) — ২px-সমান স্ট্রোক, গোল প্রান্ত, রঙ থিম থেকে (M3/M2 মাপা ধরন)।
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha} from './theme';
import {enter, f30, prog} from './motion';
import {E} from './easing';
import {useU} from './layout';

const P: Record<string, string> = {
  check: 'M5 12l5 5 9-10',
  cross: 'M6 6l12 12M18 6L6 18',
  arrow: 'M4 12h15M13 6l6 6-6 6',
  play: 'M8 5v14l11-7z',
  shop: 'M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M9 20v-6h6v6',
  page: 'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',
  folder: 'M3 6h6l2 2h10v11H3z',
  cursor: 'M5 3l14 7-6 2-2 6z',
  terminal: 'M3 4h18v16H3zM7 9l3 3-3 3M12 15h5',
  zip: 'M6 3h12v18H6zM12 3v2M12 7v2M12 11v2M10 15h4v3h-4z',
  box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9',
  clock: 'M12 3a9 9 0 1 0 0.01 0M12 7v5l3 3',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3M6 11a6 6 0 0 0 12 0M12 17v4',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
  question: 'M9 9a3 3 0 1 1 4 2.8c-.8.4-1 1-1 1.7V15M12 18.5v.5',
};
export type IconName = keyof typeof P | string;

export const Icon: React.FC<{name: IconName; size: number; color?: string; stroke?: number; draw?: number; fill?: boolean}> = ({name, size, color, stroke = 2, draw = 1, fill = false}) => {
  const t = useTheme();
  const c = color || t.palette.accent;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{overflow: 'visible', display: 'block'}}>
      <path d={P[name] || P.star} fill={fill ? c : 'none'} stroke={c} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={draw < 1 ? 1 : undefined} strokeDashoffset={draw < 1 ? 1 - draw : undefined} />
    </svg>
  );
};

// আইকন/লোগো পপ (T2 মাপা): টাইলে আইকন; children দিলে লোগো ছবি
export const IconPop: React.FC<{at: number; name?: IconName; size?: number; tile?: boolean; children?: React.ReactNode; frames30?: number}> = ({at, name = 'star', size = 7, tile = true, children, frames30 = 10}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  if (frame < at) return null;
  const m = enter.iconPop(frame - at, fps, H, frames30);
  return (
    <div style={{...m, width: u(size), height: u(size), borderRadius: u(size * 0.24), background: tile ? t.palette.light : 'transparent', border: tile ? `1px solid ${alpha(t.palette.dark, 0.12)}` : undefined, boxShadow: tile ? `0 ${u(0.4)}px ${u(1.2)}px ${alpha(t.palette.dark, 0.25)}` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {children || <Icon name={name} size={u(size * 0.58)} />}
    </div>
  );
};

// ভাসমান আইকন (ডিফল্ট): পপ + y ±০.৬%H, ২s পর্যায়
export const FloatingIcons: React.FC<{items: {name: IconName; x: number; y: number; at: number}[]; size?: number}> = ({items, size = 7}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {H} = useU();
  return (
    <>
      {items.map((it, i) => (
        <div key={i} style={{position: 'absolute', left: `${it.x}%`, top: `${it.y}%`, transform: `translateY(${Math.sin((2 * Math.PI * (frame + i * 11)) / (2 * fps)) * 0.006 * H}px)`}}>
          <IconPop at={it.at} name={it.name} size={size} />
        </div>
      ))}
    </>
  );
};

// লাইন ড্র (ডিফল্ট): ১৫ ফ্রেম E.inOut
export const LineDraw: React.FC<{at: number; name: IconName; size?: number}> = ({at, name, size = 10}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {u} = useU();
  return <Icon name={name} size={u(size)} draw={prog(frame - at, f30(15, fps), E.inOut)} />;
};
