'use client';

import React, { useState } from 'react';
import { Plus, Sliders, Save, Trash2, Check, RefreshCw, X, Shield, Globe, Award } from 'lucide-react';
import { Plan, Template, dbService, toUUID } from '../../lib/directus';

export interface AdminPlansViewProps {
  user: any;
  plans: Plan[];
  templates: Template[];
  refreshData: () => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function AdminPlansView({
  user,
  plans,
  templates,
  refreshData,
  showToast
}: AdminPlansViewProps) {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const [search, setSearch] = useState('');

  const handleStartEdit = (plan: Plan) => {
    setEditingPlan({ ...plan });
    const feats = Array.isArray(plan.features) ? plan.features.join('\n') : '';
    setFeaturesText(feats);
  };

  const handleStartCreate = () => {
    const newPlan: Plan = {
      id: crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`,
      title: 'پلن جدید مگاکارت',
      price: 290000,
      duration_days: 365,
      features: [
        'کارت ویزیت اختصاصی دیجیتال',
        'گالری تصاویر و بنر',
        'کد QR هوشمند اختصاصی',
        'دانلود فایل مخاطب vCard'
      ],
      is_active: true,
      max_cards: 1,
      allowed_templates: templates.map(t => t.id),
      custom_domain: false,
      remove_branding: false
    };
    setEditingPlan(newPlan);
    setFeaturesText(newPlan.features.join('\n'));
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    if (!editingPlan.title.trim()) {
      showToast?.('لطفاً عنوان پلن را وارد کنید.', 'error');
      return;
    }

    setSaving(true);
    try {
      const parsedFeatures = featuresText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const planToSave: Plan = {
        ...editingPlan,
        features: parsedFeatures
      };

      await dbService.savePlan(planToSave);
      showToast?.('پلن با موفقیت در پایگاه داده مگاکارت ذخیره شد.', 'success');
      setEditingPlan(null);
      await refreshData();
    } catch (err: any) {
      console.error('Error saving plan:', err);
      showToast?.(err.message || 'خطا در ذخیره‌سازی پلن', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('آیا از حذف این پلن مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) return;
    setSaving(true);
    try {
      await dbService.deletePlan(planId);
      showToast?.('پلن با موفقیت حذف شد.', 'success');
      await refreshData();
    } catch (err: any) {
      console.error('Error deleting plan:', err);
      showToast?.(err.message || 'خطا در حذف پلن', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredPlans = plans.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-500" />
            <span>مدیریت داینامیک پلن‌های اشتراک مگاکارت</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تعریف، قیمت‌گذاری و ویرایش کامل مشخصات پلن‌ها در سراسر پلتفرم و لندینگ پیج اصلی.
          </p>
        </div>

        {!editingPlan && (
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>تعریف پلن تعرفه‌ای جدید</span>
          </button>
        )}
      </div>

      {editingPlan ? (
        /* Edit / Create Form */
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-6 max-w-3xl mx-auto text-xs">
          <div className="flex items-center justify-between border-b border-slate-850 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-500" />
              <span>{editingPlan.id.startsWith('p-') ? 'ویرایش پلن اشتراک' : 'تعریف پلن جدید'}</span>
            </h3>
            <button 
              onClick={() => setEditingPlan(null)}
              className="p-1 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-300">عنوان پلن (نمایشی در سایت):</label>
              <input 
                type="text"
                required
                value={editingPlan.title}
                onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                placeholder="مثال: پلن طلایی سالانه"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">قیمت به تومان (۰ = رایگان):</label>
              <input 
                type="number"
                value={editingPlan.price}
                onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">مدت اعتبار (روز - ۱- برای نامحدود):</label>
              <input 
                type="number"
                value={editingPlan.duration_days}
                onChange={(e) => setEditingPlan({ ...editingPlan, duration_days: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">سقف ساخت کارت (۱- برای نامحدود):</label>
              <input 
                type="number"
                value={editingPlan.max_cards ?? -1}
                onChange={(e) => setEditingPlan({ ...editingPlan, max_cards: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">وضعیت در لندینگ و پرتال:</label>
              <select
                value={editingPlan.is_active ? 'true' : 'false'}
                onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.value === 'true' })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="true">فعال (قابل خرید توسط کاربران)</option>
                <option value="false">غیرفعال (مخفی در پرتال)</option>
              </select>
            </div>
          </div>

          {/* Special Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <input 
                type="checkbox"
                checked={Boolean(editingPlan.custom_domain)}
                onChange={(e) => setEditingPlan({ ...editingPlan, custom_domain: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-500"
              />
              <div>
                <span className="font-bold text-white block">پشتیبانی از دامنه اختصاصی</span>
                <span className="text-[10px] text-slate-400">امکان اتصال دامنه شخصی به کارت</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <input 
                type="checkbox"
                checked={Boolean(editingPlan.remove_branding)}
                onChange={(e) => setEditingPlan({ ...editingPlan, remove_branding: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-500"
              />
              <div>
                <span className="font-bold text-white block">حذف کپی‌رایت و لوگوی مگاکارت</span>
                <span className="text-[10px] text-slate-400">حذف عبارات برند مگاکارت از پایین کارت</span>
              </div>
            </label>
          </div>

          {/* Features Editor */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span>ویژگی‌های پلن (هر ویژگی در یک خط جداگانه):</span>
              <span className="text-[10px] text-slate-400 font-normal">تعداد خطوط: {featuresText.split('\n').filter(Boolean).length}</span>
            </label>
            <textarea
              rows={5}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={'کارت ویزیت دیجیتال اختصاصی\nپشتیبانی آنلاین تیکتی\nامکان آپلود ویدیو و بنر'}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Template Permissions */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 block">قالب‌های مجاز برای این پلن:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {templates.map((temp) => {
                const isSelected = Array.isArray(editingPlan.allowed_templates) && 
                  editingPlan.allowed_templates.some(t => toUUID(typeof t === 'object' ? t.id : t) === toUUID(temp.id));
                
                return (
                  <button
                    key={temp.id}
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(editingPlan.allowed_templates) ? [...editingPlan.allowed_templates] : [];
                      let updated: string[];
                      if (isSelected) {
                        updated = current.filter(t => toUUID(typeof t === 'object' ? t.id : t) !== toUUID(temp.id));
                      } else {
                        updated = [...current.map(t => typeof t === 'object' ? t.id : t), temp.id];
                      }
                      setEditingPlan({ ...editingPlan, allowed_templates: updated });
                    }}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between gap-2 ${
                      isSelected 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{temp.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-850">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>ذخیره تغییرات پلن</span>
            </button>

            <button
              onClick={() => setEditingPlan(null)}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-800 transition"
            >
              لغو
            </button>
          </div>
        </div>
      ) : (
        /* Plans Grid / List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between gap-5 transition ${
                plan.is_active ? 'border-slate-850 hover:border-amber-500/40' : 'border-red-900/30 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base">{plan.title}</h3>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      اعتبار: {Number(plan.duration_days) === -1 ? 'نامحدود (دائمی)' : `${plan.duration_days} روز`} | سقف کارت: {Number(plan.max_cards) === -1 ? 'نامحدود' : `${plan.max_cards} عدد`}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black shrink-0 ${
                    plan.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {plan.is_active ? 'فعال در پلتفرم' : 'غیرفعال'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">قیمت فروش:</span>
                  <div>
                    {plan.price === 0 ? (
                      <span className="text-base font-black text-emerald-400">رایگان</span>
                    ) : (
                      <span className="text-lg font-black text-amber-400">
                        {plan.price.toLocaleString('fa-IR')} <span className="text-xs text-slate-400 font-semibold">تومان</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">ویژگی‌های پلن ({plan.features?.length || 0}):</span>
                  <ul className="space-y-1 text-slate-300 text-xs">
                    {(plan.features || []).slice(0, 4).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                    {(plan.features?.length || 0) > 4 && (
                      <li className="text-[10px] text-slate-500 font-bold">
                        + {(plan.features?.length || 0) - 4} مورد دیگر ...
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-900">
                <button
                  onClick={() => handleStartEdit(plan)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 text-amber-400 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>ویرایش پلن</span>
                </button>

                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 rounded-xl transition"
                  title="حذف پلن"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
