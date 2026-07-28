'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Check, Sparkles } from 'lucide-react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installed, setInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => console.log('SW Registered:', reg.scope),
        (err) => console.log('SW Registration failed:', err)
      );
    }

    // 2. Check if already running as standalone PWA
    if (typeof window !== 'undefined') {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      
      setIsStandalone(isStandaloneMode);

      // Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);

      // Listen for beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Check if user dismissed recently
      const dismissed = localStorage.getItem('cardinow_pwa_dismissed');
      if (!dismissed && !isStandaloneMode) {
        if (isIosDevice) {
          setShowBanner(true);
        }
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      alert('برای نصب برنامه، از منوی مرورگر خود گزینه "Add to Home screen" یا "نصب برنامه" را انتخاب کنید.');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('cardinow_pwa_dismissed', 'true');
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Floating Bottom PWA Banner */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 border border-amber-500/30 backdrop-blur-xl shadow-2xl rounded-2xl p-4 text-white font-sans transition-all animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0 shadow-lg shadow-amber-500/20">
                <img src="/logo.png" alt="Cardinow" className="w-full h-full object-cover rounded-[10px]" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-amber-200 flex items-center gap-1">
                  <span>نصب اپلیکیشن کاردینو</span>
                  <Sparkles className="h-3 w-3 text-amber-400" />
                </h5>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  دسترسی سریع، تمام‌صفحه و آفلاین به کارت ویزیت دیجیتال
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>افزودن به صفحه اصلی (PWA)</span>
            </button>
          </div>
        </div>
      )}

      {/* iOS Modal Guide */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full text-white space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400">
                <Smartphone className="h-7 w-7" />
              </div>
              <h4 className="font-extrabold text-sm text-white">راهنمای نصب روی آیفون و آیپد (iOS)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                برای تجربه تمام‌صفحه و سریع کاردینو، مراحل زیر را طی کنید:
              </p>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Share className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-200 block">۱. دکمه Share</span>
                  <span className="text-[11px] text-slate-400">در پایین مرورگر Safari کلیک کنید.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-200 block">۲. Add to Home Screen</span>
                  <span className="text-[11px] text-slate-400">گزینه «افزودن به صفحه اصلی» را انتخاب کنید.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-200 block">۳. تایید نهایی</span>
                  <span className="text-[11px] text-slate-400">در بالای صفحه روی Add بزنید.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
}
