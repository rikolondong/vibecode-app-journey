# Task List: Pocong Hunt (Cong Hunt)

## Phase 1: Foundation (Engine, Audio & Graphics)

- [x] **Task 1: Project Scaffolding & Setup**
  - **Description:** Menginisialisasi proyek Vite dengan Phaser 3, membuat struktur folder, HTML container dengan CSS pixel-art viewport, serta konfigurasi engine Phaser dasar.
  - **Acceptance criteria:**
    - [x] `package.json` memuat script `dev`, `build`, dan `preview` serta dependensi `phaser` dan `vite`.
    - [x] `src/config.js` mendefinisikan resolusi `320x240`, mode `Scale.FIT`, dan `pixelArt: true`.
    - [x] Canvas ter-center di layar browser dengan aspect ratio terjaga.
  - **Verification:**
    - [x] `npm run dev` berjalan tanpa error dan build bundle sukses.
  - **Dependencies:** None
  - **Files touched:**
    - `package.json`
    - `vite.config.js`
    - `index.html`
    - `style.css`
    - `src/main.js`
    - `src/config.js`
  - **Status:** COMPLETED

- [x] **Task 2: Web Audio 8-Bit Synthesizer (`SoundManager.js`)**
  - **Description:** Membangun sound manager prosedural menggunakan Web Audio API tanpa file audio eksternal untuk menghasilkan efek suara chiptune retro 8-bit.
  - **Acceptance criteria:**
    - [x] Mampu menghasilkan SFX: tembakan (`playGunshot`), pantulan lompat (`playPocongJump`), tembakan kena (`playHit`), pocong jatuh (`playFall`), tawa kuntilanak (`playKuntiLaugh`), dan jingle retro.
    - [x] Menangani auto-resume `AudioContext` saat interaksi pertama user.
  - **Verification:**
    - [x] Panggilan method sound menghasilkan audio bersih pada speaker tanpa error browser.
  - **Dependencies:** Task 1
  - **Files touched:**
    - `src/audio/SoundManager.js`
  - **Status:** COMPLETED

- [x] **Task 3: Procedural Pixel Art Generator (`PixelArtGenerator.js` & `BootScene.js`)**
  - **Description:** Membuat generator pixel art 8-bit berbasis Canvas API untuk menghasilkan semua tekstur game langsung ke Phaser Texture Cache.
  - **Acceptance criteria:**
    - [x] Menghasilkan tekstur: `bg_cemetery` (langit malam, bulan, siluet kuburan), `foreground_grass` (nisan & rumput tempat sembunyi), `pocong_white`, `pocong_white_hit`, `pocong_red`, `pocong_red_hit`, `kunti_laugh`, `kunti_hold`, `ui_bullet`, `ui_bullet_empty`, `ui_target_hit`, `ui_target_miss`, `ui_target_pending`, dan `crosshair`.
    - [x] Tekstur tersimpan di Phaser TextureManager dan siap digunakan di seluruh Scene.
  - **Verification:**
    - [x] `BootScene` memuat seluruh tekstur ke memori dan beralih ke scene berikutnya tanpa missing texture warning.
  - **Dependencies:** Task 1, Task 2
  - **Files touched:**
    - `src/gfx/PixelArtGenerator.js`
    - `src/scenes/BootScene.js`
  - **Status:** COMPLETED

## Checkpoint 1: Foundation
- [x] Server lokal dan build aktif
- [x] Semua tekstur pixel art ter-generate tajam
- [x] Sound manager siap memproduksi SFX retro 8-bit

---

## Phase 2: Core Gameplay & Entities

- [x] **Task 4: Crosshair & Shooting System (`Crosshair.js` & Input Handling)**
  - **Description:** Mengatur kursor bidikan retro kustom, interaksi klik/tap, pengelolaan 3 peluru per gelombang, dan efek visual light gun flash putih.
  - **Acceptance criteria:**
    - [x] Crosshair mengikuti kursor pointer dengan halus.
    - [x] Klik/tap mengurangi amunisi dari 3 menjadi 0, memicu flash putih 1 frame di layar, dan memainkan audio tembakan.
    - [x] Jika amunisi 0, klik tidak memicu tembakan (suara klik kosong).
  - **Verification:**
    - [x] Klik di sembarang area canvas menghasilkan flash putih dan pengurangan amunisi.
  - **Dependencies:** Task 3
  - **Files touched:**
    - `src/entities/Crosshair.js`
    - `src/scenes/GameScene.js`
  - **Status:** COMPLETED

- [x] **Task 5: Pocong Target Entity (`Pocong.js`)**
  - **Description:** Mengembangkan entitas Pocong dengan fisika lompatan parabola zig-zag, state machine, dan variasi Pocong Putih vs Pocong Merah.
  - **Acceptance criteria:**
    - [x] Pocong muncul dari balik rumput/kuburan, melompat parabola memantul di dalam batas layar.
    - [x] Pocong Merah memiliki kecepatan ~1.55x lebih tinggi dari Pocong Putih.
    - [x] Saat tertembak (`HIT`), pocong berputar dan jatuh ke bawah gundukan tanah.
    - [x] Jika amunisi habis atau waktu lompat selesai, pocong berganti state `ESCAPING` dan melesat ke atas langit.
  - **Verification:**
    - [x] Spawn pocong dapat ditembak dengan akurat; pocong bereaksi jatuh saat kena dan kabur saat gagal.
  - **Dependencies:** Task 4
  - **Files touched:**
    - `src/entities/Pocong.js`
    - `src/scenes/GameScene.js`
  - **Status:** COMPLETED

- [x] **Task 6: Kuntilanak Reaction Entity (`Kuntilanak.js`)**
  - **Description:** Mengembangkan karakter Kuntilanak yang muncul dari balik nisan untuk menertawakan kegagalan pemain atau memamerkan pocong saat berhasil ditembak.
  - **Acceptance criteria:**
    - [x] Saat pocong lolos/kabur: Kuntilanak sembul ke atas nisan, memainkan animasi tertawa dan suara melengking `playKuntiLaugh`.
    - [x] Saat pocong tertembak: Kuntilanak sembul memegang pocong dengan ekspresi bangga.
    - [x] Setelah 1.3 detik, Kuntilanak turun kembali bersembunyi.
  - **Verification:**
    - [x] Kuntilanak muncul dan bersuara sesuai kondisi tembakan kena/meleset.
  - **Dependencies:** Task 5
  - **Files touched:**
    - `src/entities/Kuntilanak.js`
    - `src/scenes/GameScene.js`
  - **Status:** COMPLETED

## Checkpoint 2: Core Gameplay
- [x] Siklus bidik-tembak bekerja responsif
- [x] Pocong melompat, terkena tembakan, atau kabur
- [x] Kuntilanak bereaksi tepat waktu dan ekspresif

---

## Phase 3: Game Loop, Progression & UI

- [x] **Task 7: HUD & Round Progression Manager (`HUD.js` & `GameScene.js`)**
  - **Description:** Menghubungkan seluruh sistem menjadi game loop ronde lengkap dengan batas 10 target, kuota kelulusan, dan HUD retro.
  - **Acceptance criteria:**
    - [x] HUD menampilkan amunisi (3 peluru), 10 indikator target di bar bawah, ronde aktif, dan skor saat ini.
    - [x] Mengatur kemunculan 10 target secara berurutan (Mode A: 1 per 1, Mode B: 2 sekaligus).
    - [x] Mengevaluasi kuota kelulusan ronde (minimal 6-9 target kena); lanjut ronde berikutnya dengan peningkatan kecepatan jika lulus.
  - **Verification:**
    - [x] Menyelesaikan ronde 10 target memicu transisi ke ronde berikutnya jika kuota tercapai, atau memicu game over jika gagal.
  - **Dependencies:** Task 6
  - **Files touched:**
    - `src/ui/HUD.js`
    - `src/scenes/GameScene.js`
  - **Status:** COMPLETED

- [x] **Task 8: Menu, Game Over & High Score Polish (`MenuScene.js`, `GameOverScene.js`)**
  - **Description:** Menyelesaikan menu utama bergaya retro arcade, layar Game Over, penyimpanan rekor lokal (localStorage), dan pengujian build produksi.
  - **Acceptance criteria:**
    - [x] MenuScene menyediakan tombol pemilihan Mode A (1 Pocong) & Mode B (2 Pocong).
    - [x] GameOverScene menampilkan skor akhir, memutar jingle sedih, dan memeriksa apakah pemain mencetak rekor baru di `localStorage`.
    - [x] Mendukung input sentuh (touch tap) dengan nyaman di mobile.
    - [x] Build produksi `npm run build` sukses menghasilkan direktori `dist/` mandiri.
  - **Verification:**
    - [x] Seluruh loop permainan dapat dimainkan dari awal hingga akhir tanpa error console.
    - [x] `npm run build` berhasil dengan exit code 0.
  - **Dependencies:** Task 7
  - **Files touched:**
    - `src/scenes/MenuScene.js`
    - `src/scenes/GameOverScene.js`
    - `README.md`
  - **Status:** COMPLETED

## Checkpoint 3: Complete & Production Ready
- [x] Seluruh fitur dalam `SPEC.md` terimplementasi 100%
- [x] Game teruji stabil dan menyenangkan untuk dimainkan
- [x] Siap direview oleh user
