# 🚀 VibeCode App Journey

Dokumentasi dan repositori proyek perjalanan **100 Days of Code / App Journey** oleh **Riko Londong**.

---

## 📋 Daftar Proyek

| No | Folder Proyek | Deskripsi | Status |
|:--:|:---|:---|:---:|
| 1 | [**1_MY PROFILE PAGE**](./1_MY%20PROFILE%20PAGE) | Personal Profile Card interaktif dengan Apple Human Interface Guidelines (HIG), Dark/Light mode, dan Segmented Control. | ✅ Selesai |
| 2 | [**2_BUSINESS CARD**](./2_BUSINESS%20CARD) | Digital Business Card & Kartu Biodata Diri interaktif dengan estetika Neumorphism (Soft UI), fitur vCard, dan Copy to Clipboard. | ✅ Selesai |
| 3 | [**3_LANDING PAGE WEBSITE**](./3_LANDING%20PAGE%20WEBSITE) | Landing Page Perusahaan Agribisnis Sawit Berkelanjutan (PT Nusa Sawit Agro Tbk) dengan desain Enterprise Humanis & Natural. | ✅ Selesai |
| 4 | [**4_INDO FIREWATCHER**](./4_INDO%20FIREWATCHER) | Sistem Web GIS Pemantauan Titik Panas (Hotspot) Karhutla Indonesia berbasis Satelit NASA FIRMS (VIIRS/MODIS) & Cuaca Open-Meteo. | ✅ Selesai |

---

## 🌟 Ringkasan Proyek 1: Personal Profile Page

Halaman profil personal modern yang mengadopsi prinsip **Apple Human Interface Guidelines (HIG)**:
- **Design System**: Tipografi San Francisco (SF Pro), System Colors iOS, Frosted Glass (Vibrancy), dan Segmented Control.
- **Interaktivitas**: Form pesan langsung, edit profil live, salin tautan dengan *Dynamic Island banner*, dan *Dark/Light mode*.
- **Tech Stack**: HTML5 Semantic, Modern Vanilla CSS, Vanilla JavaScript (ES6+).

👉 **[Buka Dokumentasi & Kode Proyek 1](./1_MY%20PROFILE%20PAGE)**

---

## 📇 Ringkasan Proyek 2: Neumorphic Digital Business Card

Kartu nama dan biodata digital modern dengan desain **Neumorphism (Soft UI)**:
- **Design System**: Efek bayangan ganda timbul (*dual-layer soft shadows*), state *inset* interaktif, tipografi Plus Jakarta Sans.
- **Interaktivitas**: Salin cepat nilai kontak ke papan klip, ekspor kontak ke format vCard (.vcf), dan tombol ganti mode Gelap/Terang.
- **Tech Stack**: HTML5 Semantic, Vanilla CSS (Neumorphism Design Tokens), Vanilla JavaScript (ES6+).

👉 **[Buka Dokumentasi & Kode Proyek 2](./2_BUSINESS%20CARD)**

---

## 🌴 Ringkasan Proyek 3: PT Nusa Sawit Agro Tbk (Enterprise Landing Page)

Landing page resmi berskala enterprise untuk perusahaan agribisnis dan produsen minyak kelapa sawit berkelanjutan di Indonesia (IDX: NSAW):
- **Design System**: Human-Centered Agribusiness, palet Deep Forest Green (`#173827`), Warm Amber (`#9a7622`), dan kanvas Off-White natural. Tipografi editorial prestisius Lora & Plus Jakarta Sans.
- **Interaktivitas & Konten**: Top bar bursa saham IDX, strip sertifikasi RSPO/ISPO, 4 tahap rantai operasi terpadu, komitmen NDPE & konservasi 28.500 Ha, kemitraan 35.000+ pekebun swadaya, katalog produk CPO/Olein dengan modal COA laboratorium, serta form penawaran komersial B2B.
- **Tech Stack**: HTML5 Semantic, Modern Vanilla CSS (Enterprise Corporate Tokens), Vanilla JavaScript (ES6+).

👉 **[Buka Dokumentasi & Kode Proyek 3](./3_LANDING%20PAGE%20WEBSITE)**

---

## 🔥 Ringkasan Proyek 4: INDO FIREWATCH (Sistem Monitoring Karhutla Satelit NASA)

Aplikasi Web GIS & Dashboard Analitik Geospasial untuk pemantauan kebakaran hutan dan lahan (karhutla) secara langsung di seluruh 38 provinsi Indonesia:
- **Design System & Arsitektur**: Dark Geoint Dashboard modern berpalet Slate-950, Red/Amber Fire Glow, Plus Jakarta Sans, dan JetBrains Mono. Arsitektur ultra-ringan dengan Vite, React 18, Tailwind CSS, Leaflet Canvas Rendering (`preferCanvas: true`), dan manual chunk splitting.
- **Fitur Utama**:
  - **Integrasi Satelit NASA FIRMS Multi-Sensor**: Mendukung satelit VIIRS Suomi NPP, VIIRS NOAA-20, dan MODIS Terra/Aqua dengan data NRT (Near Real-Time).
  - **Performa Tinggi & Tanpa Lag**: Canvas-rendered markers, visualisasi pulsa dinamis hanya pada hotspot ekstrem teratas, dan layer seleksi terpisah tanpa re-mounting ratusan penanda.
  - **Analisis Cuaca Mikro**: Estimasi cuaca langsung (suhu, kelembapan udara, kecepatan/arah angin, dan potensi bahaya kebakaran) via Open-Meteo API.
  - **Analitik Geospasial**: Pengelompokan hotspot per-provinsi, filter tingkat kepercayaan (Nominal vs Tinggi), filter FRP (Fire Radiative Power), dan pencarian koordinat instan.
  - **Responsif Seluruh Perangkat**: Mode tab switcher dinamis untuk perangkat mobile (*Peta Interaktif* vs *Daftar & Filter*), drawer detail adaptif, dan panel statistik ringkas.
  - **Keamanan & Manajemen Kunci**: Modal konfigurasi NASA API key terintegrasi di sisi klien dengan penyimpanan aman di LocalStorage, perlindungan geofence bounding box Indonesia (95°E - 141°E, 11°S - 6°N).
- **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet & React-Leaflet, Lucide React, Node.js HTTP Proxy.

👉 **[Buka Dokumentasi & Kode Proyek 4](./4_INDO%20FIREWATCHER)**

---

## 👤 Pengembang

- **Nama**: Riko Londong
- **Email**: riko.londong1997@gmail.com
- **GitHub**: [@rikolondong](https://github.com/rikolondong)
