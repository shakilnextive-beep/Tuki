// Combined Tuki video: visual hook in the style of the Pro FX reference (person at desk → zoom into the
// problem, counters, clock), logo reveal, then the 3D-Mac feature scenes, and a celebrating ending.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThemeProvider, useTheme, alpha, bodyFont, keyFont} from './style/theme';
import {E} from './style/easing';
import {prog, f30} from './style/motion';
import {useU} from './style/layout';
import {THEME, Fonts, Backdrop, Scene, BlurLine, useSec, OFF} from './brand';
import {Keycap, Logo, Panel, Row, MacWindow, Caret, Pop, Icon, useP, MacDevice} from './ui';
import {S4, S5, S6, S7, S8} from './Video';

const Abs: React.FC<{x: number; y: number; children: React.ReactNode; center?: boolean; w?: number}> = ({x, y, children, center, w}) => (
  <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: w !== undefined ? `${w}%` : undefined, transform: center ? 'translate(-50%, -50%)' : undefined}}>{children}</div>
);

// bottom caption bar (reference style): short Bangla line, keyword in orange. **…** marks the keyword.
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
    <div style={{position: 'absolute', left: '50%', bottom: '7%', transform: `translate(-50%, ${(1 - p) * u(1.5)}px)`, opacity: p * (1 - q), filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined, padding: `${u(0.8)}px ${u(2.4)}px`, borderRadius: u(1.4), background: alpha(t.palette.dark, 0.78), color: t.palette.light, fontSize: u(3.6), whiteSpace: 'nowrap', ...bodyFont(t)}}>
      {parts.map((s, i) => s.startsWith('**') ? <span key={i} style={{...keyFont(t), color: t.palette.primary}}>{s.slice(2, -2)}</span> : <span key={i}>{s}</span>)}
    </div>
  );
};

// camera on the desk illustration: focus point (% of frame) → where it lands, with zoom
const DeskCam: React.FC<{from: [number, number, number]; to: [number, number, number]; a: number; b: number; children: React.ReactNode}> = ({from, to, a, b, children}) => {
  const frame = useCurrentFrame();
  const {W, H} = useU();
  const sec = useSec();
  const p = interpolate(frame, [sec(a), sec(b)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOut});
  const fx = from[0] + (to[0] - from[0]) * p, fy = from[1] + (to[1] - from[1]) * p, s = from[2] + (to[2] - from[2]) * p;
  // focus (fx,fy) lands at the frame centre
  const x = 0.5 * W - (fx / 100) * W * s, y = 0.48 * H - (fy / 100) * H * s;
  return <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${s})`}}>{children}</div>;
};

// ---------------- H1: copy, then copy again — the first copy is pushed out ----------------
const H1: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const sel1 = useP(0.25, 5), sel2 = useP(1.6, 5);
  const in1 = useP(0.4, 10, E.rise);
  const swap = useP(1.95, 10, E.inOut);
  const cross = useP(2.3, 6);
  return (
    <AbsoluteFill>
      <Backdrop />
      <Abs x={5} y={22}>
        <Pop at={0.0} dur={10} from={0.96}>
          <MacWindow width={88} height={40} title="Notes">
            <div style={{fontSize: u(4.4), ...keyFont(t)}}>ক্লায়েন্ট মিটিং</div>
            <div style={{marginTop: u(1.4), fontSize: u(3.6)}}><span style={{background: alpha(t.palette.primary, 0.35 * sel1 * (1 - sel2 * 0.7)), borderRadius: u(0.4), padding: `0 ${u(0.4)}px`}}>House 12, Road 5, Dhanmondi</span></div>
            <div style={{marginTop: u(1.4), fontSize: u(3.6)}}><span style={{background: alpha(t.palette.primary, 0.35 * sel2), borderRadius: u(0.4), padding: `0 ${u(0.4)}px`}}>Meeting moved to Thursday 3:30 PM</span><Caret /></div>
          </MacWindow>
        </Pop>
      </Abs>
      <Abs x={62} y={18}><div style={{display: 'flex', gap: 14}}><Keycap label="⌘" at={0.05} press={0.3} size={8} /><Keycap label="C" at={0.1} press={0.3} size={8} /></div></Abs>
      {/* what is on the clipboard */}
      <Abs x={62} y={38}>
        <div style={{width: u(62), position: 'relative', height: u(24)}}>
          <div style={{...keyFont(t), fontSize: u(3.4), color: alpha(t.palette.dark, 0.6), marginBottom: u(1)}}>Clipboard</div>
          <div style={{position: 'absolute', top: u(5), left: 0, right: 0, padding: u(2), borderRadius: u(1.6), background: t.palette.light, border: `${u(0.3)}px solid ${alpha(t.palette.primary, 1 - swap)}`, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.12)}`, fontSize: u(3), ...bodyFont(t), color: t.palette.text, opacity: in1 * (1 - swap), transform: `translateY(${(1 - in1) * u(6) - swap * u(10)}px) rotate(${-swap * 6}deg)`, filter: swap > 0 ? `blur(${swap * 10}px)` : undefined}}>
            <span style={{textDecoration: cross > 0.5 ? 'line-through' : 'none'}}>House 12, Road 5, Dhanmondi</span>
          </div>
          <div style={{position: 'absolute', top: u(5), left: 0, right: 0, padding: u(2), borderRadius: u(1.6), background: t.palette.light, border: `${u(0.3)}px solid ${t.palette.primary}`, fontSize: u(3), ...bodyFont(t), color: t.palette.text, opacity: swap, transform: `translateY(${(1 - swap) * u(6)}px)`}}>
            Meeting moved to Thursday 3:30 PM
          </div>
        </div>
      </Abs>
      <Abs x={62} y={18}><div style={{display: 'flex', gap: 14}}><Keycap label="⌘" at={1.55} press={1.75} size={8} /><Keycap label="C" at={1.6} press={1.75} size={8} /></div></Abs>
    </AbsoluteFill>
  );
};

// ---------------- H3: where did it go? — an empty dashed slot where the first copy was ----------------
const H3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const q = prog(frame - sec(3.4), f30(10, fps), E.pop);
  const ghost = 0.35 + 0.15 * Math.sin(frame / 6);
  const look = Math.sin((frame - sec(3.0)) / 7) * u(14);
  return (
    <AbsoluteFill>
      <Backdrop />
      <Abs x={50} y={46} center>
        <Pop at={3.0} dur={10}>
          <div style={{position: 'relative', width: u(80), height: u(16), borderRadius: u(2.4), border: `${u(0.45)}px dashed ${alpha(t.palette.accent, 0.7)}`, background: alpha(t.palette.light, 0.6), display: 'flex', alignItems: 'center', padding: `0 ${u(4)}px`}}>
            <span style={{fontSize: u(4.2), ...bodyFont(t), color: alpha(t.palette.dark, ghost), filter: 'blur(5px)'}}>House 12, Road 5, Dhanmondi</span>
            <div style={{position: 'absolute', right: -u(4), top: -u(9), fontSize: u(16), ...keyFont(t), color: t.palette.accent, opacity: q, transform: `scale(${0.5 + 0.5 * q}) rotate(${(1 - q) * -20 + Math.sin(frame / 8) * 4}deg)`}}>?</div>
          </div>
        </Pop>
      </Abs>
      {/* a magnifier searching around the empty slot */}
      <Abs x={50} y={70} center>
        <Pop at={3.15} dur={10}>
          <div style={{transform: `translateX(${look}px)`, width: u(10), height: u(10), borderRadius: '50%', background: t.palette.light, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.15)}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="search" size={u(6)} color={t.palette.accent} stroke={2.4} />
          </div>
        </Pop>
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- H4: searching everywhere ----------------
const APPS: {icon: 'mail' | 'note' | 'chat' | 'globe'; name: string}[] = [{icon: 'note', name: 'Notes'}, {icon: 'mail', name: 'Mail'}, {icon: 'chat', name: 'Messages'}, {icon: 'globe', name: 'Safari'}];
const H4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const q = 'House 12, Road';
  const typed = Math.max(0, Math.min(q.length, Math.floor((frame - sec(4.75)) / f30(2, fps))));
  const active = Math.floor(Math.max(0, frame - sec(5.3)) / f30(9, fps)) % APPS.length;
  const tries = Math.max(1, Math.min(9, 1 + Math.floor(Math.max(0, frame - sec(5.0)) / f30(7, fps))));
  const none = useP(5.9, 8);
  const shake = frame >= sec(5.9) && frame < sec(6.2) ? Math.sin((frame - sec(5.9)) * 1.6) * u(0.8) : 0;
  return (
    <AbsoluteFill>
      <Backdrop />
      <Abs x={50} y={30} center>
        <Pop at={4.55} dur={10}>
          <div style={{width: u(110), height: u(10), borderRadius: u(3), background: t.palette.light, boxShadow: `0 ${u(1.5)}px ${u(5)}px ${alpha(t.palette.dark, 0.14)}`, border: `${u(0.3)}px solid ${t.palette.primary}`, display: 'flex', alignItems: 'center', gap: u(2), padding: `0 ${u(3)}px`, fontSize: u(4.4), ...bodyFont(t), color: t.palette.text, transform: `translateX(${shake}px)`}}>
            <Icon name="search" size={u(5)} color={alpha(t.palette.dark, 0.5)} />{q.slice(0, typed)}<Caret />
          </div>
        </Pop>
      </Abs>
      <Abs x={50} y={56} center>
        <div style={{display: 'flex', gap: u(4)}}>
          {APPS.map((a, i) => {
            const on = frame >= sec(5.3) && i === active;
            return (
              <Pop key={a.name} at={4.75 + i * 0.12} dur={10}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(1)}}>
                  <div style={{width: u(13), height: u(13), borderRadius: u(3), background: on ? t.palette.primary : t.palette.light, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.12)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${on ? 1.08 : 1})`}}>
                    <Icon name={a.icon} size={u(7)} color={on ? t.palette.light : t.palette.accent} stroke={2} />
                  </div>
                  <div style={{fontSize: u(2.2), ...bodyFont(t), color: alpha(t.palette.dark, 0.7)}}>{a.name}</div>
                </div>
              </Pop>
            );
          })}
        </div>
      </Abs>
      <Abs x={50} y={77} center>
        <div style={{opacity: none, transform: `scale(${0.9 + 0.1 * none})`, display: 'flex', alignItems: 'center', gap: u(1.2), padding: `${u(1)}px ${u(2.6)}px`, borderRadius: u(4), background: alpha(t.palette.dark, 0.08), fontSize: u(3), ...keyFont(t), color: t.palette.text}}>
          <Icon name="x" size={u(3)} color={t.palette.accent} stroke={3} /> কোনো ফলাফল নেই
        </div>
      </Abs>
      <Abs x={86} y={10} center>
        <Pop at={5.0} dur={8}>
          <div style={{padding: `${u(0.8)}px ${u(2)}px`, borderRadius: u(4), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(2.6), ...keyFont(t)}}>আবার খোঁজা · {tries.toLocaleString('bn-BD')} বার</div>
        </Pop>
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- H5: retyping again and again, time running out ----------------
const H5: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const cycle = f30(16, fps);
  const lt = Math.max(0, frame - sec(7.1));
  const n = Math.min(5, 1 + Math.floor(lt / cycle));
  const ring = (lt % cycle) / cycle;
  const R = u(15);
  const bar = interpolate(frame, [sec(7.3), sec(9.3)], [0.2, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOut});
  const hand = (frame - sec(7.0)) * 14;
  const labels: [string, number, number][] = [['Copy', 0, -1], ['খোঁজা', 1, 0], ['টাইপ', 0, 1], ['Paste', -1, 0]];
  return (
    <AbsoluteFill>
      <Backdrop />
      {/* repeat ring */}
      <Abs x={24} y={47} center>
        <Pop at={7.05} dur={10}>
          <div style={{position: 'relative', width: R * 2.9, height: R * 2.9}}>
            <svg width={R * 2.9} height={R * 2.9} style={{position: 'absolute'}}>
              <circle cx={R * 1.45} cy={R * 1.45} r={R} fill="none" stroke={alpha(t.palette.dark, 0.1)} strokeWidth={u(0.5)} strokeDasharray={`${u(0.6)} ${u(1)}`} />
              <circle cx={R * 1.45} cy={R * 1.45} r={R} fill="none" stroke={t.palette.accent} strokeWidth={u(0.6)} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * R * ring} ${2 * Math.PI * R}`} transform={`rotate(-90 ${R * 1.45} ${R * 1.45})`} />
            </svg>
            <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{fontSize: u(10), ...keyFont(t), color: t.palette.text, lineHeight: 1}}>×{n.toLocaleString('bn-BD')}</div>
              <div style={{fontSize: u(2.4), ...bodyFont(t), color: alpha(t.palette.dark, 0.6), marginTop: u(0.6)}}>একই কাজ</div>
            </div>
            {labels.map(([l, dx, dy]) => (
              <div key={l} style={{position: 'absolute', left: R * 1.45 + dx * R - u(5), top: R * 1.45 + dy * R - u(2), width: u(10), textAlign: 'center'}}>
                <span style={{padding: `${u(0.4)}px ${u(1.2)}px`, borderRadius: u(2), background: t.palette.light, boxShadow: `0 ${u(0.4)}px ${u(1.2)}px ${alpha(t.palette.dark, 0.12)}`, fontSize: u(2), ...keyFont(t), color: t.palette.text}}>{l}</span>
              </div>
            ))}
          </div>
        </Pop>
      </Abs>
      {/* clock + time bar */}
      <Abs x={47} y={24}>
        <Pop at={7.4} dur={10}>
          <div style={{display: 'flex', alignItems: 'center', gap: u(4)}}>
            <svg width={u(18)} height={u(18)} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill={t.palette.light} stroke={t.palette.accent} strokeWidth="4" />
              {Array.from({length: 12}).map((_, i) => <line key={i} x1="50" y1="10" x2="50" y2="16" stroke={alpha(t.palette.dark, 0.5)} strokeWidth="3" transform={`rotate(${i * 30} 50 50)`} />)}
              <line x1="50" y1="50" x2="50" y2="22" stroke={t.palette.dark} strokeWidth="4" strokeLinecap="round" transform={`rotate(${hand} 50 50)`} />
              <line x1="50" y1="50" x2="50" y2="32" stroke={t.palette.accent} strokeWidth="5" strokeLinecap="round" transform={`rotate(${hand / 12} 50 50)`} />
              <circle cx="50" cy="50" r="4" fill={t.palette.dark} />
            </svg>
            <div style={{width: u(52)}}>
              <div style={{fontSize: u(2.6), ...keyFont(t), color: t.palette.text, marginBottom: u(1)}}>আপনার সময়</div>
              <div style={{height: u(4.4), borderRadius: u(1.2), overflow: 'hidden', display: 'flex', background: alpha(t.palette.primary, 0.2)}}>
                <div style={{width: `${bar * 100}%`, background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(1.9), ...keyFont(t), display: 'flex', alignItems: 'center', paddingLeft: u(1.2), whiteSpace: 'nowrap', overflow: 'hidden'}}>একই কাজ বারবার</div>
                <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: u(1.2), fontSize: u(1.9), ...bodyFont(t), color: t.palette.accent, whiteSpace: 'nowrap', overflow: 'hidden'}}>আসল কাজ</div>
              </div>
            </div>
          </div>
        </Pop>
      </Abs>
      {/* retyping field */}
      <Abs x={47} y={56}>
        <Pop at={7.7} dur={10}>
          <div style={{width: u(76), padding: u(2.4), borderRadius: u(1.6), background: t.palette.light, boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.dark, 0.1)}`, fontSize: u(3), ...bodyFont(t), color: t.palette.text}}>
            {'House 12, Road 5, Dhanmondi'.slice(0, Math.max(0, Math.floor((frame - sec(7.8)) / f30(1.6, fps)) % 28))}<Caret />
          </div>
        </Pop>
      </Abs>
    </AbsoluteFill>
  );
};

// ---------------- R: Tuki reveal ----------------
const R: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const rings = [0, 0.25, 0.5].map((d) => prog(frame - sec(9.75 + d), f30(30, fps), E.out));
  return (
    <AbsoluteFill>
      <Backdrop strength={1.6} />
      <Abs x={50} y={42} center>
        <div style={{position: 'relative', width: u(22), height: u(22)}}>
          {rings.map((p, i) => p > 0 && p < 1 ? <div key={i} style={{position: 'absolute', left: '50%', top: '50%', width: u(22) * (1 + p * 1.6), height: u(22) * (1 + p * 1.6), transform: 'translate(-50%, -50%)', borderRadius: '30%', border: `${u(0.4)}px solid ${alpha(t.palette.primary, 0.6 * (1 - p))}`}} /> : null)}
          <Pop at={9.7} dur={14} from={0.5}><Logo size={22} /></Pop>
        </div>
      </Abs>
      <Abs x={50} y={70} center w={90}><BlurLine size={9} keyColor={t.palette.text} words={[{t: '**Tuki**', at: 10.3}]} /></Abs>
    </AbsoluteFill>
  );
};

// ---------------- END: Tuki on a 3D Mac + call to action ----------------
const END: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useTheme();
  const {u} = useU();
  const sec = useSec();
  const ry = interpolate(frame, [sec(31.05), sec(38)], [22, 12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.push});
  return (
    <AbsoluteFill>
      <Backdrop />
      <Abs x={4} y={20}>
        <Pop at={31.1} dur={16} from={0.9}>
          <MacDevice width={86} rotY={ry} rotX={5}>
            <div style={{position: 'absolute', left: '5%', top: '14%', fontSize: u(3), ...keyFont(t), color: t.palette.text}}>ক্লায়েন্ট মিটিং</div>
            <div style={{position: 'absolute', left: '5%', top: '24%', fontSize: u(2.4), ...bodyFont(t), color: t.palette.text, background: alpha(t.palette.primary, 0.18), padding: `0 ${u(0.4)}px`, borderRadius: u(0.4)}}>House 12, Road 5, Dhanmondi</div>
            <div style={{position: 'absolute', right: '5%', top: '9%'}}>
              <Panel tab="clips" width={26} search="Search clipboard history">
                {[{title: 'House 12, Road 5, Dhanmondi', meta: 'Notes · 8m'}, {title: 'Meeting moved to Thursday 3:30 PM', meta: 'Mail · 21m'}, {title: 'hello@example.com', meta: 'Contacts · 1h'}, {title: '#F26B1D', meta: 'Figma · 2h', lead: '#'}].map((r, i) => <Row key={i} width={26} {...r} hi={i === 0 ? 1 : 0} />)}
              </Panel>
            </div>
          </MacDevice>
        </Pop>
      </Abs>
      <Abs x={80} y={20} center><Pop at={31.3} dur={14} from={0.6}><Logo size={13} /></Pop></Abs>
      <Abs x={80} y={38} center w={36}><BlurLine size={8} keyColor={t.palette.text} words={[{t: '**Tuki**', at: 31.5}]} /></Abs>
      <Abs x={80} y={50} center w={38}><BlurLine size={3.8} words={[{t: 'Mac-এর', at: 32.0}, {t: 'জন্য', at: 32.2}, {t: '**ফ্রি**', at: 32.45}, {t: 'Clipboard', at: 32.7}, {t: 'Manager', at: 32.9}]} /></Abs>
      <Abs x={80} y={63} center>
        <Pop at={33.5} dur={12}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1.2), padding: `${u(1.1)}px ${u(3)}px`, borderRadius: u(5), background: t.palette.accent, color: t.palette.textOnAccent, fontSize: u(3.4), ...keyFont(t), boxShadow: `0 ${u(1)}px ${u(3)}px ${alpha(t.palette.accent, 0.35)}`}}>
            <Icon name="download" size={u(3.6)} color={t.palette.textOnAccent} stroke={2.6} /> লিংক কমেন্টে
          </div>
        </Pop>
      </Abs>
      <Abs x={80} y={79} center w={40}>
        <Pop at={34.3} dur={12}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(1), fontSize: u(2.6), color: alpha(t.palette.dark, 0.75), ...bodyFont(t)}}>
            বিস্তারিত জানতে ভিজিট করুন
            <div style={{display: 'inline-flex', alignItems: 'center', gap: u(1), padding: `${u(0.6)}px ${u(1.8)}px ${u(0.6)}px ${u(0.7)}px`, borderRadius: u(4), background: t.palette.light, boxShadow: `0 ${u(0.5)}px ${u(1.6)}px ${alpha(t.palette.dark, 0.12)}`, color: t.palette.text, ...keyFont(t)}}>
              <Img src={staticFile('img/ca-logo.webp')} style={{width: u(4), height: u(4), borderRadius: u(0.8)}} /> Creative Assistant পেইজে
            </div>
          </div>
        </Pop>
      </Abs>
    </AbsoluteFill>
  );
};

const SFX: {at: number; file: string}[] = [
  {at: 0.3, file: 'key'}, {at: 1.75, file: 'key'}, {at: 1.95, file: 'whoosh'}, {at: 3.4, file: 'pop'},
  {at: 4.75, file: 'type'}, {at: 5.9, file: 'click'}, {at: 7.1, file: 'pop'}, {at: 7.8, file: 'type'},
  {at: 9.6, file: 'whoosh'}, {at: 9.75, file: 'ding'},
  {at: 11.5, file: 'key'}, {at: 11.7, file: 'key'}, {at: 11.9, file: 'key'}, {at: 13.35, file: 'click'},
  {at: 17.55, file: 'click'}, {at: 20.55, file: 'click'}, {at: 24.5, file: 'type'}, {at: 25.6, file: 'unlock'},
  {at: 29.6, file: 'click'}, {at: 29.7, file: 'ding'}, {at: 31.0, file: 'whoosh'}, {at: 31.3, file: 'pop'},
];
const CAPS: [string, number, number][] = [
  ['কপি করলেন…', 0.0, 1.5], ['আরেকটা **কপি** করলেন…', 1.5, 3.0], ['আগেরটা গেল **কোথায়?**', 3.0, 4.45],
  ['Mac-এ আগের কপি আর **খুঁজে পাওয়া যায় না**', 4.6, 7.0], ['আবার খোঁজা, আবার **টাইপ** করা', 7.05, 9.45], ['তাই বানালাম — **Tuki!**', 9.6, 11.1],
];
export const COMBO_SEC = 38;
export const TukiCombo: React.FC = () => {
  const {fps} = useVideoConfig();
  const sec = (s: number) => Math.round((s + OFF) * fps);
  const end = COMBO_SEC * fps;
  return (
    <ThemeProvider theme={THEME}>
      <Fonts>
        <AbsoluteFill>
          <Backdrop />
          <Scene start={0} end={sec(3.0)}><H1 /></Scene>
          <Scene start={sec(3.0)} end={sec(4.5)}><H3 /></Scene>
          <Scene start={sec(4.5)} end={sec(7.0)}><H4 /></Scene>
          <Scene start={sec(7.0)} end={sec(9.55)}><H5 /></Scene>
          <Scene start={sec(9.55)} end={sec(11.1)}><R /></Scene>
          <Scene start={sec(11.1)} end={sec(14.85)}><S4 /></Scene>
          <Scene start={sec(14.85)} end={sec(18.8)}><S5 /></Scene>
          <Scene start={sec(18.8)} end={sec(22.3)}><S6 /></Scene>
          <Scene start={sec(22.3)} end={sec(28.3)}><S7 /></Scene>
          <Scene start={sec(28.3)} end={sec(31.05)}><S8 /></Scene>
          <Scene start={sec(31.05)} end={end} exitBlur={false}><END /></Scene>
          {CAPS.map(([c, a, b], i) => <Caption key={i} text={c} at={a} until={b} />)}
        </AbsoluteFill>
        <Sequence from={sec(0)}><Audio src={staticFile('audio/voice.mp3')} /></Sequence>
        <Audio src={staticFile('audio/music.wav')} volume={(f) => interpolate(f, [0, 20, end - 60, end], [0, 0.15, 0.15, 0], {extrapolateRight: 'clamp'})} />
        {SFX.map((s, i) => <Sequence key={i} from={sec(s.at)}><Audio src={staticFile(`audio/sfx-${s.file}.wav`)} volume={0.28} /></Sequence>)}
      </Fonts>
    </ThemeProvider>
  );
};
