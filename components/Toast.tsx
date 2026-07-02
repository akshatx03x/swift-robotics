'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let Icon = Info;
          let bgColor = 'bg-zinc-900/90 border-zinc-800 text-zinc-100';
          let iconColor = 'text-violet-400';

          if (t.type === 'success') {
            Icon = CheckCircle2;
            bgColor = 'bg-zinc-900/95 border-emerald-500/30 text-zinc-100';
            iconColor = 'text-emerald-400';
          } else if (t.type === 'error') {
            Icon = XCircle;
            bgColor = 'bg-zinc-900/95 border-red-500/30 text-zinc-100';
            iconColor = 'text-red-400';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            bgColor = 'bg-zinc-900/95 border-amber-500/30 text-zinc-100';
            iconColor = 'text-amber-400';
          }

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md pointer-events-auto transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${bgColor}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor} mt-0.5`} />
              <div className="flex-1 text-sm font-medium">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
