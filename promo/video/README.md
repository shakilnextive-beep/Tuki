# Tuki promo video (Facebook announcement)

Remotion project for the Tuki announcement videos, 16:9, 38 s, Bangla voice.

| File | What |
|---|---|
| `export/Tuki-combo.mp4` | **Final** — visual hook (copy lost, search counter, repeat ring, clock) + 3D Mac scenes + end card |
| `export/Tuki-announcement.mp4` | Earlier version (3D Mac with camera moves) |
| `export/Tuki-film.mp4` | Clean product-ad style version (white) |
| `export/Tuki-thumbnail.png` | Facebook thumbnail (cream, Creative Assistant page badge) |
| `export/Tuki-winvsmac-30s.mp4` | **Windows vs Mac reel, 30 s** — Win+V vs ⌘V hook, Tuki by ~7 s, features, CTA (posted on the Creative Assistant page) |
| `export/Tuki-thumbnail-bn.png` | Bangla thumbnail for that reel, 1920×1080 (`tools/make-thumbnail-bn.swift`) |
| `export/Tuki-winvsmac-thumbnail.png` | Alternative thumbnail (`ThumbWinMac` still) |
| `storyline/` | Script, AI-voice script with emotion tags, colour palettes |

## Rebuild

1. Fonts are **not** in the repo (Li Ador Noirrit licence forbids redistribution). Copy
   `Li Ador Noirrit Regular.ttf`, `SemiBold.ttf`, `Bold.ttf` into `project/public/fonts/`.
2. ```bash
   cd promo/video/project
   npm install
   node tools/make-audio.js          # synthesises music.wav and sound effects
   npx remotion studio               # preview
   npx remotion render TukiCombo ../export/Tuki-combo.mp4
   ```
3. Thumbnail: `swift tools/make-thumbnail.swift <Tuki repo path> <out.png> public/img/ca-logo.webp`
   (uses the README screenshots in `docs/screenshots`).

Compositions: `TukiCombo` (final), `TukiAnnouncement`, `TukiFilm`, `Thumbnail`, `TukiWinVsMac30` (30 s reel), `TukiWinVsMac` (56 s version), `ThumbWinMac`.

### Windows vs Mac reel
- Voice: ElevenLabs "Rahat" (`public/audio/voice-winmac30.mp3`, 56 s cut uses `voice-winmac.mp3`). Scripts in `storyline/Tuki-motion-2-script*.md`.
- Sounds and music come from Epidemic Sound (keyboard K2, glass pop, tech whoosh, unlock, error, jazz-piano loop) and live in `public/audio/es/`, which is **not** in the repo (licensed). The ding is our own (`make-audio.js`).

Reference videos used for style are not stored here (they belong to others).
