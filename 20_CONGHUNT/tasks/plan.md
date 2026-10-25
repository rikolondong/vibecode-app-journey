# Implementation Plan: Pocong Hunt (Cong Hunt)

## Overview
Membangun game web arcade retro 2D **"Pocong Hunt"** berbasis Phaser 3 dan Vite dengan tema horor-komedi lokal Indonesia. Game mengadaptasi mekanisme klasik NES *Duck Hunt*: menembak pocong yang melompat-lompat dengan jatah 3 peluru per kemunculan, ditemani Kuntilanak yang menertawakan pemain saat tembakan meleset, sistem ronde 10 target, dan generator audio/pixel art mandiri (self-contained).

## Architecture Decisions
- **Vite + Phaser 3**: Tooling ringan, start server instan, dan build statis produksi siap hosting (GitHub Pages/Netlify/Vercel).
- **Procedural Canvas Textures (`PixelArtGenerator`)**: Menghasilkan seluruh sprite pixel art (Pocong Putih, Pocong Merah, Kuntilanak, Nisan, Pohon Kamboja, Bulan, Peluru, Crosshair) langsung ke Phaser Texture Cache saat runtime. Menghilangkan risiko 404/broken assets.
- **Synthesized 8-Bit Audio (`SoundManager`)**: Menggunakan Web Audio API murni untuk sintesis suara chiptune retro (tembakan, pantulan lompat, ledakan/jatuh, tawa melengking Kuntilanak, dan jingle ronde). Tidak butuh download file MP3/WAV besar.
- **Vertical Feature Slicing**: Membangun fondasi engine -> mekanik bidik tembak & entitas -> game loop ronde & HUD -> menu & penyimpanan high score.

## Task List

### Phase 1: Foundation (Engine, Audio & Graphics)
- [ ] **Task 1: Project Scaffolding & Setup**
  - Inisialisasi `package.json`, `vite.config.js`, `index.html`, dan struktur direktori `src/`.
  - Install dependensi `phaser` dan `vite`.
  - Konfigurasi `src/config.js` (resolusi 320x240, scale FIT, pixelArt true) dan `src/main.js`.
- [ ] **Task 2: Web Audio 8-Bit Synthesizer (`SoundManager.js`)**
  - Implementasi sintesis procedural chiptune SFX: Gunshot, Pocong Jump, Hit Crunch, Pocong Fall, Tawa Kuntilanak, Jingle Round/GameOver.
  - Penanganan Web Audio API resume on user gesture.
- [ ] **Task 3: Procedural Pixel Art Generator (`PixelArtGenerator.js` & `BootScene.js`)**
  - Pembuatan sprite pixel art 8-bit retro: Background kuburan malam, pohon kamboja, nisan, rumput depan, Pocong Putih, Pocong Merah, Kuntilanak, Peluru, dan Crosshair.
  - Registrasi ke Phaser TextureManager di `BootScene`.

### Checkpoint: Foundation
- [ ] Game berjalan di browser dengan `npm run dev`.
- [ ] Seluruh tekstur pixel art ter-generate tajam tanpa blur.
- [ ] Sound manager dapat memainkan suara tembakan dan tawa 8-bit tanpa error.

### Phase 2: Core Gameplay & Entities
- [ ] **Task 4: Crosshair & Shooting System (`Crosshair.js` & Input Handling)**
  - Crosshair kustom yang mengikuti pointer (mouse/touch).
  - Logika amunisi: 3 peluru per wave, efek NES white flash screen, suara tembakan.
  - Deteksi tembakan mengenai target vs tembakan meleset.
- [ ] **Task 5: Pocong Target Entity (`Pocong.js`)**
  - State machine: `SPAWNING`, `HOPPING` (lintasan parabola zig-zag acak), `HIT` (berputar dan jatuh), `ESCAPING` (melayang kabur ke langit saat peluru habis/timeout).
  - Variasi: Pocong Putih (kecepatan normal) & Pocong Merah (kecepatan tinggi, bonus skor).
- [ ] **Task 6: Kuntilanak Reaction Entity (`Kuntilanak.js`)**
  - State machine: `HIDDEN`, `POPUP_LAUGH` (sembul dari balik nisan tertawa "hihihi" saat pemain gagal), `POPUP_CELEBRATE` (sembul bangga memegang pocong saat kena).

### Checkpoint: Core Gameplay
- [ ] Pemain dapat menembak pocong yang melompat di layar dengan jatah 3 peluru.
- [ ] Pocong jatuh jika kena, atau kabur jika amunisi habis.
- [ ] Kuntilanak bereaksi akurat (tertawa saat gagal, selebrasi saat kena).

### Phase 3: Game Loop, Progression & UI
- [ ] **Task 7: HUD & Round Progression Manager (`HUD.js` & `GameScene.js`)**
  - HUD: Ikon 3 peluru, bar indikator 10 target (hijau=kena, merah=meleset), nomor ronde, skor.
  - Progresi ronde: 10 target per ronde, pengecekan kuota kelulusan (min 6-9 kena), kenaikan kecepatan ronde berikutnya.
  - Opsi Mode 1 Pocong (Mode A) dan Mode 2 Pocong (Mode B).
- [ ] **Task 8: Menu, Game Over & High Score Polish (`MenuScene.js`, `GameOverScene.js`)**
  - Tampilan Menu Scene retro dengan opsi Mode A / Mode B dan High Score.
  - Layar Game Over dengan evaluasi skor, suara sedih chiptune, dan tombol restart.
  - Penyimpanan `localStorage` untuk rekor nilai tertinggi.
  - Optimasi responsivitas mobile touch dan verifikasi build produksi `npm run build`.

### Checkpoint: Complete
- [ ] Siklus penuh berjalan mulus: Menu -> Game -> Ronde 1..N -> Game Over -> Restart.
- [ ] Build produksi `npm run build` sukses tanpa warning/error.
- [ ] Siap dimainkan dan direview oleh user.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| AudioContext diblokir oleh browser sebelum ada interaksi user | Med | Inisialisasi AudioContext pada interaksi pertama (klik mouse / sentuhan layar) di `MenuScene`. |
| Pixel art blur pada layar resolusi tinggi / Retina display | Med | Atur `pixelArt: true`, `roundPixels: true`, dan `image-rendering: pixelated` pada CSS canvas. |
| Koordinat bidikan meleset pada mode fullscreen / responsive scaling | High | Gunakan `pointer.worldX` dan `pointer.worldY` dari kamera Phaser untuk akurasi hit detection mutlak. |

## Open Questions
- Tidak ada. Semua dependensi dan spesifikasi telah disepakati.
