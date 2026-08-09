'use client';

import React, { useState, useRef } from 'react';
import { Plus, Save, Trash2, RefreshCw, X, ShoppingBag, Image as ImageIcon, Edit3, Upload, Check } from 'lucide-react';
import { ProductService, dbService, toPersianDigits, getImageUrl } from '../../lib/directus';

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (prod: ProductService) => {
    setEditingProduct({ ...prod });
  };

  const handleStartCreate = () => {
    const newProd: ProductService = {
      id: crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      image: '',
      is_active: true,
      type: 'product'
    };
    setEditingProduct(newProd);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    if (!file.type.startsWith('image/')) {
      showToast?.('لطفاً یک فایل تصویری معتبر انتخاب کنید.', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const fileId = await dbService.uploadFile(file);
      setEditingProduct({
        ...editingProduct,
        image: fileId
      });
      showToast?.('تصویر محصول با موفقیت آپلود شد.', 'success');
    } catch (err: any) {
      console.error('Error uploading product image:', err);
      showToast?.(err.message || 'خطا در آپلود تصویر', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      {/* Top Banner & Actions */}
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

          <button
            onClick={handleStartCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن محصول / خدمت جدید</span>
          </button>
        </div>
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
              <div className="h-40 bg-slate-950 relative overflow-hidden group">
                {prod.image ? (
                  <img
                    src={getImageUrl(prod.image)}
                    alt={prod.name}
                    className="w-full h-full object-cover transition transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-1">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[10px]">بدون تصویر</span>
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
                <h3 className="font-bold text-white text-sm line-clamp-1">{prod.name || 'بدون عنوان'}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[36px]">
                  {prod.description || 'بدون توضیح'}
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">قیمت:</span>
                  <span className="text-sm font-black text-emerald-400">
                    {toPersianDigits((prod.price || 0).toLocaleString())} <span className="text-[10px] font-normal text-slate-400">تومان</span>
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
          <p className="text-sm">هیچ محصول یا خدماتی در پایگاه داده ثبت نشده است.</p>
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
                <label className="block text-slate-300 font-semibold mb-1">نام محصول / خدمت *</label>
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
                  value={editingProduct.price || 0}
                  onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="350000"
                />
              </div>

              {/* Image Upload (File Only) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">تصویر محصول / خدمت</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                  {editingProduct.image ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-800 group">
                      <img
                        src={getImageUrl(editingProduct.image)}
                        alt="تصویر محصول"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>تغییر تصویر</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 py-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-400">تصویری انتخاب نشده است.</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs rounded-xl transition inline-flex items-center gap-2"
                      >
                        {uploadingImage ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                            <span>در حال آپلود در دایرکتوس...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>انتخاب و آپلود تصویر</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
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
                disabled={saving || uploadingImage}
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
