# BMW M4 Competition Coupé - 3D Interactive Web Showcase

Sebuah website 3D interaktif modern untuk showcase mobil **BMW M4 Competition Coupé** yang dibangun dengan standar rekayasa perangkat lunak [**`addyosmani/agent-skills`**](https://github.com/addyosmani/agent-skills).

---

## Fitur Utama

* **Showroom 3D Real-time (Three.js WebGL)**:
  * Model 3D detail dengan ciri khas BMW M: *Iconic Double Kidney Grille*, *Laserlight LED Angel Eyes*, *M Carbon Roof*, *Rear Quad Exhausts & Diffuser*, serta velg alloy dengan kaliper rem M.
  * *PBR Shader & Real-time Reflections*: Material cat mobil berbasis `MeshPhysicalMaterial` dengan lapisan *clearcoat*, *roughness*, dan pantulan lantai studio.
  * *Orbit Controls*: Navigasi 360° bebas (drag untuk rotasi, scroll untuk zoom).
* **BMW Individual Paint Configurator**:
  * *M Isle of Man Green* (Metallic)
  * *Tanzanite Blue II* (Metallic)
  * *Toronto Red* (Metallic)
  * *São Paulo Yellow* (Electric Gloss)
  * *Frozen Deep Grey* (Matte)
  * *Alpine White* (Solid Gloss)
* **Web Audio API Engine Synthesizer**:
  * Suara deru mesin *BMW M TwinPower Turbo Inline-6* yang dihasilkan secara sintetis/prosedural (100% offline, tanpa file audio eksternal).
  * Tombol **"Rev Engine"** interaktif untuk memacu putaran RPM mesin lengkap dengan efek letupan knalpot (*exhaust overrun crackle/pop*).
* **Drive Mode Switcher**:
  * Pilihan mode berkendara: `COMFORT`, `SPORT`, dan `SPORT+`.
  * Mengubah nuansa aksen HUD, parameter suara mesin, dan pencahayaan studio.
* **Camera Preset Quick-Switcher**:
  * *Hero 3/4*, *Side Profile*, *Rear Diffuser*, *Top Aero*, dan *M Rims Detail*.
* **Lighting Controls**:
  * *Laserlight LED Headlights*: Sakelar lampu depan menyala/mati dengan sorotan cahaya ke lantai.
  * *Neon Track Studio*: Mengubah pencahayaan studio menjadi mode malam neon agresif.
* **Spline 3D Bridge**:
  * Modal terintegrasi dengan runtime `<spline-viewer>` resmi untuk memuat atau menguji scene 3D dari [spline.design](https://spline.design).

---

## Cara Menjalankan

Server lokal telah berjalan di latar belakang:
```
http://localhost:3000
```

Jika ingin menjalankan manual di masa mendatang:
```bash
node server.cjs
# atau
npx serve .
```

---

## Struktur Kode

```text
18_SPLINE WEB/
├── index.html              # Struktur semantic UI & WebGL canvas
├── server.cjs              # Local HTTP development server
├── package.json            # ES module package definition
├── css/
│   ├── main.css            # Desain tema gelap, tipografi, glassmorphism
│   └── showroom.css        # Komponen HUD, palet warna, kontrol kamera
├── js/
│   ├── config.js           # Konfigurasi data warna, mode, dan koordinat kamera
│   ├── audio-engine.js     # Web Audio API sintesis suara mesin & revving
│   ├── car-model.js        # Pembuat geometri 3D mobil BMW M4 procedural
│   ├── showroom-scene.js   # Pengelola Three.js scene, lighting & orbit controls
│   ├── spline-bridge.js    # Jembatan integrasi runtime Spline 3D viewer
│   └── app.js              # Koordinator state dan event aplikasi
├── AGENTS.md               # Aturan kerja SDLC & Anti-Rationalization
└── GEMINI.md               # Duplikat aturan agent
```
