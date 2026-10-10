'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { Map as LeafletMap, LayerGroup, TileLayer, Polygon } from 'leaflet';
import { Search, Moon, Sun, Globe, RotateCcw, Layers, X, Info } from 'lucide-react';
import { Hotspot, BasemapType } from '@/types/hotspot';
import { REGIONS_CONFIG } from '@/lib/data-regions';
import { tacticalAudio } from '@/lib/audio';

interface MapLeafletProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
  flyToCoord: [number, number, number] | null; // [lat, lng, zoom]
}

export const MapLeaflet: React.FC<MapLeafletProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  flyToCoord,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const selectionLayerRef = useRef<LayerGroup | null>(null);
  const peatlandLayerRef = useRef<LayerGroup | null>(null);
  const currentTileLayerRef = useRef<TileLayer | null>(null);

  const [currentBasemap, setCurrentBasemap] = useState<BasemapType>('osmDark');
  const [showPeatlands, setShowPeatlands] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileLegend, setShowMobileLegend] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // 1. Inisialisasi Map Leaflet dengan Canvas Engine untuk Performa Maksimal
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-1.5, 117.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      preferCanvas: true, // Hardware-accelerated canvas rendering
      wheelDebounceTime: 40,
    });

    // Zoom control diposisikan di kanan atas dengan padding nyaman
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Default dark basemap
    const darkTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      className: 'osm-dark-tile',
    });
    darkTile.addTo(map);
    currentTileLayerRef.current = darkTile;

    // Layer groups terpisah untuk isolasi render
    const peatlandsGroup = L.layerGroup().addTo(map);
    peatlandLayerRef.current = peatlandsGroup;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    const selectionGroup = L.layerGroup().addTo(map);
    selectionLayerRef.current = selectionGroup;

    mapRef.current = map;

    // Render zona kubah gambut
    renderPeatlands(peatlandsGroup);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Render Poligon Kubah Gambut
  const renderPeatlands = (group: LayerGroup) => {
    group.clearLayers();
    REGIONS_CONFIG.PEATLAND_ZONES.forEach((zone) => {
      const polygon: Polygon = L.polygon(zone.coordinates as [number, number][], {
        color: '#f97316',
        weight: 1.5,
        fillColor: '#ea580c',
        fillOpacity: 0.15,
        dashArray: '4, 4',
      });

      polygon.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; padding: 4px;">
          <strong style="color: #f97316;">${zone.name}</strong><br/>
          <span>Kedalaman Gambut: ${zone.depth}</span><br/>
          <span style="color: #ef4444; font-weight: bold;">Status: ${zone.status}</span>
        </div>
      `, { sticky: true, className: 'glass-tooltip' });

      polygon.addTo(group);
    });
  };

  // 3. Render Titik Api Markers Berkepatan Tinggi (High Performance, Non-Lagging)
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    // Identifikasi top 6 titik paling kritis untuk animasi saja (mencegah bottleneck GPU)
    const topExtremeIds = new Set(
      [...hotspots]
        .sort((a, b) => b.frp - a.frp)
        .slice(0, 6)
        .map((h) => h.id)
    );

    hotspots.forEach((h) => {
      const isExtreme = h.threat_level === 'EXTREME' || h.frp > 50;
      const isHigh = h.threat_level === 'HIGH' || (h.frp > 25 && !isExtreme);
      const shouldPulse = topExtremeIds.has(h.id);

      const size = isExtreme ? 20 : isHigh ? 15 : 11;
      const pulseClass = shouldPulse ? 'marker-fire-extreme' : '';
      const bgGradient = isExtreme
        ? 'radial-gradient(circle, #ff1a1a 0%, #b91c1c 70%, #7f1d1d 100%)'
        : isHigh
        ? 'radial-gradient(circle, #ff8c00 0%, #c2410c 70%, #7c2d12 100%)'
        : 'radial-gradient(circle, #facc15 0%, #ca8a04 70%, #854d0e 100%)';

      const customFireIcon = L.divIcon({
        className: 'custom-fire-marker-wrapper',
        html: `
          <div class="${pulseClass}" style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${bgGradient};
            border: 1.5px solid rgba(255,255,255,0.85);
            cursor: pointer;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            transition: transform 0.15s ease;
          "></div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([h.latitude, h.longitude], {
        icon: customFireIcon,
        riseOnHover: true,
      });

      marker.on('click', () => {
        onSelectHotspot(h);
      });

      marker.addTo(markersGroup);
    });
  }, [hotspots, onSelectHotspot]);

  // 4. Update Layer Sorotan Titik Api Terpilih secara Instan (Tanpa Render Ulang Seluruh Peta)
  useEffect(() => {
    if (!selectionLayerRef.current) return;
    const selectionGroup = selectionLayerRef.current;
    selectionGroup.clearLayers();

    if (!selectedHotspot) return;

    // Tambahkan target ring highlight dinamis di koordinat terpilih
    const targetIcon = L.divIcon({
      className: 'selected-hotspot-ring',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 0 20px #ff4500, 0 0 35px #ffffff, inset 0 0 10px #ff4500;
          animation: fire-pulse-extreme 1.2s infinite ease-out;
          pointer-events: none;
        "></div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const targetMarker = L.marker([selectedHotspot.latitude, selectedHotspot.longitude], {
      icon: targetIcon,
      zIndexOffset: 1000,
    });
    targetMarker.addTo(selectionGroup);

    if (mapRef.current) {
      mapRef.current.flyTo([selectedHotspot.latitude, selectedHotspot.longitude], 10, {
        duration: 0.8,
      });
    }
  }, [selectedHotspot]);

  // 5. Ganti Basemap Ringan & Cepat
  const changeBasemap = useCallback((type: BasemapType) => {
    if (!mapRef.current || currentBasemap === type) return;

    tacticalAudio.playClick();
    const map = mapRef.current;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let newTile: TileLayer;
    if (type === 'satellite') {
      newTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri & Maxar',
        maxZoom: 18,
      });
    } else if (type === 'osmLight') {
      newTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
    } else {
      newTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        className: 'osm-dark-tile',
      });
    }

    newTile.addTo(map);
    currentTileLayerRef.current = newTile;
    setCurrentBasemap(type);
  }, [currentBasemap]);

  // 6. Reset Zoom Seluruh RI
  const resetToIndonesia = useCallback(() => {
    tacticalAudio.playRadarPing();
    if (mapRef.current) {
      mapRef.current.flyTo([-1.5, 117.5], 5, { duration: 1.2 });
    }
  }, []);

  // 7. Fly to Coordinate saat diklik dari sidebar
  useEffect(() => {
    if (!mapRef.current || !flyToCoord) return;
    const [lat, lng, zoom] = flyToCoord;
    mapRef.current.flyTo([lat, lng], zoom, { duration: 1.0 });
  }, [flyToCoord]);

  // 8. Toggle Peatlands Layer
  const togglePeatlands = useCallback(() => {
    tacticalAudio.playClick();
    if (!peatlandLayerRef.current) return;
    const group = peatlandLayerRef.current;
    if (showPeatlands) {
      group.clearLayers();
      setShowPeatlands(false);
    } else {
      renderPeatlands(group);
      setShowPeatlands(true);
    }
  }, [showPeatlands]);

  // 9. Handle Search Input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    tacticalAudio.playClick();
    const query = searchQuery.toLowerCase().trim();

    // Cek provinsi
    const matchedProv = REGIONS_CONFIG.PROVINCES.find(
      (p) => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
    );
    if (matchedProv) {
      mapRef.current.flyTo(matchedProv.center, matchedProv.zoom, { duration: 1.0 });
      return;
    }

    // Cek titik api
    const matchedHotspot = hotspots.find(
      (h) =>
        h.regency.toLowerCase().includes(query) ||
        h.district.toLowerCase().includes(query) ||
        h.province.toLowerCase().includes(query)
    );
    if (matchedHotspot) {
      onSelectHotspot(matchedHotspot);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl flex flex-col">
      {/* Top Map Action Bar - Fully Responsive */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search Bar - Responsive Pill */}
        <div className="pointer-events-auto flex items-center">
          <form
            onSubmit={handleSearch}
            className={`flex items-center gap-1.5 bg-dark-900/90 backdrop-blur-md px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/15 shadow-xl transition-all duration-200 ${
              searchOpen ? 'w-64 sm:w-72' : 'w-48 sm:w-64 md:w-72'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-fire shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => !searchQuery && setSearchOpen(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari provinsi / wilayah..."
              className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>
        </div>

        {/* Basemap & Layer Controls - Ultra-Compact on Mobile */}
        <div className="pointer-events-auto flex items-center gap-1 bg-dark-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/15 shadow-xl overflow-x-auto max-w-full">
          <button
            onClick={() => changeBasemap('osmDark')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all shrink-0 ${
              currentBasemap === 'osmDark'
                ? 'bg-fire text-white shadow-md shadow-fire/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Peta tema gelap OpenStreetMap"
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gelap</span>
          </button>

          <button
            onClick={() => changeBasemap('satellite')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all shrink-0 ${
              currentBasemap === 'satellite'
                ? 'bg-fire text-white shadow-md shadow-fire/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Citra satelit permukaan bumi ArcGIS"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Satelit</span>
          </button>

          <button
            onClick={() => changeBasemap('osmLight')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all shrink-0 ${
              currentBasemap === 'osmLight'
                ? 'bg-fire text-white shadow-md shadow-fire/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Peta tema standar OpenStreetMap"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Standar</span>
          </button>

          <div className="w-[1px] h-3.5 bg-white/20 mx-0.5 shrink-0" />

          {/* Toggle Peatlands */}
          <button
            onClick={togglePeatlands}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-medium transition-all shrink-0 ${
              showPeatlands
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Tampilkan/sembunyikan zona kubah gambut"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Gambut</span>
          </button>

          {/* Reset Indonesia */}
          <button
            onClick={resetToIndonesia}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all shrink-0"
            title="Kembali ke tampilan seluruh Indonesia"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset RI</span>
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0 min-h-[380px]" />

      {/* Mobile Legend Floating Toggle Button */}
      <div className="sm:hidden absolute bottom-3 right-3 z-[1000] pointer-events-auto">
        <button
          onClick={() => {
            tacticalAudio.playClick();
            setShowMobileLegend(!showMobileLegend);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900/95 text-slate-200 border border-white/20 text-xs shadow-xl backdrop-blur-md active:scale-95"
        >
          <Info className="w-3.5 h-3.5 text-fire" />
          <span>Legenda</span>
        </button>
      </div>

      {/* Map Legend - Desktop Fixed & Mobile Toggleable Overlay */}
      {(showMobileLegend || true) && (
        <div
          className={`absolute bottom-3 right-3 z-[1000] glass-panel px-3.5 py-2.5 rounded-2xl border border-white/15 shadow-xl text-xs space-y-1.5 pointer-events-auto backdrop-blur-md ${
            showMobileLegend ? 'block max-w-[260px]' : 'hidden sm:block'
          }`}
        >
          <div className="font-bold text-slate-200 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-fire" />
              <span>Legenda Peta</span>
            </span>
            {showMobileLegend && (
              <button
                onClick={() => setShowMobileLegend(false)}
                className="sm:hidden text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span>Titik Api Kritis (&gt;50 MW)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Titik Api Sedang (&gt;20 MW)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span>Titik Api Awal (&lt;20 MW)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="w-3 h-2 rounded bg-orange-500/30 border border-orange-500 border-dashed" />
            <span>Kubah Gambut Rawan</span>
          </div>
        </div>
      )}
    </div>
  );
};

