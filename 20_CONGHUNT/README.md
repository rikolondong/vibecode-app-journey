# 👻 POCONG HUNT (CONG HUNT)

> **Game Web Retro Arcade 8-Bit bergaya NES Duck Hunt Klasik dengan Kearifan Horor Lokal Indonesia**
> Proyek #20 dari serial *100 Days of Code / Projects*.

![Pocong Hunt Preview](docs/preview_banner.png) *(Ilustrasi)*

---

## 🎮 Tentang Game

**Pocong Hunt** adalah reinkarnasi arcade klasik *Duck Hunt* (NES 1984), di mana bebek digantikan oleh **Pocong** yang melompat lincah dari balik nisan kuburan malam hari, dan anjing penertawa legendaris digantikan oleh sosok **Kuntilanak** yang muncul mengejek sambil tertawa melengking (*"hihihi"*) saat tembakan meleset, atau memamerkan pocong saat Anda berhasil menembak.

Game ini dibuat menggunakan **Phaser 3** dan **Vite**, dengan **generator pixel art prosedural** dan **synthesizer Web Audio API 8-bit** mandiri sehingga **100% self-contained tanpa dependensi file eksternal**.

---

## ✨ Fitur Utama

- 🎯 **Mekanik Klasik Duck Hunt**:
  - Jatah **3 peluru per gelombang kemunculan**.
  - Efek kilat layar putih (*NES light-gun white flash*) dan suara tembakan 8-bit.
  - Jika peluru habis dan target belum kena, pocong panik dan melesat kabur ke langit.
- 👻 **Variasi Target Pocong**:
  - **Pocong Putih**: Kecepatan normal (500 poin), melompat memantul di udara.
  - **Pocong Merah**: Kecepatan kilat (1500 poin), melompat zig-zag agresif.
- 🧛‍♀️ **Karakter Kuntilanak**:
  - Sembul dari balik nisan dan tertawa melengking saat tembakan meleset.
  - Sembul memegang pocong yang lunglai saat tembakan mengenai sasaran.
- 📊 **Sistem Ronde & Progresi**:
  - 10 target per ronde dengan kuota minimal kena (indikator di bawah layar).
  - Pilihan **Game A (1 Pocong)** dan **Game B (2 Pocong)**.
  - Kecepatan pocong bertambah 12% setiap kenaikan ronde.
  - Penyimpanan **High Score lokal (`localStorage`)**.
- 🔊 **Web Audio Synthesizer 8-Bit**:
  - Suara tembakan, boing lompat pocong, ledakan crunch hit, pocong jatuh, tawa kuntilanak, dan jingle arcade dibuat murni dengan Web Audio API.
- 📱 **Kontrol Multi-Platform**:
  - **Desktop**: Mouse aim + crosshair kustom.
  - **Mobile / Tablet**: Touch tap langsung ke target di layar.

---

## 🚀 Cara Menjalankan

### 1. Prasyarat
- Node.js (v18+) & npm

### 2. Jalankan Mode Development
```bash
npm install
npm run dev
```
Buka browser di alamat `http://localhost:3000`.

### 3. Build Versi Produksi
```bash
npm run build
```
File build statis siap dipublikasikan di direktori `dist/`.

---

## 🕹️ Kontrol

| Aksi | Desktop | Mobile / Layar Sentuh |
|---|---|---|
| Bidik & Tembak | Gerakkan Mouse & Klik Kiri | Sentuh / Tap Layar |
| Navigasi Menu | Panah Atas/Bawah + Enter / Klik | Tap Pilihan Mode |
| Main Lagi | Klik Restart / Spasi / Enter | Tap Layar |

---

## 📜 Lisensi
Dibuat untuk eksperimen dan pembelajaran dalam inisiatif 100 Days Projects.
