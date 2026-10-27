# Missile Simulator: Mountain Strike 🚀🏔️

Game simulasi 3D berbasis Web (Three.js) yang mensimulasikan penembakan berbagai jenis rudal militer dunia nyata ke instalasi pertahanan di kawasan pegunungan terjal.

---

## 🎮 Cara Menjalankan Game

### Opsi 1: Langsung Buka di Browser
Cukup klik dua kali (double-click) file `index.html` pada browser modern (Chrome, Edge, Firefox).

### Opsi 2: Menggunakan Local Server (Node.js)
```bash
node server.js
```
Lalu buka browser di: `http://localhost:3000`

---

## 🚀 Arsenal 5 Rudal Dunia Nyata

| Rudal | Asal & Kategori | Kecepatan | Sistem Panduan & Karakteristik |
|---|---|---|---|
| **FGM-148 Javelin** | AS / ATGM | Mach 0.85 (290 m/s) | **Top-Attack**: Otomatis memanjat hingga 150m ke udara lalu menukik tajam 90° tegak lurus menghantam atap terlemah bunker atau kendaraan. |
| **BGM-71 TOW / Kornet** | AS / Rusia (SACLOS) | Mach 0.95 (320 m/s) | **SACLOS Beam-Rider**: Pemain mengemudikan hidung rudal secara manual di udara menggunakan **Mouse** atau tombol **W/A/S/D / Panah**. |
| **BGM-109 Tomahawk** | AS / Cruise Missile | Mach 0.75 (255 m/s) | **Terrain-Hugging Cruise**: Membuka sayap, terbang rendah menyusuri lembah pegunungan di bawah jangkauan radar sebelum menukik. |
| **9K720 Iskander-M** | Rusia / Ballistic | Mach 5.9 (2,050 m/s) | **Quasi-Ballistic Arc**: Melesat naik ke stratosfer membentuk busur parabola tinggi lalu menukik supersonik dengan daya penetrasi bunker. |
| **Kh-47M2 Kinzhal** | Rusia / Hypersonic | Mach 10 (3,400 m/s) | **Hypersonic Strike**: Kecepatan ekstrem dengan selubung plasma terionisasi menyala, menembus pertahanan udara dalam sekejap. |

---

## 🎯 Target Militer di Pegunungan (*Destructible Structures*)

1. **Bunker Komando "Alpha"** (Puncak Tebing): Benteng beton bertulang dengan pintu baja dan antena radio. Atap dan strukturnya hancur berkeping-keping saat terkena hantaman langsung.
2. **Kubah Radar Pengawas "Bravo"** (Puncak Salju): Kubah radome dan antena parabola berputar. Roboh dan runtuh saat terkena ledakan.
3. **Depot Amunisi & Logistik "Charlie"** (Plato Lembah): Tangki bahan bakar dan tumpukan amunisi rudal yang mengalami ledakan sekunder berantai (*cook-off*).
4. **Konvoi Tank Lapis Baja "Delta"** (Jalan Lereng): Tank tempur utama (MBT) dan kendaraan APC. Menembakkan kubah meriam (*turret*) terbang ke udara saat hancur.

---

## 🛡️ Sistem Pertahanan Udara (Air Defense System)

- **Tombol `THREAT: DEFCON 1 [ACTIVE]` / `SAFE [OFF]`**:
  - Mengaktifkan pangkalan pertahanan udara di lereng gunung.
  - **Pantsir SAM**: Radar mengunci sasaran (*radar lock*) dan menembakkan rudal pencegat ke udara.
  - **CIWS 30mm Gatling**: Memutar laras meriam dan menembakkan rentetan peluru pelacak (*tracers*) bercahaya untuk menembak jatuh rudal yang mendekat dalam radius 900m.
  - *Taktik*: Gunakan **Kinzhal** untuk menembus radar dengan kecepatan Mach 10, atau **Tomahawk** untuk menyusuri lembah tersembunyi!

---

## 🎥 Mode Kamera & Tampilan Visual

- **`[1]` CAM: CHASE**: Kamera dinamis di belakang ekor rudal mengikuti pergerakan terbang.
- **`[2]` CAM: SEEKER**: Kamera hidung rudal dengan efek statik/glitch saat menghantam sasaran.
- **`[3]` CAM: LAUNCHER**: Teropong pengamat dari stasiun peluncur dengan zoom optik dinamis.
- **`[4]` CAM: TARGET**: Kamera sinematik dari arah target melihat rudal datang menukik.
- **`[T]` FLIR**: Mode penglihatan inframerah/termal militer malam hari (*night vision scanlines*).

---

## 🔊 Tata Suara Web Audio API (Procedural Synthesis)

- Suara mesin roket, dengung turbofan mesin jet, dan desis supersonik.
- **Sonic Boom Crack** saat rudal melampaui Mach 1.0.
- **Delay Akustik Kecepatan Suara ($343\text{ m/s}$)**: Dentuman ledakan terdengar dengan jeda fisik realistis sesuai jarak kamera ke titik ledakan.
- Sirine peringatan bahaya udara dan rentetan tembakan Gatling CIWS.
