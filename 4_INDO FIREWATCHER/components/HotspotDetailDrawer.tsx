'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Flame,
  Clock,
  Thermometer,
  Satellite,
  Navigation,
  Wind,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { Hotspot, WeatherTelemetry } from '@/types/hotspot';
import { TacticalServices } from '@/lib/services';
import { tacticalAudio } from '@/lib/audio';

interface HotspotDetailDrawerProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

export const HotspotDetailDrawer: React.FC<HotspotDetailDrawerProps> = ({
  hotspot,
  onClose,
}) => {
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!hotspot) {
      setWeather(null);
      return;
    }

    let isMounted = true;
    setLoadingWeather(true);

    TacticalServices.fetchLocalWeather(hotspot.latitude, hotspot.longitude)
      .then((data) => {
        if (isMounted) {
          setWeather(data);
          setLoadingWeather(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingWeather(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hotspot]);

  if (!hotspot) return null;

  const isExtreme = hotspot.threat_level === 'EXTREME' || hotspot.frp > 50;
  const isHigh = hotspot.threat_level === 'HIGH' || hotspot.frp > 25;
  const coordDisplay = TacticalServices.formatCoordinates(hotspot.latitude, hotspot.longitude);

  const copyCoordinates = () => {
    tacticalAudio.playClick();
    const text = `${hotspot.latitude.toFixed(5)}, ${hotspot.longitude.toFixed(5)} (${coordDisplay})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareHotspot = () => {
    tacticalAudio.playClick();
    if (navigator.share) {
      navigator.share({
        title: `Titik Api ${hotspot.regency}, ${hotspot.province}`,
        text: `Terdeteksi titik api karhutla di ${hotspot.regency}, ${hotspot.province} (${hotspot.frp} MW FRP). Koordinat: ${hotspot.latitude}, ${hotspot.longitude}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      copyCoordinates();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-2 sm:p-5 pointer-events-none flex justify-center animate-in slide-in-from-bottom-6 duration-300">
      <div className="w-full max-w-3xl glass-panel border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl pointer-events-auto backdrop-blur-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto smooth-scroll">
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2 sm:hidden" />

        {/* Header Drawer */}
        <div className="flex items-start justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase px-2 sm:px-2.5 py-0.5 rounded-full border ${
                isExtreme
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : isHigh
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
              }`}>
                {isExtreme ? 'API KRITIS & BERBAHAYA' : isHigh ? 'API BERKEMBANG TINGGI' : 'ANOMALI PANAS AWAL'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">ID: {hotspot.id}</span>
            </div>
            <h3 className="text-base sm:text-xl font-extrabold text-white truncate">
              {hotspot.regency}, {hotspot.province}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300">
              Kecamatan: <strong>{hotspot.district}</strong> &bull; Lahan: <span className="text-fire">{hotspot.land_type}</span>
            </p>
          </div>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              onClose();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0"
            title="Tutup Rincian"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 my-3 sm:my-4">
          <div className="glass-card p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5">
            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" /> Waktu Deteksi
            </span>
            <div className="text-xs sm:text-sm font-bold text-white mt-1">{hotspot.acq_time}</div>
            <span className="text-[10px] text-slate-400">{hotspot.acq_date}</span>
          </div>

          <div className="glass-card p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5">
            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-red-400 shrink-0" /> Suhu Estimasi
            </span>
            <div className="text-xs sm:text-sm font-bold text-red-400 mt-1">
              {(hotspot.brightness - 273.15).toFixed(1)}°C
            </div>
            <span className="text-[10px] text-slate-400">{hotspot.brightness} K</span>
          </div>

          <div className="glass-card p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5">
            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Flame className="w-3 h-3 text-fire shrink-0" /> Radiasi (FRP)
            </span>
            <div className="text-xs sm:text-sm font-bold text-fire mt-1">{hotspot.frp} MW</div>
            <span className="text-[10px] text-slate-400">Radiasi Termal</span>
          </div>

          <div className="glass-card p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5">
            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Satellite className="w-3 h-3 text-emerald-400 shrink-0" /> Satelit
            </span>
            <div className="text-xs sm:text-sm font-bold text-white mt-1 truncate">{hotspot.satellite}</div>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase">{hotspot.confidence} conf</span>
          </div>
        </div>

        {/* Real-time Weather Telemetry Card */}
        <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-dark-900/90 border border-white/10 mb-3 sm:mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
            <span className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
              Kondisi Cuaca & Sebaran Asap
            </span>
            {loadingWeather && <span className="text-[10px] text-cyan-400 animate-pulse">Memuat cuaca...</span>}
          </div>

          {weather && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400">Suhu Udara:</span>
                <div className="font-semibold text-white">{weather.temperature}°C (RH {weather.humidity}%)</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Angin Dari:</span>
                <div className="font-semibold text-white">{weather.cardinalWind} ({weather.windSpeed} km/h)</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Asap Menuju:</span>
                <div className="font-semibold text-fire">{weather.cardinalSmoke}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Bahaya Karhutla:</span>
                <div className="font-bold text-red-400">{weather.fwiStatus} ({weather.fwiScore})</div>
              </div>
            </div>
          )}
        </div>

        {/* Action & Coordinates Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-300 font-mono">
            <Navigation className="w-3.5 h-3.5 text-fire shrink-0" />
            <span className="truncate">Koordinat: {coordDisplay}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={copyCoordinates}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-slate-200 border border-white/10 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin'}</span>
            </button>

            <button
              onClick={shareHotspot}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-fire hover:bg-orange-600 text-white transition-all active:scale-95 shadow-md shadow-fire/30"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

