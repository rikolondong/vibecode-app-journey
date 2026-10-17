# ✈️ 13_WEB AC130 — Lockheed AC-130U Spooky 3D Interactive Gunship Inspector & Combat Simulator

Aplikasi web interaktif 3D berskala militer untuk inspeksi teknis mendalam dan simulasi tempur pesawat serang darat legendaris **Lockheed AC-130U Spooky Gunship ("Angel of Death")** menggunakan **Three.js (WebGL)**, **JavaScript Modern (ES6 Modules)**, dan **CSS3 Glassmorphism Tactical HUD**.

---

## 📸 Tampilan Aplikasi

| Inspeksi Hanggar & ExplodeView | Simulasi Orbit Pylon Turn & Live Fire |
| :---: | :---: |
| ![Inspeksi Hanggar](./screenshots/Screenshot%202026-10-17%20173906.png) | ![Pylon Turn](./screenshots/Screenshot%202026-10-17%20174007.png) |

| Tactical FLIR First-Person Gunner HUD | Angel Wing Flare Countermeasure Pattern |
| :---: | :---: |
| ![Gunner HUD](./screenshots/Screenshot%202026-10-17%20174032.png) | ![Angel Flares](./screenshots/Screenshot%202026-10-17%20174212.png) |

---

## ✨ Fitur Utama

### 1. 🔍 Mode Hanggar Inspeksi & ExplodeView Dinamis
- **ExplodeView 0% – 100%**: Mengurai komponen fisik pesawat (Hidung, Sayap Kiri/Kanan, 4× Mesin Turboprop Rolls-Royce AE 2100D3, Baterai Senjata Sisi Port, Sponson & Roda Pendarat, Ekor Vertikal & Horizontal, Ramp Pintu Belakang) sepanjang vektor translasi mekanis aslinya.
- **Drawer Detail 16 Komponen**: Klik langsung pada komponen 3D atau pilih dari daftar untuk membuka spesifikasi teknis, fungsi operasional, dan parameter senjata.
- **Kamera Preset**: Sudut pandang instan (Isometrik, Hidung & Radome, Baterai Senjata Kiri, Interior BMC, Ekor & CLT, Tampak Atas).
- **Mode Visual Khusus**:
  - **Interior Cutaway**: Memotong dinding sisi kiri badan pesawat untuk mengekspos interior stasiun operator sensor dan senjata.
  - **Wireframe X-Ray**: Menampilkan struktur rangka poligonal pesawat.

### 2. 🔄 Simulasi Manuver Pylon Turn Orbit & Atmosfer Penerbangan Realistis
- **Manuver Pylon Turn Otentik**: Pesawat mengorbit target darat pada radius 38 meter di ketinggian patroli tinggi (24.5 m / ~7,500 ft) dengan sudut miring perbankan sayap kiri -37° (*orbit lock*).
- **Camera Follow (Chase Cam)**: Kamera mengikuti orbit pesawat secara tersinkronisasi tanpa jitter.
- **Atmosfer Penerbangan Dinamis**: Partikel garis kecepatan angin (*wind streaks*) dan lapisan awan volumetrik (*low-altitude cloud deck*) di bawah badan pesawat.
- **Animasi Roda & Baling-Baling**: Roda pendarat otomatis terlipat masuk (*retracted*) ke dalam sponson saat terbang, serta visual rotasi 6-bilah baling-baling Dowty R391 yang halus tanpa artefak glitch.

### 3. 💥 Sistem Balistik & Kontrol Tembakan Tiga Kaliber (Live Fire)
- **105 mm M102 Airborne Howitzer**: Dentuman artileri berat dengan ledakan kawah tanah masif dan gelombang kejut (*shockwave ring*).
- **40 mm L/60 Bofors Auto-Cannon**: Tembakan otomatis beruntun dengan lintasan pelacak bercahaya (*tracer line*).
- **30 mm GAU-23/A Bushmaster Chain Gun**: Tembakan berkecepatan tinggi dengan efek semburan api moncong (*muzzle flash*) dan hujan selongsong.
- **Laser Designator AN/AAQ-38 FLIR**: Berkas laser hijau penuntun presisi dari sensor hidung ke koordinat sasaran darat.

### 4. 🪽 Pola Pertahanan Udara Angel Wing Flare Countermeasure
- Peluncuran 40 butir suar umpan inframerah (*decoy flares*) dari dispenser AN/ALE-47 di kedua sayap pesawat.
- Membentuk pola lengkung sayap malaikat (*Angel Wing*) dramatis dengan asap tebal dan percikan api bercahaya yang memperlambat laju dan jatuh karena gravitasi.

### 5. 🎯 Mode Kokpit First-Person Gunner (WSO FLIR Station)
- **Pointer Lock 360° Bebas Layar**: Pembidikan mouse bebas tanpa batasan tepian monitor. Kursor sistem disembunyikan otomatis untuk pengalaman bidik ala simulasi tempur nyata.
- **Dual Sensor FLIR**: Toggle sensor mode antara **IR White-Hot** dan **NVG / Green FLIR** (`[V]`).
- **HUD Telemetri Militer**:
  - Heading compass ribbon & pitch ladder bergerak sesuai orientasi pandang.
  - Pembacaan telemetri jarak laser (LRF), elevasi, dan azimuth dinamis.
  - Penghitung amunisi langsung (*real-time ammo counters*).
- **Ganti Senjata Instan**: Putar roda mouse (*scroll*) atau tekan angka `1`–`4` untuk berganti antara 105mm, 40mm, 30mm, atau Salvo Fire.
- **Mode Layar Penuh (Fullscreen)**: Tombol fullscreen khusus untuk pengalaman imersif optimal.

---

## 🎮 Kontrol & Pintasan Keyboard

### Navigasi Hanggar & Umum
| Tombol / Aksi | Fungsi |
| :--- | :--- |
| **Klik Kiri + Geser** | Rotasi Kamera Mengelilingi Pesawat |
| **Klik Kanan + Geser** | Geser Posisi Kamera (Pan) |
| **Scroll Mouse** | Zoom Masuk / Keluar |
| **Klik Komponen 3D** | Buka Panel Informasi Komponen Terkait |
| **Tombol Fullscreen** | Masuk / Keluar Mode Layar Penuh |

### Mode Tempur & Gunner (FPS)
| Tombol / Aksi | Fungsi |
| :--- | :--- |
| **Gerakkan Mouse** | Membidik Sasaran (Bebas Layar via *Pointer Lock*) |
| **Klik Kiri / Spasi** | Menembakkan Senjata Aktif / Salvo |
| **Scroll Mouse / 1, 2, 3, 4** | Memilih Senjata (105mm, 40mm, 30mm, Salvo) |
| **F** | Meluncurkan Angel Wing Flare Countermeasures |
| **V** | Beralih Sensor (IR White-Hot / NVG Green FLIR) |
| **Esc / Q** | Keluar dari Mode Gunner |

---

## 🛠️ Tech Stack & Arsitektur

- **3D Graphics Engine**: [Three.js](https://threejs.org/) (WebGL Renderer, GLTFLoader, OrbitControls, Vector Math, Raycasting)
- **Bahasa**: Modern Vanilla JavaScript (ES6+ Modules)
- **Bundler**: [esbuild](https://esbuild.github.io/)
- **Styling**: Modern CSS3 dengan Glassmorphism, CSS Variables, dan Military HUD Scanlines
- **Server**: Node.js Native HTTP Server

---

## 🚀 Menjalankan Secara Lokal

1. Masuk ke direktori proyek:
   ```bash
   cd "13_WEB AC130"
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Jalankan server lokal:
   ```bash
   node server.js
   ```

4. Buka di browser:
   ```
   http://localhost:3000
   ```

---

## 📜 Lisensi & Atribusi Model 3D

Model 3D pesawat **Lockheed AC-130U Spooky** yang digunakan dalam proyek ini dibuat oleh **Rhine_Lab_Muelsyse** dan dilisensikan di bawah [Creative Commons Attribution-NonCommercial (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/):
- **Sumber Model**: ["Lockheed AC-130U Spooky"](https://sketchfab.com/3d-models/lockheed-ac-130u-spooky-0945d9ad0b354afd87fd65e9f4e1777b) di Sketchfab oleh [Rhine_Lab_Muelsyse](https://sketchfab.com/Rhine_Lab_Muelsyse).
- Modifikasi struktural, perbaikan mesh baling-baling, kalibrasi sponson roda pendarat, animasi penerbangan, artikulasi laras senjata, dan sistem partikel ditambahkan khusus untuk aplikasi web interaktif ini.
