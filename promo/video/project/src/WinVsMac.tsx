// Tuki — motion video 2: Windows vs Mac. Hook compares Win+V with ⌘V, then Mac's gaps, then Tuki's answer.
// All times are VOICE seconds (T below). When the real voice arrives, only T needs retiming.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThemeProvider, useTheme, alpha, bodyFont, keyFont} from './style/theme';
import {E} from './style/easing';
import {prog, f30} from './style/motion';
import {useU} from './style/layout';
import {THEME, Fonts, Backdrop, Scene, BlurLine, useSec, OFF, timed, NEUTRAL} from './brand';
import {Keycap, Cursor, Logo, Panel, Row, MacWindow, Caret, Pop, Icon, Dots, useP, MacDevice, PopOut, useDrift, Camera, CamKey, FeaturePill} from './ui';

// ---- voice timing (seconds) — estimates from the storyboard until the voice is recorded ----
export const T = { // synced to Voice/winmac-take-1.mp3 (Rahat, ElevenLabs)
  win: 0.0, mac: 5.0, search: 9.2, problems: 13.7, p1: 13.9, p2: 15.3, p3: 16.2, p4: 17.9, strong: 20.5, reveal: 24.2,
  allCopies: 26.0, emoji: 31.7, snippets: 35.3, secret: 38.9, secretOpen: 42.0, soundUpdate: 44.6, update: 46.4, end: 48.3, endCta: 50.7, total: 54.6,
};
// Windows-style colours (approved in the storyboard: cool blue-grey, only for the Windows side)
const WIN = {bg1: '#3E5578', bg2: '#22304A', bar: 'rgba(10,16,30,0.72)', panel: '#E8EEF7', row: '#FFFFFF', ink: '#24324A'};

const Abs: React.FC<{x: number; y: number; children: React.ReactNode; center?: boolean; w?: number; style?: React.CSSProperties}> = ({x, y, children, center, w, style}) => (
  <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: w !== undefined ? `${w}%` : undefined, transform: center ? 'translate(-50%, -50%)' : undefined, ...style}}>{children}</div>
);

// bottom caption bar: short Bangla line, keyword (**…**) in orange
const Caption: React.FC<{text: string; at: number; until: number}> = ({text, at, until}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  if (frame < sec(at) || frame >= sec(until)) return null;
  const p = prog(frame - sec(at), f30(6, fps), E.rise);
  const q = prog(frame - (sec(until) - f30(4, fps)), f30(4, fps), E.in);
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <div style={{position: 'absolute', left: '50%', bottom: '6%', transform: `translate(-50%, ${(1 - p) * u(1.5)}px)`, opacity: p * (1 - q), filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined, padding: `${u(0.8)}px ${u(2.4)}px`, borderRadius: u(1.4), background: alpha(t.palette.dark, 0.8), color: t.palette.light, fontSize: u(3.6), whiteSpace: 'nowrap', ...bodyFont(t), zIndex: 40}}>
      {parts.map((s, i) => s.startsWith('**') ? <span key={i} style={{...keyFont(t), color: t.palette.primary}}>{s.slice(2, -2)}</span> : <span key={i}>{s}</span>)}
    </div>
  );
};
// soft fade on the left so a headline stays readable beside the zoomed Mac
const LeftFade: React.FC = () => <AbsoluteFill style={{background: `linear-gradient(90deg, ${NEUTRAL} 0%, ${alpha(NEUTRAL, 0.94)} 33%, ${alpha(NEUTRAL, 0)} 50%)`}} />;

// ===================== 1–2. HOOK: Windows (Win+V) vs Mac (⌘V) =====================
const CLIPS = ['House 12, Road 5, Dhanmondi', 'Meeting moved to Thursday 3:30 PM', 'hello@example.com', '#F26B1D', 'invoice_final.pdf'];
const WinSide: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, w, h} = useU();
  const sec = useSec();
  const up = prog(frame - sec(T.win + 1.15), f30(14, fps), E.rise);
  return (
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${WIN.bg1}, ${WIN.bg2})`, overflow: 'hidden'}}>
      {/* soft light on the desktop */}
      <div style={{position: 'absolute', left: '-20%', top: '-30%', width: '90%', height: '90%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,180,255,0.25), transparent 65%)'}} />
      {/* clipboard history panel rising from the taskbar */}
      <div style={{position: 'absolute', left: '50%', bottom: h(11), width: u(60), transform: `translate(-50%, ${(1 - up) * u(30)}px)`, opacity: up, padding: u(1.8), borderRadius: u(1.4), background: WIN.panel, boxShadow: '0 20px 50px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', gap: u(0.9)}}>
        <div style={{fontSize: u(2.6), ...keyFont(t), color: WIN.ink, marginBottom: u(0.4)}}>Clipboard</div>
        {CLIPS.map((c, i) => {
          const pr = prog(frame - sec(T.win + 1.4 + i * 0.12), f30(8, fps), E.rise);
          return <div key={c} style={{opacity: pr, transform: `translateY(${(1 - pr) * u(1.5)}px)`, padding: `${u(1)}px ${u(1.4)}px`, borderRadius: u(0.7), background: WIN.row, fontSize: u(2.5), ...bodyFont(t), color: WIN.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c}</div>;
        })}
      </div>
      {/* taskbar */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h(8), background: WIN.bar, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(1.6)}}>
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{width: u(3.6), height: u(3.6), borderRadius: u(0.7), background: i === 0 ? 'rgba(120,170,255,0.9)' : 'rgba(255,255,255,0.5)'}} />)}
      </div>
      <div style={{position: 'absolute', left: w(2), top: h(4), fontSize: u(2.6), ...keyFont(t), color: 'rgba(255,255,255,0.9)', letterSpacing: u(0.2)}}>WINDOWS</div>
    </div>
  );
};
const MacSide: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, w, h} = useU();
  const sec = useSec();
  const appear = prog(frame - sec(T.mac), f30(10, fps), E.out);
  const one = prog(frame - sec(T.mac + 1.2), f30(10, fps), E.rise);
  const gone = prog(frame - sec(T.mac + 1.8), f30(16, fps), E.in);
  return (
    <div style={{position: 'absolute', inset: 0, background: NEUTRAL, opacity: appear, overflow: 'hidden'}}>
      <Backdrop />
      <div style={{position: 'absolute', left: w(6), top: h(4), fontSize: u(2.6), ...keyFont(t), color: alpha(t.palette.dark, 0.8), letterSpacing: u(0.2)}}>MAC</div>
      <div style={{position: 'absolute', left: '50%', top: h(20), transform: 'translateX(-50%)', display: 'flex', gap: u(1.4)}}>
        <Keycap label="⌘" at={T.mac + 0.25} press={T.mac + 0.75} size={9} />
        <Keycap label="V" at={T.mac + 0.35} press={T.mac + 0.75} size={9} />
      </div>
      {/* only the last copy comes back */}
      <div style={{position: 'absolute', left: '50%', top: h(48), width: u(44), transform: `translate(-50%, ${(1 - one) * u(2)}px)`, opacity: one, padding: `${u(1.6)}px ${u(2)}px`, borderRadius: u(1.2), background: t.palette.light, border: `${u(0.3)}px solid ${t.palette.primary}`, fontSize: u(2.4), ...bodyFont(t), color: t.palette.text}}>
        {CLIPS[1]}
      </div>
      {/* the earlier copies fade away */}
      <div style={{position: 'absolute', left: '50%', top: h(62), transform: `translateX(-50%) translateY(${gone * u(3)}px)`, width: u(44), display: 'flex', flexDirection: 'column', gap: u(0.8), opacity: 0.55 * (1 - gone), filter: `blur(${1.5 + gone * 10}px)`}}>
        {[CLIPS[0], CLIPS[2], CLIPS[3]].map((c) => <div key={c} style={{padding: `${u(0.8)}px ${u(1.4)}px`, borderRadius: u(0.7), background: alpha(t.palette.dark, 0.06), fontSize: u(1.9), ...bodyFont(t)}}>{c}</div>)}
      </div>
    </div>
  );
};
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, W, H} = useU();
  const sec = useSec();
  // the Windows side fills the frame, then slides to the left half when the Mac side arrives
  const split = interpolate(frame, [sec(T.mac - 0.2), sec(T.mac + 0.4)], [100, 50], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOut});
  const vs = prog(frame - sec(T.mac + 0.3), f30(10, fps), E.pop);
  return (
    <AbsoluteFill>
      {/* each side is a full-frame scene seen through its half, centred in that half */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${split}%`, overflow: 'hidden'}}><div style={{position: 'absolute', top: 0, left: -((100 - split) / 2) * W / 100, width: W, height: H}}><WinSide /></div></div>
      <div style={{position: 'absolute', left: `${split}%`, top: 0, bottom: 0, right: 0, overflow: 'hidden'}}><div style={{position: 'absolute', top: 0, left: -W / 4, width: W, height: H}}><MacSide /></div></div>
      {frame < sec(T.mac) && (
        <Abs x={74} y={30} center><div style={{display: 'flex', gap: u(1.4)}}><Keycap label="win" at={T.win + 0.25} press={T.win + 0.85} size={9} /><Keycap label="V" at={T.win + 0.35} press={T.win + 0.85} size={9} /></div></Abs>
      )}
      {frame >= sec(T.mac + 0.3) && (
        <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${0.4 + 0.6 * vs})`, opacity: vs, width: u(14), height: u(14), borderRadius: '50%', background: t.palette.dark, color: t.palette.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: u(5), ...keyFont(t), boxShadow: `0 ${u(1)}px ${u(4)}px ${alpha(t.palette.dark, 0.4)}`, zIndex: 10}}>VS</div>
      )}
    </AbsoluteFill>
  );
};

// ===================== 3. searching app after app =====================
const APPS: {icon: 'mail' | 'note' | 'globe'; name: string}[] = [{icon: 'mail', name: 'Mail'}, {icon: 'note', name: 'Notes'}, {icon: 'globe', name: 'Safari'}];
const Search: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const step = f30(13, fps);
  const k = Math.max(0, Math.floor((frame - sec(T.search + 0.3)) / step));
  const front = k % 3;
  const tries = Math.min(5, 1 + k);
  return (
    <AbsoluteFill>
      <Backdrop />
      {APPS.map((a, i) => {
        const order = (i - front + 3) % 3; // 0 = front
        const x = 22 + order * 9, y = 20 + order * 7;
        return (
          <div key={a.name} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: '50%', height: '56%', zIndex: 10 - order, transition: 'none', transform: `scale(${1 - order * 0.05})`, opacity: 1 - order * 0.18}}>
            <Pop at={T.search + i * 0.1} dur={10}>
              <MacWindow width={96} height={58} title={a.name}>
                <div style={{display: 'flex', alignItems: 'center', gap: u(1.4)}}><Icon name={a.icon} size={u(4)} color={t.palette.accent} stroke={2} /><span style={{fontSize: u(2.8), ...keyFont(t)}}>{a.name}</span></div>
                {[70, 85, 55, 78].map((wd, j) => <div key={j} style={{marginTop: u(1.4), height: u(1.6), width: `${wd}%`, borderRadius: u(0.6), background: alpha(t.palette.dark, 0.08)}} />)}
              </MacWindow>
            </Pop>
          </div>
        );
      })}
      <Abs x={86} y={10} center>
        <Pop at={T.search + 0.4} dur={8}>
          <div style={{padding: `${u(0.9)}px ${u(2.2)}px`, borderRadius: u(4), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(2.8), whiteSpace: 'nowrap', ...keyFont(t)}}>আবার খোঁজা · {tries.toLocaleString('bn-BD')} বার</div>
        </Pop>
      </Abs>
    </AbsoluteFill>
  );
};

// ===================== 4. four gaps, each crossed out =====================
const GAPS: {icon: 'smile' | 'gif' | 'keyboard' | 'lock'; label: string; at: number}[] = [
  {icon: 'smile', label: 'Emoji আলাদা জায়গায়', at: T.p1}, {icon: 'gif', label: 'GIF নেই', at: T.p2},
  {icon: 'keyboard', label: 'বারবার একই টাইপ', at: T.p3}, {icon: 'lock', label: 'Password খোলা পড়ে থাকে', at: T.p4},
];
const Gaps: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{position: 'absolute', left: '8%', right: '8%', top: '16%', bottom: '18%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: u(3)}}>
        {GAPS.map((g) => {
          const p = prog(frame - sec(g.at), f30(12, fps), E.rise);
          const x = prog(frame - sec(g.at + 0.6), f30(8, fps), E.pop);
          return (
            <div key={g.label} style={{position: 'relative', opacity: p, transform: `translateY(${(1 - p) * u(4)}px)`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : x > 0 ? `saturate(${1 - x * 0.6})` : undefined, borderRadius: u(2.4), background: t.palette.light, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.1)}`, display: 'flex', alignItems: 'center', gap: u(2.4), padding: `0 ${u(3)}px`}}>
              <div style={{width: u(10), height: u(10), borderRadius: u(2.4), background: alpha(t.palette.primary, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name={g.icon} size={u(6)} color={t.palette.accent} stroke={2} /></div>
              <div style={{fontSize: u(4), ...keyFont(t), color: t.palette.text, textDecoration: x > 0.5 ? 'line-through' : 'none', textDecorationThickness: u(0.3)}}>{g.label}</div>
              {frame >= sec(g.at + 0.6) && (
                <div style={{position: 'absolute', right: -u(1.6), top: -u(1.6), width: u(6), height: u(6), borderRadius: '50%', background: t.palette.dark, border: `${u(0.4)}px solid ${t.palette.light}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.4 + 0.6 * x})`, opacity: x}}>
                  <Icon name="x" size={u(3.4)} color={t.palette.light} stroke={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ===================== 5. a powerful Mac with something missing =====================
const Missing: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const s = interpolate(frame, [sec(T.strong), sec(T.reveal)], [1.25, 0.95], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.push});
  const glow = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <AbsoluteFill>
      <Backdrop />
      <Abs x={50} y={48} center>
        <div style={{transform: `scale(${s})`}}>
          <MacDevice width={92} rotY={0} rotX={6}>
            <div style={{position: 'absolute', left: '60%', top: '12%', width: '28%', height: '74%', borderRadius: u(1.4), border: `${u(0.45)}px dashed ${alpha(t.palette.primary, 0.6 + 0.4 * glow)}`, boxShadow: `0 0 ${u(4) * glow}px ${alpha(t.palette.primary, 0.45)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: u(9), ...keyFont(t), color: alpha(t.palette.accent, 0.7)}}>?</div>
          </MacDevice>
        </div>
      </Abs>
    </AbsoluteFill>
  );
};

// ===================== 6. Tuki reveal =====================
const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const rings = [0, 0.25, 0.5].map((d) => prog(frame - sec(T.reveal + 0.15 + d), f30(30, fps), E.out));
  return (
    <AbsoluteFill>
      <Backdrop strength={1.7} />
      <Abs x={50} y={40} center>
        <div style={{position: 'relative', width: u(22), height: u(22)}}>
          {rings.map((p, i) => p > 0 && p < 1 ? <div key={i} style={{position: 'absolute', left: '50%', top: '50%', width: u(22) * (1 + p * 1.7), height: u(22) * (1 + p * 1.7), transform: 'translate(-50%, -50%)', borderRadius: '30%', border: `${u(0.4)}px solid ${alpha(t.palette.primary, 0.6 * (1 - p))}`}} /> : null)}
          <Pop at={T.reveal + 0.1} dur={14} from={0.5}><Logo size={22} /></Pop>
        </div>
      </Abs>
      <Abs x={50} y={66} center w={90}><BlurLine size={10} keyColor={t.palette.text} words={[{t: '**Tuki**', at: T.reveal + 0.6}]} /></Abs>
      <Abs x={50} y={77} center w={90}><BlurLine size={3.6} words={timed('Mac-এর জন্য Clipboard Manager', T.reveal + 1.0, 0.12)} color={alpha(t.palette.dark, 0.7)} /></Abs>
    </AbsoluteFill>
  );
};

// ===================== 7–11. features on the MacBook =====================
const MAC_W = 84;
const Mac: React.FC<{a: number; b: number; children: React.ReactNode}> = ({a, b, children}) => {
  const ry = useDrift(-24, -14, a, b);
  const rx = useDrift(6, 3, a, b);
  return <Abs x={43} y={16}><Pop at={a} dur={16} from={0.88}><MacDevice width={MAC_W} rotY={ry} rotX={rx}>{children}</MacDevice></Pop></Abs>;
};
const On: React.FC<{x: number; y: number; children: React.ReactNode}> = ({x, y, children}) => <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`}}>{children}</div>;
const WIDE = (at: number): CamKey => ({at, f: [67, 45], s: 0.92});
const BACK = (at: number, dur = 0.45): CamKey => ({at, dur, f: [67, 45], s: 1});

const AllCopies: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const a = T.allCopies;
  const keysOut = useP(a + 1.0, 6, E.in);
  const hi = useP(a + 2.4, 6);
  const rows = [
    {title: 'Meeting moved to Thursday 3:30 PM', meta: 'Text · Mail', lead: 'Aa'},
    {title: 'developer.apple.com/documentation', meta: 'Link · Safari', lead: 'www'},
    {title: 'Screenshot 9.41 AM.png', meta: 'Image · 1440 × 900', lead: 'IMG'},
    {title: 'invoice_final.pdf', meta: 'File · Finder', lead: 'PDF'},
    {title: 'House 12, Road 5, Dhanmondi', meta: 'Text · Notes', lead: 'Aa', pinned: true},
  ];
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(a + 1.1), {at: a + 1.8, dur: 0.7, f: [80, 38], s: 1.85, t: [70, 48]}, BACK(a + 4.0)]}>
        <Mac a={a + 1.1} b={a + 4.5}>
          <On x={4} y={13}><MacWindow width={42} height={26} title="Notes"><div style={{fontSize: u(2.4), ...keyFont(t)}}>আজকের কাজ</div><div>সব কপি এক জায়গায়…<Caret /></div></MacWindow></On>
          <On x={62} y={8}><Panel tab="clips" width={22} search="Search clipboard history">{rows.map((r, i) => <Row key={i} width={22} {...r} hi={i === 1 ? hi : 0} />)}</Panel></On>
        </Mac>
      </Camera>
      <LeftFade />
      <Abs x={50} y={45} center>
        <div style={{display: 'flex', gap: u(2), opacity: 1 - keysOut, filter: keysOut > 0 ? `blur(${keysOut * 12}px)` : undefined}}>
          <Keycap label="⇧" at={a + 0.05} press={a + 0.45} size={13} />
          <Keycap label="⌘" at={a + 0.2} press={a + 0.65} size={13} />
          <Keycap label="V" at={a + 0.35} press={a + 0.85} size={13} />
        </div>
      </Abs>
      <Abs x={6} y={34} w={36}>
        <BlurLine align="left" size={6.2} words={[...timed('সব কপি,', a + 1.4, 0.2), {t: '**এক জায়গায়।**', at: a + 1.9}]} />
        <div style={{height: u(1.6)}} />
        <BlurLine align="left" size={3.6} words={timed('লেখা · লিংক · ছবি · ফাইল', a + 2.6, 0.18)} color={alpha(t.palette.dark, 0.7)} />
      </Abs>
    </AbsoluteFill>
  );
};

const EMOJI = ['😀', '😂', '🥹', '😍', '😎', '🤔', '🥳', '😭', '👍', '🙏', '👏', '🔥', '❤️', '💯', '🎉', '✅', '🥭', '🍋', '☕', '🌙', '⭐', '🚀', '💡', '📌', '৳', '।', '০', '১', '২', '৩', '৪', '৫'];
const Emoji: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const a = T.emoji;
  const sel = useP(a + 2.3, 6);
  const typed = useP(a + 2.5, 8);
  const k = (v: number) => u(v * (22 / 38));
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(a), {at: a + 0.5, dur: 0.7, f: [80, 34], s: 1.8, t: [70, 48]}, {at: a + 2.45, dur: 0.5, f: [59, 34], s: 1.8, t: [66, 48]}]}>
        <Mac a={a} b={a + 3.5}>
          <On x={4} y={13}><MacWindow width={42} height={22} title="Messages">আজকের মিটিং দারুণ হয়েছে <span style={{opacity: typed, ...bodyFont(t)}}>{typed > 0 ? '😂' : ''}</span><Caret /></MacWindow></On>
          <On x={62} y={8}>
            <Panel tab="emoji" width={22} search="Search emoji">
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: k(0.5)}}>
                {EMOJI.map((e, i) => <div key={i} style={{height: k(3.4), borderRadius: k(0.8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: k(2.2), ...bodyFont(t), background: i === 1 ? alpha(t.palette.primary, 0.3 * sel) : 'transparent'}}>{e}</div>)}
              </div>
            </Panel>
          </On>
        </Mac>
        <Cursor path={[{x: 90, y: 50, at: a + 1.8}, {x: 76.7, y: 31, at: a + 2.25}]} clicks={[a + 2.3]} size={2.2} />
      </Camera>
      <LeftFade />
      <Abs x={6} y={18}><div style={{display: 'flex', flexDirection: 'column', gap: u(2), alignItems: 'flex-start'}}>
        <FeaturePill icon="smile" label="Emoji" at={a + 0.05} size={3.8} />
        <FeaturePill icon="gif" label="GIF" at={a + 0.5} size={3.8} />
        <FeaturePill icon="sticker" label="Sticker" at={a + 0.95} size={3.8} />
        <FeaturePill icon="symbol" label="বাংলা symbol  ৳ । ১২৩" at={a + 1.5} size={3.8} />
      </div></Abs>
    </AbsoluteFill>
  );
};

const Snippets: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const a = T.snippets;
  const hi = useP(a + 1.55, 6);
  const pasted = useP(a + 1.95, 8);
  const k = (v: number) => u(v * (22 / 38));
  const snips = [{title: 'Reply: on it', meta: 'Work'}, {title: 'Home address', meta: 'Personal'}, {title: 'Invoice footer', meta: 'Work'}, {title: 'Undo last commit', meta: 'Code'}];
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(a), {at: a + 0.6, dur: 0.7, f: [80, 36], s: 1.8, t: [70, 48]}, {at: a + 1.85, dur: 0.55, f: [59, 34], s: 1.8, t: [66, 48]}]}>
        <Mac a={a} b={a + 3}>
          <On x={4} y={13}><MacWindow width={42} height={22} title="Messages"><span style={{opacity: pasted, background: pasted > 0 ? alpha(t.palette.primary, 0.14) : undefined, borderRadius: u(0.4)}}>{pasted > 0 ? 'House 12, Road 5, Dhanmondi, Dhaka 1205' : ''}</span><Caret /></MacWindow></On>
          <On x={62} y={8}>
            <Panel tab="snips" width={22} search="Search snippets">
              <div style={{display: 'flex', gap: k(0.6)}}>{['All', 'Work', 'Personal', 'Code'].map((f, i) => <div key={f} style={{padding: `${k(0.4)}px ${k(1.1)}px`, borderRadius: k(2), fontSize: k(1.15), background: i === 0 ? alpha(t.palette.primary, 0.16) : alpha(t.palette.dark, 0.05), color: i === 0 ? t.palette.accent : alpha(t.palette.dark, 0.6), ...(i === 0 ? keyFont(t) : bodyFont(t))}}>{f}</div>)}</div>
              {snips.map((s, i) => <Row key={i} width={22} title={s.title} meta={s.meta} hi={i === 1 ? hi : 0} />)}
            </Panel>
          </On>
        </Mac>
        <Cursor path={[{x: 92, y: 60, at: a + 1.1}, {x: 79, y: 37.5, at: a + 1.5}]} clicks={[a + 1.55]} size={2.2} />
      </Camera>
      <LeftFade />
      <Abs x={6} y={30} w={36}>
        <BlurLine align="left" size={7.4} words={[{t: '**Snippets**', at: a + 0.6}]} />
        <div style={{height: u(1)}} />
        <BlurLine align="left" size={4.4} words={[...timed('বারবার লেখা জিনিস,', a + 0.1, 0.18), {t: '**এক click-এ।**', at: a + 1.4}]} />
      </Abs>
    </AbsoluteFill>
  );
};

const Secret: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const a = T.secret, o = T.secretOpen;
  const dlgOut = useP(o - 0.05, 6, E.in);
  const open = frame >= sec(o);
  const dots = Math.max(0, Math.min(10, Math.floor((frame - sec(a + 1.6)) / f30(2.4, fps))));
  const k = (v: number) => u(v * (22 / 38));
  const unl = useP(o, 10);
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(a), {at: a + 0.7, dur: 0.8, f: [68, 37], s: 1.7, t: [72, 48]}, {at: a + 1.3, dur: 0.6, f: [68, 40], s: 1.25, t: [74, 50]}, {at: o, dur: 0.6, f: [68, 37], s: 1.8, t: [72, 48]}, BACK(T.soundUpdate - 0.6, 0.5)]}>
        <Mac a={a} b={T.soundUpdate}>
          <On x={36} y={8}>
            <Panel tab="secret" width={22} search="Search confidential">
              {!open ? (
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: k(1.2), textAlign: 'center'}}>
                  <Icon name="lock" size={k(6)} color={t.palette.primary} stroke={2.2} />
                  <div style={{fontSize: k(2), ...keyFont(t)}}>Confidential is locked</div>
                  <div style={{marginTop: k(0.6), padding: `${k(0.6)}px ${k(1.8)}px`, borderRadius: k(0.8), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: k(1.4), ...keyFont(t)}}>Unlock</div>
                </div>
              ) : (
                <div style={{opacity: unl, display: 'flex', flexDirection: 'column', gap: k(0.8)}}>
                  {[['Bank account', 12], ['Wi-Fi password', 10], ['bKash PIN', 5], ['Server login', 14]].map(([n, c], i) => <Row key={i} width={22} title="" masked={c as number} meta={n as string} lead={<Icon name="lock" size={k(1.5)} color={t.palette.accent} />} />)}
                </div>
              )}
            </Panel>
          </On>
        </Mac>
      </Camera>
      <LeftFade />
      <Abs x={6} y={18} w={29}>
        <BlurLine align="left" size={6.8} words={[{t: '**Confidential**', at: a + 0.2}]} />
        <div style={{height: u(1.4)}} />
        <BlurLine align="left" size={4} words={timed('password · account number', a + 0.9, 0.2)} color={alpha(t.palette.dark, 0.75)} />
      </Abs>
      <Abs x={6} y={70} w={36}>
        <BlurLine align="left" size={4.6} words={[...timed('খোলে শুধু আপনার', o + 0.1, 0.2), {t: '**Mac-এর password দিয়ে।**', at: o + 0.7}]} />
      </Abs>
      <Abs x={36} y={30}>
        <div style={{opacity: 1 - dlgOut, filter: dlgOut > 0 ? `blur(${dlgOut * 8}px)` : undefined}}>
          <PopOut at={a + 1.3} rot={10}>
            <div style={{width: u(36), padding: u(2.8), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(1.2), ...bodyFont(t), color: t.palette.text, textAlign: 'center'}}>
              <Logo size={6} shadow={false} />
              <div style={{fontSize: u(1.9), ...keyFont(t)}}>Tuki</div>
              <div style={{fontSize: u(1.5), color: alpha(t.palette.dark, 0.65)}}>Tuki is trying to open your Confidential items.</div>
              <div style={{width: '100%', height: u(3.6), borderRadius: u(0.8), border: `${u(0.2)}px solid ${t.palette.primary}`, display: 'flex', alignItems: 'center', padding: `0 ${u(1)}px`}}><Dots n={dots} size={u(0.9)} color={t.palette.text} /><Caret /></div>
              <div style={{alignSelf: 'stretch', padding: `${u(0.8)}px 0`, borderRadius: u(0.8), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(1.6), ...keyFont(t)}}>Use Password</div>
            </div>
          </PopOut>
        </div>
      </Abs>
    </AbsoluteFill>
  );
};

const SoundUpdate: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const a = T.soundUpdate, up = T.update;
  const done = frame >= sec(up + 0.85);
  const d = useP(up + 0.85, 8, E.pop);
  const rings = [0, 0.18, 0.36].map((dd) => prog(frame - sec(a + 0.55 + dd), f30(24, fps), E.out));
  return (
    <AbsoluteFill>
      <Backdrop />
      {/* copy → sound */}
      <Abs x={25} y={42} center>
        <div style={{position: 'relative', display: 'flex', gap: u(1.4)}}>
          <Keycap label="⌘" at={a + 0.05} press={a + 0.5} size={10} />
          <Keycap label="C" at={a + 0.15} press={a + 0.5} size={10} />
          {rings.map((p, i) => p > 0 && p < 1 ? <div key={i} style={{position: 'absolute', left: '50%', top: '50%', width: u(24) * (0.6 + p), height: u(24) * (0.6 + p), transform: 'translate(-50%, -50%)', borderRadius: '50%', border: `${u(0.45)}px solid ${alpha(t.palette.primary, 0.7 * (1 - p))}`}} /> : null)}
        </div>
      </Abs>
      <Abs x={25} y={64} center w={40}><BlurLine size={4.4} words={[{t: 'কপি', at: a + 0.6}, {t: 'করলেই', at: a + 0.8}, {t: '**শব্দ**', at: a + 1.05}]} /></Abs>
      {/* one-click update */}
      <Abs x={70} y={46} center>
        <Pop at={up - 0.2} dur={12}>
          <div style={{width: u(52), padding: u(3), display: 'flex', gap: u(2.4), alignItems: 'center', ...bodyFont(t), color: t.palette.text, background: t.palette.light, borderRadius: u(2), boxShadow: `0 ${u(1.5)}px ${u(5)}px ${alpha(t.palette.dark, 0.18)}`}}>
            <Logo size={10} shadow={false} />
            <div style={{flex: 1}}>
              <div style={{fontSize: u(2.8), ...keyFont(t)}}>Tuki 1.3 is available</div>
              <div style={{fontSize: u(1.8), color: alpha(t.palette.dark, 0.6), marginTop: u(0.4)}}>Your history and settings stay.</div>
              <div style={{display: 'flex', gap: u(1), marginTop: u(1.8)}}>
                <div style={{padding: `${u(0.9)}px ${u(2.2)}px`, borderRadius: u(1), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(2), ...keyFont(t), display: 'flex', alignItems: 'center', gap: u(0.8), transform: done ? `scale(${1 + 0.06 * Math.sin(d * Math.PI)})` : undefined}}>
                  {done ? <><Icon name="check" size={u(2.4)} color={t.palette.textOnAccent} stroke={3} /> Updated</> : 'Install Update'}
                </div>
                {!done && <div style={{padding: `${u(0.9)}px ${u(2.2)}px`, borderRadius: u(1), background: alpha(t.palette.dark, 0.06), fontSize: u(2)}}>Later</div>}
              </div>
            </div>
          </div>
        </Pop>
      </Abs>
      <Abs x={70} y={68} center w={40}><BlurLine size={4.4} words={[{t: 'আপডেট', at: up + 0.2}, {t: '**এক click-এ**', at: up + 0.5}]} /></Abs>
      <Cursor path={[{x: 82, y: 80, at: up + 0.3}, {x: 64.5, y: 52.5, at: up + 0.75}]} clicks={[up + 0.8]} size={2.6} />
    </AbsoluteFill>
  );
};

// ===================== 12. comparison → Tuki takes over → CTA =====================
const WIN_HAS = ['History', 'Emoji', 'GIF'];
const TUKI_HAS = ['History', 'Emoji · GIF', 'Sticker', 'বাংলা symbol', 'Snippets', 'Confidential', 'Copy sound', '১-click update'];
const End: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const a = T.end, c = T.endCta;
  const take = interpolate(frame, [sec(c - 0.3), sec(c + 0.4)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOut});
  const winW = 34 * (1 - take);
  const listOut = 1 - take;
  return (
    <AbsoluteFill>
      <Backdrop />
      {/* Windows column shrinks away */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${winW}%`, overflow: 'hidden', background: `linear-gradient(160deg, ${WIN.bg1}, ${WIN.bg2})`}}>
        <div style={{position: 'absolute', left: u(5), top: '22%', width: u(40), color: 'rgba(255,255,255,0.95)'}}>
          <div style={{fontSize: u(3.4), ...keyFont(t), marginBottom: u(2)}}>Windows · Win+V</div>
          {WIN_HAS.map((x, i) => {
            const p = prog(frame - sec(a + 0.2 + i * 0.2), f30(8, fps), E.rise);
            return <div key={x} style={{opacity: p, fontSize: u(3.2), ...bodyFont(t), marginBottom: u(1.2), display: 'flex', alignItems: 'center', gap: u(1)}}><Icon name="check" size={u(3.2)} color="rgba(160,200,255,1)" stroke={3} />{x}</div>;
          })}
        </div>
      </div>
      {/* Tuki list */}
      <div style={{position: 'absolute', left: `${winW + 6}%`, top: '14%', opacity: listOut, filter: take > 0 ? `blur(${take * 10}px)` : undefined}}>
        <div style={{fontSize: u(3.6), ...keyFont(t), color: t.palette.text, marginBottom: u(2), display: 'flex', alignItems: 'center', gap: u(1.4)}}><Logo size={5} shadow={false} /> Tuki · Mac</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: u(5)}}>
          {TUKI_HAS.map((x, i) => {
            const p = prog(frame - sec(a + 0.6 + i * 0.17), f30(8, fps), E.rise);
            return <div key={x} style={{opacity: p, transform: `translateY(${(1 - p) * u(1)}px)`, fontSize: u(3.2), ...keyFont(t), color: t.palette.text, marginBottom: u(1.4), display: 'flex', alignItems: 'center', gap: u(1)}}><Icon name="check" size={u(3.4)} color={t.palette.accent} stroke={3} />{x}</div>;
          })}
        </div>
      </div>
      {/* CTA once Tuki takes the whole frame */}
      {frame >= sec(c) && (
        <>
          <Abs x={50} y={22} center><Pop at={c} dur={14} from={0.6}><Logo size={15} /></Pop></Abs>
          <Abs x={50} y={43} center w={90}><BlurLine size={9} keyColor={t.palette.text} words={[{t: '**Tuki**', at: c + 0.2}]} /></Abs>
          <Abs x={50} y={56} center w={90}><BlurLine size={4.2} words={[{t: 'Mac-এর', at: c + 0.5}, {t: 'জন্য', at: c + 0.65}, {t: '**সম্পূর্ণ ফ্রি**', at: c + 0.85}]} /></Abs>
          <Abs x={50} y={69} center>
            <Pop at={c + 1.2} dur={12}>
              <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1.2), padding: `${u(1.1)}px ${u(3)}px`, borderRadius: u(5), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(3.4), ...keyFont(t), boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.accent, 0.35)}`}}>
                <Icon name="download" size={u(3.6)} color={t.palette.textOnAccent} stroke={2.6} /> লিংক কমেন্টে
              </div>
            </Pop>
          </Abs>
          <Abs x={50} y={85} center w={90}>
            <Pop at={c + 1.8} dur={12}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(1.4), fontSize: u(2.8), color: alpha(t.palette.dark, 0.75), ...bodyFont(t)}}>
                বিস্তারিত জানতে ভিজিট করুন
                <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1), padding: `${u(0.6)}px ${u(1.8)}px ${u(0.6)}px ${u(0.7)}px`, borderRadius: u(4), background: t.palette.light, boxShadow: `0 ${u(0.5)}px ${u(1.6)}px ${alpha(t.palette.dark, 0.12)}`, color: t.palette.text, ...keyFont(t)}}>
                  <Img src={staticFile('img/ca-logo.webp')} style={{width: u(4), height: u(4), borderRadius: u(0.8)}} /> Creative Assistant পেইজে
                </div>
              </div>
            </Pop>
          </Abs>
        </>
      )}
    </AbsoluteFill>
  );
};

// ===================== assembly =====================
const SFX: {at: number; file: string}[] = [
  {at: T.win + 0.85, file: 'key'}, {at: T.win + 1.15, file: 'whoosh'}, {at: T.mac + 0.3, file: 'pop'}, {at: T.mac + 0.75, file: 'key'},
  {at: T.search + 0.4, file: 'click'}, {at: T.p1 + 0.6, file: 'error'}, {at: T.p2 + 0.6, file: 'error'}, {at: T.p3 + 0.6, file: 'error'}, {at: T.p4 + 0.6, file: 'error'},
  {at: T.reveal, file: 'whoosh'}, {at: T.reveal + 0.15, file: 'ding'},
  {at: T.allCopies + 0.45, file: 'key'}, {at: T.allCopies + 0.65, file: 'key'}, {at: T.allCopies + 0.85, file: 'key'},
  {at: T.emoji + 2.3, file: 'click'}, {at: T.snippets + 1.55, file: 'click'}, {at: T.secret + 1.6, file: 'type'}, {at: T.secretOpen, file: 'unlock'},
  {at: T.soundUpdate + 0.5, file: 'pop'}, {at: T.update + 0.8, file: 'click'}, {at: T.update + 0.9, file: 'ding'}, {at: T.endCta, file: 'whoosh'},
];
const CAPS: [string, number, number][] = [
  ['Windows-এ **Win + V** — আগের সব কপি', T.win + 0.3, T.mac],
  ['Mac-এ ⌘V — **শুধু শেষ কপিটা**', T.mac + 0.2, T.search],
  ['আগেরটা দরকার? আবার **খুঁজুন**', T.search + 0.2, T.problems],
  ['Mac এত শক্তিশালী… অথচ এটাই **নেই**', T.strong + 0.2, T.reveal],
];
// chosen sounds: K2 key, P1 pop/click, W1 whoosh, own ding, L2 unlock, E2 error, M3 jazz loop
const SFX_SRC: Record<string, [string, number]> = {
  key: ['audio/es/key.mp3', 0.35], pop: ['audio/es/pop.mp3', 0.85], click: ['audio/es/pop.mp3', 0.7],
  whoosh: ['audio/es/whoosh.mp3', 1.0], unlock: ['audio/es/unlock.mp3', 0.85], error: ['audio/es/error.mp3', 0.22],
  ding: ['audio/sfx-ding.wav', 0.28], type: ['audio/sfx-type.wav', 0.28],
};
const MUSIC_FILE = 'audio/es/music-jazz.wav';
export const WINMAC_SEC = Math.ceil(T.total + 0.6);
export const VOICE_FILE: string | null = 'audio/voice-winmac.mp3';

export const TukiWinVsMac: React.FC = () => {
  const {fps} = useVideoConfig();
  const sec = (s: number) => Math.round((s + OFF) * fps);
  const end = WINMAC_SEC * fps;
  return (
    <ThemeProvider theme={THEME}>
      <Fonts>
        <AbsoluteFill>
          <Backdrop />
          <Scene start={0} end={sec(T.search)} enterBlur={false}><Hook /></Scene>
          <Scene start={sec(T.search)} end={sec(T.problems)}><Search /></Scene>
          <Scene start={sec(T.problems)} end={sec(T.strong)}><Gaps /></Scene>
          <Scene start={sec(T.strong)} end={sec(T.reveal)}><Missing /></Scene>
          <Scene start={sec(T.reveal)} end={sec(T.allCopies)}><Reveal /></Scene>
          <Scene start={sec(T.allCopies)} end={sec(T.emoji)}><AllCopies /></Scene>
          <Scene start={sec(T.emoji)} end={sec(T.snippets)}><Emoji /></Scene>
          <Scene start={sec(T.snippets)} end={sec(T.secret)}><Snippets /></Scene>
          <Scene start={sec(T.secret)} end={sec(T.soundUpdate)}><Secret /></Scene>
          <Scene start={sec(T.soundUpdate)} end={sec(T.end)}><SoundUpdate /></Scene>
          <Scene start={sec(T.end)} end={end} exitBlur={false}><End /></Scene>
          {CAPS.map(([c, a, b], i) => <Caption key={i} text={c} at={a} until={b} />)}
        </AbsoluteFill>
        {VOICE_FILE && <Sequence from={sec(0)}><Audio src={staticFile(VOICE_FILE)} /></Sequence>}
        <Audio src={staticFile(MUSIC_FILE)} volume={(f) => interpolate(f, [0, 20, end - 60, end], [0, VOICE_FILE ? 0.15 : 0.35, VOICE_FILE ? 0.15 : 0.35, 0], {extrapolateRight: 'clamp'})} />
        {SFX.map((s, i) => <Sequence key={i} from={sec(s.at)}><Audio src={staticFile(SFX_SRC[s.file][0])} volume={SFX_SRC[s.file][1]} /></Sequence>)}
      </Fonts>
    </ThemeProvider>
  );
};
