// Thumbnail for the 30s Windows-vs-Mac reel: cream background, 5% margin on every side.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ThemeProvider, useTheme, alpha, bodyFont, keyFont} from './style/theme';
import {useU} from './style/layout';
import {THEME, Fonts, Backdrop} from './brand';
import {Logo, Panel, Row, Keycap, MacDevice} from './ui';

const WINBLUE = '#3E5578';

const Inner: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const rows = [
    {title: 'Meeting moved to Thursday 3:30 PM', meta: 'Text · Mail', lead: 'Aa'},
    {title: 'developer.apple.com/documentation', meta: 'Link · Safari', lead: 'www'},
    {title: 'Screenshot 9.41 AM.png', meta: 'Image · 1440 × 900', lead: 'IMG'},
    {title: 'invoice_final.pdf', meta: 'File · Finder', lead: 'PDF'},
    {title: 'House 12, Road 5, Dhanmondi', meta: 'Text · Notes', lead: 'Aa', pinned: true},
  ];
  const chip = (bg: string, fg: string): React.CSSProperties => ({display: 'inline-flex', alignItems: 'center', gap: u(1), padding: `${u(0.6)}px ${u(1.6)}px`, borderRadius: u(5), background: bg, color: fg, fontSize: u(2.6), ...keyFont(t)});
  return (
    <AbsoluteFill>
      <Backdrop strength={1.6} />
      {/* safe area: 5% on all sides */}
      <div style={{position: 'absolute', left: '5%', right: '5%', top: '5%', bottom: '5%'}}>
        {/* left: the message */}
        <div style={{position: 'absolute', left: 0, top: '12%', width: '50%'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: u(1.6)}}>
            <span style={chip(alpha(WINBLUE, 0.12), WINBLUE)}>Windows</span>
            <Keycap label="win" at={-5} press={-4} size={6.5} />
            <Keycap label="V" at={-5} press={-4} size={6.5} />
          </div>
          <div style={{marginTop: u(3), fontSize: u(8.4), lineHeight: 1.15, color: t.palette.text, ...keyFont(t)}}>
            এবার <span style={{color: t.palette.primary}}>Mac-এ</span>ও<br />সব কপি এক জায়গায়!
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: u(1.6), marginTop: u(3.4)}}>
            <span style={chip(alpha(t.palette.primary, 0.14), t.palette.accent)}>Mac</span>
            <Keycap label="⇧" at={-5} press={-4} size={6.5} />
            <Keycap label="⌘" at={-5} press={-4} size={6.5} />
            <Keycap label="V" at={-5} press={-4} size={6.5} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: u(2), marginTop: u(4)}}>
            <Logo size={10} />
            <div style={{...keyFont(t), fontSize: u(8), color: t.palette.text, lineHeight: 1}}>Tuki</div>
            <span style={{...keyFont(t), fontSize: u(3.6), color: t.palette.textOnAccent, background: t.palette.accent, padding: `${u(0.3)}px ${u(1.6)}px`, borderRadius: u(1.2)}}>সম্পূর্ণ ফ্রি</span>
          </div>
        </div>
        {/* right: MacBook with the Tuki panel */}
        <div style={{position: 'absolute', right: '-4%', top: '10%', width: '56%'}}>
          <MacDevice width={58} rotY={-16} rotX={4}>
            <div style={{position: 'absolute', left: '27%', top: '6%'}}>
              <Panel tab="clips" width={23} search="Search clipboard history">{rows.map((r, i) => <Row key={i} width={23} {...r} hi={i === 1 ? 1 : 0} />)}</Panel>
            </div>
          </MacDevice>
        </div>
        {/* bottom line: page info */}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: u(1.4), padding: `${u(1)}px ${u(2.4)}px`, borderRadius: u(5), background: alpha(t.palette.dark, 0.88), color: t.palette.light, fontSize: u(3.1), ...bodyFont(t)}}>
            <Img src={staticFile('img/ca-logo.webp')} style={{width: u(4.2), height: u(4.2), borderRadius: u(1)}} />
            বিস্তারিত দেখতে ভিজিট করো · <span style={{...keyFont(t), color: t.palette.primary}}>Creative Assistant</span> ফেসবুক পেইজে
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const ThumbWinMac: React.FC = () => (
  <ThemeProvider theme={THEME}><Fonts><Inner /></Fonts></ThemeProvider>
);
