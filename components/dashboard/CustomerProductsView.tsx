'use client';

import React, { useState } from 'react';
import { ShoppingBag, Check, CreditCard, Wallet as WalletIcon, RefreshCw, Sparkles, Send, PhoneCall, ShieldCheck, Tag } from 'lucide-react';
import { ProductService, Wallet, dbService, toPersianDigits } from '../../lib/directus';

export interface CustomerProductsViewProps {
  user: any;
  products: ProductService[];
  userWallet: Wallet | null;
  refreshData: () => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  setActiveTab?: (tab: string) => void;
}

export function CustomerProductsView({
  user,
  products,
  userWallet,
  refreshData,
  showToast,
  setActiveTab
}: CustomerProductsViewProps) {
  const [buyingProd, setBuyingProd] = useState<ProductService | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderAddress, setOrderAddress] = useState('');
  const [orderPhone, setOrderPhone] = useState('');

  const activeProducts = products.filter(p => p.is_active);

  const handlePurchaseWithWallet = async () => {
    if (!buyingProd) return;
    if (!userWallet || userWallet.balance < buyingProd.price) {
      showToast?.('موجودی کیف پول شما برای این خرید کافی نیست. لطفاً ابتدا کیف پول خود را شارژ کنید.', 'error');
      if (setActiveTab) setActiveTab('wallet');
      return;
    }

    if (!orderPhone.trim()) {
      showToast?.('لطفاً شماره تماس جهت هماهنگی را وارد کنید.', 'error');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create wallet debit transaction (createWalletTransaction updates wallet balance automatically)
      await dbService.createWalletTransaction({
        wallet_id: userWallet.id,
        type: 'debit',
        amount: buyingProd.price,
        reference_id: `PROD-ORDER-${Date.now()}`,
        status: 'completed'
      });

      // Save a transaction record for admin audit
      await dbService.saveTransaction({
        id: crypto.randomUUID ? crypto.randomUUID() : `tx-prod-${Date.now()}`,
        user_id: user?.id,
        amount: buyingProd.price,
        gateway: 'کیف پول سیستم',
        authority: `PROD-${buyingProd.id}`,
        ref_id: `ORDER-${Date.now().toString().slice(-6)}`,
        status: 'success',
        created_at: new Date().toISOString(),
        payload: {
          product_id: buyingProd.id,
          product_name: buyingProd.name,
          phone: orderPhone,
          address: orderAddress
        }
      });

      showToast?.(`سفارش "${buyingProd.name}" با موفقیت ثبت شد و مبلغ از کیف پول کسر گردید.`, 'success');
      setBuyingProd(null);
      await refreshData();
    } catch (err: any) {
      console.error('Purchase error:', err);
      showToast?.(err.message || 'خطا در ثبت سفارش', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/20 to-slate-900 border border-purple-500/20 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 text-purple-400 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                فروشگاه محصولات و خدمات فیزیکی مگاکارت
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                سفارش کارت‌های هوشمند NFC چوبی و فلزی، تجهیزات جانبی و خدمات اختصاصی برندینگ
              </p>
            </div>
          </div>

          {/* User Wallet Pill */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <WalletIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">موجودی کیف پول شما:</span>
              <span className="text-sm font-black text-emerald-400">
                {toPersianDigits((userWallet?.balance || 0).toLocaleString())} <span className="text-[10px] font-normal text-slate-400">تومان</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeProducts.map(prod => (
          <div
            key={prod.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/30 rounded-2xl overflow-hidden transition shadow-lg flex flex-col justify-between"
          >
            <div>
              {/* Image Banner */}
              <div className="h-44 bg-slate-950 relative overflow-hidden group">
                <img
                  src={prod.image || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80'}
                  alt={prod.name}
                  className="w-full h-full object-cover transition transform group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md ${
                    prod.type === 'service' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {prod.type === 'service' ? 'خدمت اختصاصی' : 'محصول NFC فیزیکی'}
                  </span>
                </div>
              </div>

              {/* Title & Desc */}
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-white text-base leading-snug">{prod.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[48px]">
                  {prod.description}
                </p>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">قیمت خرید:</span>
                  <span className="text-base font-black text-emerald-400">
                    {toPersianDigits(prod.price.toLocaleString())} <span className="text-[10px] font-normal text-slate-400">تومان</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800">
              <button
                onClick={() => {
                  setBuyingProd(prod);
                  setOrderPhone(user?.phone || user?.mobile || '');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>سفارش و خرید آنلاین</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Modal */}
      {buyingProd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <span>ثبت سفارش محصول/خدمت</span>
              </h3>
              <button
                onClick={() => setBuyingProd(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src={buyingProd.image || ''} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <h4 className="font-bold text-white text-xs">{buyingProd.name}</h4>
                <p className="text-emerald-400 font-bold text-xs mt-0.5">
                  مبلغ قابل پرداخت: {toPersianDigits(buyingProd.price.toLocaleString())} تومان
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">شماره تماس جهت هماهنگی *</label>
                <input
                  type="text"
                  value={orderPhone}
                  onChange={e => setOrderPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="09123456789"
                />
              </div>

              {buyingProd.type === 'product' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">آدرس دقیق پستی جهت ارسال</label>
                  <textarea
                    rows={2}
                    value={orderAddress}
                    onChange={e => setOrderAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="شهر، خیابان، پلاک، کد پستی..."
                  />
                </div>
              )}

              <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-white">
                  <span>موجودی کیف پول:</span>
                  <span className={userWallet && userWallet.balance >= buyingProd.price ? "text-emerald-400" : "text-rose-400"}>
                    {toPersianDigits((userWallet?.balance || 0).toLocaleString())} تومان
                  </span>
                </div>
                {userWallet && userWallet.balance < buyingProd.price && (
                  <p className="text-rose-400 text-[10px]">
                    ⚠️ موجودی کیف پول برای خرید این محصول کافی نیست.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setBuyingProd(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                انصراف
              </button>
              <button
                onClick={handlePurchaseWithWallet}
                disabled={processing}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>پرداخت و ثبت سفارش</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
