export const AC130_DATA = {
  general: {
    name: "Lockheed AC-130 Gunship",
    nickname: "Ghostrider / Spooky / Spectre",
    primaryRole: "Close Air Support (CAS), Air Interdiction, Armed Reconnaissance, Forward Air Control",
    manufacturer: "Lockheed Martin (Airframe) / Boeing (Conversion & Mission Systems)",
    firstFlight: "1966 (AC-130A Spectre Prototype)",
    introduction: "1968 (USAF)",
    status: "Active Service (AC-130J Ghostrider & AC-130W Stinger II)",
    primaryUser: "United States Air Force (AFSOC - Air Force Special Operations Command)",
    unitCost: "± US$ 115 - 165 Juta (tergantung varian & integrasi sensor)"
  },
  dimensions: [
    { label: "Panjang Badan (Length)", value: "29,79 meter (97 ft 9 in)", desc: "Dari hidung beradome hingga ujung stabilizer ekor" },
    { label: "Rentang Sayap (Wingspan)", value: "40,41 meter (132 ft 7 in)", desc: "Sayap tinggi (high-wing) tipe cantilever berkekuatan tinggi" },
    { label: "Tinggi Pesawat (Height)", value: "11,73 meter (38 ft 6 in)", desc: "Diukur dari roda pendarat ke puncak vertical stabilizer" },
    { label: "Luas Sayap (Wing Area)", value: "162,1 m² (1.745 sq ft)", desc: "Profil sayap aerodinamis C-130 Hercules" },
    { label: "Berat Kosong (Empty Weight)", value: "± 34.000 kg (75.000 lb)", desc: "Termasuk sistem persenjataan dan pelindung lapis baja internal" },
    { label: "Berat Maksimum Lepas Landas (MTOW)", value: "74.389 kg (164.000 lb)", desc: "Mendukung kapasitas amunisi berat dan bahan bakar maksimal" },
    { label: "Kapasitas Bahan Bakar Internal", value: "± 26.000 liter", desc: "Mendukung loiter time hingga lebih dari 6 jam di atas area target" }
  ],
  propulsion: [
    { label: "Mesin (Powerplant)", value: "4 × Rolls-Royce AE 2100D3 Turboprop", desc: "Mesin turboprop generasi modern dengan kendali digital (FADEC)" },
    { label: "Tenaga per Mesin", value: "4.591 shp (3.424 kW)", desc: "Total tenaga gabungan mencapai lebih dari 18.000 shp" },
    { label: "Baling-baling (Propeller)", value: "Dowty R391 6-blade Composite Propellers", desc: "Baling-baling 6-bilah komposit berkinerja tinggi dan tingkat kebisingan rendah" },
    { label: "Kecepatan Maksimum (Vne)", value: "362 knot (669 km/h / 416 mph)", desc: "Kecepatan terbang horizontal puncak" },
    { label: "Kecepatan Jelajah (Cruise Speed)", value: "300 knot (556 km/h / 345 mph)", desc: "Kecepatan efisien saat transit menuju zona operasi" },
    { label: "Kecepatan Tempur / Pylon Turn", value: "180 - 220 knot (330 - 400 km/h)", desc: "Kecepatan optimal saat bermanuver miring mengitari titik tembak" },
    { label: "Ketinggian Layanan (Service Ceiling)", value: "39.000 ft (12.000 m)", desc: "Ketinggian operasi tempur efektif: 10.000 - 20.000 ft" },
    { label: "Jangkauan Operasi (Ferry Range)", value: "3.000 nautical miles (5.556 km)", desc: "Dapat diperpanjang tak terbatas dengan In-Flight Refueling (Boom/Probe)" }
  ],
  crew: {
    total: "7 hingga 9 personel (AC-130J modern vs 12-14 personel pada varian lawas AC-130H/U)",
    roles: [
      { role: "Pilot & Copilot", count: "2 Orang", duty: "Navigasi terbang, koordinasi formasi, dan eksekusi pylon turn orbit" },
      { role: "Combat Systems Officer (CSO)", count: "1 Orang", duty: "Koordinasi misi taktis, komunikasi medan perang, dan izin pelepasan senjata" },
      { role: "Weapon Systems Officer (WSO)", count: "1 Orang", duty: "Penargetan senjata optik/radar, integrasi kalkulasi balistik, dan pemandu rudal" },
      { role: "Sensor Operator (SO)", count: "1 - 2 Orang", duty: "Pengoperasian kamera thermal FLIR, pelacak sasaran, laser designator, dan SIGINT" },
      { role: "Specialized Aerial Gunners", count: "2 Orang", duty: "Pemuatan ulang proyektil howitzer 105mm, pemeliharaan amunisi 30mm, serta penanganan malfungsi mekanis" }
    ]
  },
  armament: [
    {
      name: "105mm M102 Howitzer",
      caliber: "105 mm (4.13 in)",
      rateOfFire: "6 - 10 putaran / menit (manual feed)",
      range: "Hingga 11.5 km (ketinggian jelajah)",
      type: "Artileri Berat Udara",
      icon: "crosshair",
      desc: "Merupakan senjata terberat yang pernah dipasang secara operasional pada pesawat tempur udara. Menggunakan amunisi proyektil berdaya ledak tinggi (High Explosive / HE) dengan hulu ledak seberat ±15 kg. Sangat mematikan untuk menghancurkan benteng beton, struktur gedung persembunyian musuh, bunker pertahanan, dan konvoi lapis baja berat."
    },
    {
      name: "30mm GAU-23/A Autocannon",
      caliber: "30 × 173 mm",
      rateOfFire: "200 putaran / menit",
      range: "Hingga 4.5 km efektif",
      type: "Meriam Otomatis Rantai (Bushmaster II derivative)",
      icon: "zap",
      desc: "Meriam otomatis kaliber 30mm berpresisi tinggi dengan recoil yang terkendali komputer. Menggunakan amunisi fragmentasi pembakar berdaya ledak tinggi (HEI/HEI-T) serta peluru penembus lapis baja (APFSDS). Efektif memotong infanteri musuh di ruang terbuka, kendaraan pengangkut pasukan, serta perahu patroli cepat musuh."
    },
    {
      name: "AGM-114 Hellfire Missiles",
      caliber: "178 mm (Rudal Berpemandu Laser / Radar)",
      payload: "Hulu ledak anti-armor tandem shaped charge (8 kg)",
      range: "0.5 - 11 km",
      type: "Precision Guided Munition (Pylon Mounted)",
      icon: "target",
      desc: "Rudal presisi tinggi berpemandu laser yang digantungkan di rak pylon sayap luar. Mampu menghancurkan target titik presisi (seperti pos penembak jitu atau kendaraan bergerak) dengan kerusakan kolateral (collateral damage) minimal di wilayah padat penduduk."
    },
    {
      name: "AGM-176 Griffin & GBU-69/B SGM",
      caliber: "Stand-off Glide Munitions (Common Launch Tubes)",
      payload: "Blast fragmentation / penetrator 5 - 16 kg",
      range: "15 - 20 km (Glide Stand-off)",
      type: "Ramp-launched Precision Munition",
      icon: "feather",
      desc: "Munisi mini berpemandu GPS/INS dan semi-active laser yang diluncurkan melalui tabung Common Launch Tubes (CLT) di pintu rampa belakang (cargo ramp) bertekanan udara. Memberikan kemampuan serangan jarak jauh tanpa harus terbang tepat di atas kubah pertahanan udara MANPADS lawan."
    },
    {
      name: "GBU-39 Small Diameter Bomb (SDB)",
      caliber: "250 lb Precision Guided Glide Bomb",
      payload: "Intense blast warhead with diamond wing kit",
      range: "Hingga 70 km glide range",
      type: "Long-Range Glide Bomb",
      icon: "shield",
      desc: "Bom luncur presisi dengan sayap lipat yang dibawa pada BRU-61/A rack. Memungkinkan AC-130 menghantam kubu pertahanan musuh dari jarak aman di luar jangkauan radar pertahanan udara."
    }
  ],
  tactics: [
    {
      title: "The Pylon Turn (Orbit Tembak Melingkar)",
      subtitle: "Prinsip Fisika Dasar Taktik Gunship",
      desc: "AC-130 terbang dalam lintasan melingkar kontinu (orbit lingkaran) dengan sudut kemiringan (bank angle) berkisar antara 25° hingga 45°. Karena semua senjata utama dipasang di sisi kiri lambung (port side) dan mengarah ke bawah, sudut miring ini membuat lintasan moncong senjata terkunci tepat pada satu titik pusat di darat. Komputer balistik mengoreksi hembusan angin, kecepatan pesawat, dan perbedaan elevasi medan, memungkinkan tembakan konstan bertubi-tubi ke sasaran tanpa henti selama berjam-jam."
    },
    {
      title: "Night Stalker Dominance (Kedaulatan Malam Hari)",
      subtitle: "Sensor Thermal Canggih & Siluman Akustik",
      desc: "Mayoritas misi tempur mematikan AC-130 dilakukan pada kegelapan total malam hari. Melalui gabungan pod FLIR resolusi tinggi, laser illuminator inframerah tak terlihat, dan datalink satelit, kru AC-130 dapat membedakan pasukan kawan (blue force tracker) dan musuh di kegelapan gulita, menyerang dari balik awan tanpa pernah terlihat oleh mata telanjang personel darat lawan."
    }
  ],
  variants: [
    { code: "AC-130A Spectre", era: "1967 - 1970an", engine: "Allison T56-A-9", guns: "4× 7.62mm Minigun, 4× 20mm Vulcan", note: "Prototipe pertama dalam Proyek Gunship II untuk Perang Vietnam." },
    { code: "AC-130E Pave Spectre", era: "1971 - 1980an", engine: "Allison T56-A-15", guns: "2× 20mm Vulcan, 1× 40mm Bofors, 1× 105mm Howitzer", note: "Varian pertama yang secara revolusioner memasang howitzer 105mm M102." },
    { code: "AC-130H Spectre", era: "1972 - 2015", engine: "Allison T56-A-15", guns: "1× 40mm Bofors L/60, 1× 105mm M102", note: "Menjadi ikon dalam Perang Teluk, Grenada, Panama, dan Somalia." },
    { code: "AC-130U Spooky II", era: "1995 - 2019", engine: "Allison T56-A-15", guns: "1× 25mm GAU-12 Equalizer, 1× 40mm Bofors, 1× 105mm Howitzer", note: "Dilengkapi radar sintetis APQ-180 dan penembakan otomatis simultan." },
    { code: "AC-130W Stinger II", era: "2010 - Sekarang", engine: "Allison T56", guns: "1× 30mm GAU-23/A, AGM-176 Griffin, SDB", note: "Transisi ke sistem Precision Strike Package dan rudal standoff." },
    { code: "AC-130J Ghostrider", era: "2017 - Sekarang", engine: "Rolls-Royce AE 2100D3", guns: "1× 30mm GAU-23/A, 1× 105mm M102, AGM-114, SDB, Griffin", note: "Varian tercanggih berbasis airframe MC-130J dengan glass cockpit dan radar kuantum." }
  ],
  missions: [
    {
      id: "vietnam",
      year: "1968 - 1973",
      title: "Perang Vietnam & Jalur Ho Chi Minh",
      location: "Laos, Kamboja, dan Vietnam Selatan",
      icon: "flame",
      badge: "Perang Vietnam",
      summary: "Debut tempur perdana AC-130 Spectre dalam membendung jalur suplai logistik militer Vietnam Utara.",
      details: "Selama kampanye interdiksi 'Operation Commando Hunt' di atas Jalur Ho Chi Minh, AC-130 membuktikan kemampuan mematikannya. Menggunakan sensor inframerah generasi awal, pendeteksi pengapian truk, dan lampu sorot tembak, Spectre mengklaim penghancuran lebih dari 10.000 truk pasokan dan puluhan baterai artileri anti-pesawat musuh, menjadikannya salah satu pesawat interdiksi darat paling disegani dalam sejarah penerbangan militer."
    },
    {
      id: "urgent-fury",
      year: "1983",
      title: "Operasi Urgent Fury (Invasi Grenada)",
      location: "Grenada, Karibia",
      icon: "compass",
      badge: "Invasi Grenada",
      summary: "Dukungan tembakan udara presisi untuk penyelamatan mahasiswa kedokteran AS dan penguasaan Bandara Point Salines.",
      details: "Dua pesawat AC-130H Spectre memberikan perlindungan udara tak terputus bagi pasukan U.S. Army Rangers yang terjun payung di Bandara Point Salines. AC-130 melumpuhkan sarang senapan mesin pertahanan udara dan baterai BTR Kuba tanpa merusak fasilitas terminal penting di sekitarnya."
    },
    {
      id: "just-cause",
      year: "1989",
      title: "Operasi Just Cause (Panama)",
      location: "Panama City, Panama",
      icon: "map-pin",
      badge: "Invasi Panama",
      summary: "Penghancuran markas besar Pasukan Pertahanan Panama (PDF) dan Comandancia.",
      details: "AC-130H Spectre menghujani markas militer Manuel Noriega dengan tembakan proyektil 105mm dan 40mm berakurasi bedah bedah di tengah kawasan padat penduduk kota Panama City. Serangan ini melumpuhkan pusat komando musuh dengan korban sipil yang sangat minim."
    },
    {
      id: "desert-storm",
      year: "1991",
      title: "Operasi Desert Storm & Pertempuran Khafji",
      location: "Kuwait & Perbatasan Arab Saudi - Irak",
      icon: "sun",
      badge: "Perang Teluk",
      summary: "Dukungan CAS dramatis dalam pertempuran darat pertama Perang Teluk melawan divisi lapis baja Irak.",
      details: "Dalam Pertempuran Khafji, AC-130H menghancurkan konvoi tank dan pos komando lapis baja Irak. Dalam operasi ini, pesawat panggilan 'Spirit 03' gugur tertembak rudal SAM bahu (Strela/SA-7) setelah sukarela tetap bertahan di area pertempuran menjelang fajar demi melindungi rekan marinir darat—menjadi kehilangan kru terbesar dalam sejarah modern AFSOC."
    },
    {
      id: "gothic-serpent",
      year: "1993",
      title: "Operasi Gothic Serpent (Pertempuran Mogadishu)",
      location: "Mogadishu, Somalia",
      icon: "shield-alert",
      badge: "Black Hawk Down",
      summary: "Misi perlindungan malam hari untuk gugus tugas Task Force Ranger di wilayah Somalia.",
      details: "Pesawat AC-130 Spectre rutin melakukan patroli tembak dan interdiksi malam hari di atas wilayah Mogadishu sebelum tanggal 3 Oktober 1993. Kehadirannya yang menebarkan tembakan presisi dari langit sangat ditakuti milisi Mohamed Farrah Aidid hingga mendapat julukan 'Kematian Senyap di Langit Malam'."
    },
    {
      id: "enduring-freedom",
      year: "2001 - 2021",
      title: "Operasi Enduring Freedom (Afganistan)",
      location: "Tora Bora, Shah-i-Kot, Kandahar, Afganistan",
      icon: "mountain",
      badge: "Perang Afganistan",
      summary: "Dua dekade dominasi udara di pegunungan terjal dan pertempuran sengit melawan Taliban & Al-Qaeda.",
      details: "Di lereng pegunungan terjal Hindu Kush dan pertempuran Lembah Shah-i-Kot (Operation Anaconda), AC-130U Spooky II menjadi malaikat pelindung bagi pasukan khusus Navy SEALs, Green Berets, dan CIA SAD. Meriam 105mm mampu melontarkan proyektil langsung ke dalam mulut gua persembunyian musuh yang tidak bisa dijangkau bom jet tempur konvensional."
    },
    {
      id: "iraqi-freedom",
      year: "2003 - 2011",
      title: "Operasi Iraqi Freedom & Pertempuran Fallujah",
      location: "Baghdad, Fallujah, Al-Anbar, Irak",
      icon: "crosshair",
      badge: "Perang Irak",
      summary: "Dukungan tempur perkotaan terberat dalam Operasi Phantom Fury di Fallujah.",
      details: "Selama Pertempuran Fallujah Kedua (November 2004), armada AC-130 menembakkan ratusan putaran howitzer 105mm dan meriam 40mm setiap malam. Pilot dan sistem sensor melacak penembak jitu serta regu mortir pemberontak dari atap ke atap di tengah labirin perkotaan padat."
    },
    {
      id: "inherent-resolve",
      year: "2014 - Sekarang",
      title: "Operasi Inherent Resolve (Suriah & Irak)",
      location: "Raqqa, Mosul, Lembah Eufrat",
      icon: "radio",
      badge: "Anti-ISIS Campaign",
      summary: "Debut tempur varian mutakhir AC-130W Stinger II dan AC-130J Ghostrider dalam menumpas ISIS.",
      details: "Menggunakan amunisi cerdas rudal Hellfire, bom luncur SDB, dan meriam rantai 30mm GAU-23/A, AC-130J Ghostrider menghancurkan konvoi truk minyak ilegal, basis produksi bom VBIED, dan pertahanan garis depan ISIS dengan presisi bedah berbasis koordinat GPS dan penandaan laser inframerah."
    }
  ]
};
