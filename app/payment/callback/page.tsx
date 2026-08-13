'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ArrowRight, Wallet, ShieldCheck, Copy, Check, CreditCard, Sparkles, Home } from 'lucide-react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const authority = searchParams.get('Authority') || searchParams.get('authority') || searchParams.get('Authority_') || '';
  const status = searchParams.get('Status') || searchParams.get('status') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    ref_id?: string;
    amount?: number;
    error?: string;
    message?: string;
    payload?: any;
    already_verified?: boolean;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authority) {
      setIsLoading(false);
      setResult({
        success: false,
        error: 'شناسه اتوریتی (Authority) تراکنش یافت نشد. لطفاً از طریق لینک مستقیم درگاه اقدام نمایید.'
      });
      return;
    }

    let isMounted = true;

    async function verifyPayment() {
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authority, status })
        });

        const json = await res.json();
        if (isMounted) {
          if (res.ok && json.success) {
            setResult({
              success: true,
              ref_id: json.ref_id,
              amount: json.amount,
              message: json.message || 'پرداخت شما با موفقیت تایید و در سیستم ثبت گردید.',
              payload: json.payload,
              already_verified: json.already_verified
            });
          } else {
            setResult({
              success: false,
              error: json.error || 'تراکنش تایید نشد یا توسط کاربر لغو گردید.',
              amount: json.amount,
              payload: json.payload
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setResult({
            success: false,
            error: 'خطا در ارتباط با سرور جهت استعلام وضعیت تراکنش: ' + err.message
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyPayment();

    return () => { isMounted = false; };
  }, [authority, status]);

  const handleCopyRefId = () => {
    if (result?.ref_id) {
      navigator.clipboard.writeText(result.ref_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getJalaliNow = () => {
    return new Date().toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4 dir-rtl">
      {/* Subtle Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
              M
            </div>
            <div>
              <h1 className="font-bold text-base text-white">مگاکارت | درگاه پرداخت</h1>
              <p className="text-[11px] text-slate-400">نتیجه پردازش تراکنش زرین‌پال</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>اتصال امن شتاب</span>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              <Sparkles className="h-6 w-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">در حال استعلام و تایید پرداخت...</h2>
              <p className="text-xs text-slate-400">لطفاً چند لحظه شکیبا باشید تا اطلاعات از درگاه زرین‌پال دریافت گردد.</p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {!isLoading && result?.success && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Success Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-8 w-8 animate-in zoom-in" />
              </div>
              <h2 className="text-lg font-black text-emerald-400">پرداخت با موفقیت انجام شد!</h2>
              <p className="text-xs text-slate-300">
                {result.message || 'عملیات با موفقیت تایید شد و تغییرات در حساب کاربری شما اعمال گردید.'}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-slate-400">کد پیگیری تراکنش (Ref ID):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-sm tracking-wider dir-ltr">{result.ref_id || '---'}</span>
                  <button
                    onClick={handleCopyRefId}
                    title="کپی شماره پیگیری"
                    className="p-1 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-slate-400">شناسه اتوریتی درگاه:</span>
                <span className="font-mono text-slate-300 text-[11px] dir-ltr">{authority}</span>
              </div>

              {result.amount && (
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <span className="text-slate-400">مبلغ پرداخت شده:</span>
                  <span className="font-extrabold text-white text-sm">
                    {Number(result.amount).toLocaleString('fa-IR')} <span className="text-xs font-normal text-amber-400">تومان</span>
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-slate-400">نوع تراکنش:</span>
                <span className="font-bold text-blue-400">
                  {result.payload?.payment_type === 'plan' ? `خرید اشتراک (${result.payload?.plan_title || 'پلن انتخاب شده'})` : 'شارژ آنلاین کیف پول'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">تاریخ و زمان پردازش:</span>
                <span className="text-slate-300">{getJalaliNow()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span>بازگشت به داشبورد</span>
              </button>
            </div>
          </div>
        )}

        {/* FAILURE STATE */}
        {!isLoading && !result?.success && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Error Banner */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center text-red-400 shadow-lg shadow-red-500/20">
                <XCircle className="h-8 w-8 animate-in zoom-in" />
              </div>
              <h2 className="text-lg font-black text-red-400">پرداخت ناموفق بود</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result?.error || 'پرداخت توسط کاربر لغو گردید یا تراکنش در درگاه بانکی با خطا مواجه شد.'}
              </p>
            </div>

            {/* Error Notice Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>توجه در صورت کسر وجه از حساب:</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                چنانچه مبلغی از حساب شما کسر شده باشد، طبق قوانین شبکه شتاب حداکثر ظرف مدت ۷۲ ساعت کاری به صورت خودکار توسط بانک به حساب شما بازگردانده خواهد شد.
              </p>
            </div>

            {/* Details Card */}
            {authority && (
              <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">شناسه اتوریتی:</span>
                  <span className="font-mono text-slate-400 text-[11px] dir-ltr">{authority}</span>
                </div>
                {result?.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">مبلغ درخواستی:</span>
                    <span className="font-bold text-slate-300">{Number(result.amount).toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                <span>بازگشت به داشبورد</span>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>تلاش مجدد جهت پرداخت</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
          سامانه هوشمند مگاکارت • پشتیبانی درگاه آنلاین زرین‌پال
        </div>

      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
        در حال بارگذاری صفحه تایید پرداخت...
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
