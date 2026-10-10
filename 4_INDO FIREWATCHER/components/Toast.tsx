'use client';

import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { ToastInfo } from '@/types/hotspot';

interface ToastProps {
  toast: ToastInfo | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-fire shrink-0" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full pointer-events-none flex justify-end animate-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto glass-panel border border-white/20 rounded-2xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-xl">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white">{toast.title}</h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
