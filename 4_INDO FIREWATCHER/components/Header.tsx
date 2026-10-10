'use client';

import React from 'react';
import { Flame, RefreshCw, Volume2, VolumeX, Clock, Satellite, ShieldCheck } from 'lucide-react';
import { tacticalAudio } from '@/lib/audio';

interface HeaderProps {
  isNasaLive: boolean;
  isLoading: boolean;
  countdown: number;
  soundEnabled: boolean;
  onRefresh: () => void;
  onToggleSound: () => void;
  onOpenSecurity?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isNasaLive,
  isLoading,
  countdown,
  soundEnabled,
  onRefresh,
  onToggleSound,
  onOpenSecurity,
}) => {
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-3 py-2 sm:px-6 sm:py-3 shadow-glass">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Leading Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-fire to-yellow-500 flex items-center justify-center shadow-lg shadow-fire/30 ring-1 ring-white/20 shrink-0">
            <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-1 truncate">
                INDO <span className="text-fire font-extrabold">FIREWATCH</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-fire/20 text-fire border border-fire/30 shrink-0">
                v2.0
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate hidden xs:block">
              Monitoring Titik Api Satelit NASA & Cuaca RI
            </p>
          </div>
        </div>

        {/* Center Live Status & Countdown Badge (Hidden on very narrow mobile, visible md+) */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 lg:gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-dark-800/80 border border-white/10 backdrop-blur-md">
            <Satellite className={`w-3.5 h-3.5 ${isNasaLive ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-300 text-[11px] lg:text-xs">
              {isNasaLive ? 'NASA Live' : 'Satelit Standby'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isNasaLive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-dark-800/80 border border-white/10 text-slate-300"
            title="Interval otomatis pembaruan data satelit"
          >
            <Clock className="w-3.5 h-3.5 text-fire" />
            <span className="hidden lg:inline text-[11px]">Auto:</span>
            <span className="font-mono font-bold text-fire text-xs">{formatCountdown(countdown)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Refresh Button */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onRefresh();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-fire hover:bg-orange-600 active:scale-95 text-white transition-all shadow-md shadow-fire/30 disabled:opacity-60"
            title="Tarik data titik api satelit terbaru sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Memuat...' : 'Perbarui'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onToggleSound();
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-dark-800/90 hover:bg-dark-750 text-slate-200 border border-white/10 transition-all hover:border-white/20 active:scale-95"
            title="Aktifkan atau matikan suara notifikasi"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="hidden md:inline text-xs">Suara: On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                <span className="hidden md:inline text-xs">Suara: Off</span>
              </>
            )}
          </button>

          {/* Security / Info Audit Button */}
          {onOpenSecurity && (
            <button
              onClick={() => {
                tacticalAudio.playClick();
                onOpenSecurity();
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-dark-800/90 hover:bg-dark-750 text-slate-300 hover:text-emerald-400 border border-white/10 transition-all active:scale-95"
              title="Informasi Keamanan & Kredensial Satelit"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

