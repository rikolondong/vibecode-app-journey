import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/StatsOverview';
import { Sidebar } from '@/components/Sidebar';
import { MapLeaflet } from '@/components/MapLeaflet';
import { HotspotDetailDrawer } from '@/components/HotspotDetailDrawer';
import { NasaKeyModal } from '@/components/NasaKeyModal';
import { Toast } from '@/components/Toast';
import { Map as MapIcon, ListFilter } from 'lucide-react';
import { Hotspot, SeverityFilter, SensorFilter, ToastInfo } from '@/types/hotspot';
import { REGIONS_CONFIG, ProvinceConfig } from '@/lib/data-regions';
import { INDONESIA_HOTSPOTS } from '@/lib/data-hotspots';
import { TacticalServices } from '@/lib/services';
import { tacticalAudio } from '@/lib/audio';

export function App() {
  const [allHotspots, setAllHotspots] = useState<Hotspot[]>(INDONESIA_HOTSPOTS);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [sensorFilter, setSensorFilter] = useState<SensorFilter>('all');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNasaLive, setIsNasaLive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(300);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [flyToCoord, setFlyToCoord] = useState<[number, number, number] | null>(null);

  // Responsive mobile view tab ('map' | 'list')
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  const showToast = useCallback(
    (title: string, message: string, type: ToastInfo['type'] = 'info') => {
      setToast({
        id: String(Date.now()),
        title,
        message,
        type,
        timestamp: Date.now(),
      });
    },
    []
  );

  // Auto-dismiss toast notification
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load satellite data from NASA FIRMS API via server proxy
  const loadSatelliteData = useCallback(async () => {
    setIsLoading(true);
    showToast(
      'Memperbarui Data',
      'Menghubungi satelit pemantau wilayah Indonesia...',
      'info'
    );

    try {
      const liveData = await TacticalServices.fetchNasaFirmsHotspots('VIIRS_SNPP_NRT', 1);

      if (liveData && liveData.length > 0) {
        setAllHotspots(liveData);
        setIsNasaLive(true);
        tacticalAudio.playRadarPing();
        showToast(
          'Satelit Terhubung',
          `Berhasil memuat ${liveData.length} titik api terkini dari satelit NASA.`,
          'success'
        );
      } else {
        throw new Error('Data satelit kosong');
      }
    } catch {
      setIsNasaLive(false);
      setAllHotspots(INDONESIA_HOTSPOTS);
      showToast(
        'Basis Data Cadangan',
        'Menggunakan data pantauan satelit terintegrasi.',
        'warning'
      );
    } finally {
      setIsLoading(false);
      setCountdown(300);
    }
  }, [showToast]);

  // Initial data load
  useEffect(() => {
    loadSatelliteData();
  }, [loadSatelliteData]);

  // Auto-refresh countdown timer (5 mins)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadSatelliteData();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadSatelliteData]);

  // Hitung provinsi dengan titik api terbanyak (Single pass memoized)
  const { topProvinceName, topProvinceCount } = useMemo(() => {
    const provinceCounts: Record<string, number> = {};
    allHotspots.forEach((h) => {
      provinceCounts[h.province] = (provinceCounts[h.province] || 0) + 1;
    });

    let topName = 'Belum Ada';
    let max = 0;
    Object.entries(provinceCounts).forEach(([name, count]) => {
      if (count > max) {
        max = count;
        topName = name;
      }
    });

    return { topProvinceName: topName, topProvinceCount: max };
  }, [allHotspots]);

  // Handle Hotspot Selection
  const handleSelectHotspot = (hotspot: Hotspot) => {
    tacticalAudio.playTargetLock();
    setSelectedHotspot(hotspot);
    setFlyToCoord([hotspot.latitude, hotspot.longitude, 10]);
    // Pada mobile layar kecil, arahkan langsung ke peta setelah memilih
    setMobileTab('map');
  };

  // Handle Province Navigation
  const handleFlyToProvince = (prov: ProvinceConfig) => {
    tacticalAudio.playClick();
    setFlyToCoord([prov.center[0], prov.center[1], prov.zoom]);
    // Pada mobile layar kecil, arahkan langsung ke peta setelah memilih
    setMobileTab('map');
  };

  return (
    <div className="min-h-[100dvh] bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-fire selection:text-white relative overflow-x-hidden">
      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Security Audit Modal */}
      <NasaKeyModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Main Header */}
      <Header
        isNasaLive={isNasaLive}
        isLoading={isLoading}
        countdown={countdown}
        soundEnabled={soundEnabled}
        onRefresh={loadSatelliteData}
        onToggleSound={() => {
          const isMuted = tacticalAudio.toggleMute();
          setSoundEnabled(!isMuted);
        }}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
      />

      {/* Overview Statistics Cards */}
      <StatsOverview
        hotspots={allHotspots}
        isLoading={isLoading}
        topProvinceName={topProvinceName}
        topProvinceCount={topProvinceCount}
      />

      {/* Mobile View Switcher Tabs (Only visible on screens < lg) */}
      <div className="lg:hidden px-3 pt-1 pb-2">
        <div className="flex items-center p-1 rounded-xl bg-dark-900/90 border border-white/10 shadow-lg">
          <button
            onClick={() => {
              tacticalAudio.playClick();
              setMobileTab('map');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'map'
                ? 'bg-fire text-white shadow-md shadow-fire/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Peta Interaktif</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setMobileTab('list');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'list'
                ? 'bg-fire text-white shadow-md shadow-fire/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Daftar & Filter ({allHotspots.length})</span>
          </button>
        </div>
      </div>

      {/* Interactive GIS Workspace */}
      <main className="flex-1 px-3 sm:px-6 pb-3 sm:pb-4 flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0">
        {/* Left Sidebar (Desktop: always visible, Mobile: visible if tab is 'list') */}
        <div className={`${mobileTab === 'list' ? 'flex flex-1' : 'hidden'} lg:flex shrink-0`}>
          <Sidebar
            provinces={REGIONS_CONFIG.PROVINCES}
            hotspots={allHotspots}
            selectedHotspot={selectedHotspot}
            activeProvince={activeProvince}
            severityFilter={severityFilter}
            sensorFilter={sensorFilter}
            onSelectHotspot={handleSelectHotspot}
            onSelectProvince={setActiveProvince}
            onSeverityChange={setSeverityFilter}
            onSensorChange={setSensorFilter}
            onFlyToProvince={handleFlyToProvince}
            onJumpToMap={() => setMobileTab('map')}
          />
        </div>

        {/* Right Canvas / Map (Desktop: always visible, Mobile: visible if tab is 'map') */}
        <div className={`${mobileTab === 'map' ? 'flex flex-1' : 'hidden'} lg:flex flex-1 min-w-0 relative`}>
          <MapLeaflet
            hotspots={allHotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={handleSelectHotspot}
            flyToCoord={flyToCoord}
          />

          {/* Quick Floating Button on Mobile Map View to switch to List */}
          <div className="lg:hidden absolute bottom-3 left-3 z-[1000] pointer-events-auto">
            <button
              onClick={() => {
                tacticalAudio.playClick();
                setMobileTab('list');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900/95 text-slate-200 border border-white/20 text-xs shadow-xl backdrop-blur-md active:scale-95 font-medium"
            >
              <ListFilter className="w-3.5 h-3.5 text-fire" />
              <span>Daftar Titik ({allHotspots.length})</span>
            </button>
          </div>
        </div>
      </main>

      {/* Hotspot Detailed Telemetry Drawer */}
      <HotspotDetailDrawer
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
      />

      {/* Public Footer */}
      <footer className="w-full glass-panel border-t border-white/10 px-3 py-2.5 sm:px-6 mt-auto text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs flex-wrap justify-center sm:justify-start">
          <span>Sumber Satelit:</span>
          <strong className="text-slate-200">NASA FIRMS</strong>
          <span>&bull; Peta:</span>
          <strong className="text-slate-200">OpenStreetMap & Esri</strong>
          <span>&bull; Cuaca:</span>
          <strong className="text-slate-200">Open-Meteo</strong>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-500">
          INDO FIREWATCH &bull; Pemantauan Karhutla Indonesia
        </div>
      </footer>
    </div>
  );
}

export default App;

