'use client';

import React, { useState } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, CreditCard, Plus, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Upload, ShieldCheck } from 'lucide-react';
import { Wallet, WalletTransaction, dbService, toJalaliDate } from '../../lib/directus';

export interface CustomerWalletViewProps {
  user: any;
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  bankCardInfo?: { bank_card?: string; bank_name?: string };
  onRefreshWallet: () => void;
}

export function CustomerWalletView({
  user,
  wallet,
  transactions,
  bankCardInfo,
  onRefreshWallet
}: CustomerWalletViewProps) {
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'card_to_card'>('online');
  const [chargeAmount, setChargeAmount] = useState<number>(100000);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [refIdInput, setRefIdInput] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  const presetAmounts = [50000, 100000, 250000, 500000, 1000000];

  const currentBalance = wallet?.balance || 0;
  const walletStatus = wallet?.status || 'active';

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setActionError('حجم تصویر فیش نباید بیشتر از ۵ مگابایت باشد.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      setActionError('اطلاعات کیف پول یافت نشد.');
      return;
    }

    const finalAmount = customAmountInput ? parseInt(customAmountInput, 10) : chargeAmount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setActionError('لطفاً مبلغ معتبری برای شارژ وارد کنید.');
      return;
    }

    if (finalAmount < 10000) {
      setActionError('حداقل مبلغ شارژ ۱۰,۰۰۰ تومان می‌باشد.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (paymentMethod === 'online') {
        // Zarinpal Real Online Gateway Redirect
        const res = await fetch('/api/payment/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalAmount,
            description: `شارژ آنلاین کیف پول - ${user?.name || user?.email || 'کاربر مگاکارت'}`,
            user_id: user?.id,
            tenant_id: user?.tenant_id || null,
            payment_type: 'wallet',
            wallet_id: wallet.id,
            email: user?.email,
            mobile: user?.phone
          })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'خطا در برقراری ارتباط با درگاه زرین‌پال');
        }

        if (json.url) {
          setActionSuccess('در حال انتقال به درگاه پرداخت امن زرین‌پال...');
          window.location.href = json.url;
          return;
        } else {
          throw new Error('آدرس انتقال به درگاه زرین‌پال دریافت نشد.');
        }
      } else {
        // Card to card (Offline pending review)
        if (!refIdInput.trim()) {
          setActionError('لطفاً شماره فیش / کد پیگیری تراکنش کارت به کارت را وارد کنید.');
          setIsSubmitting(false);
          return;
        }
        await dbService.createWalletTransaction({
          wallet_id: wallet.id,
          type: 'credit',
          amount: finalAmount,
          reference_id: `C2C-${refIdInput.trim()}`,
          status: 'pending'
        });
        setActionSuccess('درخواست شارژ کارت به کارت با موفقیت ثبت شد و پس از بررسی و تایید مدیریت، کیف پول شما شارژ خواهد شد.');
        setRefIdInput('');
        setReceiptImage(null);
        setCustomAmountInput('');
        setIsChargeModalOpen(false);
        onRefreshWallet();
      }
    } catch (err: any) {
      setActionError(err.message || 'خطا در ثبت شارژ کیف پول.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-blue-400" />
            <span>کیف پول و اعتبار حساب</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            موجودی کیف پول خود را شارژ کرده و با سرعت بالا برای خرید یا ارتقای اشتراک و خدمات استفاده کنید.
          </p>
        </div>
        <button
          onClick={onRefreshWallet}
          className="self-start md:self-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>بروزرسانی موجودی</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Display Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 border border-blue-900/30 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>

          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                <WalletIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">موجودی فعلی کیف پول</span>
                <span className="text-[10px] text-slate-500">کیف پول دیجیتال مگاکارت</span>
              </div>
            </div>

            {/* Wallet Status Badge */}
            <div className="z-10">
              {walletStatus === 'active' && (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  فعال
                </span>
              )}
              {walletStatus === 'frozen' && (
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  معلق
                </span>
              )}
              {walletStatus === 'blocked' && (
                <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400"></span>
                  مسدود
                </span>
              )}
            </div>
          </div>

          <div className="my-6 z-10 flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tight">
              {(currentBalance).toLocaleString('fa-IR')}
            </span>
            <span className="text-sm font-bold text-blue-400">تومان</span>
          </div>

          <div className="pt-4 border-t border-slate-800/80 z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>پرداخت امن و سریع در تمام بخش‌های سامانه</span>
            </div>
            <button
              onClick={() => setIsChargeModalOpen(true)}
              disabled={walletStatus !== 'active'}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>شارژ کیف پول</span>
            </button>
          </div>
        </div>

        {/* Quick Usage Guide Card */}
        <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-purple-400" />
              <span>مزایای کیف پول</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                <span>فعال‌سازی آنی اشتراک‌ها بدون نیاز به تایید دستی.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                <span>جلوگیری از قطع خدمات هنگام انقضای پلن‌ها.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                <span>ثبت دقیق تمام تراکنش‌ها و شفافیت مالی.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-850 text-[11px] text-slate-400">
            برای شارژ آنلاین می‌توانید از درگاه شتابی زرین‌پال یا واریز کارت به کارت استفاده نمایید.
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div>
            <h3 className="font-bold text-white text-base">تاریخچه تراکنش‌های کیف پول</h3>
            <p className="text-xs text-slate-400 mt-0.5">ریز واریزها و برداشت‌های انجام شده از حساب شما</p>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition ${filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              همه ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1 rounded-lg font-bold transition ${filterType === 'credit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              واریزها
            </button>
            <button
              onClick={() => setFilterType('debit')}
              className={`px-3 py-1 rounded-lg font-bold transition ${filterType === 'debit' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              برداشت‌ها
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            هیچ تراکنشی در این بخش یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 text-[11px]">
                  <th className="py-3 px-3">نوع تراکنش</th>
                  <th className="py-3 px-3">مبلغ (تومان)</th>
                  <th className="py-3 px-3">موجودی پس از تراکنش</th>
                  <th className="py-3 px-3">شناسه پیگیری</th>
                  <th className="py-3 px-3">وضعیت</th>
                  <th className="py-3 px-3">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id || idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-3">
                      {tx.type === 'credit' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                          <ArrowDownLeft className="h-3.5 w-3.5 bg-emerald-500/10 p-0.5 rounded" />
                          واریز به کیف پول
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
                          <ArrowUpRight className="h-3.5 w-3.5 bg-amber-500/10 p-0.5 rounded" />
                          برداشت / خرید خدمات
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">
                      {tx.type === 'credit' ? '+' : '-'}{(tx.amount).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      {(tx.balance_after || 0).toLocaleString('fa-IR')} تومان
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono dir-ltr text-right text-[11px]">
                      {tx.reference_id || '---'}
                    </td>
                    <td className="py-3.5 px-3">
                      {tx.status === 'completed' && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          موفق
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          در انتظار بررسی
                        </span>
                      )}
                      {(tx.status === 'failed' || tx.status === 'rejected') && (
                        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {tx.status === 'rejected' ? 'رد شده' : 'ناموفق'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                      {toJalaliDate(tx.date_created)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charge Modal */}
      {isChargeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsChargeModalOpen(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-400" />
                <span>شارژ کیف پول</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">مبلغ مورد نظر برای شارژ حساب خود را انتخاب کنید.</p>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${paymentMethod === 'online' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <CreditCard className="h-4 w-4" />
                <span>درگاه آنلاین (زرین‌پال)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card_to_card')}
                className={`py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${paymentMethod === 'card_to_card' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <WalletIcon className="h-4 w-4" />
                <span>کارت به کارت (آفلاین)</span>
              </button>
            </div>

            <form onSubmit={handleChargeSubmit} className="space-y-4">
              {/* Preset Amounts */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">انتخاب مبلغ آماده (تومان):</label>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setChargeAmount(amt);
                        setCustomAmountInput('');
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${chargeAmount === amt && !customAmountInput ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'}`}
                    >
                      {(amt).toLocaleString('fa-IR')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">یا ورود مبلغ دلخواه (تومان):</label>
                <input
                  type="number"
                  placeholder="مثال: ۱۵۰۰۰۰"
                  value={customAmountInput}
                  onChange={(e) => setCustomAmountInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {paymentMethod === 'card_to_card' && (
                <div className="space-y-3 pt-2 border-t border-slate-850">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1 text-xs">
                    <p className="text-blue-300 font-bold">شماره کارت جهت واریز:</p>
                    <p className="font-mono text-white dir-ltr text-right text-sm tracking-wider">{bankCardInfo?.bank_card || '۵۰۲۲-۲۹۱۰-۱۲۳۴-۵۶۷۸'}</p>
                    <p className="text-[11px] text-slate-400">به نام: {bankCardInfo?.bank_name || 'مگاکارت دیجیتال سیستم'}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">کد پیگیری یا شماره فیش واریزی:</label>
                    <input
                      type="text"
                      placeholder="مثال: ۹۸۷۶۵۴۳۲۱"
                      value={refIdInput}
                      onChange={(e) => setRefIdInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">تصویر فیش واریزی (اختیاری):</label>
                    <div className="flex items-center gap-3">
                      <label className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>انتخاب فایل فیش</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {receiptImage && <span className="text-xs text-emerald-400 font-bold">تصویر دریافت شد</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsChargeModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>در حال پردازش...</span>
                    </>
                  ) : (
                    <span>{paymentMethod === 'online' ? 'اتصال به درگاه آنلاین' : 'ثبت درخواست شارژ'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
