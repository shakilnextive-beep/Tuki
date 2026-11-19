// থিম: রঙ, ফন্ট, ইজিং — একমাত্র উৎস। কোনো কম্পোনেন্টে রঙ/ফন্ট/ইজিং সরাসরি লেখা নয়।
// রঙের মান ইচ্ছা করে ফাঁকা: প্রতিটা ভিডিওতে অনুমোদিত প্যালেট দিয়ে ভরা হবে (SKILL.md রঙের নিয়ম)।
import React, {createContext, useContext} from 'react';
import {E, SPRING} from './easing';

export type Palette = {
  primary: string;      // প্রধান রঙ (ব্যাকড্রপ গ্রেড, বড় শেপ)
  accent: string;       // অ্যাকসেন্ট (কীওয়ার্ড, ব্যাজ, আইকন, গ্লো) — বাক্যে ১–২টা শব্দ
  accent2?: string;     // ঐচ্ছিক দ্বিতীয় অ্যাকসেন্ট (গ্রেডিয়েন্টের অন্য প্রান্ত)
  dark: string;         // গাঢ় নিউট্রাল (গাঢ় ব্যাকড্রপ, লেখা আলো থিমে)
  light: string;        // হালকা নিউট্রাল (কার্ড বডি, লেখা গাঢ় থিমে)
  text: string;         // প্রধান লেখার রঙ
  textOnAccent: string; // অ্যাকসেন্ট বক্সের ওপরে লেখা
  positive?: string;    // ✓/নতুন দাম (প্যালেটে থাকলে)
  negative?: string;    // ✕/কাটা দাম (প্যালেটে থাকলে)
};

export type Fonts = {
  bn: string;           // বাংলা ফন্ট পরিবার — ব্যবহারকারী যা বলবে (references/fonts.md); Hind Siliguri নয়
  en: string;           // ইংরেজি ফন্ট পরিবার (যেমন Montserrat); আলাদা না হলে bn-এর নামই দাও
  heavy: number;        // কীওয়ার্ডের ওজন (সাধারণত 700)
  regular: number;      // সাধারণ কথার ওজন (সাধারণত 400)
  keyword: 'bold' | 'boldItalic'; // কীওয়ার্ডের ধরন — প্রতি ভিডিওতে ব্যবহারকারী বলবে
  keywordFamily?: string; // কীওয়ার্ড অন্য পরিবারে হলে (যেমন Li Purno Pran-এ Bold নেই → কীওয়ার্ড Li Ador Noirrit Bold)
};

export type Theme = {
  palette: Palette;
  fonts: Fonts;
  mode: 'dark' | 'light';
  digits: 'bn' | 'en';  // সংখ্যার অঙ্ক
  ease: typeof E;
  spring: typeof SPRING;
};

// ফাঁকা টেমপ্লেট — ভরাট না করে রেন্ডার করলে assertTheme() থামিয়ে দেবে।
export const EMPTY_THEME: Theme = {
  palette: {primary: '', accent: '', dark: '', light: '', text: '', textOnAccent: ''},
  fonts: {bn: '', en: '', heavy: 700, regular: 400, keyword: 'bold'},
  mode: 'dark',
  digits: 'bn',
  ease: E,
  spring: SPRING,
};

export const assertTheme = (t: Theme) => {
  const missing = Object.entries(t.palette).filter(([k, v]) => ['primary', 'accent', 'dark', 'light', 'text', 'textOnAccent'].includes(k) && !v).map(([k]) => k);
  if (/hind\s*siliguri/i.test(t.fonts.bn + t.fonts.en)) throw new Error('Hind Siliguri ব্যবহার নিষেধ — ব্যবহারকারীর বলা ফন্ট বসাও (references/fonts.md)।');
  if (missing.length || !t.fonts.bn) {
    throw new Error(`থিম ভরা হয়নি: ${[...missing, !t.fonts.bn ? 'fonts.bn' : ''].filter(Boolean).join(', ')} — অনুমোদিত প্যালেট ও ফন্ট বসাও।`);
  }
};

const Ctx = createContext<Theme>(EMPTY_THEME);
export const ThemeProvider: React.FC<{theme: Theme; children: React.ReactNode}> = ({theme, children}) => {
  assertTheme(theme);
  // font-synthesis: none — যে ওজন ফন্টে নেই (যেমন Li Purno Pran-এ Bold) সেটা নকল-বোল্ড হবে না
  return <Ctx.Provider value={theme}><div style={{display: 'contents', fontSynthesis: 'none'} as React.CSSProperties}>{children}</div></Ctx.Provider>;
};
export const useTheme = () => useContext(Ctx);

// ফন্ট স্ট্যাক: ইংরেজি ফন্ট আগে, তারপর বাংলা ফন্ট — মিশ্র লেখার বাংলা অক্ষর বাংলা ফন্টে যায়।
// সিস্টেম ফন্ট/sans-serif কখনো স্ট্যাকে নয় (চুপচাপ ফেরা নিষেধ)।
export const fontStack = (t: Theme) => (t.fonts.en && t.fonts.en !== t.fonts.bn ? `"${t.fonts.en}", "${t.fonts.bn}"` : `"${t.fonts.bn}"`);

// লেখার নিয়ম: সাধারণ কথা Regular, কীওয়ার্ড Bold বা Bold Italic (একই ভিডিওতে একটাই ধরন)
export const bodyFont = (t: Theme): React.CSSProperties => ({fontFamily: fontStack(t), fontWeight: t.fonts.regular, fontStyle: 'normal'});
export const keyFont = (t: Theme): React.CSSProperties => ({
  fontFamily: t.fonts.keywordFamily ? `"${t.fonts.en && t.fonts.en !== t.fonts.bn ? t.fonts.en + '", "' : ''}${t.fonts.keywordFamily}"` : fontStack(t),
  fontWeight: t.fonts.heavy,
  fontStyle: t.fonts.keyword === 'boldItalic' ? 'italic' : 'normal',
});
// "সাধারণ **কীওয়ার্ড** সাধারণ" → কীওয়ার্ড অংশ keyFont-এ, বাকিটা bodyFont-এ
export const Rich: React.FC<{text: string; keyColor?: string}> = ({text, keyColor}) => {
  const t = useTheme();
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((seg, i) =>
        seg.startsWith('**') ? <span key={i} style={{...keyFont(t), color: keyColor}}>{seg.slice(2, -2)}</span> : <span key={i} style={bodyFont(t)}>{seg}</span>)}
    </>
  );
};

// রঙ সহায়ক (থিমের রঙ থেকে স্বচ্ছতা বানানো, নতুন রঙ নয়)
export const alpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export const grad = (t: Theme, angle = 90) => `linear-gradient(${angle}deg, ${t.palette.accent}, ${t.palette.accent2 || t.palette.accent})`;
