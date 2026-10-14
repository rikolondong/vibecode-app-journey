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
| 5 | [**5_ENDLESS HIGHWAY**](./5_ENDLESS%20HIGHWAY) | Game 3D Mengemudi Jalan Tol Malam Hari Berkabut (*Endless Midnight Highway*) dengan Three.js, audio prosedural, dan fisika realistis. | ✅ Selesai |
| 6 | [**6_SIMULATOR PERLINTASAN KERETA**](./6_SIMULATOR%20PERLINTASAN%20KERETA) | Simulator 3D Pos Penjaga Perlintasan Kereta Api Indonesia (PJL) dengan Three.js, AI lalu lintas kendaraan, dan audio sirine otentik. | ✅ Selesai |
| 7 | [**7_IDLE HIKING GAME**](./7_IDLE%20HIKING%20GAME) | Game Idle Mendaki Gunung Indonesia (*Ekspedisi Puncak Nusantara*) dengan 2D Multi-Layer Parallax Engine dan Web Audio API. | ✅ Selesai |
| 9 | [**9_AI VIRTUAL OFFICE**](./9_AI%20VIRTUAL%20OFFICE) | Visualisasi 3D Isometrik AI Multi-Agent Office dengan kru karakter manusia Voxel realistis, tata ruang kantor modern, audio prosedural, dan simulasi alur tugas. | ✅ Selesai |

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

## 🚗 Ringkasan Proyek 5: JALAN TOL KELAM (Endless Midnight Highway 3D)

Game simulasi mengemudi 3D tak berujung (*endless driving*) dengan nuansa sunyi malam hari, kabut atmosferik, dan pencahayaan realistis:
- **Design System & Visual**: Tampilan jalan tol tak berujung dengan aspal basah bertekstur specular/normal map, reflektor pembatas jalan (mata kucing/guardrail), tiang lampu sodium uap amber (2200K), serta pencahayaan lampu mobil proyektor xenon yang membelah kabut malam.
- **Fisika & Powertrain**:
  - Transmisi otomatis 5-percepatan dengan kurva torsi realistis dan panel speedometer/tachometer aktif.
  - Stabilitas kemudi dinamis berbasis kecepatan (*speed-sensitive steering*), body roll saat menikung, dan ayunan suspensi saat melintasi sambungan beton jalan tol tiap 30 meter.
  - Tiga pilihan sudut pandang kamera: Kabin Pengemudi (*First-Person Right-Hand Drive*), Belakang Mobil (*Chase Cam* anti-jitter), dan Kap Mesin (*Hood View*).
- **Audio Prosedural 100% Prosedural (Web Audio API)**: Sintesis deru mesin multi-osilator, road tire noise, deru aerodinamika angin, klakson ganda, dan suara benturan fisik tanpa berkas audio eksternal.
- **Platform**: Web Desktop/Mobile touch controls serta peluncur Windows native (Electron desktop launcher).
- **Tech Stack**: Three.js, Modern Vanilla JavaScript (ES6+ Modules), Web Audio API, CSS3 Glassmorphism, Electron (Windows Desktop).

👉 **[Buka Dokumentasi & Kode Proyek 5](./5_ENDLESS%20HIGHWAY)**

---

## 🚂 Ringkasan Proyek 6: PJL Nusantara (Simulator Palang Kereta Api Indonesia)

Simulator interaktif penjaga pos perlintasan sebidang kereta api (**PJL**) di Indonesia dengan grafis 3D isometrik:
- **Design System & Visual 3D**: Pemodelan 3D Three.js isometrik dengan lokomotif CC206 khas KAI, gerbong eksekutif stainless steel dan kargo kontainer (petikemas), rel ganda (*double track*) beralas batu kricak/ballast, pos jaga PJL, lampu strobo merah kembar berkedip bergantian, serta animasi buka-tutup palang pintu otomatis dan manual.
- **AI Lalu Lintas Kendaraan (Smart Traffic System)**: Simulasi kendaraan khas jalanan Indonesia (sepeda motor bebek/matic, mobil Avanza/Innova, Angkot lokal, dan truk boks/engkel) yang memiliki logika antrean berjarak aman dan berhenti tertib di belakang garis marka stop saat palang pintu ditutup.
- **Audio Otentik (Hybrid Audio Engine)**:
  - Sirine genta perlintasan kereta asli Indonesia (`suara_palang.mp3`).
  - Sintesis klakson lokomotif Semboyan 35 (*Nathan AirChime K3LA* 4-nada akord) via Web Audio API.
  - Efek suara gemuruh roda di sambungan rel dan desis rem angin pneumatik.
- **Panel Kontrol Operator & Warta KA**:
  - Tombol kontrol manual palang pintu, sirine peringatan, dan semboyan 35.
  - Layar radio komunikasi warta kedatangan KA (nama KA, rute perjalanan, kecepatan, dan waktu tiba/ETA).
  - Sistem deteksi peringatan darurat tabrakan (*collision alert*) saat ada penerobos rel.
- **Tech Stack**: Three.js, Web Audio API, Vanilla JavaScript (ES6+), CSS3 Glassmorphism HUD.

👉 **[Buka Dokumentasi & Kode Proyek 6](./6_SIMULATOR%20PERLINTASAN%20KERETA)**

---

## ⛰️ Ringkasan Proyek 7: Ekspedisi Puncak Nusantara (Indonesian Mountain Hiking Idle Game)

Game Idle bertema pendakian gunung-gunung tersohor di Indonesia dengan gaya visual **2D Side-Scrolling** dan **Multi-Layer Dynamic Parallax Scrolling Engine**:
- **Multi-Layer Parallax & Siklus Alam**:
  - Siklus waktu dinamis (Subuh / Golden Sunrise, Siang Terik, Senja Lembayung, Malam Bertabur Bintang).
  - 6 Lapisan kedalaman: Langit, awan berarak, siluet gunung api vulkanik jauh, hutan cemara pinus, lereng savana bunga edelweis bergoyang, dan jalan setapak berbatu.
  - Sistem partikel cuaca (kabut dingin tebal, hujan rintik gunung, kelopak bunga & dedaunan melayang).
- **6 Gunung Legendaris Indonesia**:
  - Gunung Prau (2.565 mdpl - Dieng, Jateng)
  - Gunung Bromo (2.329 mdpl - Tengger, Jatim)
  - Gunung Merapi (2.930 mdpl - Boyolali / Sleman, DIY-Jateng)
  - Gunung Semeru (3.676 mdpl - Lumajang / Malang, Jatim)
  - Gunung Rinjani (3.726 mdpl - Lombok, NTB)
  - Gunung Kerinci (3.805 mdpl - Jambi / Sumbar)
- **Mekanik Gameplay & Idle Progression**:
  - *Auto-Walk & Active Tap*: Melangkah ritmis dengan combo multiplier hingga 2.5x.
  - *Mode Tenda (Campfire & Rest)*: Pasang tenda dome & api unggun hangat untuk memulihkan stamina pendaki.
  - *Manajemen Logistik & Tim*: Rekrut porter lokal Pak Slamet, ranger taman nasional, sahabat medsos, fotografer, serta beli perlengkapan carrier 60L hingga kompor nesting.
  - *Prestige Edelweis Emas*: Bonus multiplier abadi saat menuntaskan ekspedisi puncak dan mengibarkan bendera Merah Putih.
- **Procedural Web Audio API Engine**:
  - Suara langkah kaki di kerikil, ketukan trekking pole logam, desau angin sepoi-sepoi, kicau burung tropis, dan alunan melodi petikan instrumen akustik santai (*chill ambient*).
- **Tech Stack**: HTML5 Canvas, CSS3 Modern Glassmorphism HUD, Vanilla JavaScript (ES6+), Web Audio API Prosedural.

👉 **[Buka Dokumentasi & Kode Proyek 7](./7_IDLE%20HIKING%20GAME)**

---

## 🏢 Ringkasan Proyek 9: AI Virtual Office 3D (Voxel Human Multi-Agent)

Aplikasi visualisasi dan simulasi interaktif **AI Virtual Office 3D Isometrik** dengan kru karakter manusia voxel bergaya modern tech-workspace:
- **Karakter Manusia Voxel 3D**:
  - *Bima (Lead Architect & Orchestrator)*: PM berjas smart-casual dengan kacamata, mengkoordinasikan arsitektur sistem.
  - *Nadia (Research & Data Scientist)*: Peneliti bersanggul auburn/ginger dengan kacamata merah, meja penuh buku & dokumen.
  - *Reza (Senior Coder)*: Programmer ber-hoodie merah dengan headphone gaming besar, coding di triple ultrawide monitor.
  - *Maya (QA & Security Sentinel)*: Auditor pirang kuncir dua yang menjalankan test suite, OWASP scans, dan bug whiteboard.
  - *Hendro (DevOps & Memory Server)*: Teknisi berjenggot bertopi kupluk yang mengelola server rack kluster dan vector database.
- **Ruangan Kantor Realistis**:
  - Lantai kayu parket oak & walnut, karpet beludru eksekutif, partisi kaca frosted, dan uap kopi mengepul dari mesin espresso.
  - Kursi putar kantor ergonomis, pot tanaman hias Monstera, dan rak server bertingkat dengan lampu LED status berkedip.
- **Simulasi Multi-Agent Real-time**:
  - Pertukaran berkas dossier 3D melayang dengan jejak partikel (*particle trail*).
  - Animasi mengetik pada keyboard meja secara otomatis saat agen sedang bekerja.
  - Sintesis audio Web Audio API (efek ketikan keyboard mekanik, dispatch blip, suara alert).
- **Misi Siap Pakai & Kustom**:
  - 🚀 *Deploy SaaS MVP*, 🛡️ *Security Vulnerability Audit*, 📊 *Riset Pasar & Tren AI 2026*, ⚡ *Emergency Production Hotfix*, serta form instruksi kustom.
- **Tech Stack**: HTML5 Canvas (Pure Procedural 3D Isometric Engine), Vanilla JavaScript (ES6+), Web Audio API Prosedural, Tailwind CSS.

👉 **[Buka Dokumentasi & Kode Proyek 9](./9_AI%20VIRTUAL%20OFFICE)**

---

## 👤 Pengembang

- **Nama**: Riko Londong
- **Email**: riko.londong1997@gmail.com
- **GitHub**: [@rikolondong](https://github.com/rikolondong)
