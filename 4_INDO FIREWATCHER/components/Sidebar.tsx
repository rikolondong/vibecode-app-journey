'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Flame,
  Globe2,
  Filter,
  Satellite,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Search,
  X,
} from 'lucide-react';
import { Hotspot, SeverityFilter, SensorFilter } from '@/types/hotspot';
import { ProvinceConfig } from '@/lib/data-regions';
import { tacticalAudio } from '@/lib/audio';

interface SidebarProps {
  provinces: ProvinceConfig[];
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  activeProvince: string | null;
  severityFilter: SeverityFilter;
  sensorFilter: SensorFilter;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onSelectProvince: (provinceName: string | null) => void;
  onSeverityChange: (val: SeverityFilter) => void;
  onSensorChange: (val: SensorFilter) => void;
  onFlyToProvince: (prov: ProvinceConfig) => void;
  onJumpToMap?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  provinces,
  hotspots,
  selectedHotspot,
  activeProvince,
  severityFilter,
  sensorFilter,
  onSelectHotspot,
  onSelectProvince,
  onSeverityChange,
  onSensorChange,
  onFlyToProvince,
  onJumpToMap,
}) => {
  const [activeTab, setActiveTab] = useState<'provinces' | 'hotspots'>('provinces');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(60);

  // 1. Hitung statistik provinsi dalam satu pass O(N) dan memoized
  const provinceStats = useMemo(() => {
    const statsMap: Record<string, { count: number; criticalCount: number; maxFrp: number }> = {};

    hotspots.forEach((h) => {
      const pKey = h.province.toLowerCase().trim();
      if (!statsMap[pKey]) {
        statsMap[pKey] = { count: 0, criticalCount: 0, maxFrp: 0 };
      }
      statsMap[pKey].count += 1;
      if (h.threat_level === 'EXTREME' || h.frp > 50) {
        statsMap[pKey].criticalCount += 1;
      }
      if (h.frp > statsMap[pKey].maxFrp) {
        statsMap[pKey].maxFrp = h.frp;
      }
    });

    return provinces
      .map((p) => {
        const pLower = p.name.toLowerCase().trim();
        let count = 0;
        let criticalCount = 0;
        let maxFrp = 0;

        Object.entries(statsMap).forEach(([key, s]) => {
          if (key.includes(pLower) || pLower.includes(key)) {
            count += s.count;
            criticalCount += s.criticalCount;
            if (s.maxFrp > maxFrp) maxFrp = s.maxFrp;
          }
        });

        return {
          ...p,
          count,
          criticalCount,
          maxFrp,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [provinces, hotspots]);

  // 2. Filter daftar titik api dengan useMemo untuk pencarian responsif instan
  const filteredHotspotsList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return hotspots.filter((h) => {
      if (activeProvince && !h.province.toLowerCase().includes(activeProvince.toLowerCase())) {
        return false;
      }
      if (severityFilter === 'critical' && h.frp < 50 && h.threat_level !== 'EXTREME') {
        return false;
      }
      if (severityFilter === 'moderate' && h.frp < 20) {
        return false;
      }
      if (sensorFilter === 'VIIRS' && !h.satellite.includes('VIIRS')) {
        return false;
      }
      if (sensorFilter === 'MODIS' && !h.satellite.includes('MODIS')) {
        return false;
      }
      if (q) {
        return (
          h.province.toLowerCase().includes(q) ||
          h.regency.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q) ||
          h.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hotspots, activeProvince, severityFilter, sensorFilter, searchQuery]);

  return (
    <aside className="w-full lg:w-96 glass-panel border border-white/10 flex flex-col h-full min-h-[420px] rounded-2xl overflow-hidden shadow-2xl">
      {/* Tab Navigation */}
      <div className="flex items-center p-1.5 sm:p-2 border-b border-white/10 bg-dark-900/60 gap-1.5">
        <button
          onClick={() => {
            tacticalAudio.playClick();
            setActiveTab('provinces');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'provinces'
              ? 'bg-fire text-white shadow-md shadow-fire/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Daftar Provinsi</span>
        </button>

        <button
          onClick={() => {
            tacticalAudio.playClick();
            setActiveTab('hotspots');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'hotspots'
              ? 'bg-fire text-white shadow-md shadow-fire/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4 shrink-0" />
          <span>Titik Api ({filteredHotspotsList.length})</span>
        </button>
      </div>

      {/* Tab 1: Daftar Provinsi */}
      {activeTab === 'provinces' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white">Wilayah Terdampak RI</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Pilih provinsi untuk fokus peta</p>
            </div>
            <button
              onClick={() => {
                tacticalAudio.playClick();
                onSelectProvince(null);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeProvince === null
                  ? 'bg-fire/20 text-fire border border-fire/40'
                  : 'bg-dark-800 text-slate-300 hover:bg-dark-750 border border-white/10'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Semua</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 smooth-scroll">
            {provinceStats.map((prov) => {
              const isSelected = activeProvince?.toLowerCase() === prov.name.toLowerCase();
              return (
                <div
                  key={prov.id}
                  onClick={() => {
                    tacticalAudio.playClick();
                    onSelectProvince(isSelected ? null : prov.name);
                    onFlyToProvince(prov);
                    if (onJumpToMap) onJumpToMap();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-fire/15 border-fire/50 shadow-md shadow-fire/20 ring-1 ring-fire/40'
                      : 'glass-card border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white">{prov.name}</span>
                      <span className="text-[9px] sm:text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-md bg-dark-800 text-slate-300 border border-white/10">
                        {prov.island}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-extrabold text-fire">
                        {prov.count} <span className="text-[10px] font-normal text-slate-400">titik</span>
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-fire' : ''}`} />
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                    <span className="truncate max-w-[190px]">{prov.peatlandVulnerability}</span>
                    {prov.criticalCount > 0 && (
                      <span className="flex items-center gap-1 text-red-400 font-semibold shrink-0">
                        <ShieldAlert className="w-3 h-3" />
                        {prov.criticalCount} Kritis
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Titik Api Terkini */}
      {activeTab === 'hotspots' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filter Bar */}
          <div className="p-2.5 sm:p-3 border-b border-white/5 space-y-2 bg-dark-900/40">
            {/* Quick Search with Clear button */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kabupaten / titik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-800/90 text-xs rounded-xl pl-8 pr-7 py-2 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-fire/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 bg-dark-800/90 rounded-xl px-2.5 py-1.5 border border-white/10">
                <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                <select
                  value={severityFilter}
                  onChange={(e) => {
                    tacticalAudio.playClick();
                    onSeverityChange(e.target.value as SeverityFilter);
                  }}
                  className="bg-transparent text-[11px] text-slate-200 focus:outline-none w-full cursor-pointer"
                >
                  <option value="all" className="bg-dark-900">Semua Skala</option>
                  <option value="critical" className="bg-dark-900">Kritis (&gt;50 MW)</option>
                  <option value="moderate" className="bg-dark-900">Sedang (&gt;20 MW)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-dark-800/90 rounded-xl px-2.5 py-1.5 border border-white/10">
                <Satellite className="w-3 h-3 text-slate-400 shrink-0" />
                <select
                  value={sensorFilter}
                  onChange={(e) => {
                    tacticalAudio.playClick();
                    onSensorChange(e.target.value as SensorFilter);
                  }}
                  className="bg-transparent text-[11px] text-slate-200 focus:outline-none w-full cursor-pointer"
                >
                  <option value="all" className="bg-dark-900">Semua Sensor</option>
                  <option value="VIIRS" className="bg-dark-900">VIIRS 375m</option>
                  <option value="MODIS" className="bg-dark-900">MODIS 1km</option>
                </select>
              </div>
            </div>
          </div>

          {/* List Hotspots */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 smooth-scroll">
            {filteredHotspotsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <p>Tidak ada titik api yang cocok.</p>
                {(activeProvince || severityFilter !== 'all' || sensorFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      onSelectProvince(null);
                      onSeverityChange('all');
                      onSensorChange('all');
                      setSearchQuery('');
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-fire/20 text-fire text-xs font-semibold border border-fire/30"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredHotspotsList.slice(0, displayLimit).map((h) => {
                  const isSelected = selectedHotspot?.id === h.id;
                  const isExtreme = h.threat_level === 'EXTREME' || h.frp > 50;

                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        tacticalAudio.playTargetLock();
                        onSelectHotspot(h);
                        if (onJumpToMap) onJumpToMap();
                      }}
                      className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-fire/20 border-fire shadow-md shadow-fire/30 ring-1 ring-fire'
                          : isExtreme
                          ? 'glass-card border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10'
                          : 'glass-card border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isExtreme ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-orange-400'}`} />
                          <span className="font-bold text-xs text-white truncate">
                            {h.regency}, {h.province}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          isExtreme
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        }`}>
                          {h.frp} MW
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                        <span>{h.acq_time}</span>
                        <span className="truncate max-w-[140px] text-right">{h.satellite}</span>
                      </div>
                    </div>
                  );
                })}

                {filteredHotspotsList.length > displayLimit && (
                  <button
                    onClick={() => setDisplayLimit((prev) => prev + 50)}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-slate-300 border border-white/10 transition-all text-center"
                  >
                    Tampilkan Lebih Banyak ({filteredHotspotsList.length - displayLimit} tersisa)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Guide Card at bottom */}
      <div className="p-2.5 sm:p-3 border-t border-white/10 bg-dark-900/80">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-fire shrink-0" />
          <span>Panduan Warna Titik Api</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[9px] sm:text-[10px]">
          <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-300 justify-center sm:justify-start">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="truncate">Kritis (&gt;50MW)</span>
          </div>
          <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-lg bg-orange-950/40 border border-orange-500/20 text-orange-300 justify-center sm:justify-start">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
            <span className="truncate">Sedang (&gt;20MW)</span>
          </div>
          <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-lg bg-yellow-950/40 border border-yellow-500/20 text-yellow-300 justify-center sm:justify-start">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
            <span className="truncate">Awal (&lt;20MW)</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

