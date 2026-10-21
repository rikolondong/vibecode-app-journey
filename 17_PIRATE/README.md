# 🏴‍☠️ Lautan Tak Bertuan — Indie Pirate Adventure

Game bertemakan bajak laut indie yang terinspirasi dari **Sea of Thieves**, dibangun menggunakan **Three.js** (WebGL 3D), shader ombak prosedural, fisika apung kapal di atas ombak, siklus siang-malam dinamis, sistem tempur meriam, perburuan harta karun pulau terpencil, dan synthesizer audio prosedural (**Web Audio API** tanpa perlu download file mp3 eksternal).

---

## 🎮 Fitur Utama (Khas Sea of Thieves)

1. **Fisika Berlayar Otentik**:
   - **Layar (Sails)**: Naikkan / turunkan layar untuk menangkap hembusan angin.
   - **Arah Angin (Wind Direction)**: Kapal melaju kencang jika mengarahkan haluan searah angin.
   - **Kemudi & Jangkar (Helm & Anchor)**: Kendalikan sudut kemudi kapal dan jatuhkan jangkar saat hendak berlabuh di pulau.
   - **Ombak & Fluktuasi Badan Kapal**: Simulasi gelombang gerstner matematis yang memiringkan (pitch & roll) kapal secara dinamis.
2. **Sistem Kerusakan & Menambal Lambung (Damage & Repair)**:
   - Terkena tembakan meriam atau karang membuat kapal berlubang.
   - Air perlahan membanjiri lambung kapal.
   - Gunakan papan kayu untuk menambal kebocoran sebelum kapal tenggelam!
3. **Perburuan Harta Karun (Voyages & X Marks the Spot)**:
   - Buka **Peta Perkamen Besar** (`M`) untuk melihat pulau tujuan dengan tanda silang merah `✕`.
   - Turun dari kapal (`E`), jelajahi pulau pasir dan pohon kelapa, gunakan sekop (`F`) untuk menggali peti harta karun!
   - Angkut peti emas kembali ke kapalmu.
4. **Pertempuran Kapal Tengkorak (Skeleton Ships Broadside Combat)**:
   - Kapal hantu bajak laut tengkorak berkeliaran di lautan lepas.
   - Bidik dan tembakkan meriam lambung kiri/kanan (*port & starboard broadside*).
   - Tenggelamkan kapal musuh untuk mendapatkan peti jarahan dan amunisi terapung!
5. **Pelabuhan Sanggar (Outpost Trading Post)**:
   - Jual peti-peti karun ke Persekutuan Emas (*Gold Hoarders*) di dermaga pelabuhan (`T`).
   - Beli amunisi peluru meriam (`B`) dan persediaan papan kayu tambal (`N`).
   - Kumpulkan **5.000 Emas** untuk dinobatkan sebagai **Legenda Bajak Laut**!
6. **Audio Prosedural & Shanty Musik**:
   - Sintesis Web Audio API langsung menghasilkan dentuman meriam, cipratan air ombak, ayunan sekop, dentang koin emas, hingga melodi akordeon bajak laut.

---

## 🕹️ Daftar Kontrol Permainan

### Saat di Kemudi Kapal:
- **`W` / `S`** : Naikkan (bentangkan) / turunkan (gulung) layar
- **`A` / `D`** : Putar kemudi kapal ke kiri / kanan
- **`Mouse`** : Putar sudut pandang kamera & bidik arah meriam
- **`Klik Kiri`** : Tembak meriam samping (*broadside*) ke arah yang dibidik
- **`X`** : Turunkan / naikkan jangkar
- **`Tahan R`** : Tambal lubang bocor kapal dengan papan kayu
- **`E`** : Turun dari kapal (masuk mode jalan kaki)
- **`M`** : Buka / tutup Peta Perkamen Dunia
- **`H`** : Buka / tutup panduan kontrol
- **`K`** : Nyalakan / bisukan musik latar

### Saat Berjalan Kaki di Pulau:
- **`W`, `A`, `S`, `D`** : Berjalan di pantai/pulau
- **`Shift`** : Berlari kencang
- **`Spasi`** : Melompat
- **`Tahan F`** : Gali sekop di tanda silang `✕` harta karun
- **`E`** : Simpan peti ke dalam kapal atau kembali naik ke kemudi

### Di Pelabuhan Sanggar (Outpost):
- **`T`** : Jual seluruh peti harta karun untuk mendapatkan emas
- **`B`** : Beli 12 peluru meriam (100 Emas)
- **`N`** : Beli 6 papan kayu tambal (100 Emas)

---

## 🚀 Cara Menjalankan Game

Cukup jalankan lokal server HTTP dengan salah satu cara berikut:

### Opsi 1: Menggunakan Node.js / npx
```bash
npm start
# atau
npx serve .
```
Lalu buka peramban di `http://localhost:3000`.

### Opsi 2: Menggunakan Python (jika terpasang)
```bash
python -m http.server 3000
```

### Opsi 3: Menggunakan VS Code Live Server
Klik kanan `index.html` lalu pilih **Open with Live Server**.
