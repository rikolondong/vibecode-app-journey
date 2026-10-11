# 🚗 JALAN TOL KELAM: Endless Midnight Highway 3D

Game simulasi mengemudi 3D tak berujung (*endless driving*) dengan suasana sunyi, gelap, dan berkabut tebal di jalan tol pada tengah malam (nuansa *liminal space / analog horror / night drive aesthetic*). Dibuat menggunakan **Three.js** dan sistem audio prosedural **Web Audio API** tanpa memerlukan instalasi aset eksternal.

---

## 🌟 Fitur Utama

1. **Pencahayaan Lampu Mobil Realistis (Realistic Automotive Lighting):**
   - **Hamparan Cahaya Lampu Depan pada Aspal (*Ground Light Carpet*):** Lampu mobil memproyeksikan hamparan karpet cahaya lebar dengan gradasi titik panas (*hotspot*) elips dan batasan *cutoff* yang memudar halus di atas aspal.
   - **Berkas Cahaya Lembut (*Soft Volumetric Light Shaft*):** Sorot lampu membelah kabut malam dengan efek berkas cahaya halus alami (tanpa batas poligon yang kaku).
   - **Mode Lampu Dekat (*Low Beam*) & Lampu Jauh (*High Beam*):** Lampu jauh menjangkau hingga 280 meter menembus kabut tebal, menyinari rambu-rambu dan jembatan di kejauhan.
   - **Pendaran Lampu Belakang ke Aspal Basah (*Ground Wash*):** Aspal di belakang mobil berpendar merah saat melaju, dan menyala terang pekat saat mengerem.

2. **Pengatur Kecerahan Lingkungan & Kabut (Dynamic Environment Sliders):**
   - Tersedia slider **"PENCAHAYAAN MALAM"** di layar untuk mengatur tingkat gelap-terang lingkungan (dari gelap gulita pekat hingga terang tersiram cahaya bulan redup).
   - Tersedia slider **"KEPEKATAN KABUT"** untuk mengatur ketebalan kabut jalan tol sesuai selera Anda.

3. **Gameplay Ringan & Sunyi (*Solitary Midnight Drive*):**
   - Jalan tol dibuat sepenuhnya sepi dan hening tanpa kendaraan NPC, memberikan nuansa mengemudi larut malam yang kontemplatif, bebas hambatan, serta performa super ringan dan mulus (60–144+ FPS stabil).

2. **Fisika Kendaraan & Transmisi 5-Percepatan (Realistic Powertrain):**
   - **Transmisi Otomatis 5-Speed & Kurva Torsi:** Akselerasi memiliki kurva tenaga realistis di putaran menengah (3800 - 5200 RPM) dengan penurunan RPM saat pergantian gigi.
   - **Panel Instrumen Kokpit Aktif:** Jarum speedometer dan jarum tachometer bergerak secara halus dan akurat di dasbor interior.
   - **Sambungan Jalan Tol Beton (*Expansion Joint Thumps*):** Setiap 30 meter bentang jalan tol, suspensi mobil akan mengayun halus disertai suara ketukan roda khas melintasi sambungan aspal/beton.
   - **Stabilitas Kemudi Berbasis Kecepatan:** Pada kecepatan tinggi (>140 km/h), respon kemudi menjadi lebih mantap dan stabil untuk mencegah manuver liar yang tidak realistis.

2. **3 Pilihan Sudut Pandang Kamera (Toggle tombol `C`):**
   - **Kabin Pengemudi (*First-Person Cockpit*):** Tampilan dari dalam kabin dengan setir kemudi (*Right-Hand Drive* khas Indonesia) yang berputar, panel speedometer bercahaya, dan kaca depan berembun.
   - **Belakang Mobil (*Third-Person Chase Cam*):** Kamera mengikuti mobil dengan efek FOV dinamis saat kecepatan tinggi.
   - **Kap Mesin (*Hood / Bumper View*):** Sensasi kecepatan maksimal dekat dengan aspal.

3. **Audio Prosedural 100% Prosedural (Web Audio API):**
   - Suara deru mesin mobil (*Synthesized Engine Drone*) yang naik-turun seiring RPM dan kecepatan.
   - Suara gesekan ban pada aspal (*road noise*) dan deru angin kencang (*aerodynamic wind rush*).
   - Suara klakson mobil ganda (*dual-tone horn*).
   - Suara hujan rintik malam dan benturan fisik jika menyenggol pembatas jalan.

4. **Kondisi Cuaca & Lingkungan:**
   - Fitur **Hujan Malam Hari** (Tombol `P` atau tombol hujan di layar) dengan animasi wiper pembersih kaca yang bergerak otomatis.
   - Sambungan jalan tol beton (*Expansion Joint Thumps*) dengan efek bump suspensi dan audio ketukan roda tiap 30 meter.

5. **Responsif & Mendukung Layar Sentuh / Mobile:**
   - Tersedia tombol kontrol di layar (*Touch Controls*) untuk dimainkan di perangkat tablet/layar sentuh.

---

## 🎮 Kontrol Permainan

| Tombol Keyboard | Aksi |
| :--- | :--- |
| **W** atau **Panah Atas (↑)** | Gas / Akselerasi |
| **S** atau **Panah Bawah (↓)** | Rem / Mundur |
| **A** atau **Panah Kiri (←)** | Belok Kiri |
| **D** atau **Panah Kanan (→)** | Belok Kanan |
| **Spasi (Spacebar)** | Rem Tangan (*Handbrake*) |
| **C** | Ganti Sudut Pandang Kamera (Kabin / Chase / Kap) |
| **L** atau **F** | Ganti Mode Lampu (Dekat / Jauh / Mati) |
| **H** | Klakson Mobil |
| **P** | Mode Hujan & Wiper Kaca |

---

## 🚀 Cara Menjalankan Game (Windows Edition)

### 🌟 Metode 1: Klik Langsung Shortcut di Desktop Windows (Paling Praktis)
Shortcut **"Jalan Tol Kelam"** sudah otomatis dibuat di **Desktop Windows** Anda. Cukup klik ganda ikon tersebut untuk langsung bermain dalam jendela aplikasi desktop mandiri!

---

### 💻 Metode 2: Klik Ganda Berkas Peluncur (*Launcher*)
Di dalam folder proyek ini, cukup klik ganda salah satu berkas berikut:
1. **`JALAN_TOL_KELAM.bat`** : Peluncur satu klik untuk Windows.
2. **`JALAN_TOL_KELAM.vbs`** : Peluncur tanpa jendela konsol hitam (*silent launch*).

---

### ⚡ Metode 3: Melalui Terminal / Command Prompt
Buka terminal/PowerShell di direktori ini, lalu jalankan:
```bash
npm run desktop
```
Atau:
```bash
npm run game
```

> **Tips Layar Penuh (Fullscreen):** Tekan tombol **F11** saat game berjalan di jendela aplikasi untuk beralih ke mode **Layar Penuh Tanpa Batas (*Borderless Fullscreen*)**.

---

### 🌐 Metode 4: Mode Web Browser (Opsional)
Jika ingin membuka melalui browser biasa:
```bash
npm start
```
Lalu buka: **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Struktur Berkas

```
5_ENDLESS HIGHWAY/
├── index.html           # Struktur antarmuka game & HUD
├── style.css            # Gaya visual malam hari & speedometer
├── main.js              # Game loop, rendering Three.js, input & kamera
├── world.js             # Generator jalan tol tak berujung, lampu, rambu, cuaca
├── car.js               # Model 3D mobil, interior kabin, fisika mobil & AI
├── audio.js             # Mesin sintesis audio prosedural (Web Audio API)
├── server.js            # Server lokal statis ringan berbasis Node.js
├── libs/
│   └── three.module.js  # Library Three.js lokal
├── package.json         # Konfigurasi dependensi proyek
└── README.md            # Dokumentasi & panduan
```
