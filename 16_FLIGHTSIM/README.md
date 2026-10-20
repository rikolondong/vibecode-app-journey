# ✈️ PROJECT SKYLINE // Ace Combat Modern Indie Pixel Flight Combat

Game simulasi pertempuran udara arcade 3D bergaya **Ace Combat** dengan estetika **Modern Indie Pixel Shader (Sky Rogue / PS1 Retro 3D)** menggunakan **Three.js (WebGL)**, **Procedural Canvas Textures**, **Web Audio API Synth & Sound Engine**, dan **Crisp 2D Avionics HUD Canvas**.

---

## 🎮 Tampilan & Fitur Utama

### 1. 🛩️ Hangar 3D Interaktif & Pemilihan Pesawat
- **3D Pixel Turntable Preview**: Pesawat tempur berputar secara mulus di atas platform holografik taktis, dapat diputar manual dengan *mouse drag*.
- **3 Pilihan Jet Tempur dengan Statistik Unik**:
  - **F-15C // PIXEL EAGLE** (*Air Superiority Fighter*): Kecepatan tinggi, stabilitas tinggi, dan dual afterburner kokoh. Senjata bawaan: **4AAM**.
  - **SU-47 // BERKUT-X** (*Experimental Forward-Swept Wing*): Kelincahan ekstrim dengan sayap sapu-maju dan canard depan untuk manuver High-G turn tajam. Senjata bawaan: **QAAM**.
  - **F-22X // RAPTOR NOVA** (*Stealth Tactical Dominator*): Pesawat siluman generasi ke-5 dengan rasio dorong-bobot tinggi dan integritas lambung komposit kokoh. Senjata bawaan: **HVSM**.
- **3 Pilihan Special Weapon (SPW)**:
  - **4AAM (Multi-Lock Air-to-Air)**: Mengunci hingga 4 target musuh secara serentak di dalam kerucut HUD dan meluncurkan salvo 4 rudal sekaligus.
  - **QAAM (Quick-Maneuver High-Agility)**: Rudal homing dengan sirip kendali ultra-responsif yang mampu mengejar jet Ace walau bermanuver mengelak.
  - **HVSM (Hyper-Velocity Strike Missile)**: Rudal hipersonik berkecepatan 2.5x lipat dengan daya hancur masif untuk menghancurkan kapal perang radar dan benteng udara komando.

### 2. 🎯 Sistem Avionik HUD & Radar Khas Ace Combat
- **Proyeksi Target Box 3D-ke-2D**: Kotak target musuh `[TGT]` lengkap dengan label nama, callsign, jarak dalam meter, dan bar HP.
- **Lead-Computing Gun Sight**: Garis bidik terkomputasi otomatis (*pipper reticle*) yang memprediksi vektor posisi musuh di depan berdasarkan kecepatan peluru meriam Vulcan 20mm.
- **Sistem Lock-On Dinamis**: Berlian pengunci yang bertransisi dari sudut pandang tengah ke target yang dituju, berubah menjadi merah menyala `<< SHOOT / LOCK >>` disertai nada lock-on berfrekuensi tinggi.
- **Tactical Circular Radar**: Radar bulat taktis di kiri bawah yang memetakan pulau, garis pandang pilot (*FOV cone*), posisi pesawat musuh, kapal perang, serta rudal yang sedang mengejar.
- **Wireframe Jet Hull Damage Indicator**: Siluet kawat pesawat di kanan bawah yang berubah warna (Hijau ➔ Kuning ➔ Merah) sesuai integritas lambung, lengkap dengan monitor reload dua slot rudal dan amunisi flare.

### 3. 💥 Fisika Terbang 360° Bebas Gimbal Lock & Taktik Dogfight
- **Rotasi Quaternion Lokal**: Bebas melakukan *vertical loop*, *barrel roll*, *Immelmann turn*, dan *split-S* tanpa mengalami *gimbal lock*.
- **High-G Turn Maneuver**: Tahan kombinasi tombol Boost + Brake saat melakukan pitch untuk menghasilkan belokan berkecepatan tinggi dengan jejak uap kental (*vapor trails*) di ujung sayap.
- **Countermeasure Flares [F]**: Melepaskan decoy flare bercahaya panas untuk membelokkan rudal musuh yang terkunci di ekor pesawat.
- **Dynamic Camera Modes [V]**:
  - *Chase Camera*: Kamera belakang dengan efek lag inersia dan getaran G-force.
  - *Cockpit HUD View*: Sudut pandang hidung pesawat untuk pengalaman simulasi murni.
  - *Target Follow Cam (Tahan C)*: Kamera otomatis melirik dan mengunci fokus ke arah target yang dipilih.

### 4. 🔊 Prosedural Retro-Synth & Audio Engine (Web Audio API)
- 100% sintetis murni di browser tanpa file audio MP3/WAV eksternal.
- Suara deru turbin jet dinamis yang naik-turun frekuensinya mengikuti tuas throttle.
- Suara tembakan meriam Vulcan 20mm, desis peluncuran rudal, dentuman ledakan berfrekuensi rendah (*sub-boom*), sirine bahaya rudal (*Missile Alert*), dan radio static AWACS.
- Musik latar (BGM) bernuansa *synthwave/chiptune* ala Ace Combat dengan bassline driving 136 BPM, arpeggio taktis, melodi heroik, dan beat drum sintetis.

---

## 🕹️ Panduan Kontrol

| Kontrol | Tombol Keyboard / Mouse | Fungsi |
| :--- | :--- | :--- |
| **Pitch Naik (Pull Up)** | `S` atau `↓` | Menarik kemudi naik ke atas |
| **Pitch Turun (Nose Down)** | `W` atau `↑` | Menukik ke bawah |
| **Roll** | `A` / `D` atau `←` / `→` | Miring ke kiri / kanan |
| **Yaw** | `Q` / `E` | Kemudi ekor kiri / kanan |
| **Afterburner (Boost)** | Tahan `SHIFT` | Akselerasi kecepatan jet |
| **Airbrake (Rem Udara)** | Tahan `CTRL` | Mengurangi kecepatan jelajah |
| **High-G Turn** | Tahan `SHIFT` + `CTRL` + Pitch | Belokan tajam ber-G tinggi |
| **Vulcan Gun** | `SPACE` atau `Klik Kiri` | Tembakan meriam 20mm beruntun |
| **Luncurkan Rudal / SPW** | `G` atau `Klik Kanan` | Tembak rudal standar atau SPW |
| **Ganti Senjata** | `X` atau `Scroll Mouse` | Ganti antara MSL ⇄ SPW |
| **Ganti Target** | `TAB` atau `R` | Memilih target berikutnya |
| **Fokus Kamera Target** | Tahan `C` | Kamera menatap musuh terkunci |
| **Lepas Flare** | `F` | Pengecoh rudal musuh |
| **Ganti Mode Kamera** | `V` | Chase / Cockpit / Far |
| **Toggle BGM** | `M` | Menyalakan / mematikan musik |
| **Pause / Menu** | `ESC` | Menghentikan sementara misi |

---

## 🛠️ Tech Stack & Arsitektur

- **3D Graphics Engine**: Three.js (r128)
- **Pixel Shader Technique**: Low-resolution offscreen rendering buffer dengan `THREE.NearestFilter` dan canvas `image-rendering: pixelated` dikombinasikan dengan 2D Canvas Tactical Overlay beresolusi native tajam.
- **Audio Engine**: Pure Web Audio API (OscillatorNode, BiquadFilterNode, AudioBufferSourceNode, GainNode).
- **Styling**: Vanilla CSS3 dengan CRT Scanline shader filter, Phosphor Green & Radar Cyan tactical palette, dan Google Fonts (*Press Start 2P*, *Share Tech Mono*).

---

## 🚀 Cara Menjalankan

### Cara 1: Langsung di Browser
Cukup buka file `index.html` dengan browser modern apa pun (Chrome, Edge, Firefox, Safari).

### Cara 2: Menjalankan Server Lokal (Node.js)
```bash
node server.js
```
Akses aplikasi di browser melalui: `http://localhost:3016`
