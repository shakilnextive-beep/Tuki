// কার্ড — references/cards.md। অবস্থান বাইরের div-এ % দিয়ে দাও; এখানে শুধু কার্ড নিজে।
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme, alpha, grad, fontStack, bodyFont, Rich} from './theme';
import {enter, exit, breathe, f30, prog} from './motion';
import {E} from './easing';
import {useU} from './layout';
import {Icon, IconName} from './icons';
import {fmtNum, toBnDigits} from './fonts';

const fam = (t: any, _s?: string) => fontStack(t);
const withExit = (frame: number, exitAt: number | undefined, fps: number, base: any, W: number) => (exitAt !== undefined && frame >= exitAt ? exit.card(frame - exitAt, fps, W, -1) : base);

// ১. নম্বর দেওয়া লিস্ট কার্ড (T1): বাঁ থেকে ৫.৫%W, ১২ ফ্রেম, ব্লার-ইন; প্রস্থ ৮৩.৫%W (১:১ মাপা)
export const ListCard: React.FC<{n: number; text: string; at: number; icon?: IconName; widthPct?: number; exitAt?: number; image?: React.ReactNode}> = ({n, text, at, icon, widthPct = 83.5, exitAt, image}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W} = useU();
  if (frame < at) return null;
  const m = withExit(frame, exitAt, fps, enter.cardSlideIn(frame - at, fps, W), W);
  const h = u(11);
  return (
    <div style={{...m, width: (W * widthPct) / 100, height: h, borderRadius: u(1.6), background: t.palette.light, boxShadow: `0 ${u(1)}px ${u(2.2)}px ${alpha(t.palette.dark, 0.22)}`, display: 'flex', alignItems: 'center', padding: `0 ${u(3)}px`, gap: u(2.4), boxSizing: 'border-box'}}>
      <div style={{width: u(7.5), height: u(7.5), borderRadius: '50%', background: t.palette.accent, color: t.palette.textOnAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(3.6), flexShrink: 0}}>{t.digits === 'bn' ? toBnDigits(String(n)) : n}</div>
      <div style={{flex: 1, ...bodyFont(t), fontSize: u(3.6), color: t.palette.dark}}><Rich text={text} /></div>
      {image || (icon && <Icon name={icon} size={u(6)} />)}
    </div>
  );
};

// ২. গ্লাস আইকন কার্ড (M3): নিচ থেকে ৪.৪%H ১৩ ফ্রেম; active = গ্লো + নিশ্বাস-পালস
export const GlassCard: React.FC<{title: string; sub?: string; icon?: IconName; at: number; active?: boolean; w?: number; h?: number; exitAt?: number; layout?: 'column' | 'row'}> = ({title, sub, icon, at, active = false, w = 40, h = 30, exitAt, layout = 'column'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  if (frame < at) return null;
  const m = withExit(frame, exitAt, fps, enter.riseIn(frame - at, fps, H), W);
  const b = active ? breathe(frame, fps, H) : {glow: 1, dy: 0};
  return (
    <div style={{...m, width: `${w}%`, height: `${h}%`, position: 'relative', transform: `${m.transform || ''} translateY(${b.dy}px)`, borderRadius: u(2), background: alpha(t.palette.light, active ? 0.08 : 0.05), border: `1px solid ${active ? alpha(t.palette.accent, 0.55) : alpha(t.palette.light, 0.12)}`, boxShadow: active ? `0 0 ${u(3) * b.glow}px ${alpha(t.palette.accent, 0.35 * b.glow)}, inset 0 0 ${u(4)}px ${alpha(t.palette.accent, 0.12)}` : 'none', display: 'flex', flexDirection: layout, alignItems: 'center', justifyContent: 'center', gap: u(2), opacity: (m.opacity ?? 1) * (active ? 1 : 0.85), boxSizing: 'border-box', padding: u(2)}}>
      {icon && <Icon name={icon} size={u(layout === 'column' ? 9 : 6)} />}
      <div style={{textAlign: layout === 'column' ? 'center' : 'left'}}>
        <div style={{...bodyFont(t), fontSize: u(4.2), color: t.palette.text}}><Rich text={title} /></div>
        {sub && <div style={{...bodyFont(t), fontSize: u(3.6), color: t.palette.accent}}><Rich text={sub} /></div>}
      </div>
    </div>
  );
};

// ৩. নম্বর-ব্যাজ ফিচার কার্ড (M1): ঝলক-পপ; variant ticket = বোর্ডিং-পাস (M2)
export const FeatureCard: React.FC<{n?: number; title: string; icon?: IconName; at: number; variant?: 'badge' | 'ticket'; sub?: string; exitAt?: number}> = ({n, title, icon = 'star', at, variant = 'badge', sub, exitAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  if (frame < at) return null;
  const m = withExit(frame, exitAt, fps, enter.flashPop(frame - at, fps, H), W);
  if (variant === 'ticket') {
    return (
      <div style={{...m, display: 'flex', width: '100%', height: '100%', borderRadius: u(1.6), overflow: 'hidden', boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.4)}`}}>
        <div style={{flex: 1, background: t.palette.light, padding: u(3), display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{...bodyFont(t), fontSize: u(5), color: t.palette.dark}}><Rich text={title} /></div>
          {sub && <div style={{fontFamily: fam(t, sub), fontSize: u(2.4), color: alpha(t.palette.dark, 0.7), marginTop: u(1)}}>{sub}</div>}
        </div>
        <div style={{width: '22%', background: t.palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `${u(0.4)}px dashed ${alpha(t.palette.light, 0.7)}`}}><Icon name={icon} size={u(7)} color={t.palette.textOnAccent} /></div>
      </div>
    );
  }
  return (
    <div style={{...m, position: 'relative', width: '100%', height: '100%', borderRadius: u(2.6), background: t.palette.light, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.3)}`, padding: u(2.6), boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
      <div style={{width: u(6), height: u(6), borderRadius: u(1.4), background: alpha(t.palette.accent, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name={icon} size={u(3.6)} /></div>
      <div style={{...bodyFont(t), fontSize: u(3), color: t.palette.dark}}><Rich text={title} /></div>
      {n !== undefined && (
        <div style={{position: 'absolute', right: -u(1.6), top: -u(1.6), width: u(5), height: u(5), borderRadius: '50%', background: t.palette.primary, border: `${u(0.4)}px solid ${t.palette.light}`, color: t.palette.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: u(2.8)}}>{t.digits === 'bn' ? toBnDigits(String(n)) : n}</div>
      )}
    </div>
  );
};

// ৪. কাঁচের পিল (T5 ৫১.৩s মাপা): ফ্রেম ~২০ ফ্রেমে ফেড (স্কেল ০.৯৮→১), লেখা ~১৫ ফ্রেম পরে ~৮ ফ্রেমে; প্রথম লাইন অ্যাকসেন্ট
export const GlassPill: React.FC<{line1: string; line2?: string; icon?: IconName; at: number; exitAt?: number}> = ({line1, line2, icon = 'star', at, exitAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W} = useU();
  if (frame < at) return null;
  const p = prog(frame - at, f30(20, fps), E.fadeIn);
  const pt = prog(frame - at - f30(15, fps), f30(8, fps), E.fadeIn);
  const ex = exitAt !== undefined && frame >= exitAt ? exit.fade(frame - exitAt, fps, 6) : null;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: u(2.4), padding: `${u(1.6)}px ${u(3)}px ${u(1.6)}px ${u(1.6)}px`, borderRadius: u(2.4), background: alpha(t.palette.light, 0.13), border: `1px solid ${alpha(t.palette.light, 0.3)}`, backdropFilter: 'blur(12px)', opacity: p * (ex ? ex.opacity : 1), transform: `scale(${0.98 + 0.02 * p})`}}>
      {/* T5 মাপা: আইকন টাইল পিলের বাঁ-ওপর কোণ ছাড়িয়ে বেরিয়ে থাকে */}
      <div style={{width: u(10), height: u(10), marginTop: -u(5), marginLeft: -u(1), flexShrink: 0, borderRadius: u(1.8), background: alpha(t.palette.light, 0.2), border: `1px solid ${alpha(t.palette.light, 0.4)}`, backdropFilter: 'blur(10px)', boxShadow: `0 ${u(0.6)}px ${u(1.6)}px ${alpha(t.palette.dark, 0.35)}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name={icon} size={u(5.5)} /></div>
      <div style={{opacity: pt}}>
        <div style={{...bodyFont(t), fontSize: u(4.6), color: t.palette.accent, lineHeight: 1.15, whiteSpace: 'nowrap'}}><Rich text={line1} /></div>
        {line2 && <div style={{...bodyFont(t), fontSize: u(3.4), color: t.palette.text, textAlign: 'right', whiteSpace: 'nowrap'}}><Rich text={line2} /></div>}
      </div>
    </div>
  );
};

// ৫. কাঁচের প্যানেল তালিকা (T2): বর্ডার ৬ ফ্রেম স্কেল ০.৯→১, সারি পরে; highlight সারি নিয়ন বক্সে
export const GlassPanel: React.FC<{rows: {text: string; icon?: IconName}[]; at: number; rowGap?: number; highlight?: number; exitAt?: number}> = ({rows, at, rowGap = 8, highlight, exitAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  if (frame < at) return null;
  const pb = prog(frame - at, f30(6, fps), E.out);
  const ex = exitAt !== undefined && frame >= exitAt ? exit.fade(frame - exitAt, fps, 6) : null;
  return (
    <div style={{width: '100%', height: '100%', borderRadius: u(3), border: `${u(0.3)}px solid ${alpha(t.palette.light, 0.85)}`, background: alpha(t.palette.light, 0.08), transform: `scale(${0.9 + 0.1 * pb})`, opacity: pb * (ex ? ex.opacity : 1), padding: u(3), boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: u(2.2)}}>
      {rows.map((r, i) => {
        const pr = prog(frame - at - f30(6, fps) - i * rowGap, f30(8, fps), E.rise);
        const hl = highlight === i;
        return (
          <div key={i} style={{opacity: pr, transform: `translateY(${(1 - pr) * u(2)}px)`, display: 'flex', alignItems: 'center', gap: u(2), padding: `${u(1)}px ${u(1.6)}px`, borderRadius: u(1.4), border: hl ? `${u(0.35)}px solid ${t.palette.accent}` : '1px solid transparent', boxShadow: hl ? `0 0 ${u(2.5)}px ${alpha(t.palette.accent, 0.7)}` : 'none'}}>
            {r.icon && <Icon name={r.icon} size={u(4.4)} color={t.palette.light} />}
            <span style={{...bodyFont(t), fontSize: u(3.6), color: t.palette.light}}><Rich text={r.text} /></span>
          </div>
        );
      })}
    </div>
  );
};

// ৬. চিপ (T2/M3/M2): pill; variant label = বাঁয়ে অ্যাকসেন্ট দাগ; cta = অ্যাকসেন্ট গ্রেডিয়েন্ট
export const Chip: React.FC<{text: string; at: number; icon?: IconName; variant?: 'pill' | 'label' | 'cta'; size?: number; logo?: React.ReactNode; exitAt?: number}> = ({text, at, icon, variant = 'pill', size = 3, logo, exitAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H, W} = useU();
  if (frame < at) return null;
  const m = withExit(frame, exitAt, fps, enter.iconPop(frame - at, fps, H, 8), W);
  const dark = t.mode === 'dark';
  const bg = variant === 'cta' ? `linear-gradient(90deg, ${t.palette.primary}, ${t.palette.accent})` : variant === 'label' ? alpha(t.palette.dark, 0.7) : dark ? alpha(t.palette.light, 0.1) : t.palette.light;
  const fg = variant === 'cta' ? t.palette.light : variant === 'label' ? t.palette.light : dark ? t.palette.text : t.palette.dark;
  return (
    <div style={{...m, display: 'inline-flex', alignItems: 'center', gap: u(size * 0.4), padding: `${u(size * 0.3)}px ${u(size * 0.6)}px`, borderRadius: variant === 'label' ? u(0.6) : u(size), background: bg, border: dark && variant === 'pill' ? `1px solid ${alpha(t.palette.light, 0.18)}` : undefined, borderLeft: variant === 'label' ? `${u(0.6)}px solid ${t.palette.accent}` : undefined, boxShadow: variant === 'pill' && !dark ? `0 ${u(0.3)}px ${u(1)}px ${alpha(t.palette.dark, 0.2)}` : undefined}}>
      {logo || (icon && <Icon name={icon} size={u(size * 0.9)} color={variant === 'pill' ? t.palette.accent : fg} />)}
      <span style={{...bodyFont(t), fontSize: u(size), color: fg, whiteSpace: 'nowrap'}}><Rich text={text} /></span>
    </div>
  );
};

// ৭. স্টিকার ট্যাগ (M4): হেলানো, ✕/✓/♥ আইকন
export const StickerTag: React.FC<{text: string; at: number; tilt?: number; icon?: IconName; tone?: 'light' | 'accent' | 'dark'; size?: number}> = ({text, at, tilt = -4, icon = 'cross', tone = 'light', size = 4}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  if (frame < at) return null;
  const p = prog(frame - at, f30(7, fps), E.out);
  const bg = tone === 'accent' ? t.palette.accent : tone === 'dark' ? t.palette.dark : t.palette.light;
  const fg = tone === 'accent' ? t.palette.textOnAccent : tone === 'dark' ? t.palette.light : t.palette.dark;
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1.2), padding: `${u(1)}px ${u(2.2)}px`, borderRadius: u(1.2), background: bg, transform: `rotate(${tilt}deg) scale(${0.7 + 0.3 * p})`, opacity: p, boxShadow: `0 ${u(0.6)}px ${u(1.6)}px ${alpha(t.palette.dark, 0.3)}`}}>
      <Icon name={icon} size={u(size * 0.8)} color={tone === 'light' ? t.palette.accent : fg} stroke={3} />
      <span style={{...bodyFont(t), fontSize: u(size), color: fg}}><Rich text={text} /></span>
    </div>
  );
};

// ৮. ডকুমেন্ট callout (P3): হলুদ বক্স (accent), নেগেটিভ রঙের পাতলা বর্ডার, ১.৪× বড়
export const Callout: React.FC<{text: string; at: number; exitAt?: number; size?: number}> = ({text, at, exitAt, size = 3}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  if (frame < at) return null;
  const p = prog(frame - at, f30(8, fps), E.out);
  const ex = exitAt !== undefined && frame >= exitAt ? exit.fade(frame - exitAt, fps, 5) : null;
  return (
    <div style={{padding: `${u(0.6)}px ${u(1.2)}px`, background: t.palette.accent, border: `1px solid ${t.palette.negative || t.palette.dark}`, color: t.palette.textOnAccent, ...bodyFont(t), fontSize: u(size), transform: `scale(${0.71 + 0.29 * p})`, transformOrigin: 'left center', opacity: Math.min(1, p * 2) * (ex ? ex.opacity : 1), boxShadow: `0 ${u(0.5)}px ${u(1.5)}px ${alpha(t.palette.dark, 0.35)}`, whiteSpace: 'nowrap'}}><Rich text={text} /></div>
  );
};

// ৯. lower third (ডিফল্ট): বার ১০ ফ্রেম, নাম ৪ ফ্রেম পরে, উপাধি আরও ৪ ফ্রেম পরে
export const LowerThird: React.FC<{name: string; title?: string; at: number; exitAt?: number}> = ({name, title, at, exitAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W} = useU();
  if (frame < at) return null;
  const pb = prog(frame - at, f30(10, fps), E.cardSlide);
  const pn = prog(frame - at - f30(4, fps), f30(8, fps), E.rise);
  const pt = prog(frame - at - f30(8, fps), f30(8, fps), E.rise);
  const ex = exitAt !== undefined && frame >= exitAt ? exit.card(frame - exitAt, fps, W, -1) : null;
  return (
    <div style={{display: 'inline-flex', alignItems: 'stretch', gap: u(1.6), padding: `${u(1.4)}px ${u(2.6)}px ${u(1.4)}px ${u(1.4)}px`, borderRadius: u(1.4), background: alpha(t.palette.dark, 0.72), clipPath: `inset(0 ${(1 - pb) * 100}% 0 0 round ${u(1.4)}px)`, ...(ex || {})}}>
      <div style={{width: u(0.6), borderRadius: u(0.3), background: t.palette.accent}} />
      <div>
        <div style={{...bodyFont(t), fontSize: u(4), color: t.palette.light, opacity: pn, transform: `translateY(${(1 - pn) * u(1)}px)`}}><Rich text={name} /></div>
        {title && <div style={{...bodyFont(t), fontSize: u(2.6), color: alpha(t.palette.light, 0.8), opacity: pt}}><Rich text={title} /></div>}
      </div>
    </div>
  );
};

// ১০. ছবির গ্রিড/পোলারয়েড (T1): ছবি পপ, নিচে সংখ্যা
export const PhotoGrid: React.FC<{items: {src: React.ReactNode; label?: string; at: number}[]; cols?: number}> = ({items, cols = 3}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  return (
    <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: u(2.4), width: '100%'}}>
      {items.map((it, i) => (
        <div key={i} style={{...enter.iconPop(frame - it.at, fps, H, 10), background: t.palette.light, padding: u(1), paddingBottom: u(3.5), boxShadow: `0 ${u(0.8)}px ${u(2)}px ${alpha(t.palette.dark, 0.4)}`, transform: `${enter.iconPop(frame - it.at, fps, H, 10).transform} rotate(${(i % 2 ? 1 : -1) * 1.5}deg)`}}>
          <div style={{aspectRatio: '1', overflow: 'hidden', background: alpha(t.palette.dark, 0.1)}}>{it.src}</div>
          {it.label && <div style={{display: 'flex', alignItems: 'center', gap: u(0.6), fontFamily: fontStack(t), fontSize: u(2.2), color: t.palette.negative || t.palette.accent, marginTop: u(0.6)}}><Icon name="heart" size={u(2.2)} fill color={t.palette.negative || t.palette.accent} />{it.label}</div>}
        </div>
      ))}
    </div>
  );
};
