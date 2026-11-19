// ফন্ট লোড — লোড না হলে রেন্ডার থামবে (চুপচাপ সিস্টেম ফন্টে ফেরা নয়)।
// ফন্ট ফাইল: শুধু ব্যবহারকারীর দেওয়া ফন্ট (references/fonts.md) — প্রজেক্টের public/fonts/-এ রেখে useLoadFonts দিয়ে লোড।
// Hind Siliguri বা কোনো npm/গুগল ডিফল্ট ফন্ট নয়।
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {useTheme, fontStack} from './theme';

export type FontFile = {family: string; weight: number; style?: 'normal' | 'italic'; file: string}; // file = public/ ফোল্ডারের পথ

// FontFace দিয়ে লোড (ব্যবহারকারীর আপলোড করা ফন্টের জন্য)
export const useLoadFonts = (files: FontFile[]) => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(files.map(async (ff) => {
      const face = new FontFace(ff.family, `url("${staticFile(ff.file)}")`, {weight: String(ff.weight), style: ff.style || 'normal'});
      await face.load();
      (document.fonts as any).add(face);
    }))
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(new Error('ফন্ট লোড হয়নি: ' + e)));
  }, []);
};

// সব ফন্ট সত্যিই লোড হয়েছে কিনা নিশ্চিত — প্রতিটা পরিবারকে তার নিজের লিপির নমুনা দিয়ে যাচাই (Montserrat-এ বাংলা নেই)
// files দিলে আগে সেগুলো লোড করে, তারপর যাচাই — একটাই কম্পোনেন্টে (রেস কন্ডিশন এড়াতে)
export const FontGate: React.FC<{families: {family: string; weight: number; style?: 'normal' | 'italic'; script?: 'bn' | 'latin'}[]; files?: FontFile[]; children: React.ReactNode}> = ({families, files = [], children}) => {
  const [handle] = useState(() => delayRender('font-gate'));
  const [ok, setOk] = useState(false);
  const sample = (s?: string) => (s === 'latin' ? 'Aa Bb 0123' : 'ক্ষ স্ত প্র র্ক কি কু ১২৩');
  useEffect(() => {
    Promise.all(files.map(async (ff) => {
      const face = new FontFace(ff.family, `url("${staticFile(ff.file)}")`, {weight: String(ff.weight), style: ff.style || 'normal'});
      await face.load();
      (document.fonts as any).add(face);
    }))
      .then(() => Promise.all(families.map((f) => document.fonts.load(`${f.style === 'italic' ? 'italic ' : ''}${f.weight} 40px "${f.family}"`, sample(f.script)))))
      .then((res) => {
        const missing = families.filter((f, i) => !res[i].length || !document.fonts.check(`${f.style === 'italic' ? 'italic ' : ''}${f.weight} 40px "${f.family}"`, sample(f.script)));
        if (missing.length) throw new Error(missing.map((m) => `${m.family} ${m.weight}`).join(', '));
        setOk(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(new Error('ফন্ট লোড হয়নি, সিস্টেম ফন্টে রেন্ডার বন্ধ: ' + e.message)));
  }, []);
  return ok ? <>{children}</> : null;
};

// যুক্তাক্ষর পরীক্ষার ফ্রেম — রেন্ডার করে চোখে দেখো বাক্স (□) বা ভাঙা অক্ষর আছে কিনা
export const GlyphTest: React.FC = () => {
  const t = useTheme();
  const lines = ['ক্ষ স্ত স্ব ন্ত ন্দ জ্ঞ ঙ্ক ষ্ট', 'প্র ক্র শ্র ত্র র্ক র্ম র্থ', 'কি কী কু কূ কৃ কে কৈ কো কৌ', 'শিক্ষার্থী স্ক্রিপ্ট অ্যাপ ১২৩৪৫৬৭৮৯০'];
  return (
    <AbsoluteFill style={{background: t.palette.dark, color: t.palette.light, justifyContent: 'center', padding: '6%', gap: '3%'}}>
      {lines.map((l, i) => (
        <div key={i} style={{fontFamily: fontStack(t), fontWeight: i % 2 ? t.fonts.regular : t.fonts.heavy, fontSize: '5.5vmin'}}>{l}</div>
      ))}
      <div style={{fontFamily: fontStack(t), fontWeight: t.fonts.heavy, fontSize: '4vmin'}}>English sample — {t.fonts.en}</div>
    </AbsoluteFill>
  );
};

// বাংলা অঙ্ক
const BN = '০১২৩৪৫৬৭৮৯';
export const toBnDigits = (s: string) => s.replace(/[0-9]/g, (d) => BN[+d]);
// বাংলা/দক্ষিণ এশীয় হাজার বিভাজক (১০,০০০ / ৫,০০,০০০)
export const groupIndian = (n: number) => {
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3), rest = s.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
};
export const fmtNum = (n: number, digits: 'bn' | 'en', group: boolean | 'indian' | 'western' = 'indian') => {
  let s = group === false ? Math.round(n).toString() : group === 'western' ? Math.round(n).toLocaleString('en-US') : groupIndian(n);
  return digits === 'bn' ? toBnDigits(s) : s;
};

// আমার ফন্ট লাইব্রেরি (references/fonts.md) — ফাইলগুলো প্রজেক্টের public/fonts/-এ কপি করে রাখো
type LibFile = {weight: number; style: 'normal' | 'italic'; file: string};
const both = (weight: number, normal: string, italic?: string): LibFile[] => [{weight, style: 'normal', file: normal}, ...(italic ? [{weight, style: 'italic' as const, file: italic}] : [])];
const AD: [number, string, string][] = [[200, 'ExtraLight', 'ExtraLight Italic'], [300, 'Light', 'Light Italic'], [400, 'Regular', 'Italic'], [600, 'SemiBold', 'SemiBold Italic'], [700, 'Bold', 'Bold Italic']];
const MW: [number, string][] = [[100, 'Thin'], [200, 'ExtraLight'], [300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'SemiBold'], [700, 'Bold'], [800, 'ExtraBold'], [900, 'Black']];
export const FONT_LIBRARY: Record<string, {script: 'bn' | 'latin'; files: LibFile[]}> = {
  'Li Ador Noirrit': {script: 'bn', files: AD.flatMap(([w, n, it]) => both(w, `fonts/Li Ador Noirrit ${n}.ttf`, `fonts/Li Ador Noirrit ${it}.ttf`))},
  'Li Purno Pran': {script: 'bn', files: both(400, 'fonts/Li Purno Pran Unicode.ttf', 'fonts/Li Purno Pran Unicode Italic.ttf')}, // Bold নেই
  Montserrat: {script: 'latin', files: MW.flatMap(([w, n]) => both(w, `fonts/Montserrat-${n}.ttf`, `fonts/Montserrat-${n === 'Regular' ? '' : n}Italic.ttf`))},
};
// ব্যবহৃত পরিবার/ওজন/ধরন থেকে লোড-তালিকা + FontGate-তালিকা। italic = যে ওজনগুলোর Italic লাগবে (যেমন কীওয়ার্ড Bold Italic হলে [700])
export const libraryFonts = (use: {family: string; weights: number[]; italic?: number[]}[]) => {
  const files: FontFile[] = [], gate: {family: string; weight: number; style: 'normal' | 'italic'; script: 'bn' | 'latin'}[] = [];
  for (const u of use) {
    const lib = FONT_LIBRARY[u.family];
    if (!lib) throw new Error(`ফন্ট লাইব্রেরিতে নেই: ${u.family} — references/fonts.md-এ যোগ করো`);
    const want: [number, 'normal' | 'italic'][] = [...u.weights.map((w) => [w, 'normal'] as [number, 'normal']), ...(u.italic || []).map((w) => [w, 'italic'] as [number, 'italic'])];
    for (const [w, st] of want) {
      const f = lib.files.find((x) => x.weight === w && x.style === st);
      if (!f) throw new Error(`${u.family}-এ ${w} ${st} নেই (আছে: ${lib.files.map((x) => x.weight + (x.style === 'italic' ? 'i' : '')).join(', ')})`);
      files.push({family: u.family, weight: w, style: st, file: f.file});
      gate.push({family: u.family, weight: w, style: st, script: lib.script});
    }
  }
  return {files, gate};
};
