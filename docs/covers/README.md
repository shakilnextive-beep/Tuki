# Promo covers (16:9, 1600×900)

Made from the README screenshots (sample data only). Used on SupportKori.

- `cover-1-dark.png`: main cover (SupportKori post and shop listing)
- `cover-2-orange.png`, `cover-3-bangla.png`, `cover-4-light.png`: shop gallery

Rebuild after new screenshots:

```bash
swift tools/make-cover-1.swift "$PWD" docs/covers/cover-1-dark.png
swift tools/make-covers.swift "$PWD" docs/covers
```
