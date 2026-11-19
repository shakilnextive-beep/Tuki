// ক্যাপশন ও গ্রাফিক্সের নিয়ম — একটাই তালিকা থেকে ক্যাপশন নিয়ন্ত্রণ (SKILL.md, references/secondary.md)।
// graphicWindows-এ শুধু টেক্সট-বহনকারী গ্রাফিক্স: কার্ড, কীওয়ার্ড হাইলাইট, kinetic/word-by-word টেক্সট,
// তালিকা/পয়েন্ট, কাউন্টার/চার্টের লেবেল, lower third, callout, UI মকআপের লেখা, chapter title, ফুল-স্ক্রিন সিন।
// লেখাহীন আইকন/শেপ/ব্যাকগ্রাউন্ড/জুম/ট্রানজিশন/ছবি-বি-রোল এখানে ঢুকবে না।

export type GraphicWindow = {id: string; start: number; end: number}; // ফ্রেম (ঢোকা শুরু → বেরোনো শেষ)

export const CAPTION_RULE = {
  leadFrames: 4,      // গ্রাফিক্স ঢোকার ৩–৪ ফ্রেম আগে ক্যাপশন পুরো লুকানো
  fadeFrames: 5,      // ফেড ৪–৬ ফ্রেম
  minGapSec: 0.5,     // এর কম ফাঁকে ক্যাপশন ফিরবে না
  minShowSec: 0.4,    // ক্যাপশন একবার এলে অন্তত এতক্ষণ
};

// ছোট ফাঁক জোড়া লাগানো + ন্যূনতম দেখানোর সময় নিশ্চিত করা
export const mergeWindows = (windows: GraphicWindow[], fps: number): GraphicWindow[] => {
  const ws = [...windows].sort((a, b) => a.start - b.start);
  const out: GraphicWindow[] = [];
  const {leadFrames, fadeFrames, minGapSec, minShowSec} = CAPTION_RULE;
  // ক্যাপশন দেখা যাবে [prev.end + fade, next.start − lead − fade] — এই অংশ < max(minGap, minShow) হলে জোড়া
  const minVisible = Math.round(Math.max(minGapSec, minShowSec) * fps);
  for (const w of ws) {
    const last = out[out.length - 1];
    if (last) {
      const visible = (w.start - leadFrames - fadeFrames) - (last.end + fadeFrames);
      const gap = w.start - last.end;
      if (gap < Math.round(minGapSec * fps) || visible < minVisible) {
        last.end = Math.max(last.end, w.end);
        last.id += '+' + w.id;
        continue;
      }
    }
    out.push({...w});
  }
  return out;
};

// প্রতি ফ্রেমে ক্যাপশনের opacity (০–১)
export const captionOpacity = (frame: number, windows: GraphicWindow[], fps: number): number => {
  const {leadFrames, fadeFrames} = CAPTION_RULE;
  let o = 1;
  for (const w of mergeWindows(windows, fps)) {
    const hideStart = w.start - leadFrames;           // এই ফ্রেমে পুরো লুকানো
    const fadeOutStart = hideStart - fadeFrames;
    const fadeInEnd = w.end + fadeFrames;
    let v = 1;
    if (frame >= fadeOutStart && frame < hideStart) v = 1 - (frame - fadeOutStart) / fadeFrames;
    else if (frame >= hideStart && frame <= w.end) v = 0;
    else if (frame > w.end && frame < fadeInEnd) v = (frame - w.end) / fadeFrames;
    o = Math.min(o, v);
  }
  return Math.max(0, Math.min(1, o));
};

// যাচাই: কোনো গ্রাফিক্স তার কথার আগে বেরিয়ে গেছে কিনা (কথা "ফাঁকা" পড়া)
export const checkCoverage = (windows: {id: string; start: number; end: number; speechEnd: number}[]) =>
  windows.filter((w) => w.end < w.speechEnd).map((w) => `${w.id}: গ্রাফিক্স ${w.end} ফ্রেমে শেষ, কিন্তু কথা ${w.speechEnd} পর্যন্ত`);
