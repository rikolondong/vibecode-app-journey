# 🔥 INDO FIREWATCH v2.0
> **Sistem Pemantauan Titik Api Karhutla & Cuaca Wilayah Indonesia Berbasis Satelit NASA FIRMS**

![INDO FIREWATCH Banner](https://img.shields.io/badge/Status-Live%20Production-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20Vite%20%7C%20Leaflet%20%7C%20TypeScript%20%7C%20Tailwind-orange?style=for-the-badge)
![Satellite](https://img.shields.io/badge/Satellite-NASA%20VIIRS%20%26%20MODIS-blue?style=for-the-badge)

Sistem Web GIS interaktif mutakhir untuk pemantauan titik panas (*hotspot*) kebakaran hutan dan lahan (karhutla) di seluruh wilayah kedaulatan Negara Kesatuan Republik Indonesia secara langsung, akurat, ringan, cepat, dan sepenuhnya responsif di semua perangkat.

---

## 🌟 Fitur Unggulan

### 1. 🛰️ Integrasi Satelit NASA EOSDIS FIRMS
- Mengambil data anomali termal langsung dari satelit **VIIRS (Suomi-NPP & NOAA-20 resolusi 375m)** serta **MODIS (Terra & Aqua resolusi 1km)**.
- Backend proxy terenkripsi di server dengan perlindungan *geofence* koordinat Indonesia (Anti-SSRF & Rate Limiting).
- Cadangan dataset historis karhutla terintegrasi untuk ketersediaan sistem 100%.

### 2. 🗺️ Peta Interaktif Kinerja Tinggi (60 FPS)
- **Mesin Canvas Terakselerasi**: Mengoptimalkan render ratusan titik api tanpa lag pada perangkat *mobile* maupun komputer berspesifikasi rendah.
- **Lapisan Kubah Gambut**: Menampilkan batas polygon zona kubah gambut rawan kebakaran (Riau, OKI Sumsel, Pulang Pisau Kalteng, dsb).
- **Multi-Basemap**: Pilihan peta Gelap (*Dark OSM*), Citra Satelit Bumi (*ArcGIS Satellite*), dan Peta Standar (*OpenStreetMap*).
- **Target Lock-On**: Sorotan instan (*radar pulse ring*) saat titik api dipilih dengan animasi transisi kamera halus (*FlyTo*).

### 3. 🌤️ Telemetri Cuaca & Arah Sebaran Asap
- Integrasi data cuaca *real-time* dari **Open-Meteo API** berdasarkan koordinat titik api:
  - Suhu udara & kelembapan relatif (RH).
  - Kecepatan & arah mata angin.
  - Proyeksi arah sebaran asap (*smoke dispersion*).
  - Indeks Bahaya Kebakaran (*Fire Weather Index / FWI*).

### 4. 📱 100% Responsif & Ergonomis
- **Tampilan Mobile Adaptif**: Tab navigasi khusus ponsel (*Peta Interaktif* vs *Daftar & Filter*), tombol aksi cepat mengambang (*floating quick actions*), dan laci telemetri sentuh (*bottom sheet*).
- **Ringkas & Ringan**: Pemanfaatan *chunk splitting*, kompresi aset, dan eliminasi dependensi berat.
- **Audio Taktis Terintegrasi**: Efek suara sintetis murni menggunakan Web Audio API (nada radar ping, target lock, dan klik telemetri).

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Peta GIS**: Leaflet 1.9 dengan Canvas Renderer
- **Build Engine**: Vite 5 dengan Code Chunk Splitting & Path Resolution Caching
- **Backend / Proxy**: Node.js HTTP/HTTPS Server dengan In-Memory Cache (TTL 180s)
- **Sumber Data**: NASA EOSDIS FIRMS CSV API & Open-Meteo Forecast API

---

## 🚀 Panduan Menjalankan

### Prasyarat
- Node.js versi 18 atau lebih baru
- npm / yarn / pnpm

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Lingkungan
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```
*(Opsional: Masukkan kunci API NASA FIRMS gratis Anda jika ingin menggunakan kuota mandiri).*

### 3. Menjalankan di Mode Pengembangan (Vite Dev Server)
```bash
npm run dev
```
Akses di browser melalui: `http://localhost:3000`

### 4. Menjalankan di Mode Produksi (Hardened Server)
```bash
# Build bundle produksi
npm run build

# Jalankan server produksi
node server.js
```
Akses di browser melalui: `http://localhost:3000`

---

## 🔒 Keamanan & Perlindungan Data

- **Kredensial Server-Side**: Kunci API satelit NASA FIRMS dikelola murni di server (tidak pernah terekspos ke klien).
- **Geofence Protection**: Permintaan dibatasi ketat hanya pada batas teritori Indonesia (`95°BT - 141°BT`, `11°LS - 6°LU`).
- **Security Headers**: Dilengkapi CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, dan Referrer-Policy ketat.

---

## 👤 Pengembang

- **Nama**: Riko Londong
- **Repositori**: [vibecode-app-journey](https://github.com/rikolondong/vibecode-app-journey)
- **Proyek**: Bagian dari 100 Days App Journey (Proyek #4)

