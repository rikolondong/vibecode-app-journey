'use client';

import React from 'react';
import { X, ShieldCheck, Lock, Globe, Server, CheckCircle2 } from 'lucide-react';
import { tacticalAudio } from '@/lib/audio';

interface NasaKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const NasaKeyModal: React.FC<NasaKeyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel border border-white/20 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={() => {
            tacticalAudio.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Audit & Keamanan Data Sistem</h3>
            <p className="text-xs text-slate-400">Protokol Keamanan Informasi Publik Karhutla</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Item 1: Credential Protection */}
          <div className="p-3.5 rounded-2xl bg-dark-900/90 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Isolasi Kredensial Server-Side</h4>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Kunci API satelit NASA FIRMS dikelola 100% di sisi server (environment variable rahasia). Tidak ada kunci API atau kredensial sensitif yang diekspos ke publik atau disimpan di browser pengguna.
              </p>
            </div>
          </div>

          {/* Item 2: Sanitasi Informasi Pertahanan & Militer */}
          <div className="p-3.5 rounded-2xl bg-dark-900/90 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Sanitasi Data Strategis & Publik</h4>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Sistem telah melalui proses audit informasi: data dibatasi murni untuk penanggulangan bencana karhutla (BPBD, BNPB, dan Manggala Agni). Seluruh rincian alutsista pertahanan dan grid militer telah disanitasi.
              </p>
            </div>
          </div>

          {/* Item 3: Geofencing & SSRF Protection */}
          <div className="p-3.5 rounded-2xl bg-dark-900/90 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Proteksi Geofencing & Anti-Abuse</h4>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Permintaan data satelit dikunci secara ketat hanya pada koordinat wilayah Negara Kesatuan Republik Indonesia (95°BT - 141°BT, 11°LS - 6°LU) dengan sistem pembatasan laju (*rate limiting*) dan proteksi SSRF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium text-[11px]">
              Status Sistem: Memenuhi standar keamanan aplikasi publik & bebas kebocoran kredensial.
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-white border border-white/10 transition-all active:scale-95"
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
};
