import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThemeProvider, useTheme, alpha, bodyFont, keyFont} from './style/theme';
import {E} from './style/easing';
import {prog, f30, breathe} from './style/motion';
import {useU} from './style/layout';
import {THEME, Fonts, Backdrop, OrangeBackdrop, Scene, Iris, BlurLine, useSec, OFF, timed, NEUTRAL} from './brand';
import {Keycap, Cursor, ProblemChip, FeaturePill, Logo, Panel, Row, MacWindow, Caret, Pop, Icon, Dots, useP, Silhouette, MacDevice, PopOut, useDrift, DeskScene, Camera, CamKey} from './ui';
import {Img} from 'remotion';

const Abs: React.FC<{x: number; y: number; children: React.ReactNode; center?: boolean; w?: number}> = ({x, y, children, center, w}) => (
  <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: w !== undefined ? `${w}%` : undefined, transform: center ? 'translate(-50%, -50%)' : undefined}}>{children}</div>
);

// ---------------- 1. hook: person at a desk, copy, copy again, where did it go? ----------------
const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const push = interpolate(frame, [0, Math.round(4.8 * fps)], [1, 1.07], {extrapolateRight: 'clamp', easing: E.push});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '30% 60%'}}><DeskScene goneAt={2.9} /></div>
      <Abs x={81} y={24} center>
        <div style={{display: 'flex', gap: 14}}>
          <Keycap label="⌘" at={0.0} press={0.3} size={8.5} />
          <Keycap label="C" at={0.08} press={0.3} size={8.5} />
        </div>
      </Abs>
      <Abs x={81} y={46} center w={33}>
        <BlurLine size={5.6} words={[...timed('কপি করলেন।', 0.1, 0.35), ...timed('আরেকটা কপি করলেন।', 1.6, 0.3)]} />
      </Abs>
      <Abs x={81} y={66} center w={33}>
        <BlurLine size={6.8} words={[...timed('আগেরটা গেল', 3.05, 0.3), {t: '**কোথায়?**', at: 3.65}]} />
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- 2. problems ----------------
const S2: React.FC = () => {
  const t = useTheme();
  const {u, w, h} = useU();
  const l1 = useP(6.4, 14, E.inOut), l2 = useP(8.0, 14, E.inOut);
  const line = (x1: number, y1: number, x2: number, y2: number, p: number) => (
    <path d={`M${w(x1)} ${h(y1)} H${w(x1 + (x2 - x1) * 0.5)} V${h(y2)} H${w(x2)}`} fill="none" stroke={alpha(t.palette.accent, 0.5)} strokeWidth={u(0.3)} strokeDasharray={w(60)} strokeDashoffset={w(60) * (1 - p)} />
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${alpha(t.palette.dark, 0.1)} 1.4px, transparent 1.6px)`, backgroundSize: `${u(2.6)}px ${u(2.6)}px`, opacity: 0.5}} />
      <svg width={w(100)} height={h(100)} style={{position: 'absolute'}}>{line(52, 26, 58, 48, l1)}{line(60, 48, 48, 70, l2)}</svg>
      <Abs x={36} y={26} center><ProblemChip icon="clip" label="কপি হারিয়ে যায়" at={4.75} xAt={6.15} size={4.4} /></Abs>
      <Abs x={60} y={48} center><ProblemChip icon="search" label="আবার খোঁজা" at={7.05} xAt={7.85} size={4.4} /></Abs>
      <Abs x={38} y={70} center><ProblemChip icon="keyboard" label="আবার টাইপ করা" at={8.15} xAt={8.95} size={4.4} /></Abs>
      <Cursor path={[{x: 72, y: 88, at: 5.3}, {x: 47, y: 23, at: 6.05}, {x: 75, y: 45, at: 7.75}, {x: 49, y: 67, at: 8.85}]} clicks={[6.1, 7.8, 8.9]} />
    </AbsoluteFill>
  );
};

// ---------------- 3. reveal: Meet Tuki ----------------
const S3: React.FC = () => {
  const t = useTheme();
  return (
    <AbsoluteFill>
      <OrangeBackdrop />
      <Abs x={50} y={40} center><Pop at={9.85} dur={14} from={0.6}><Logo size={22} /></Pop></Abs>
      <Abs x={50} y={70} center w={80}>
        <BlurLine size={8} color={t.palette.light} keyColor={t.palette.light} words={[...timed('তাই বানালাম —', 9.75, 0.25), {t: '**Tuki!**', at: 10.4}]} />
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- 4. ⇧⌘V: all copies, one place (3D Mac) ----------------
const clips = [
  {title: 'hello@example.com', meta: 'Contacts · 2m', lead: 'Aa', pinned: true},
  {title: 'House 12, Road 5, Dhanmondi, Dhaka 1205', meta: 'Notes · 8m', lead: 'Aa'},
  {title: 'Meeting moved to Thursday 3:30 PM', meta: 'Mail · 21m', lead: 'Aa'},
  {title: 'developer.apple.com/documentation', meta: 'Safari · 34m', lead: 'www'},
  {title: '#F26B1D', meta: 'Figma · 1h', lead: '#'},
];
const MAC_W = 84;
const Mac: React.FC<{at: number; a: number; b: number; children: React.ReactNode}> = ({at, a, b, children}) => {
  const ry = useDrift(-24, -14, a, b);
  const rx = useDrift(6, 3, a, b);
  return <Abs x={43} y={16}><Pop at={at} dur={16} from={0.88}><MacDevice width={MAC_W} rotY={ry} rotX={rx}>{children}</MacDevice></Pop></Abs>;
};
const OnScreen: React.FC<{x: number; y: number; children: React.ReactNode}> = ({x, y, children}) => <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`}}>{children}</div>;
// soft fade from the left, so the headline stays readable when the Mac is zoomed (like the reference)
const LeftFade: React.FC = () => <AbsoluteFill style={{background: `linear-gradient(90deg, ${NEUTRAL} 0%, ${alpha(NEUTRAL, 0.94)} 33%, ${alpha(NEUTRAL, 0)} 50%)`}} />;
const WIDE = (at: number): CamKey => ({at, f: [67, 45], s: 0.92});
const BACK = (at: number, dur = 0.45): CamKey => ({at, dur, f: [67, 45], s: 1});

const S4: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const keysOut = useP(12.15, 6, E.in);
  const hi = useP(13.3, 6);
  const pasted = useP(13.7, 8);
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(12.3), {at: 12.85, dur: 0.6, f: [80, 36], s: 1.9, t: [70, 48]}, {at: 13.6, dur: 0.55, f: [59, 37], s: 1.8, t: [66, 48]}, BACK(14.35)]}>
        <Mac at={12.3} a={12.3} b={14.85}>
          <OnScreen x={4} y={13}>
            <MacWindow width={42} height={28} title="Notes">
              <div style={{fontSize: u(2.4), ...keyFont(t)}}>ক্লায়েন্ট মিটিং</div>
              <div>পার্সেল পাঠাবেন এই ঠিকানায়:</div>
              <div><span style={{opacity: pasted, background: pasted > 0 ? alpha(t.palette.primary, 0.15) : undefined, borderRadius: u(0.4)}}>{pasted > 0 ? 'House 12, Road 5, Dhanmondi' : ''}</span><Caret /></div>
            </MacWindow>
          </OnScreen>
          <OnScreen x={62} y={8}>
            <Panel tab="clips" width={22} search="Search clipboard history">
              {clips.map((c, i) => <Row key={i} width={22} {...c} hi={i === 1 ? hi : 0} />)}
            </Panel>
          </OnScreen>
        </Mac>
        <Cursor path={[{x: 92, y: 60, at: 12.9}, {x: 79, y: 34.5, at: 13.3}, {x: 79, y: 34.5, at: 13.6}]} clicks={[13.35]} size={2.2} />
      </Camera>
      <LeftFade />
      <Abs x={50} y={45} center>
        <div style={{display: 'flex', gap: u(2), opacity: 1 - keysOut, filter: keysOut > 0 ? `blur(${keysOut * 12}px)` : undefined, transform: `scale(${1 + keysOut * 0.1})`}}>
          <Keycap label="⇧" at={11.2} press={11.5} size={13} />
          <Keycap label="⌘" at={11.35} press={11.7} size={13} />
          <Keycap label="V" at={11.5} press={11.9} size={13} />
        </div>
      </Abs>
      <Abs x={6} y={38} w={36}>
        <BlurLine align="left" size={6.4} words={[...timed('আপনার সব কপি,', 12.55, 0.2), {t: '**এক\u00A0জায়গায়।**', at: 13.2}]} />
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- 5. emoji, GIF, sticker, Bangla symbols ----------------
const EMOJI = ['😀', '😂', '🥹', '😍', '😎', '🤔', '🥳', '😭', '👍', '🙏', '👏', '🔥', '❤️', '💯', '🎉', '✅', '🥭', '🍋', '☕', '🌙', '⭐', '🚀', '💡', '📌', '৳', '।', '০', '১', '২', '৩', '৪', '৫'];
const S5: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const sel = useP(17.55, 6);
  const k = (v: number) => u(v * (22 / 38));
  const typed = useP(17.75, 8);
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(14.95), {at: 15.5, dur: 0.7, f: [80, 34], s: 1.8, t: [70, 48]}, {at: 17.75, dur: 0.5, f: [59, 34], s: 1.8, t: [66, 48]}, BACK(18.35, 0.4)]}>
        <Mac at={14.95} a={14.95} b={18.8}>
          <OnScreen x={4} y={13}>
            <MacWindow width={42} height={22} title="Messages">
              আজকের মিটিং দারুণ হয়েছে <span style={{opacity: typed, ...bodyFont(t)}}>{typed > 0 ? '😂' : ''}</span><Caret />
            </MacWindow>
          </OnScreen>
          <OnScreen x={62} y={8}>
            <Panel tab="emoji" width={22} search="Search emoji">
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: k(0.5)}}>
                {EMOJI.map((e, i) => (
                  <div key={i} style={{height: k(3.4), borderRadius: k(0.8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: k(2.2), ...bodyFont(t), background: i === 1 ? alpha(t.palette.primary, 0.3 * sel) : 'transparent'}}>{e}</div>
                ))}
              </div>
            </Panel>
          </OnScreen>
        </Mac>
        <Cursor path={[{x: 90, y: 50, at: 17.05}, {x: 76.7, y: 31, at: 17.5}]} clicks={[17.55]} size={2.2} />
      </Camera>
      <LeftFade />
      <Abs x={6} y={18}><div style={{display: 'flex', flexDirection: 'column', gap: u(2), alignItems: 'flex-start'}}>
        <FeaturePill icon="smile" label="Emoji" at={15.0} size={3.8} />
        <FeaturePill icon="gif" label="GIF" at={15.55} size={3.8} />
        <FeaturePill icon="sticker" label="Sticker" at={16.05} size={3.8} />
        <FeaturePill icon="symbol" label="বাংলা symbol  ৳ । ১২৩" at={16.6} size={3.8} />
      </div></Abs>
      <Abs x={6} y={74}>
        <PopOut at={17.6}>
          <div style={{display: 'flex', alignItems: 'center', gap: u(2), padding: `${u(1.2)}px ${u(3)}px ${u(1.2)}px ${u(1.2)}px`}}>
            <div style={{width: u(8), height: u(8), borderRadius: u(2), background: alpha(t.palette.primary, 0.18), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: u(5.4), ...bodyFont(t)}}>😂</div>
            <div style={{display: 'flex', alignItems: 'center', gap: u(1), fontSize: u(3.4), ...keyFont(t), color: t.palette.text}}><Icon name="check" size={u(3.6)} color={t.palette.accent} stroke={3} />paste হয়ে গেছে</div>
          </div>
        </PopOut>
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- 6. snippets ----------------
const S6: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const hi = useP(20.55, 6);
  const pasted = useP(20.95, 8);
  const k = (v: number) => u(v * (22 / 38));
  const snips = [
    {title: 'Reply: on it', meta: 'Work', hi: 0},
    {title: 'Home address', meta: 'Personal', hi: 1},
    {title: 'Invoice footer', meta: 'Work', hi: 0},
    {title: 'Undo last commit', meta: 'Code', hi: 0},
  ];
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(18.95), {at: 19.7, dur: 0.7, f: [80, 36], s: 1.8, t: [70, 48]}, {at: 20.85, dur: 0.55, f: [59, 34], s: 1.8, t: [66, 48]}, BACK(21.8, 0.4)]}>
        <Mac at={18.95} a={18.95} b={22.3}>
          <OnScreen x={4} y={13}>
            <MacWindow width={42} height={22} title="Messages">
              <span style={{opacity: pasted, background: pasted > 0 ? alpha(t.palette.primary, 0.14) : undefined, borderRadius: u(0.4)}}>{pasted > 0 ? 'House 12, Road 5, Dhanmondi, Dhaka 1205' : ''}</span><Caret />
            </MacWindow>
          </OnScreen>
          <OnScreen x={62} y={8}>
            <Panel tab="snips" width={22} search="Search snippets">
              <div style={{display: 'flex', gap: k(0.6)}}>{['All', 'Work', 'Personal', 'Code'].map((f, i) => <div key={f} style={{padding: `${k(0.4)}px ${k(1.1)}px`, borderRadius: k(2), fontSize: k(1.15), background: i === 0 ? alpha(t.palette.primary, 0.16) : alpha(t.palette.dark, 0.05), color: i === 0 ? t.palette.accent : alpha(t.palette.dark, 0.6), ...(i === 0 ? keyFont(t) : bodyFont(t))}}>{f}</div>)}</div>
              {snips.map((s, i) => <Row key={i} width={22} title={s.title} meta={s.meta} hi={s.hi ? hi : 0} />)}
            </Panel>
          </OnScreen>
        </Mac>
        <Cursor path={[{x: 92, y: 60, at: 20.1}, {x: 79, y: 37.5, at: 20.5}, {x: 79, y: 37.5, at: 20.85}]} clicks={[20.55]} size={2.2} />
      </Camera>
      <LeftFade />
      <Abs x={6} y={30} w={36}>
        <BlurLine align="left" size={7.4} words={[{t: '**Snippets**', at: 19.0}]} />
        <div style={{height: u(1)}} />
        <BlurLine align="left" size={4.6} words={[...timed('বারবার যা লেখেন,', 19.6, 0.2), {t: '**একবার\u00A0save\u00A0করুন।**', at: 20.3}]} />
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- 7. confidential ----------------
const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const dlgOut = useP(25.55, 6, E.in);
  const open = frame >= sec(25.6);
  const dots = Math.max(0, Math.min(10, Math.floor((frame - sec(24.45)) / f30(2.4, fps))));
  const k = (v: number) => u(v * (22 / 38));
  const unl = useP(25.6, 10);
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(22.5), {at: 23.2, dur: 0.8, f: [68, 37], s: 1.7, t: [72, 48]}, {at: 24.0, dur: 0.6, f: [68, 40], s: 1.25, t: [74, 50]}, {at: 25.6, dur: 0.6, f: [68, 37], s: 1.8, t: [72, 48]}, BACK(27.7, 0.5)]}>
        <Mac at={22.5} a={22.5} b={28.3}>
          <OnScreen x={36} y={8}>
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
          </OnScreen>
        </Mac>
      </Camera>
      <LeftFade />
      <Abs x={6} y={18} w={29}>
        <BlurLine align="left" size={6.8} words={[{t: '**Confidential**', at: 22.5}]} />
        <div style={{height: u(1.4)}} />
        <BlurLine align="left" size={4} words={timed('password, account number — লক করা থাকে', 23.2, 0.22)} color={alpha(t.palette.dark, 0.75)} />
      </Abs>
      <Abs x={6} y={70} w={36}>
        <BlurLine align="left" size={4.6} words={[...timed('খোলে শুধু আপনার', 25.75, 0.2), {t: '**Mac-এর\u00A0password\u00A0দিয়ে।**', at: 26.4}]} />
      </Abs>
      {/* macOS password prompt pops out of the screen (sample) */}
      <Abs x={36} y={30}>
        <div style={{opacity: 1 - dlgOut, filter: dlgOut > 0 ? `blur(${dlgOut * 8}px)` : undefined}}>
          <PopOut at={24.1} rot={10}>
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

// ---------------- 8. one-click update ----------------
const UpdateCard: React.FC<{done: boolean; d: number}> = ({done, d}) => {
  const t = useTheme();
  const {u} = useU();
  return (
    <div style={{width: u(46), padding: u(3), display: 'flex', gap: u(2.4), alignItems: 'center', ...bodyFont(t), color: t.palette.text}}>
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
const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useTheme();
  const sec = useSec();
  const done = frame >= sec(29.65);
  const d = useP(29.65, 8, E.pop);
  return (
    <AbsoluteFill>
      <Camera keys={[WIDE(28.45), {at: 28.8, dur: 0.6, f: [68.5, 45], s: 2.0, t: [70, 50]}]}>
        <Mac at={28.45} a={28.45} b={31.05}>
          <OnScreen x={30} y={34}><div style={{zoom: 0.75, borderRadius: 16, background: t.palette.light, boxShadow: `0 10px 30px ${alpha(t.palette.dark, 0.2)}`}}><UpdateCard done={done} d={d} /></div></OnScreen>
        </Mac>
        <Cursor path={[{x: 80, y: 62, at: 29.1}, {x: 68.2, y: 46, at: 29.55}]} clicks={[29.6]} size={2.2} />
      </Camera>
      <LeftFade />
      <Abs x={6} y={38} w={36}>
        <BlurLine align="left" size={6.4} words={[...timed('নতুন আপডেট,', 28.5, 0.25), {t: '**এক\u00A0click-এই।**', at: 29.0}]} />
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- 9. end card ----------------
const S9: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u, H} = useU();
  const b = breathe(frame, fps, H, 2.4, 0.6);
  return (
    <AbsoluteFill>
      <OrangeBackdrop />
      <Abs x={50} y={27} center><Pop at={31.3} dur={14} from={0.6}><div style={{transform: `translateY(${b.dy}px)`}}><Logo size={17} /></div></Pop></Abs>
      <Abs x={50} y={50} center w={90}>
        <BlurLine size={10} color={t.palette.light} keyColor={t.palette.light} words={[{t: '**Tuki**', at: 31.45}]} />
      </Abs>
      <Abs x={50} y={63} center w={90}>
        <BlurLine size={4.6} color={t.palette.light} keyColor={t.palette.dark} words={[{t: 'Mac-এর', at: 32.0}, {t: 'জন্য', at: 32.2}, {t: '**ফ্রি**', at: 32.45}, {t: 'Clipboard', at: 32.7}, {t: 'Manager', at: 32.9}]} />
      </Abs>
      <Abs x={50} y={78} center>
        <Pop at={33.5} dur={12}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1.2), padding: `${u(1.2)}px ${u(3)}px`, borderRadius: u(5), background: t.palette.light, color: t.palette.accent, fontSize: u(3.4), ...keyFont(t), boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.25)}`}}>
            <Icon name="download" size={u(3.6)} color={t.palette.accent} stroke={2.6} /> লিংক কমেন্টে
          </div>
        </Pop>
      </Abs>
      <Abs x={50} y={90} center w={90}>
        <Pop at={34.3} dur={12}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(1.4), fontSize: u(3.1), color: t.palette.light, ...bodyFont(t)}}>
            বিস্তারিত জানতে ভিজিট করুন
            <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1), padding: `${u(0.6)}px ${u(1.8)}px ${u(0.6)}px ${u(0.7)}px`, borderRadius: u(4), background: t.palette.light, color: t.palette.text, ...keyFont(t)}}>
              <Img src={staticFile('img/ca-logo.webp')} style={{width: u(4.2), height: u(4.2), borderRadius: u(0.8)}} /> Creative Assistant
            </div>
            পেইজে
          </div>
        </Pop>
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- sound ----------------
const SFX: {at: number; file: string; vol?: number}[] = [
  {at: 0.3, file: 'key'}, {at: 1.65, file: 'key'},
  {at: 4.75, file: 'pop'}, {at: 6.1, file: 'click'}, {at: 7.05, file: 'pop'}, {at: 7.8, file: 'click'}, {at: 8.15, file: 'pop'}, {at: 8.9, file: 'click'},
  {at: 9.45, file: 'whoosh'}, {at: 9.9, file: 'pop'},
  {at: 11.5, file: 'key'}, {at: 11.7, file: 'key'}, {at: 11.9, file: 'key'}, {at: 13.3, file: 'click'},
  {at: 17.55, file: 'click'}, {at: 20.55, file: 'click'},
  {at: 24.5, file: 'type'}, {at: 25.6, file: 'unlock'},
  {at: 29.6, file: 'click'}, {at: 29.7, file: 'ding'},
  {at: 30.9, file: 'whoosh'}, {at: 31.3, file: 'pop'},
];

export {S4, S5, S6, S7, S8};
export const TOTAL_SEC = 38;
export const TukiAnnouncement: React.FC = () => {
  const {fps} = useVideoConfig();
  const sec = (s: number) => Math.round((s + OFF) * fps);
  const end = TOTAL_SEC * fps;
  return (
    <ThemeProvider theme={THEME}>
      <Fonts>
        <AbsoluteFill>
          <Backdrop />
          <Scene start={0} end={sec(4.45)}><S1 /></Scene>
          <Scene start={sec(4.45)} end={sec(9.6)} exitBlur={false}><S2 /></Scene>
          <Iris start={sec(9.45)}><Scene start={sec(9.45)} end={sec(11.1)} enterBlur={false}><S3 /></Scene></Iris>
          <Scene start={sec(11.1)} end={sec(14.85)}><S4 /></Scene>
          <Scene start={sec(14.85)} end={sec(18.8)}><S5 /></Scene>
          <Scene start={sec(18.8)} end={sec(22.3)}><S6 /></Scene>
          <Scene start={sec(22.3)} end={sec(28.3)}><S7 /></Scene>
          <Scene start={sec(28.3)} end={sec(31.05)} exitBlur={false}><S8 /></Scene>
          <Iris start={sec(30.9)}><Scene start={sec(30.9)} end={end} enterBlur={false} exitBlur={false}><S9 /></Scene></Iris>
        </AbsoluteFill>
        <Sequence from={sec(0)}><Audio src={staticFile('audio/voice.mp3')} /></Sequence>
        <Audio src={staticFile('audio/music.wav')} volume={(f) => interpolate(f, [0, 20, end - 60, end], [0, 0.15, 0.15, 0], {extrapolateRight: 'clamp'})} />
        {SFX.map((s, i) => <Sequence key={i} from={sec(s.at)}><Audio src={staticFile(`audio/sfx-${s.file}.wav`)} volume={s.vol ?? 0.28} /></Sequence>)}
      </Fonts>
    </ThemeProvider>
  );
};
