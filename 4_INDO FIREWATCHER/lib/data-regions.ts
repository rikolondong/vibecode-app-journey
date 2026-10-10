export interface ProvinceConfig {
  id: string;
  name: string;
  island: string;
  center: [number, number];
  zoom: number;
  riskLevel: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  peatlandVulnerability: string;
}

export interface PeatlandZone {
  name: string;
  depth: string;
  status: string;
  coordinates: [number, number][];
}

export interface RegionsConfig {
  INDONESIA_CENTER: [number, number];
  INDONESIA_ZOOM: number;
  PROVINCES: ProvinceConfig[];
  PEATLAND_ZONES: PeatlandZone[];
}

export const REGIONS_CONFIG: RegionsConfig = {
  INDONESIA_CENTER: [-1.5, 117.5],
  INDONESIA_ZOOM: 5,
  
  PROVINCES: [
    {
      id: "riau",
      name: "Riau",
      island: "Sumatera",
      center: [0.5071, 101.4478],
      zoom: 8,
      riskLevel: "EXTREME",
      peatlandVulnerability: "SANGAT TINGGI (Kubah Gambut >4m)",
    },
    {
      id: "sumsel",
      name: "Sumatera Selatan",
      island: "Sumatera",
      center: [-3.3194, 104.9147],
      zoom: 8,
      riskLevel: "EXTREME",
      peatlandVulnerability: "SANGAT TINGGI (Lahan Gambut OKI & Banyuasin)",
    },
    {
      id: "jambi",
      name: "Jambi",
      island: "Sumatera",
      center: [-1.6101, 103.6131],
      zoom: 8,
      riskLevel: "HIGH",
      peatlandVulnerability: "TINGGI (Tanjabtim & Muaro Jambi)",
    },
    {
      id: "kalbar",
      name: "Kalimantan Barat",
      island: "Kalimantan",
      center: [-0.1322, 110.8789],
      zoom: 7,
      riskLevel: "EXTREME",
      peatlandVulnerability: "SANGAT TINGGI (Ketapang & Kubu Raya)",
    },
    {
      id: "kalteng",
      name: "Kalimantan Tengah",
      island: "Kalimantan",
      center: [-1.6815, 113.3824],
      zoom: 7,
      riskLevel: "EXTREME",
      peatlandVulnerability: "KRITIS (Eks PLG, Sebangau, Pulang Pisau)",
    },
    {
      id: "kalsel",
      name: "Kalimantan Selatan",
      island: "Kalimantan",
      center: [-3.0926, 115.2838],
      zoom: 8,
      riskLevel: "HIGH",
      peatlandVulnerability: "TINGGI (Ring 1 Bandara Syamsudin Noor)",
    },
    {
      id: "kaltim",
      name: "Kalimantan Timur (IKN)",
      island: "Kalimantan",
      center: [0.5387, 116.4194],
      zoom: 8,
      riskLevel: "MODERATE",
      peatlandVulnerability: "SEDANG (Zona Penyangga IKN & Kutai)",
    },
    {
      id: "papua_selatan",
      name: "Papua Selatan",
      island: "Papua",
      center: [-7.8210, 139.7540],
      zoom: 8,
      riskLevel: "HIGH",
      peatlandVulnerability: "TINGGI (Savana Kering Merauke & Rawa)",
    },
    {
      id: "aceh",
      name: "Aceh",
      island: "Sumatera",
      center: [4.2410, 96.7540],
      zoom: 8,
      riskLevel: "MODERATE",
      peatlandVulnerability: "SEDANG (Rawa Tripa & Pesisir Barat)",
    }
  ],

  // Zona Poligon Risiko Lahan Gambut Indonesia (Informasi Konservasi Lingkungan Publik)
  PEATLAND_ZONES: [
    {
      name: "Kubah Gambut Semenanjung Kampar - Pelalawan (Riau)",
      depth: ">4.0 Meter",
      status: "SANGAT RAWAN",
      coordinates: [
        [0.45, 102.15],
        [0.55, 102.60],
        [0.20, 102.80],
        [0.05, 102.35],
        [0.18, 101.90]
      ]
    },
    {
      name: "Kubah Gambut Ogan Komering Ilir (Sumsel)",
      depth: ">3.5 Meter",
      status: "SANGAT RAWAN",
      coordinates: [
        [-3.10, 105.00],
        [-3.15, 105.45],
        [-3.65, 105.40],
        [-3.70, 104.95],
        [-3.35, 104.85]
      ]
    },
    {
      name: "Kawasan Gambut Eks PLG - Pulang Pisau (Kalteng)",
      depth: ">3.0 Meter",
      status: "KRITIS",
      coordinates: [
        [-2.50, 113.90],
        [-2.55, 114.40],
        [-3.10, 114.30],
        [-3.05, 113.80],
        [-2.75, 113.70]
      ]
    },
    {
      name: "Kubah Gambut Kendawangan - Ketapang (Kalbar)",
      depth: ">3.5 Meter",
      status: "SANGAT RAWAN",
      coordinates: [
        [-1.60, 109.95],
        [-1.65, 110.35],
        [-2.10, 110.30],
        [-2.05, 109.90]
      ]
    }
  ]
};
