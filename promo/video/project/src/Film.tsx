// "Tuki" film in the clean product-ad style of the MacBook Air reference (no Apple assets):
// white backdrop, big centred lines with one orange keyword, a Mac that flies in at many angles, quick cuts.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThemeProvider, Theme, useTheme, alpha, bodyFont, keyFont} from './style/theme';
import {E} from './style/easing';
import {prog, f30} from './style/motion';
import {useU} from './style/layout';
import {THEME, Fonts, Scene, BlurLine, useSec, OFF, timed} from './brand';
import {Keycap, Logo, Panel, Row, MacWindow, Caret, Pop, Icon, Dots, useP, MacDevice} from './ui';

// approved: white + Tuki orange (orange only on big keywords)
const FILM: Theme = {
  ...THEME,
  palette: {primary: '#E8721C', accent: '#E2650F', accent2: '#E8721C', dark: '#1D1D1F', light: '#FFFFFF', text: '#1D1D1F', textOnAccent: '#FFFFFF'},
};
const BG = '#F5F5F7';

const Abs: React.FC<{x: number; y: number; children: React.ReactNode; center?: boolean; w?: number}> = ({x, y, children, center, w}) => (
  <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: w !== undefined ? `${w}%` : undefined, transform: center ? 'translate(-50%, -50%)' : undefined}}>{children}</div>
);

const WhiteBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useTheme();
  const {W, H} = useU();
  const a = frame / 30;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #FFFFFF 0%, ${BG} 70%)`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: W * (0.85 + 0.03 * Math.sin(a * 0.3)) - W * 0.4, top: H * 0.75 - W * 0.4, width: W * 0.8, height: W * 0.8, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(t.palette.primary, 0.08)} 0%, transparent 65%)`}} />
    </AbsoluteFill>
  );
};

// ---------- a Mac flying along key poses (x,y = centre in % of frame, s = scale of a 100u-wide Mac) ----------
type MK = {at: number; dur?: number; x: number; y: number; s: number; ry: number; rx: number; rz?: number; blur?: boolean; ease?: (x: number) => number};
const FlyMac: React.FC<{keys: MK[]; children: React.ReactNode}> = ({keys, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sec = useSec();
  let c = {...keys[0], rz: keys[0].rz ?? 0};
  let bl = 0;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (frame < sec(k.at)) break;
    const p = prog(frame - sec(k.at), Math.max(1, Math.round((k.dur ?? 0.6) * fps)), k.ease ?? E.inOut);
    const L = (a: number, b: number) => a + (b - a) * p;
    c = {...c, x: L(c.x, k.x), y: L(c.y, k.y), s: L(c.s, k.s), ry: L(c.ry, k.ry), rx: L(c.rx, k.rx), rz: L(c.rz, k.rz ?? 0)};
    if (k.blur && p < 1) bl = Math.sin(p * Math.PI) * 16;
  }
  return (
    <div style={{position: 'absolute', left: `${c.x}%`, top: `${c.y}%`, transform: `translate(-50%, -50%) scale(${c.s}) rotateZ(${c.rz}deg)`, filter: bl > 0.3 ? `blur(${bl}px)` : undefined}}>
      <MacDevice width={100} rotY={c.ry} rotX={c.rx}>{children}</MacDevice>
    </div>
  );
};
const On: React.FC<{x: number; y: number; children: React.ReactNode}> = ({x, y, children}) => <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`}}>{children}</div>;

// cursor inside the Mac screen (positions in % of the screen)
const SCursor: React.FC<{from: [number, number]; to: [number, number]; start: number; arrive: number; click: number}> = ({from, to, start, arrive, click}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  if (frame < sec(start)) return null;
  const p = prog(frame - sec(start), Math.max(1, sec(arrive) - sec(start)), E.inOut);
  const x = from[0] + (to[0] - from[0]) * p, y = from[1] + (to[1] - from[1]) * p;
  const c = frame - sec(click);
  const s = c >= 0 && c < f30(8, fps) ? 1 - 0.2 * Math.sin((c / f30(8, fps)) * Math.PI) : 1;
  const ring = c >= 0 && c < f30(10, fps) ? c / f30(10, fps) : -1;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, zIndex: 20}}>
      {ring >= 0 && <div style={{position: 'absolute', left: -u(2) * ring, top: -u(2) * ring, width: u(4) * ring, height: u(4) * ring, borderRadius: '50%', border: `${u(0.3)}px solid ${alpha(t.palette.primary, 1 - ring)}`}} />}
      <svg width={u(2.6)} height={u(2.6)} viewBox="0 0 24 24" style={{transform: `scale(${s})`, transformOrigin: '0 0'}}>
        <path d="M3 2l17 10.5-7.4 1.6L9.4 21z" fill="#FFFFFF" stroke={t.palette.dark} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// thin motion streak (a Mac flashing past, as in the reference)
const Streak: React.FC<{at: number; y: number}> = ({at, y}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const p = prog(frame - sec(at), f30(14, fps), E.inOut);
  if (frame < sec(at) || p >= 1) return null;
  return <div style={{position: 'absolute', top: `${y}%`, left: `${-40 + 160 * p}%`, width: '38%', height: u(1.4), borderRadius: u(1), background: `linear-gradient(90deg, transparent, ${alpha(t.palette.dark, 0.35)}, ${alpha(t.palette.dark, 0.6)}, transparent)`, filter: `blur(${u(0.9)}px)`}} />;
};

const clips = [
  {title: 'hello@example.com', meta: 'Contacts · 2m', pinned: true},
  {title: 'House 12, Road 5, Dhanmondi, Dhaka 1205', meta: 'Notes · 8m'},
  {title: 'Meeting moved to Thursday 3:30 PM', meta: 'Mail · 21m'},
  {title: 'developer.apple.com/documentation', meta: 'Safari · 34m', lead: 'www'},
  {title: '#F26B1D', meta: 'Figma · 1h', lead: '#'},
];
const EMOJI = ['😀', '😂', '🥹', '😍', '😎', '🤔', '🥳', '😭', '👍', '🙏', '👏', '🔥', '❤️', '💯', '🎉', '✅', '🥭', '🍋', '☕', '🌙', '⭐', '🚀', '💡', '📌', '৳', '।', '০', '১', '২', '৩', '৪', '৫'];

// ---------------- scenes ----------------
const F1: React.FC = () => (
  <AbsoluteFill>
    <Abs x={50} y={40} center w={90}><BlurLine size={8} words={[{t: 'কপি।', at: 0.1}, {t: 'আবার', at: 1.6}, {t: 'কপি।', at: 1.9}]} exitAt={2.85} /></Abs>
    <Abs x={50} y={50} center w={90}><BlurLine size={9} words={[{t: 'আগেরটা', at: 3.0}, {t: '**কোথায়?**', at: 3.55}]} /></Abs>
    <Streak at={1.1} y={70} />
  </AbsoluteFill>
);
const F2: React.FC = () => (
  <AbsoluteFill>
    <Abs x={50} y={50} center w={90}><BlurLine size={7.4} words={timed('খুঁজে পাওয়া যায় না।', 4.7, 0.3)} exitAt={6.85} /></Abs>
    <Abs x={50} y={50} center w={90}><BlurLine size={7.4} words={[...timed('আবার খোঁজা।', 7.05, 0.3), {t: 'আবার', at: 8.15}, {t: '**টাইপ।**', at: 8.45}]} /></Abs>
  </AbsoluteFill>
);
const F3: React.FC = () => {
  const t = useTheme();
  return (
    <AbsoluteFill>
      <Abs x={50} y={50} center>
        <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
          <Pop at={9.75} dur={12} from={0.7}><Logo size={15} /></Pop>
          <BlurLine size={13} words={[{t: '**Tuki**', at: 10.3}]} keyColor={t.palette.text} />
        </div>
      </Abs>
    </AbsoluteFill>
  );
};
const F4: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const keysOut = useP(12.1, 6, E.in);
  const hi = useP(13.3, 6);
  const pasted = useP(13.75, 8);
  return (
    <AbsoluteFill>
      <Abs x={50} y={50} center>
        <div style={{display: 'flex', gap: u(2), opacity: 1 - keysOut, filter: keysOut > 0 ? `blur(${keysOut * 12}px)` : undefined}}>
          <Keycap label="⇧" at={11.2} press={11.5} size={13} />
          <Keycap label="⌘" at={11.35} press={11.7} size={13} />
          <Keycap label="V" at={11.5} press={11.9} size={13} />
        </div>
      </Abs>
      <FlyMac keys={[
        {at: 12.1, x: 140, y: 70, s: 0.5, ry: 75, rx: 40, rz: -18},
        {at: 12.15, dur: 0.7, x: 52, y: 52, s: 1.15, ry: -18, rx: 8, blur: true, ease: E.out},
        {at: 12.95, dur: 0.6, x: 26, y: 56, s: 2.0, ry: -30, rx: 10},
        {at: 13.6, dur: 0.6, x: 76, y: 56, s: 1.9, ry: -22, rx: 8},
        {at: 14.3, dur: 0.5, x: 55, y: 52, s: 1.15, ry: -16, rx: 6},
      ]}>
        <On x={4} y={12}>
          <MacWindow width={44} height={30} title="Notes">
            <div style={{fontSize: u(2.4), ...keyFont(t)}}>ক্লায়েন্ট মিটিং</div>
            <div>পার্সেল পাঠাবেন এই ঠিকানায়:</div>
            <div><span style={{opacity: pasted, background: pasted > 0 ? alpha(t.palette.primary, 0.15) : undefined, borderRadius: u(0.4)}}>{pasted > 0 ? 'House 12, Road 5, Dhanmondi' : ''}</span><Caret /></div>
          </MacWindow>
        </On>
        <On x={66} y={9}>
          <Panel tab="clips" width={28} search="Search clipboard history">{clips.map((c, i) => <Row key={i} width={28} {...c} hi={i === 1 ? hi : 0} />)}</Panel>
        </On>
        <SCursor from={[90, 70]} to={[82, 35]} start={12.9} arrive={13.25} click={13.3} />
      </FlyMac>
    </AbsoluteFill>
  );
};
const F5: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const sel = useP(17.6, 6);
  const typed = useP(17.8, 8);
  const k = (v: number) => u(v * (28 / 38));
  const textOut = useP(16.95, 5, E.in);
  return (
    <AbsoluteFill>
      <Abs x={50} y={46} center w={90}>
        <div style={{opacity: 1 - textOut, filter: textOut > 0 ? `blur(${textOut * 10}px)` : undefined}}>
          <BlurLine size={6.6} words={[{t: 'Emoji', at: 15.0}, {t: '·', at: 15.4}, {t: 'GIF', at: 15.55}, {t: '·', at: 15.9}, {t: 'Sticker', at: 16.05}]} />
          <div style={{height: u(1.5)}} />
          <BlurLine size={8} words={[{t: '**বাংলা symbol**', at: 16.55}]} />
        </div>
      </Abs>
      <FlyMac keys={[
        {at: 16.9, x: -40, y: 60, s: 0.8, ry: -60, rx: 30, rz: 10},
        {at: 16.95, dur: 0.55, x: 72, y: 54, s: 1.9, ry: 26, rx: 9, rz: 3, blur: true, ease: E.out},
        {at: 17.6, dur: 1.2, x: 70, y: 53, s: 2.0, ry: 22, rx: 7, rz: 2},
      ]}>
        <On x={4} y={9}>
          <Panel tab="emoji" width={28} search="Search emoji">
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: k(0.5)}}>
              {EMOJI.map((e, i) => <div key={i} style={{height: k(3.4), borderRadius: k(0.8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: k(2.2), ...bodyFont(t), background: i === 1 ? alpha(t.palette.primary, 0.3 * sel) : 'transparent'}}>{e}</div>)}
            </div>
          </Panel>
        </On>
        <On x={36} y={14}>
          <MacWindow width={44} height={22} title="Messages">আজকের মিটিং দারুণ হয়েছে <span style={{opacity: typed, ...bodyFont(t)}}>{typed > 0 ? '😂' : ''}</span><Caret /></MacWindow>
        </On>
        <SCursor from={[30, 60]} to={[12.5, 26]} start={17.15} arrive={17.5} click={17.6} />
      </FlyMac>
    </AbsoluteFill>
  );
};
const F6: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const hi = useP(20.55, 6);
  const pasted = useP(20.95, 8);
  const k = (v: number) => u(v * (28 / 38));
  const snips = [{title: 'Reply: on it', meta: 'Work'}, {title: 'Home address', meta: 'Personal'}, {title: 'Invoice footer', meta: 'Work'}, {title: 'Undo last commit', meta: 'Code'}];
  return (
    <AbsoluteFill>
      <Abs x={50} y={50} center w={90}><BlurLine size={11} words={[{t: '**Snippets**', at: 19.0}]} exitAt={20.0} /></Abs>
      <FlyMac keys={[
        {at: 20.0, x: 50, y: 58, s: 0.75, ry: 0, rx: 18},
        {at: 20.05, dur: 0.45, x: 50, y: 52, s: 0.95, ry: 0, rx: 4, ease: E.out},
        {at: 20.35, dur: 0.7, x: 26, y: 56, s: 1.75, ry: -14, rx: 5},
        {at: 20.95, dur: 0.6, x: 74, y: 56, s: 1.75, ry: -10, rx: 5},
        {at: 21.7, dur: 0.5, x: 50, y: 52, s: 1.0, ry: -4, rx: 4},
      ]}>
        <On x={4} y={14}>
          <MacWindow width={44} height={22} title="Messages"><span style={{opacity: pasted, background: pasted > 0 ? alpha(t.palette.primary, 0.14) : undefined, borderRadius: u(0.4)}}>{pasted > 0 ? 'House 12, Road 5, Dhanmondi, Dhaka 1205' : ''}</span><Caret /></MacWindow>
        </On>
        <On x={66} y={9}>
          <Panel tab="snips" width={28} search="Search snippets">
            <div style={{display: 'flex', gap: k(0.6)}}>{['All', 'Work', 'Personal', 'Code'].map((f, i) => <div key={f} style={{padding: `${k(0.4)}px ${k(1.1)}px`, borderRadius: k(2), fontSize: k(1.15), background: i === 0 ? alpha(t.palette.primary, 0.16) : alpha(t.palette.dark, 0.05), color: i === 0 ? t.palette.accent : alpha(t.palette.dark, 0.6), ...(i === 0 ? keyFont(t) : bodyFont(t))}}>{f}</div>)}</div>
            {snips.map((s, i) => <Row key={i} width={28} title={s.title} meta={s.meta} hi={i === 1 ? hi : 0} />)}
          </Panel>
        </On>
        <SCursor from={[92, 75]} to={[82, 33]} start={20.15} arrive={20.5} click={20.55} />
      </FlyMac>
    </AbsoluteFill>
  );
};
const F7: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const k = (v: number) => u(v * (28 / 38));
  const open = frame >= sec(25.3);
  const dlg = useP(24.15, 8, E.rise), dlgOut = useP(25.25, 5, E.in);
  const dots = Math.max(0, Math.min(10, Math.floor((frame - sec(24.4)) / f30(2.2, fps))));
  const unl = useP(25.3, 8);
  const macOn = frame >= sec(23.85) && frame < sec(25.75);
  return (
    <AbsoluteFill>
      <Abs x={50} y={46} center w={90}>
        <BlurLine size={11} words={[{t: '**Confidential**', at: 22.5}]} exitAt={23.7} />
        <div style={{height: u(1.4)}} />
        <BlurLine size={4.4} words={timed('password · account number', 23.0, 0.15)} exitAt={23.7} />
      </Abs>
      {macOn && (
        <FlyMac keys={[
          {at: 23.85, x: 50, y: 120, s: 1.2, ry: -10, rx: 60},
          {at: 23.9, dur: 0.5, x: 50, y: 58, s: 1.7, ry: -8, rx: 26, blur: true, ease: E.out},
          {at: 24.4, dur: 1.3, x: 50, y: 56, s: 1.85, ry: -4, rx: 20},
        ]}>
          <On x={36} y={9}>
            <Panel tab="secret" width={28} search="Search confidential">
              {!open ? (
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: k(1.2), textAlign: 'center'}}>
                  <Icon name="lock" size={k(6)} color={t.palette.primary} stroke={2.2} />
                  <div style={{fontSize: k(2), ...keyFont(t)}}>Confidential is locked</div>
                </div>
              ) : (
                <div style={{opacity: unl, display: 'flex', flexDirection: 'column', gap: k(0.8)}}>
                  {[['Bank account', 12], ['Wi-Fi password', 10], ['bKash PIN', 5], ['Server login', 14]].map(([n, c], i) => <Row key={i} width={28} title="" masked={c as number} meta={n as string} lead={<Icon name="lock" size={k(1.5)} color={t.palette.accent} />} />)}
                </div>
              )}
            </Panel>
          </On>
          {frame >= sec(24.15) && (
            <div style={{position: 'absolute', left: '31%', top: '30%', width: '38%', opacity: dlg * (1 - dlgOut), transform: `scale(${0.94 + 0.06 * dlg})`, padding: u(2.2), borderRadius: u(1.6), background: t.palette.light, boxShadow: `0 ${u(2)}px ${u(6)}px ${alpha(t.palette.dark, 0.3)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(1), ...bodyFont(t), textAlign: 'center', color: t.palette.text}}>
              <Logo size={5} shadow={false} />
              <div style={{fontSize: u(1.5), color: alpha(t.palette.dark, 0.65)}}>Tuki is trying to open your Confidential items.</div>
              <div style={{width: '100%', height: u(3.2), borderRadius: u(0.8), border: `${u(0.2)}px solid ${t.palette.primary}`, display: 'flex', alignItems: 'center', padding: `0 ${u(1)}px`}}><Dots n={dots} size={u(0.8)} color={t.palette.text} /><Caret /></div>
            </div>
          )}
        </FlyMac>
      )}
      {frame >= sec(25.75) && (
        <Abs x={50} y={50} center w={90}><BlurLine size={6.4} words={[...timed('খোলে শুধু আপনার', 25.75, 0.2), {t: '**Mac-এর password দিয়ে।**', at: 26.4}]} /></Abs>
      )}
    </AbsoluteFill>
  );
};
const UpdateCard: React.FC<{done: boolean; d: number}> = ({done, d}) => {
  const t = useTheme();
  const {u} = useU();
  return (
    <div style={{width: u(46), padding: u(3), display: 'flex', gap: u(2.4), alignItems: 'center', ...bodyFont(t), color: t.palette.text, background: t.palette.light, borderRadius: u(2), boxShadow: `0 ${u(1.5)}px ${u(5)}px ${alpha(t.palette.dark, 0.18)}`}}>
      <Logo size={10} shadow={false} />
      <div style={{flex: 1}}>
        <div style={{fontSize: u(2.8), ...keyFont(t)}}>Tuki 1.2 is available</div>
        <div style={{fontSize: u(1.8), color: alpha(t.palette.dark, 0.6), marginTop: u(0.4)}}>Your history and settings stay.</div>
        <div style={{display: 'flex', gap: u(1), marginTop: u(1.8)}}>
          <div style={{padding: `${u(0.9)}px ${u(2.2)}px`, borderRadius: u(1), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(2), ...keyFont(t), display: 'flex', alignItems: 'center', gap: u(0.8), transform: done ? `scale(${1 + 0.06 * Math.sin(d * Math.PI)})` : undefined}}>
            {done ? <><Icon name="check" size={u(2.4)} color={t.palette.textOnAccent} stroke={3} /> Updated</> : 'Install Update'}
          </div>
          {!done && <div style={{padding: `${u(0.9)}px ${u(2.2)}px`, borderRadius: u(1), background: alpha(t.palette.dark, 0.06), fontSize: u(2)}}>Later</div>}
        </div>
      </div>
    </div>
  );
};
const F8: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const done = frame >= sec(29.65);
  const d = useP(29.65, 8, E.pop);
  return (
    <AbsoluteFill>
      <Abs x={50} y={11} center w={90}><BlurLine size={6.4} words={[...timed('নতুন version,', 28.5, 0.25), {t: '**এক click-এ।**', at: 29.0}]} /></Abs>
      <FlyMac keys={[
        {at: 28.35, x: 150, y: 62, s: 0.9, ry: 70, rx: 10},
        {at: 28.4, dur: 0.55, x: 50, y: 66, s: 0.95, ry: 24, rx: 6, blur: true, ease: E.out},
        {at: 29.0, dur: 1.9, x: 50, y: 65, s: 1.1, ry: 14, rx: 5},
      ]}>
        <On x={28} y={32}><UpdateCard done={done} d={d} /></On>
        <SCursor from={[75, 80]} to={[46, 56]} start={29.1} arrive={29.5} click={29.6} />
      </FlyMac>
    </AbsoluteFill>
  );
};
const F9: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  return (
    <AbsoluteFill>
      <Abs x={50} y={30} center><Pop at={31.3} dur={14} from={0.7}><Logo size={18} /></Pop></Abs>
      <Abs x={50} y={51} center w={90}><BlurLine size={9} words={[{t: '**Tuki**', at: 31.6}]} keyColor={t.palette.text} /></Abs>
      <Abs x={50} y={63} center w={90}><BlurLine size={4.4} words={[{t: 'Mac-এর', at: 32.0}, {t: 'জন্য', at: 32.2}, {t: '**ফ্রি**', at: 32.45}, {t: 'Clipboard', at: 32.7}, {t: 'Manager', at: 32.9}]} /></Abs>
      <Abs x={50} y={76} center>
        <Pop at={33.5} dur={12}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1.2), padding: `${u(1.1)}px ${u(3)}px`, borderRadius: u(5), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(3.4), ...keyFont(t)}}>
            <Icon name="download" size={u(3.6)} color={t.palette.textOnAccent} stroke={2.6} /> লিংক কমেন্টে
          </div>
        </Pop>
      </Abs>
      <Abs x={50} y={89} center w={90}>
        <Pop at={34.3} dur={12}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(1.4), fontSize: u(2.8), color: alpha(t.palette.dark, 0.75), ...bodyFont(t)}}>
            বিস্তারিত জানতে ভিজিট করুন
            <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1), padding: `${u(0.6)}px ${u(1.8)}px ${u(0.6)}px ${u(0.7)}px`, borderRadius: u(4), background: t.palette.light, boxShadow: `0 ${u(0.5)}px ${u(1.6)}px ${alpha(t.palette.dark, 0.12)}`, color: t.palette.text, ...keyFont(t)}}>
              <Img src={staticFile('img/ca-logo.webp')} style={{width: u(4), height: u(4), borderRadius: u(0.8)}} /> Creative Assistant
            </div>
            পেইজে
          </div>
        </Pop>
      </Abs>
    </AbsoluteFill>
  );
};

const SFX: {at: number; file: string}[] = [
  {at: 0.1, file: 'key'}, {at: 1.1, file: 'whoosh'}, {at: 9.75, file: 'pop'},
  {at: 11.5, file: 'key'}, {at: 11.7, file: 'key'}, {at: 11.9, file: 'key'}, {at: 12.15, file: 'whoosh'}, {at: 13.3, file: 'click'},
  {at: 16.95, file: 'whoosh'}, {at: 17.6, file: 'click'}, {at: 20.0, file: 'whoosh'}, {at: 20.55, file: 'click'},
  {at: 23.9, file: 'whoosh'}, {at: 24.4, file: 'type'}, {at: 25.3, file: 'unlock'},
  {at: 28.4, file: 'whoosh'}, {at: 29.6, file: 'click'}, {at: 29.7, file: 'ding'}, {at: 31.3, file: 'pop'},
];
export const FILM_SEC = 38;
export const TukiFilm: React.FC = () => {
  const {fps} = useVideoConfig();
  const sec = (s: number) => Math.round((s + OFF) * fps);
  const end = FILM_SEC * fps;
  return (
    <ThemeProvider theme={FILM}>
      <Fonts>
        <AbsoluteFill>
          <WhiteBackdrop />
          <Scene start={0} end={sec(4.45)}><F1 /></Scene>
          <Scene start={sec(4.45)} end={sec(9.6)}><F2 /></Scene>
          <Scene start={sec(9.6)} end={sec(11.1)}><F3 /></Scene>
          <Scene start={sec(11.1)} end={sec(14.85)}><F4 /></Scene>
          <Scene start={sec(14.85)} end={sec(18.8)}><F5 /></Scene>
          <Scene start={sec(18.8)} end={sec(22.3)}><F6 /></Scene>
          <Scene start={sec(22.3)} end={sec(28.3)}><F7 /></Scene>
          <Scene start={sec(28.3)} end={sec(31.05)}><F8 /></Scene>
          <Scene start={sec(31.05)} end={end} exitBlur={false}><F9 /></Scene>
        </AbsoluteFill>
        <Sequence from={sec(0)}><Audio src={staticFile('audio/voice.mp3')} /></Sequence>
        <Audio src={staticFile('audio/music.wav')} volume={(f) => interpolate(f, [0, 20, end - 60, end], [0, 0.15, 0.15, 0], {extrapolateRight: 'clamp'})} />
        {SFX.map((s, i) => <Sequence key={i} from={sec(s.at)}><Audio src={staticFile(`audio/sfx-${s.file}.wav`)} volume={0.28} /></Sequence>)}
      </Fonts>
    </ThemeProvider>
  );
};
