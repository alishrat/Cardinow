'use client';

import React from 'react';
import { 
  Plus, Palette, Save, Phone, MessageCircle, Send, Globe
} from 'lucide-react';
import { Template, dbService, toUUID } from '../../lib/directus';

export interface AdminTemplatesViewProps {
  user: any;
  templates: Template[];
  editingTemplate: Template | null;
  setEditingTemplate: (temp: Template | null) => void;
  refreshData: () => Promise<void>;
}

export function AdminTemplatesView({
  user,
  templates,
  editingTemplate,
  setEditingTemplate,
  refreshData
}: AdminTemplatesViewProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">مدیریت قالب‌های اختصاصی مگاکارت</h2>
          <p className="text-xs text-slate-400 mt-1">ایجاد و تنظیم قالب‌های کاملاً داینامیک بر اساس ساختار JSON Schema.</p>
        </div>
        {!editingTemplate && (
          <button
            onClick={() => {
              setEditingTemplate({
                id: crypto.randomUUID?.() || `temp-${Math.random().toString(36).substr(2, 9)}`,
                name: 'قالب جدید اختصاصی',
                slug: 'custom-new',
                is_premium: false,
                is_active: true,
                schema: {
                  theme: 'light',
                  colors: {
                    primary: '#8d5b4c',
                    secondary: '#f4ece1',
                    background: '#faf6f0',
                    text: '#2d221e',
                    text_secondary: '#6e5a53'
                  },
                  typography: {
                    font_family: 'Shabnam',
                    title_size: '20px',
                    body_size: '14px'
                  },
                  layout: {
                    avatar_shape: 'circle',
                    header_style: 'split',
                    social_icons_position: 'under-bio'
                  }
                }
              } as any);
            }}
            className="flex items-center gap-1.5 py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
          >
            <Plus className="h-4 w-4" />
            ایجاد قالب جدید داینامیک
          </button>
        )}
      </div>

      {/* Editing Form / Creator Form */}
      {editingTemplate ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Fields Editor */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800 flex justify-between items-center">
              <span>⚙️ مشخصات و پیکربندی قالب</span>
              <span className="text-[10px] text-amber-500 font-mono">ID: {editingTemplate.id}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">نام قالب فارسی</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">شناسه انگلیسی (slug)</label>
                <input
                  type="text"
                  value={editingTemplate.slug}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-left"
                />
              </div>
            </div>

            <div className="flex gap-6 py-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={editingTemplate.is_premium}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, is_premium: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span>قالب VIP / طلایی مخصوص کاربران ویژه</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={editingTemplate.is_active}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span>فعال و قابل انتخاب توسط کاربر</span>
              </label>
            </div>

            {/* SCHEMA CONTROLS */}
            <div className="border-t border-slate-800 pt-4 space-y-4">
              <h4 className="font-bold text-amber-500 flex items-center gap-1.5 text-xs">
                <Palette className="h-4 w-4" />
                تنظیمات استایل و زبان بصری قالب (Schema JSON)
              </h4>

              {/* Theme Choice */}
              <div>
                <label className="block text-slate-400 mb-1">تم پیش‌فرض قالب</label>
                <div className="flex gap-2">
                  {['light', 'dark'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const currentSchema = editingTemplate.schema || {};
                        setEditingTemplate({
                          ...editingTemplate,
                          schema: { ...currentSchema, theme: t } as any
                        });
                      }}
                      className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition ${
                        (editingTemplate.schema?.theme || 'light') === t
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'light' ? 'روشن (Light)' : 'تیره (Dark)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors Pickers */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">پالت رنگ اختصاصی قالب</span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">رنگ اصلی (Accent)</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="color"
                        value={editingTemplate.schema?.colors?.primary || '#8d5b4c'}
                        onChange={(e) => {
                          const s = editingTemplate.schema || {};
                          const c = s.colors || {};
                          setEditingTemplate({
                            ...editingTemplate,
                            schema: { ...s, colors: { ...c, primary: e.target.value } } as any
                          });
                        }}
                        className="h-8 w-8 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <span className="font-mono text-[9px] uppercase">{editingTemplate.schema?.colors?.primary || '#8D5B4C'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">رنگ فرعی (Accent 2)</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="color"
                        value={editingTemplate.schema?.colors?.secondary || '#f4ece1'}
                        onChange={(e) => {
                          const s = editingTemplate.schema || {};
                          const c = s.colors || {};
                          setEditingTemplate({
                            ...editingTemplate,
                            schema: { ...s, colors: { ...c, secondary: e.target.value } } as any
                          });
                        }}
                        className="h-8 w-8 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <span className="font-mono text-[9px] uppercase">{editingTemplate.schema?.colors?.secondary || '#F4ECE1'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">رنگ کل لندینگ</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="color"
                        value={editingTemplate.schema?.colors?.background || '#faf6f0'}
                        onChange={(e) => {
                          const s = editingTemplate.schema || {};
                          const c = s.colors || {};
                          setEditingTemplate({
                            ...editingTemplate,
                            schema: { ...s, colors: { ...c, background: e.target.value } } as any
                          });
                        }}
                        className="h-8 w-8 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <span className="font-mono text-[9px] uppercase">{editingTemplate.schema?.colors?.background || '#FAF6F0'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">رنگ متن اصلی</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="color"
                        value={editingTemplate.schema?.colors?.text || '#2d221e'}
                        onChange={(e) => {
                          const s = editingTemplate.schema || {};
                          const c = s.colors || {};
                          setEditingTemplate({
                            ...editingTemplate,
                            schema: { ...s, colors: { ...c, text: e.target.value } } as any
                          });
                        }}
                        className="h-8 w-8 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <span className="font-mono text-[9px] uppercase">{editingTemplate.schema?.colors?.text || '#2D221E'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">رنگ متن ثانویه</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="color"
                        value={editingTemplate.schema?.colors?.text_secondary || '#6e5a53'}
                        onChange={(e) => {
                          const s = editingTemplate.schema || {};
                          const c = s.colors || {};
                          setEditingTemplate({
                            ...editingTemplate,
                            schema: { ...s, colors: { ...c, text_secondary: e.target.value } } as any
                          });
                        }}
                        className="h-8 w-8 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <span className="font-mono text-[9px] uppercase">{editingTemplate.schema?.colors?.text_secondary || '#6E5A53'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography / Font Choice */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <div>
                  <label className="block text-slate-400 mb-1 text-[10px]">فونت اختصاصی قالب</label>
                  <select
                    value={editingTemplate.schema?.typography?.font_family || 'Shabnam'}
                    onChange={(e) => {
                      const s = editingTemplate.schema || {};
                      const t = s.typography || {};
                      setEditingTemplate({
                        ...editingTemplate,
                        schema: { ...s, typography: { ...t, font_family: e.target.value } } as any
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white focus:outline-none"
                  >
                    <option value="Shabnam">شبنم (Shabnam)</option>
                    <option value="Vazir">وزیر متن (Vazir)</option>
                    <option value="IranYekan">ایران یکان (IranYekan)</option>
                    <option value="Tahoma">تاهما (Tahoma)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[10px]">اندازه فونت عنوان</label>
                  <input
                    type="text"
                    value={editingTemplate.schema?.typography?.title_size || '20px'}
                    onChange={(e) => {
                      const s = editingTemplate.schema || {};
                      const t = s.typography || {};
                      setEditingTemplate({
                        ...editingTemplate,
                        schema: { ...s, typography: { ...t, title_size: e.target.value } } as any
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white focus:outline-none text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[10px]">اندازه فونت بدنه</label>
                  <input
                    type="text"
                    value={editingTemplate.schema?.typography?.body_size || '14px'}
                    onChange={(e) => {
                      const s = editingTemplate.schema || {};
                      const t = s.typography || {};
                      setEditingTemplate({
                        ...editingTemplate,
                        schema: { ...s, typography: { ...t, body_size: e.target.value } } as any
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white focus:outline-none text-center font-mono"
                  />
                </div>
              </div>

              {/* Layout */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <div>
                  <label className="block text-slate-400 mb-1 text-[10px]">شکل عکس آواتار</label>
                  <select
                    value={editingTemplate.schema?.layout?.avatar_shape || 'circle'}
                    onChange={(e) => {
                      const s = editingTemplate.schema || {};
                      const l = s.layout || {};
                      setEditingTemplate({
                        ...editingTemplate,
                        schema: { ...s, layout: { ...l, avatar_shape: e.target.value } } as any
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white focus:outline-none"
                  >
                    <option value="circle">دایره‌ای (Circle)</option>
                    <option value="square">گوشه‌گرد مربعی (Rounded Square)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[10px]">استایل هدر و منو</label>
                  <select
                    value={editingTemplate.schema?.layout?.header_style || 'split'}
                    onChange={(e) => {
                      const s = editingTemplate.schema || {};
                      const l = s.layout || {};
                      setEditingTemplate({
                        ...editingTemplate,
                        schema: { ...s, layout: { ...l, header_style: e.target.value } } as any
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white focus:outline-none"
                  >
                    <option value="split">دو ستونه افقی (Split UI)</option>
                    <option value="full">کامل عمودی متمرکز (Full Centered)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="py-2 px-4 bg-slate-950 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingTemplate.name || !editingTemplate.slug) {
                    alert('لطفا نام و شناسه انگلیسی قالب را پر کنید.');
                    return;
                  }
                  try {
                    await dbService.saveTemplate(editingTemplate);
                    await refreshData();
                    alert('قالب با موفقیت در پایگاه داده ذخیره شد!');
                    setEditingTemplate(null);
                  } catch (err: any) {
                    alert('خطا در ذخیره قالب: ' + err.message);
                  }
                }}
                className="py-2.5 px-6 bg-amber-600 hover:bg-amber-500 rounded-xl text-white transition font-bold flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>ذخیره نهایی قالب در سیستم</span>
              </button>
            </div>
          </div>

          {/* Right: Live Visual Preview */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center">💻 پیش‌نمایش زنده بصری قالب شما (Live Mockup)</span>
            {(() => {
              const tSchema = editingTemplate.schema || {};
              const isDarkTheme = tSchema.theme === 'dark';
              const pColor = tSchema.colors?.primary || '#8d5b4c';
              const sColor = tSchema.colors?.secondary || '#f4ece1';
              const bColor = tSchema.colors?.background || '#faf6f0';
              const txtColor = tSchema.colors?.text || '#2d221e';
              const txtSecColor = tSchema.colors?.text_secondary || '#6e5a53';
              const cardBg = isDarkTheme ? '#18181b' : '#ffffff';

              const isCircleAvatar = (tSchema.layout?.avatar_shape || 'circle') === 'circle';
              const isSplitHeader = tSchema.layout?.header_style === 'split';

              return (
                <div 
                  className="w-full max-w-[320px] mx-auto rounded-[40px] border-4 border-slate-800 bg-slate-950 p-3.5 shadow-2xl overflow-hidden aspect-[9/16] flex flex-col justify-between"
                >
                  <div 
                    className="w-full h-full rounded-[28px] overflow-hidden p-4 space-y-4 text-right flex flex-col justify-between"
                    style={{ 
                      backgroundColor: cardBg, 
                      color: txtColor,
                      fontFamily: tSchema.typography?.font_family || 'iranyekan'
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[8px]">
                        <span className="px-2 py-0.5 rounded-full text-[7px] font-bold" style={{ backgroundColor: sColor, color: pColor }}>
                          {editingTemplate.name || 'قالب جدید'}
                        </span>
                      </div>

                      {isSplitHeader ? (
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100/50">
                          <div className="h-10 w-10 overflow-hidden border shrink-0 bg-slate-100" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '6px' }}>
                            <div className="w-full h-full bg-slate-300 flex items-center justify-center text-[10px] font-bold">👤</div>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black" style={{ color: txtColor }}>نام و نام خانوادگی</h4>
                            <p className="text-[8px] font-bold" style={{ color: pColor }}>عنوان شغلی یا سمت تخصصی</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-1.5">
                          <div className="h-12 w-12 overflow-hidden border p-0.5 bg-slate-100" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '8px' }}>
                            <div className="w-full h-full bg-slate-300 flex items-center justify-center text-[10px] font-bold" style={{ borderRadius: isCircleAvatar ? '9999px' : '6px' }}>👤</div>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black" style={{ color: txtColor }}>نام و نام خانوادگی</h4>
                            <p className="text-[8px] font-bold mt-0.5" style={{ color: pColor }}>عنوان شغلی یا سمت تخصصی</p>
                          </div>
                        </div>
                      )}

                      <p className="text-[7.5px] leading-relaxed text-center" style={{ color: txtSecColor }}>
                        این یک متن تستی درباره ما است که در قالب پیش‌نمایش به مخاطب نشان داده می‌شود. شما می‌توانید بیوگرافی و رزومه خود را در این بخش بنویسید.
                      </p>

                      <div className="grid grid-cols-4 gap-1.5 pt-2">
                        {['تلفن', 'واتساپ', 'تلگرام', 'سایت'].map((social, i) => (
                          <div key={social} className="flex flex-col items-center justify-center p-1 rounded-md border text-[7px]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                            {i === 0 && <Phone className="h-3 w-3" style={{ color: pColor }} />}
                            {i === 1 && <MessageCircle className="h-3 w-3" style={{ color: pColor }} />}
                            {i === 2 && <Send className="h-3 w-3" style={{ color: pColor }} />}
                            {i === 3 && <Globe className="h-3 w-3" style={{ color: pColor }} />}
                            <span className="text-[5.5px] font-bold mt-0.5" style={{ color: txtSecColor }}>{social}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Templates List */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="p-3 font-bold">نام قالب</th>
                <th className="p-3 font-bold">شناسه انگلیسی</th>
                <th className="p-3 font-bold">نوع دسترسی</th>
                <th className="p-3 font-bold">تم پیش‌فرض</th>
                <th className="p-3 font-bold">فرم عکس</th>
                <th className="p-3 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((temp) => {
                let schema = temp.schema;
                if (typeof schema === 'string') {
                  try {
                    schema = JSON.parse(schema);
                  } catch {
                    schema = {};
                  }
                }
                schema = schema || {};

                return (
                  <tr key={temp.id} className="border-b border-slate-800/60 hover:bg-slate-850/40 transition">
                    <td className="p-3 font-bold text-white">{temp.name}</td>
                    <td className="p-3 font-mono text-slate-400">{temp.slug}</td>
                    <td className="p-3">
                      {temp.is_premium ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 rounded-full text-amber-400 text-[9px] font-bold">ویژه (VIP)</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 rounded-full text-slate-400 text-[9px]">رایگان / عمومی</span>
                      )}
                    </td>
                    <td className="p-3 uppercase">{schema.theme || 'light'}</td>
                    <td className="p-3">{schema.layout?.avatar_shape === 'square' ? 'مربعی' : 'دایره‌ای'}</td>
                    <td className="p-3 text-left space-x-2 space-x-reverse">
                      <button
                        onClick={() => {
                          let finalSchema = temp.schema;
                          if (typeof finalSchema === 'string') {
                            try {
                              finalSchema = JSON.parse(finalSchema);
                            } catch {
                              finalSchema = {};
                            }
                          }
                          setEditingTemplate({
                            ...temp,
                            schema: finalSchema || {
                              theme: 'light',
                              colors: {
                                primary: '#8d5b4c',
                                secondary: '#f4ece1',
                                background: '#faf6f0',
                                text: '#2d221e',
                                text_secondary: '#6e5a53'
                              },
                              typography: { font_family: 'Shabnam', title_size: '20px', body_size: '14px' },
                              layout: { avatar_shape: 'circle', header_style: 'split', social_icons_position: 'under-bio' }
                            }
                          });
                        }}
                        className="py-1 px-3 bg-slate-950 hover:bg-slate-850 rounded-lg text-blue-400 font-bold border border-slate-800 transition"
                      >
                        ویرایش استایل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
