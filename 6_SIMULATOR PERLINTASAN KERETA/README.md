# 🚂 PJL Nusantara - Simulator Palang Perlintasan Kereta Api Indonesia

Simulator interaktif pos penjaga perlintasan kereta api sebidang (**PJL - Pos Jaga Perlintasan**) khas Indonesia berbasis Web 3D (**Three.js**) dan audio realistis (**Web Audio API + Audio Sirine PJL Asli**).

---

## 🌟 Fitur Utama

1. **Grafis Isometrik 3D Prosedural (Three.js WebGL):**
   - **Lokomotif & Rangkaian Kereta Indonesia:** Model 3D lokomotif khas Indonesia (CC206) lengkap dengan livery khas KAI, bogie roda, lampu semboyan malam, serta rangkaian gerbong eksekutif stainless steel dan gerbong barang kontainer (petikemas).
   - **Perlintasan Rel Ganda (Double Track):** Dilengkapi bantalan rel beton/kayu, taburan batu kricak (ballast), dan sinyal perlintasan.
   - **Pos Jaga PJL & Pos Keamanan:** Pos pengawas khas KAI dengan tiang antena komunikasi radio, lampu penerangan sodium, dan rambu silang perlintasan sebidang (Crossbuck / Rambu Tanda Silang).
   - **Palang Pintu Perlintasan Otomatis/Manual:** Palang pintu dengan garis reflektif merah-putih yang berotasi halus dengan animasi mekanis hidrolik.
   - **Lampu Strobo Sinyal PJL:** Lampu merah kembar yang berkedip bergantian (*alternating warning flashers*) saat sirine diaktifkan.

2. **Simulasi Lalu Lintas Kendaraan Jalan Raya (AI Traffic System):**
   - Beragam kendaraan khas jalan raya Indonesia melintas:
     - 🛵 Sepeda motor bebek & matic
     - 🚗 Mobil keluarga / MPV (Avanza/Innova)
     - 🚐 Angkutan Kota (Angkot) khas warna lokal
     - 🚚 Truk boks / truk engkel ekspedisi
   - **Logika Perilaku Cerdas & Antrean:** Kendaraan mendeteksi keberadaan kendaraan di depannya, melambat secara bertahap, dan berhenti tertib di belakang garis marka stop saat palang pintu tertutup atau kereta mendekat.

3. **Sistem Tata Suara Otentik (Hybrid Audio System):**
   - **Sirine Genta PJL Asli:** Memutar rekaman audio nada lonceng/sirine perlintasan kereta api Indonesia (`suara_palang.mp3`).
   - **Klakson Semboyan 35 KAI Prosedural:** Sintesis klakson terompet lokomotif khas jenis *Nathan AirChime K3LA* menggunakan Web Audio API 4-nada akord (D#4, F#4, A#4, D#5).
   - **Suara Gemuruh Roda & Rel:** Suara roda besi beradu dengan sambungan rel (*rail joint click-clack*) dan desis rem angin pneumatik (*pneumatic air brake*).

4. **Panel Kontrol Petugas PJL & Warta KA:**
   - **Tombol Kendali Palang Pintu:** Buka dan tutup palang pintu perlintasan dengan satu klik atau tombol keyboard.
   - **Tombol Sirine Peringatan:** Aktifkan/nonaktifkan alarm tanda bahaya perlintasan.
   - **Tombol Semboyan 35:** Membunyikan klakson lokomotif dari kejauhan.
   - **Warta Perjalanan KA (Radio Komunikasi):** Menampilkan papan warta jadwal KA aktif (Argo Bromo Anggrek, Taksaka, Pasundan, Kereta Barang), kecepatan tempuh (km/h), dan estimasi waktu melintas (*ETA Countdown*).
   - **Peringatan Bahaya (Collision Alert):** Deteksi darurat jika ada kendaraan atau penerobos yang berada di tengah area rel saat kereta meluncur kencang.

---

## 🎮 Kontrol & Interaksi

| Tombol / Tombol Layar | Fungsi |
| :--- | :--- |
| **Spasi (Spacebar)** / Tombol Palang | Buka / Tutup Palang Pintu Perlintasan |
| **Tombol S** / Tombol Sirine | Nyalakan / Matikan Sirine Peringatan PJL |
| **Tombol H** / Tombol Klakson | Bunyikan Klakson Lokomotif (Semboyan 35) |
| **Klik & Seret Mouse** | Rotasi dan geser sudut pandang kamera (Orbit Controls) |
| **Scroll Roda Mouse** | Zoom in / Zoom out kamera |

---

## 🛠️ Teknologi yang Digunakan

- **HTML5 & CSS3 Glassmorphism** – Antarmuka operator PJL modern, HUD responsif, dan panel status tembus pandang.
- **Three.js (WebGL)** – Rendering grafis 3D real-time dengan kamera isometrik ortografis dan pencahayaan dinamis.
- **Web Audio API & HTML5 Audio** – Sintesis klakson lokomotif multi-osilator dan pemutaran audio sirine PJL.
- **Vanilla JavaScript (ES6+)** – State management simulasi, sistem lalu lintas otonom, dan penjadwalan kereta otomatis.

---

## 🚀 Cara Menjalankan

Cukup buka berkas `index.html` di peramban web modern Anda (Google Chrome, Microsoft Edge, Mozilla Firefox, dll.) atau jalankan melalui local web server:

```bash
# Menjalankan dengan live-server atau static server lokal:
npx serve .
# Atau buka langsung index.html di browser favorit Anda
```
