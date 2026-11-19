# Tuki promo video (Facebook announcement)

Remotion project for the Tuki announcement videos, 16:9, 38 s, Bangla voice.

| File | What |
|---|---|
| `export/Tuki-combo.mp4` | **Final** — visual hook (copy lost, search counter, repeat ring, clock) + 3D Mac scenes + end card |
| `export/Tuki-announcement.mp4` | Earlier version (3D Mac with camera moves) |
| `export/Tuki-film.mp4` | Clean product-ad style version (white) |
| `export/Tuki-thumbnail.png` | Facebook thumbnail (cream, Creative Assistant page badge) |
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

Compositions: `TukiCombo` (final), `TukiAnnouncement`, `TukiFilm`, `Thumbnail`.
Reference videos used for style are not stored here (they belong to others).
