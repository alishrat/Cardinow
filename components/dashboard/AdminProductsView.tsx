'use client';

import React, { useState } from 'react';
import { Plus, Save, Trash2, Check, RefreshCw, X, ShoppingBag, Tag, Image, DollarSign, Database, Info, Edit3 } from 'lucide-react';
import { ProductService, dbService, toPersianDigits } from '../../lib/directus';

export interface AdminProductsViewProps {
  user: any;
  products: ProductService[];
  refreshData: () => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function AdminProductsView({
  user,
  products,
  refreshData,
  showToast
}: AdminProductsViewProps) {
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showDirectusInfo, setShowDirectusInfo] = useState(false);

  const handleStartEdit = (prod: ProductService) => {
    setEditingProduct({ ...prod });
  };

  const handleStartCreate = () => {
    const newProd: ProductService = {
      id: crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
      name: 'محصول / خدمت جدید',
      description: 'توضیحات تکمیلی محصول یا خدمت جدید...',
      price: 250000,
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
      is_active: true,
      type: 'product'
    };
    setEditingProduct(newProd);
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      showToast?.('لطفاً عنوان محصول یا خدمت را وارد کنید.', 'error');
      return;
    }

    setSaving(true);
    try {
      await dbService.saveProduct(editingProduct);
      showToast?.('محصول/خدمت با موفقیت ذخیره شد.', 'success');
      setEditingProduct(null);
      await refreshData();
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast?.(err.message || 'خطا در ذخیره‌سازی محصول', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این محصول/خدمت مطمئن هستید؟')) return;
    setSaving(true);
    try {
      await dbService.deleteProduct(id);
      showToast?.('محصول/خدمت با موفقیت حذف شد.', 'success');
      await refreshData();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showToast?.(err.message || 'خطا در حذف محصول', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                مدیریت محصولات و خدمات قابل خرید
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تعریف کارت‌های هوشمند فیزیکی، تجهیزات NFC و خدمات جانبی جهت خرید توسط کاربران
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDirectusInfo(!showDirectusInfo)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>راهنمای دایرکتوس</span>
            </button>

            <button
              onClick={handleStartCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن محصول / خدمت جدید</span>
            </button>
          </div>
        </div>

        {/* Directus Schema Guide Toggle */}
        {showDirectusInfo && (
          <div className="mt-4 p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl text-xs space-y-3 text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Info className="w-4 h-4" />
              <span>مشخصات ساخت کالکشن در Directus (برای ادمین)</span>
            </div>
            <p className="text-slate-400">
              برای هماهنگی با دایرکتوس، یک کالکشن جدید با نام <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-mono">products</code> بپازید و فیلدهای زیر را در آن ایجاد کنید:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">id</span> (UUID - Primary Key)
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">name</span> (String - نام محصول)
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">description</span> (Text - توضیحات)
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">price</span> (Integer - قیمت به تومان)
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">image</span> (String - لینک تصویر)
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">is_active</span> (Boolean - فعال/غیرفعال)
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">type</span> (String - product / service)
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">tenant_id</span> (String - آیدی نماینده)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو در نام و توضیحات..."
          className="w-full max-w-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
        <div className="text-xs text-slate-400">
          مجموع: <span className="font-bold text-emerald-400">{toPersianDigits(filteredProducts.length)}</span> آیتم
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(prod => (
          <div
            key={prod.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition flex flex-col justify-between"
          >
            <div>
              {/* Product Image */}
              <div className="h-36 bg-slate-950 relative overflow-hidden group">
                {prod.image ? (
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover transition transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Image className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    prod.type === 'service' 
                      ? 'bg-purple-500/80 text-white' 
                      : 'bg-emerald-500/80 text-white'
                  }`}>
                    {prod.type === 'service' ? 'خدمت' : 'محصول فیزیکی'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    prod.is_active 
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-950/90 text-rose-300 border border-rose-500/30'
                  }`}>
                    {prod.is_active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-white text-sm line-clamp-1">{prod.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[36px]">
                  {prod.description || 'بدون توضیح'}
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">قیمت:</span>
                  <span className="text-sm font-black text-emerald-400">
                    {toPersianDigits(prod.price.toLocaleString())} <span className="text-[10px] font-normal text-slate-400">تومان</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Product Actions */}
            <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleStartEdit(prod)}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>ویرایش</span>
              </button>

              <button
                onClick={() => handleDelete(prod.id)}
                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-lg transition"
                title="حذف محصول"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm">هیچ محصول یا خدماتی یافت نشد.</p>
        </div>
      )}

      {/* Edit / Create Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <span>ویرایش / افزودن محصول و خدمت</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Type & Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">نوع آیتم</label>
                  <select
                    value={editingProduct.type || 'product'}
                    onChange={e => setEditingProduct({ ...editingProduct, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="product">محصول فیزیکی (NFC/کارت)</option>
                    <option value="service">خدمت جانبی (عکاسی/طراحی)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">وضعیت نمایش</label>
                  <button
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, is_active: !editingProduct.is_active })}
                    className={`w-full py-2 px-3 rounded-xl font-bold border text-center transition ${
                      editingProduct.is_active
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    {editingProduct.is_active ? 'فعال (قابل خرید)' : 'غیرفعال (مخفی)'}
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نام محصول / خدمت</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="مثلاً کارت NFC هوشمند چوبی"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">قیمت (تومان)</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="350000"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">لینک تصویر (URL)</label>
                <input
                  type="text"
                  value={editingProduct.image || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 dir-ltr text-left font-mono"
                  placeholder="https://..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">توضیحات</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="توضیحات مشخصات فنی، تراشه و ویژگی‌ها..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
