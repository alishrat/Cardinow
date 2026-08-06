'use client';

import React, { useState } from 'react';
import { Wallet as WalletIcon, Search, Plus, Minus, CheckCircle2, XCircle, Clock, ShieldCheck, RefreshCw, AlertTriangle, Key, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Wallet, WalletTransaction, dbService, toJalaliDate } from '../../lib/directus';

export interface AdminWalletsViewProps {
  wallets: Wallet[];
  transactions: WalletTransaction[];
  zarinpalMerchant: string;
  onRefreshData: () => void;
}

export function AdminWalletsView({
  wallets,
  transactions,
  zarinpalMerchant,
  onRefreshData
}: AdminWalletsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen' | 'blocked'>('all');
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [merchantInput, setMerchantInput] = useState<string>(zarinpalMerchant || '');
  const [isSavingMerchant, setIsSavingMerchant] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  const pendingTxs = transactions.filter(t => t.status === 'pending');

  const filteredWallets = wallets.filter(w => {
    const matchSearch =
      (w.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.user_phone || '').includes(searchTerm);
    if (!matchSearch) return false;
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    return true;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amountNum = parseInt(adjustAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setActionError('لطفاً مبلغ معتبری وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await dbService.adminAdjustWallet(
        selectedWallet.id,
        adjustType,
        amountNum,
        adjustReason ? `مدیریت: ${adjustReason}` : 'شارژ/کسر دستی توسط مدیر'
      );
      setActionSuccess(`حساب کاربر با موفقیت ${adjustType === 'credit' ? 'شارژ' : 'بدهکار'} شد.`);
      setIsAdjustModalOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
      setSelectedWallet(null);
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || 'خطا در شارژ/کسر دستی.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (walletId: number | string, newStatus: 'active' | 'frozen' | 'blocked') => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await dbService.adminUpdateWalletStatus(walletId, newStatus);
      setActionSuccess('وضعیت کیف پول با موفقیت بروزرسانی شد.');
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || 'خطا در تغییر وضعیت کیف پول.');
    }
  };

  const handleProcessTransaction = async (tx: WalletTransaction, approve: boolean) => {
    if (!tx.id) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await dbService.updateWalletTransactionStatus(
        tx.id,
        tx.wallet_id,
        approve ? 'completed' : 'rejected'
      );
      setActionSuccess(approve ? 'تراکنش با موفقیت تایید و کیف پول کاربر شارژ گردید.' : 'تراکنش رد شد.');
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || 'خطا در پردازش تراکنش.');
    }
  };

  const handleSaveMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMerchant(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await dbService.saveZarinpalMerchant(merchantInput.trim());
      setActionSuccess('کلید مرچنت زرین‌پال با موفقیت ذخیره شد.');
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || 'خطا در ذخیره مرچنت زرین‌پال.');
    } finally {
      setIsSavingMerchant(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-amber-400" />
            <span>مدیریت کیف‌پول‌های کاربران و امور مالی</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده موجودی کاربران، شارژ و کسر دستی اعتبار، بررسی درخواست‌های واریز و پیکربندی درگاه.
          </p>
        </div>

        <button
          onClick={onRefreshData}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>بروزرسانی داده‌ها</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block">تعداد کیف‌پول‌ها</span>
            <span className="text-2xl font-black text-white mt-1 block">{(wallets.length).toLocaleString('fa-IR')}</span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <WalletIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block">مجموع موجودی پلتفرم</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">{(totalBalance).toLocaleString('fa-IR')}</span>
              <span className="text-xs font-bold text-slate-400">تومان</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block">درخواست‌های در انتظار تایید</span>
            <span className={`text-2xl font-black mt-1 block ${pendingTxs.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
              {(pendingTxs.length).toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Pending Transactions Section (if any) */}
      {pendingTxs.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Clock className="h-5 w-5" />
            <span>درخواست‌های شارژ کیف پول در انتظار تایید ({pendingTxs.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-amber-900/40 text-amber-300 text-[11px]">
                  <th className="py-2.5 px-3">شناسه / پیگیری</th>
                  <th className="py-2.5 px-3">کاربر</th>
                  <th className="py-2.5 px-3">مبلغ (تومان)</th>
                  <th className="py-2.5 px-3">تاریخ</th>
                  <th className="py-2.5 px-3 text-center">عملیات تایید / رد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/30 text-slate-300">
                {pendingTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-amber-900/10 transition">
                    <td className="py-3 px-3 font-mono text-amber-200 dir-ltr text-right">{tx.reference_id || '---'}</td>
                    <td className="py-3 px-3 font-bold text-white">{tx.user_name || tx.user_email || 'کاربر سیستم'}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{(tx.amount).toLocaleString('fa-IR')}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">{toJalaliDate(tx.date_created)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleProcessTransaction(tx, true)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>تایید و شارژ</span>
                        </button>
                        <button
                          onClick={() => handleProcessTransaction(tx, false)}
                          className="px-3 py-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white font-bold rounded-lg text-xs transition flex items-center gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>رد</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Users Wallets Table Section */}
      <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div>
            <h3 className="font-bold text-white text-base">لیست کیف‌پول‌های کاربران</h3>
            <p className="text-xs text-slate-400 mt-0.5">مدیریت اعتبار و تغییر وضعیت کیف پول کاربران</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجو با نام، ایمیل یا موبایل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="frozen">معلق</option>
              <option value="blocked">مسدود</option>
            </select>
          </div>
        </div>

        {filteredWallets.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            هیچ کیف پولی مطابق با جستجو یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 text-[11px]">
                  <th className="py-3 px-3">نام و مشخصات کاربر</th>
                  <th className="py-3 px-3">ایمیل / موبایل</th>
                  <th className="py-3 px-3">موجودی (تومان)</th>
                  <th className="py-3 px-3">وضعیت</th>
                  <th className="py-3 px-3 text-center">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredWallets.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-white block">{w.user_name || 'کاربر سیستم'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {w.user_id}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      <div>{w.user_email || '---'}</div>
                      <div className="text-[11px] text-slate-500">{w.user_phone || ''}</div>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400 text-sm">
                      {(w.balance || 0).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3.5 px-3">
                      {w.status === 'active' && <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">فعال</span>}
                      {w.status === 'frozen' && <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-lg border border-amber-500/20">معلق</span>}
                      {w.status === 'blocked' && <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20">مسدود</span>}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedWallet(w);
                            setIsAdjustModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>شارژ / کسر دستی</span>
                        </button>

                        <select
                          value={w.status}
                          onChange={(e: any) => handleStatusChange(w.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2 py-1 text-[11px] focus:outline-none focus:border-amber-500"
                        >
                          <option value="active">فعال‌سازی</option>
                          <option value="frozen">تعلیق</option>
                          <option value="blocked">مسدودسازی</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gateway Configuration (Zarinpal) */}
      <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-850 pb-3">
          <Key className="h-5 w-5 text-amber-400" />
          <span>پیکربندی درگاه پرداخت زرین‌پال (Zarinpal Merchant)</span>
        </div>

        <form onSubmit={handleSaveMerchant} className="flex flex-col md:flex-row items-end gap-3">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-semibold text-slate-300">کلید مرچنت زرین‌پال (Merchant ID):</label>
            <input
              type="text"
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              value={merchantInput}
              onChange={(e) => setMerchantInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono dir-ltr placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingMerchant}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSavingMerchant ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>ذخیره مرچنت</span>}
          </button>
        </form>
      </div>

      {/* Manual Adjust Modal */}
      {isAdjustModalOpen && selectedWallet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsAdjustModalOpen(false);
                setSelectedWallet(null);
              }}
              className="absolute top-5 left-5 text-slate-400 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <WalletIcon className="h-5 w-5 text-amber-400" />
                <span>شارژ یا کسر دستی اعتبار</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                کاربر: <span className="text-white font-bold">{selectedWallet.user_name || selectedWallet.user_email}</span>
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${adjustType === 'credit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Plus className="h-4 w-4" />
                  <span>افزایش / شارژ (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${adjustType === 'debit' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Minus className="h-4 w-4" />
                  <span>کاهش / کسر (-)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">مبلغ به تومان:</label>
                <input
                  type="number"
                  placeholder="مثال: ۵۰۰۰۰۰"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">توضیحات / بابت (اختیاری):</label>
                <input
                  type="text"
                  placeholder="مثال: بابت هدیه ثبت‌نام یا واریز کارت به کارت"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustModalOpen(false);
                    setSelectedWallet(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>ثبت تراکنش</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
