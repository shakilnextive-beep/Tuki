import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThemeProvider, useTheme, alpha, bodyFont, keyFont} from './style/theme';
import {useU} from './style/layout';
import {THEME, Fonts, Backdrop} from './brand';
import {Logo, Panel, Row, FeaturePill} from './ui';

const Inner: React.FC = () => {
  const t = useTheme();
  const {u} = useU();
  const rows = [
    {title: 'hello@example.com', meta: 'Contacts · 2m', pinned: true},
    {title: 'House 12, Road 5, Dhanmondi, Dhaka 1205', meta: 'Notes · 8m'},
    {title: 'Meeting moved to Thursday 3:30 PM', meta: 'Mail · 21m'},
    {title: 'developer.apple.com/documentation', meta: 'Safari · 34m', lead: 'www'},
    {title: '#F26B1D', meta: 'Figma · 1h', lead: '#'},
  ];
  return (
    <AbsoluteFill>
      <Backdrop strength={1.6} />
      <div style={{position: 'absolute', left: '6%', top: '20%', width: '54%'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: u(3)}}>
          <Logo size={17} />
          <div style={{...keyFont(t), fontSize: u(16), color: t.palette.text, lineHeight: 1}}>Tuki</div>
        </div>
        <div style={{marginTop: u(3.5), fontSize: u(7.2), lineHeight: 1.22, color: t.palette.text, ...bodyFont(t)}}>
          Mac-এর জন্য <span style={{...keyFont(t), color: t.palette.textOnAccent, background: t.palette.accent, padding: `0 ${u(1.4)}px`, borderRadius: u(1.4)}}>ফ্রি</span><br />
          <span style={keyFont(t)}>Clipboard Manager</span>
        </div>
        <div style={{display: 'flex', gap: u(1.4), marginTop: u(4.5), flexWrap: 'wrap'}}>
          <FeaturePill icon="smile" label="Emoji" at={-5} size={3} />
          <FeaturePill icon="gif" label="GIF" at={-5} size={3} />
          <FeaturePill icon="bookmark" label="Snippets" at={-5} size={3} />
          <FeaturePill icon="lock" label="Confidential" at={-5} size={3} />
        </div>
      </div>
      <div style={{position: 'absolute', left: '61%', top: '9%', transform: 'rotate(4deg)'}}>
        <Panel tab="clips" width={52} search="Search clipboard history">
          {rows.map((r, i) => <Row key={i} width={52} {...r} hi={i === 1 ? 1 : 0} />)}
        </Panel>
      </div>
    </AbsoluteFill>
  );
};
export const Thumbnail: React.FC = () => (
  <ThemeProvider theme={THEME}><Fonts><Inner /></Fonts></ThemeProvider>
);
