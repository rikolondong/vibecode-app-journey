'use client';

import React, { useState } from 'react';
import { Flame, AlertTriangle, MapPin, Satellite, ChevronDown, ChevronUp } from 'lucide-react';
import { Hotspot } from '@/types/hotspot';

interface StatsOverviewProps {
  hotspots: Hotspot[];
  isLoading: boolean;
  topProvinceName: string;
  topProvinceCount: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  hotspots,
  isLoading,
  topProvinceName,
  topProvinceCount,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const totalHotspots = hotspots.length;
  const criticalHotspots = hotspots.filter(
    (h) => h.threat_level === 'EXTREME' || h.frp > 50
  ).length;

  return (
    <section className="px-3 sm:px-6 pt-2 sm:pt-4 pb-2">
      {/* Mobile Toggle Pill */}
      <div className="lg:hidden flex items-center justify-between mb-1.5 px-1">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-fire animate-pulse" />
          Ringkasan Situasi Terkini
        </span>
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="flex items-center gap-1 text-[11px] font-semibold text-fire hover:text-orange-400 bg-fire/10 px-2 py-0.5 rounded-lg border border-fire/20 transition-all"
        >
          <span>{mobileExpanded ? 'Tutup Rincian' : 'Buka Rincian'}</span>
          {mobileExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 ${mobileExpanded ? 'block' : ''}`}>
        {/* 1. Total Hotspots */}
        <div className="glass-card glass-card-hover p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-fire/10 rounded-full blur-xl group-hover:bg-fire/20 transition-all pointer-events-none" />
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tr from-red-600/20 to-orange-500/20 border border-fire/30 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-fire group-hover:scale-110 transition-transform" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              Total Titik Api
            </span>
            <div className="text-lg sm:text-2xl font-black tracking-tight text-white mt-0.5 leading-tight">
              {isLoading ? (
                <span className="text-xs sm:text-sm font-normal text-slate-400 animate-pulse">Memuat...</span>
              ) : (
                <span>{totalHotspots.toLocaleString('id-ID')}</span>
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] text-slate-400 truncate ${mobileExpanded ? 'block' : 'hidden sm:block'}`}>
              Pantauan Satelit 24 Jam
            </span>
          </div>
        </div>

        {/* 2. Critical Fires */}
        <div className="glass-card glass-card-hover p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/10 rounded-full blur-xl group-hover:bg-red-600/20 transition-all pointer-events-none" />
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tr from-red-700/30 to-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              Kritis (&gt;50 MW)
            </span>
            <div className="text-lg sm:text-2xl font-black tracking-tight text-red-400 mt-0.5 leading-tight">
              {isLoading ? (
                <span className="text-xs sm:text-sm font-normal text-slate-400 animate-pulse">Memuat...</span>
              ) : (
                <span>{criticalHotspots.toLocaleString('id-ID')}</span>
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] text-slate-400 truncate ${mobileExpanded ? 'block' : 'hidden sm:block'}`}>
              Radiasi Panas Tinggi
            </span>
          </div>
        </div>

        {/* 3. Top Impacted Province */}
        <div className="glass-card glass-card-hover p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              Puncak Wilayah
            </span>
            <div className="text-sm sm:text-lg font-bold tracking-tight text-blue-300 mt-0.5 truncate leading-tight">
              {isLoading ? (
                <span className="text-xs font-normal text-slate-400 animate-pulse">Memuat...</span>
              ) : (
                <span>{topProvinceName || 'Seluruh RI'}</span>
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] text-slate-400 truncate ${mobileExpanded ? 'block' : 'hidden sm:block'}`}>
              {topProvinceCount > 0 ? `${topProvinceCount} titik api` : 'Kerapatan tertinggi'}
            </span>
          </div>
        </div>

        {/* 4. Satellite Sensor */}
        <div className="glass-card glass-card-hover p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Satellite className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              Sensor Satelit
            </span>
            <div className="text-sm sm:text-lg font-bold tracking-tight text-emerald-300 mt-0.5 truncate leading-tight">
              VIIRS & MODIS
            </div>
            <span className={`text-[10px] sm:text-[11px] text-slate-400 truncate ${mobileExpanded ? 'block' : 'hidden sm:block'}`}>
              Resolusi 375m & 1km
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

