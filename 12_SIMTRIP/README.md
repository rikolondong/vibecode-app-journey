# 🚘 12_SIMTRIP — Simulator Berkendara 3D Peta Dunia Nyata (OpenStreetMap)

Game simulasi berkendara 3D berbasis web yang menggunakan **100% ekosistem OpenStreetMap (OSM)** — memungkinkan pemain menentukan titik mulai dan tujuan di seluruh dunia, memilih waktu keberangkatan, serta memilih jenis kendaraan 3D yang digunakan.

---

## ✨ Fitur Utama

1. **Perencanaan Perjalanan Peta Dunia Nyata (OpenStreetMap + OSRM + Nominatim)**
   - **Set Titik Mulai & Tujuan**: Klik langsung di atas peta OpenStreetMap, geser pin marker, cari nama jalan/kota di seluruh dunia (Nominatim Geocoding), atau pilih rute populer (*Jakarta Monas → Bundaran HI*, *Bandung Gedung Sate → Jl. Braga*, *Yogyakarta Tugu → Malioboro*, *Surabaya*, *Bali*, *Tokyo*, *Paris*).
   - **Routing Jalan Asli (OSRM)**: Menghitung geometri jalan raya nyata, jarak tempuh (`km`), estimasi durasi perjalanan, dan instruksi belokan (*turn-by-turn*).

2. **Dunia 3D Berbasis Data OpenStreetMap Asli (Slippy Tiles + Overpass API)**
   - **Terrain Peta 3D OpenStreetMap**: Merender tile peta OpenStreetMap (`tile.openstreetmap.org`) langsung di permukaan tanah 3D sesuai koordinat geografis `(lat, lng)`.
   - **Bentuk Gedung 3D Menyerupai Dunia Nyata**: Mengekstrusi poligon tapak bangunan asli (`way["building"]` & `way["building:part"]`) dari **Overpass API** lengkap dengan tinggi lantai (`building:levels`), atap genteng miring (*pitched roof*), kubah masjid 3D (`mosque`), fasad kaca gedung tinggi (*curtain wall*), plakat nama gedung, serta *landmark* ikonik 3D (**Monas**, **Bundaran HI**, **Gedung Sate**, **Tugu Jogja**).
   - **Papan Nama Jalan & Portal RPPJ Otentik**: Menampilkan tiang papan nama jalan hijau reflektif khas Indonesia di setiap persimpangan jalan asli (`way["highway"]["name"]`) serta portal *gantry* Rambu Pendahulu Petunjuk Jurusan (RPPJ) di atas jalan sebelum belokan.

3. **Pengaturan Waktu Berangkat & Siklus Langit Dinamis**
   - Bebas memilih jam berangkat (`05:30 Subuh`, `08:30 Pagi`, `12:30 Siang`, `17:15 Senja`, `21:00 Malam`, atau jam kustom) dengan simulasi pergerakan matahari/bulan, bayangan, lampu jalan otomatis, cahaya jendela gedung malam hari, dan perhitungan **ETA (Estimasi Tiba)** *real-time*.

4. **5 Pilihan Kendaraan 3D & Kustomisasi Warna**
   - **🏎️ Sedan Sport GT** (220 km/j)
   - **🚙 SUV Adventure 4x4** (175 km/j)
   - **🏍️ Motor Sport 1000cc** (240 km/j — miring/*lean* dinamis di tikungan)
   - **🚌 Bus Pariwisata Eksekutif** (130 km/j)
   - **🚚 Truk Kargo Box** (115 km/j)
   - Dilengkapi 6 warna cat, 4 sudut kamera (*Chase*, *Cockpit*, *Drone*, *Cinematic*), **Mode Autopilot AI (`[P]`)**, lalu lintas kendaraan AI, serta synthesizer suara mesin & klakson berbasis **Web Audio API**.

---

## 🎮 Kontrol Permainan

- `W` / `↑` : Gas (Maju)
- `S` / `↓` : Rem / Mundur
- `A` `D` / `←` `→` : Kemudi Kiri / Kanan
- `Spasi` : Rem Tangan (*Handbrake*)
- `P` : Aktifkan / Matikan **Autopilot AI**
- `C` : Ganti Sudut Kamera (*Chase*, *Cockpit*, *Drone*, *Cinematic*)
- `L` : Lampu Depan (*Headlights*)
- `H` : Klakson
- `R` : Reset Posisi ke Jalan Terdekat
- `Esc` : Kembali ke Menu Rute & Kendaraan

---

## 🚀 Cara Menjalankan Lokal

```bash
node server.js
```
Lalu buka `http://localhost:5173` di browser.
