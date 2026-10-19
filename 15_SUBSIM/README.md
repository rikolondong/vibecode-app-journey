# ⚓ WWII U-Boat War Simulator — Submarine Simulation Game (U-96)

> **Proyek 15 dari serial VibeCode App Journey oleh Riko Londong.**
> Simulator tempur kapal selam Perang Dunia II berbasis **Three.js** dan **Web Audio API** dengan panel instrumen kuningan gantung otentik, HUD taktis, stasiun periskop tempur, peta navigasi laut, sistem hidrofom akustik, dan AI kapal perusak pengawal konvoi.

---

## 🌟 Fitur Unggulan

### 1. 🧭 Panel Jam Antik Gantung Otentik (Top Hanging Gauges)
Render kanvas 2D beresolusi tinggi dengan tekstur logam kuningan, baut riveted, dan dial kertas antik:
- **Speedometer (0–25 Knots)**: Jarum vintage yang menunjukkan kecepatan kapal selam secara real-time.
- **Depth Gauge (0–260 Meters)**: Pengukur kedalaman laut dengan tiga zona warna:
  - *Green Zone (0–25m)*: Zona permukaan & kedalaman periskop aman.
  - *Yellow Zone (25–100m)*: Kedalaman jelajah patroli.
  - *Red Zone (100–260m)*: Zona bahaya tekanan hancur (*Crush Depth*).
  - *Interaktif*: Klik langsung pada dial untuk memerintahkan target kedalaman.
- **Engine Order Telegraph**: Telegraf mesin dwisisi:
  - Sisi Kiri (*Ahead / Voraus* - Hijau Zaitun): Stop, Slow, Half, Full, Flank (*Äußerste Kraft*).
  - Sisi Kanan (*Astern / Zurück* - Merah): Stop, Slow, Half, Full, Emerg.
  - Tuas kuningan interaktif yang dapat diklik langsung untuk mengubah kecepatan.
- **Rudder Indicator**: Penunjuk sudut kemudi dengan busur merah **Port** (Kiri: 0°–35°) dan busur hijau **Stbd** (Kanan: 0°–35°).
- **Compass & Course Controller**: Kompas mawar 360° dengan tombol kontrol **[L]** dan **[R]** di bagian braket bawah untuk mengoreksi haluan (*heading*).

### 2. 🎛️ Konsol Taktis Bawah (Bottom HUD Console)
- **BATTERY (100%)**: Daya baterai berkurang saat menyelam dengan motor listrik, terisi kembali saat mesin diesel menyala di permukaan.
- **DIESEL (98%)**: Konsumsi bahan bakar solar saat berlayar di permukaan.
- **REPORT**: Layar CRT laporan perwira kapal (*e.g.* `"Ahead Full! Heading 030° steady."`, `"Tube 1 FIRE!"`, `"DEPTH CHARGES dropped!"`).
- **SPEED [14 kn]**: Tampilan digital kecepatan (klik untuk memutar telegraf).
- **DEPTH [2 m]**: Tampilan kedalaman (klik untuk menu cepat: Surface, Periscope 12m, Cruising 45m, Evasion 90m, Crash Dive!).
- **HEADING [30°]**: Arah haluan kapal selam saat ini.
- **RUDDER [0°]**: Sudut kemudi (klik untuk kembali lurus tengah / *amidships*).
- **TORPEDO [14/14]**: Indikator amunisi tabung torpedo (klik untuk meluncurkan).
- **HULL [94%]**: Integritas ketahanan lambung dari ledakan bom laut.
- **HYDROPHONE**: Sensor hidrofom akustik (*"0 - Too loud"* jika melaju kencang, aktif saat senyap).

### 3. 🚢 Model 3D U-Boot Type VII & Simulasi Lautan Realistis
- **Kapal Selam Type VII**: Lambung ganda abu-abu Hellgrau 50, tangki pelampung samping (*saddle tanks*), dek kayu jati (*teak deck*) dengan lubang pembuangan air (*limber holes*), menara anjungan (*conning tower*), meriam dek 8.8 cm, kanon antipesawat 2.0 cm Flak, baling-baling kuningan yang berputar sesuai kecepatan mesin, kemudi dinamis, dan bendera Kriegsmarine yang berkibar.
- **Efek Busa & Gelombang**: Semprotan buih haluan (*bow spray*) dan jejak buih air baling-baling (*stern wake*) yang berpadu halus dengan permukaan samudra.
- **Fisika Kedalaman & Apung**: Gerak angguk (*pitch*) saat menyelam/muncul, air laut membasahi dek, hingga kabut biru pekat saat menyelam ke dasar laut.
- **Siklus Cuaca & Waktu**: Siang hari (*Day*), Senja (*Sunset*), Malam berbintang (*Night*), dan Badai ombak besar (*Storm*).

### 4. 🎯 Stasiun & Mode Kamera
- **F1: External View**: Kamera orbit 3D bebas mouse-look dan zoom scroll di sekitar kapal selam.
- **F2: Bridge Deck**: Sudut pandang perwira jaga di dek anjungan terbuka menatap lautan luas.
- **F3: Attack Periscope**: Teropong periskop tempur optik 1.5x / 6.0x dengan retikel miliradian, cincin azimuth, dan kalkulator sasaran **TDC (Torpedo Data Computer)**.
- **F4 / M: Tactical Map**: Peta navigasi bahari bergrid dengan penjejak konvoi Sekutu, trajektori torpedo, dan plotting arah haluan.
- **F5: Hydrophone Room (GHG)**: Ruang operator sonar pasif dengan roda kemudi akustik 360° dan meteran dB untuk melacak putaran baling-baling kapal musuh dalam kegelapan.

### 5. 💥 Sistem Tempur & AI Kapal Pengawal (ASW)
- **Konvoi Kapal Dagang Sekutu**: Kapal barang *Liberty Ship* berlayar dalam formasi dengan cerobong berasap.
- **Kapal Perusak Pengawal (*Destroyer*)**: Berpatroli di sekeliling konvoi dengan sonar aktif dan lampu sorot. Jika mendeteksi kapal selam, perusak akan menyerang dengan kecepatan penuh dan menjatuhkan **Depth Charges (Bom Laut)** dari rak buritan.
- **Fisika Karam**: Kapal yang terkena torpedo akan terbakar dengan bola api raksasa, tiang air menyembur ke langit, lambung miring (*listing*), dan perlahan karam ke dasar laut.

### 6. 🔊 Sintesis Audio Mandiri (Web Audio API)
Tanpa ketergantungan file audio eksternal, seluruh suara disintesis secara algoritmik:
- Gemuruh mesin diesel permukaan dengan tempo RPM dinamis.
- Dengung motor listrik saat menyelam.
- Sirine alarm dua nada otentik (*"ALARM! CRASH DIVE!"*).
- Desis pneumatik peluncuran torpedo.
- Dentuman bom laut bawah air dan getaran lambung (*hull creaking*) pada kedalaman > 75 meter.

---

## 🎮 Kontrol & Tombol Pintas

| Tombol | Fungsi |
| :--- | :--- |
| **W / S** atau **Panah Atas / Bawah** | Mengatur telegraf mesin (Ahead / Stop / Astern) |
| **A / D** atau **Panah Kiri / Kanan** | Memutar kemudi (Port / Starboard) |
| **0** (Angka Nol) | Kemudi lurus ke tengah (*Amidships 0°*) |
| **U** | Perintah Muncul ke Permukaan (*Surface - 0m*) |
| **P** | Menyelam ke Kedalaman Periskop (*Periscope Depth - 12m*) |
| **C** | **CRASH DIVE!** (Penyelaman darurat cepat ke 80m) |
| **SPASI** | Tembakkan Torpedo Rohr 1! |
| **F1 – F5** | Beralih stasiun & kamera pertempuran |
| **M** | Buka / Tutup Peta Navigasi Taktis |
| **H** | Tampilkan / Tutup Bantuan Kontrol |
| **Mouse Kiri Tarik** | Memutar sudut pandang kamera |
| **Mouse Wheel** | Zoom In / Out |

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Batch Launcher (Windows)
Klik dua kali file [`start.bat`](./start.bat). Browser default akan otomatis membuka `http://localhost:3000`.

### Cara 2: Menggunakan Node.js
```bash
# Masuk ke direktori
cd "15_SUBSIM"

# Install dependensi (jika belum)
npm install

# Jalankan server
node server.js
```
Buka browser di: [http://localhost:3000](http://localhost:3000)

### Cara 3: Mode Pengembang (Vite Dev Server)
```bash
npm run dev
```

---

## 🛠️ Tech Stack
- **3D Graphics Engine**: Three.js (WebGL, ShadowMap, Procedural Geometries & Custom Canvas Textures)
- **Frontend / UI**: HTML5 Canvas, Vanilla CSS3 (Military HUD & Brass Aesthetics), ES6 Modules
- **Audio Engine**: Web Audio API (Real-time Algorithmic Sound Synthesis)
- **Bundler & Server**: Vite & Node.js Native HTTP Server
