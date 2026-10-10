export type ThreatLevel = 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';

export interface Hotspot {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: string;
  version: string;
  bright_t31: number;
  frp: number; // Fire Radiative Power (MW)
  daynight: 'D' | 'N';
  province: string;
  regency: string;
  district: string;
  land_type: string;
  vegetation?: string;
  threat_level: ThreatLevel;
}

export interface RegionSummary {
  id: string;
  name: string;
  island: string;
  center: [number, number];
  zoom: number;
  totalHotspots: number;
  criticalHotspots: number;
  maxFrp: number;
  highRiskArea: string;
}

export interface WeatherTelemetry {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  cardinalWind: string;
  smokeDirection: number;
  cardinalSmoke: string;
  fwiStatus: 'RENDAH' | 'SEDANG' | 'TINGGI' | 'SANGAT EKSTREM';
  fwiScore: number;
  timestamp: string;
}

export type BasemapType = 'osmDark' | 'osmLight' | 'satellite';
export type SeverityFilter = 'all' | 'critical' | 'moderate';
export type SensorFilter = 'all' | 'VIIRS' | 'MODIS';

export interface ToastInfo {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}
