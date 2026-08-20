'use client';

import React from 'react';
import { 
  Plus, Palette, Save, Phone, MessageCircle, Send, Globe, Copy, Check, Sparkles, BookOpen, X, Eye, Sliders, Code2, Layers, Layout, Type
} from 'lucide-react';
import { Template, dbService, toUUID, getImageUrl, PRESET_TEMPLATE_SCHEMAS, TemplateSchema } from '../../lib/directus';

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
  const [tabMode, setTabMode] = React.useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = React.useState('');
  const [showPresetsModal, setShowPresetsModal] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('همه');
  const [copiedPresetId, setCopiedPresetId] = React.useState<string | null>(null);
  const [searchPreset, setSearchPreset] = React.useState('');
  const [copiedSchemaToast, setCopiedSchemaToast] = React.useState(false);

  React.useEffect(() => {
    if (editingTemplate) {
      setJsonText(JSON.stringify(editingTemplate.schema || {}, null, 2));
    }
  }, [editingTemplate]);

  const categories = ['همه', ...Array.from(new Set(PRESET_TEMPLATE_SCHEMAS.map(p => p.category)))];

  const filteredPresets = PRESET_TEMPLATE_SCHEMAS.filter(p => {
    const matchesCat = selectedCategory === 'همه' || p.category === selectedCategory;
    const matchesSearch = !searchPreset || p.name.toLowerCase().includes(searchPreset.toLowerCase()) || p.slug.toLowerCase().includes(searchPreset.toLowerCase()) || p.description.toLowerCase().includes(searchPreset.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATE_SCHEMAS[0]) => {
    setEditingTemplate({
      id: crypto.randomUUID?.() || `temp-${Math.random().toString(36).substr(2, 9)}`,
      name: preset.name,
      slug: preset.slug,
      thumbnail: preset.thumbnail,
      is_premium: ['preset-luxury-gold', 'preset-cyberpunk', 'preset-aurora-glass', 'preset-emerald-imperial', 'preset-diamond-3d', 'preset-retro-synthwave'].includes(preset.id),
      is_active: true,
      schema: preset.schema
    } as any);
    setJsonText(JSON.stringify(preset.schema, null, 2));
    setShowPresetsModal(false);
  };

  const handleCopyPresetJSON = (preset: typeof PRESET_TEMPLATE_SCHEMAS[0]) => {
    navigator.clipboard.writeText(JSON.stringify(preset.schema, null, 2));
    setCopiedPresetId(preset.id);
    setTimeout(() => setCopiedPresetId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">مدیریت و مهندسی قالب‌های اختصاصی مگاکارت</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
              {PRESET_TEMPLATE_SCHEMAS.length}+ قالب آماده
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">ایجاد و تنظیم قالب‌های مدرن با بیش از ۳۰ پارامتر رنگ، انیمیشن، هندسه، آواتار، دکمه و ساختار داینامیک JSON.</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPresetsModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <span>قالب‌های آماده</span>
          </button>

          {!editingTemplate && (
            <button
              onClick={() => {
                setEditingTemplate({
                  id: crypto.randomUUID?.() || `temp-${Math.random().toString(36).substr(2, 9)}`,
                  name: 'قالب سفارشی جدید',
                  slug: 'custom-new',
                  is_premium: false,
                  is_active: true,
                  schema: {
                    theme: 'light',
                    colors: {
                      primary: '#2563eb',
                      secondary: '#dbeafe',
                      background: '#f8fafc',
                      card_bg: '#ffffff',
                      text: '#0f172a',
                      text_secondary: '#64748b',
                      border_color: '#e2e8f0',
                      glow_color: '#3b82f6'
                    },
                    typography: {
                      font_family: 'Vazir',
                      title_size: '22px',
                      body_size: '14px'
                    },
                    layout: {
                      card_radius: 'lg',
                      card_border: 'none',
                      card_shadow: 'xl',
                      header_style: 'split',
                      avatar_position: 'overlap-right',
                      avatar_shape: 'circle',
                      avatar_size: 'lg',
                      button_style: 'pill',
                      social_display_mode: 'grid-squares',
                      cover_height: 'standard',
                      bio_style: 'card-boxed'
                    },
                    effects: {
                      style: 'none',
                      backdrop_blur: 'none'
                    }
                  }
                } as any);
              }}
              className="flex items-center gap-1.5 py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>قالب جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* PRESETS LIBRARY MODAL */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPresetsModal(false)} />
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 z-10 flex flex-col overflow-hidden text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">کتابخانه قالب‌های آماده مگاکارت ({PRESET_TEMPLATE_SCHEMAS.length} قالب تنوع‌بخش)</h3>
                  <p className="text-xs text-slate-400">کپی مستقیم ساختار JSON یا بارگذاری در سازنده جهت ویرایش و اختصاصی‌سازی</p>
                </div>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0 border-b border-slate-800/60">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="جستجو در قالب‌ها..."
                value={searchPreset}
                onChange={(e) => setSearchPreset(e.target.value)}
                className="w-full md:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Presets Grid */}
            <div className="overflow-y-auto p-1 flex-1 space-y-4 my-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-4 transition flex flex-col justify-between group space-y-3"
                  >
                    <div>
                      {/* Image + Badges */}
                      <div className="h-32 w-full rounded-xl overflow-hidden relative bg-slate-900 border border-slate-800 mb-3">
                        <img 
                          src={preset.thumbnail} 
                          alt={preset.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold">
                            {preset.category}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 flex gap-1 items-center bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.schema.colors?.primary || '#3b82f6' }} />
                          <span className="text-[9px] font-mono text-slate-300 uppercase">{preset.schema.theme}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition">{preset.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{preset.description}</p>
                      
                      {/* Key features chips */}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        <span className="px-2 py-0.5 bg-slate-900 rounded-md text-[9px] text-slate-400 border border-slate-800">
                          {preset.schema.layout?.header_style || 'split'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-900 rounded-md text-[9px] text-slate-400 border border-slate-800">
                          {preset.schema.layout?.avatar_shape || 'circle'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-900 rounded-md text-[9px] text-slate-400 border border-slate-800">
                          {preset.schema.layout?.button_style || 'pill'}
                        </span>
                        {preset.schema.effects?.style !== 'none' && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[9px] font-bold border border-amber-500/20">
                            {preset.schema.effects?.style}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyPresetJSON(preset)}
                        className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1"
                      >
                        {copiedPresetId === preset.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>کپی JSON</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>بارگذاری و ویرایش</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editing Form / Creator Form */}
      {editingTemplate ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Fields Editor */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">تنظیمات و پارامترهای جامع قالب</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPresetsModal(true)}
                  className="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold hover:bg-indigo-600/30 transition flex items-center gap-1"
                >
                  <BookOpen className="h-3 w-3" />
                  قالب‌های آماده
                </button>
                <span className="text-[10px] text-amber-500 font-mono">ID: {editingTemplate.id}</span>
              </div>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">نام قالب</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-bold"
                  placeholder="مثال: نئون سایبرپانک"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">شناسه لاتین (slug)</label>
                <input
                  type="text"
                  value={editingTemplate.slug}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-left"
                  placeholder="cyberpunk-neon"
                />
              </div>
            </div>

            <div className="flex gap-6 py-2 border-y border-slate-800/60">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={editingTemplate.is_premium}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, is_premium: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span>قالب ویژه (VIP)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={editingTemplate.is_active}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span>فعال</span>
              </label>
            </div>

            {/* SCHEMA CONTROLS WITH TABS */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-amber-500 flex items-center gap-1.5 text-xs">
                  <Palette className="h-4 w-4" />
                  تنظیمات ظاهری قالب
                </h4>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTabMode('form')}
                    className={`px-3 py-1 rounded-lg transition font-bold flex items-center gap-1 ${tabMode === 'form' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Sliders className="h-3 w-3" />
                    فرم
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTabMode('json');
                      setJsonText(JSON.stringify(editingTemplate.schema || {}, null, 2));
                    }}
                    className={`px-3 py-1 rounded-lg transition font-bold font-mono flex items-center gap-1 ${tabMode === 'json' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Code2 className="h-3 w-3" />
                    کد JSON
                  </button>
                </div>
              </div>

              {tabMode === 'json' ? (
                <div className="space-y-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>کد ساختار فنی قالب:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(jsonText);
                        setCopiedSchemaToast(true);
                        setTimeout(() => setCopiedSchemaToast(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded font-mono font-bold transition flex items-center gap-1"
                    >
                      {copiedSchemaToast ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>کپی کد JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={15}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 focus:outline-none focus:border-amber-500 leading-relaxed"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(jsonText);
                        setEditingTemplate({
                          ...editingTemplate,
                          schema: parsed
                        });
                        alert('ساختار JSON با موفقیت اعمال شد!');
                      } catch (err: any) {
                        alert('خطا در فرمت JSON: ' + err.message);
                      }
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>اعمال کد JSON به پیش‌نمایش</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Theme Presets Choice */}
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                    <label className="block text-slate-400 text-[10px] font-bold">تم رنگی کلی</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'light', label: 'روشن' },
                        { id: 'dark', label: 'تیره' },
                        { id: 'glass', label: 'شیشه‌ای' },
                        { id: 'neon', label: 'نئونی' },
                        { id: 'sunset', label: 'پاستلی' },
                        { id: 'emerald', label: 'زمردی' },
                        { id: 'gold', label: 'طلایی' },
                        { id: 'cyber', label: 'سایبر' },
                        { id: 'artisan', label: 'خاکی' },
                        { id: 'minimal', label: 'مینیمال' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            const currentSchema = editingTemplate.schema || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...currentSchema, theme: t.id } as any
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition ${
                            (editingTemplate.schema?.theme || 'light') === t.id
                              ? 'bg-amber-600 border-amber-600 text-white shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors Palette Controls */}
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-[10px] text-amber-500 font-bold block flex items-center gap-1">
                      <Palette className="h-3.5 w-3.5" />
                      پالت رنگ
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">رنگ اصلی</label>
                        <div className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingTemplate.schema?.colors?.primary || '#2563eb'}
                            onChange={(e) => {
                              const s = editingTemplate.schema || {};
                              const c = s.colors || {};
                              setEditingTemplate({
                                ...editingTemplate,
                                schema: { ...s, colors: { ...c, primary: e.target.value } } as any
                              });
                            }}
                            className="h-6 w-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] uppercase text-white">{editingTemplate.schema?.colors?.primary || '#2563EB'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">رنگ دوم</label>
                        <div className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingTemplate.schema?.colors?.secondary || '#dbeafe'}
                            onChange={(e) => {
                              const s = editingTemplate.schema || {};
                              const c = s.colors || {};
                              setEditingTemplate({
                                ...editingTemplate,
                                schema: { ...s, colors: { ...c, secondary: e.target.value } } as any
                              });
                            }}
                            className="h-6 w-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] uppercase text-white">{editingTemplate.schema?.colors?.secondary || '#DBEAFE'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">پس‌زمینه صفحه</label>
                        <div className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingTemplate.schema?.colors?.background || '#f8fafc'}
                            onChange={(e) => {
                              const s = editingTemplate.schema || {};
                              const c = s.colors || {};
                              setEditingTemplate({
                                ...editingTemplate,
                                schema: { ...s, colors: { ...c, background: e.target.value } } as any
                              });
                            }}
                            className="h-6 w-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] uppercase text-white">{editingTemplate.schema?.colors?.background || '#F8FAFC'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">بدنه کارت</label>
                        <div className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingTemplate.schema?.colors?.card_bg || '#ffffff'}
                            onChange={(e) => {
                              const s = editingTemplate.schema || {};
                              const c = s.colors || {};
                              setEditingTemplate({
                                ...editingTemplate,
                                schema: { ...s, colors: { ...c, card_bg: e.target.value } } as any
                              });
                            }}
                            className="h-6 w-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] uppercase text-white">{editingTemplate.schema?.colors?.card_bg || '#FFFFFF'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">متن اصلی</label>
                        <div className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingTemplate.schema?.colors?.text || '#0f172a'}
                            onChange={(e) => {
                              const s = editingTemplate.schema || {};
                              const c = s.colors || {};
                              setEditingTemplate({
                                ...editingTemplate,
                                schema: { ...s, colors: { ...c, text: e.target.value } } as any
                              });
                            }}
                            className="h-6 w-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] uppercase text-white">{editingTemplate.schema?.colors?.text || '#0F172A'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">متن فرعی</label>
                        <div className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingTemplate.schema?.colors?.text_secondary || '#64748b'}
                            onChange={(e) => {
                              const s = editingTemplate.schema || {};
                              const c = s.colors || {};
                              setEditingTemplate({
                                ...editingTemplate,
                                schema: { ...s, colors: { ...c, text_secondary: e.target.value } } as any
                              });
                            }}
                            className="h-6 w-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] uppercase text-white">{editingTemplate.schema?.colors?.text_secondary || '#64748B'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">درخشش نئون</label>
                        <div className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingTemplate.schema?.colors?.glow_color || '#3b82f6'}
                            onChange={(e) => {
                              const s = editingTemplate.schema || {};
                              const c = s.colors || {};
                              setEditingTemplate({
                                ...editingTemplate,
                                schema: { ...s, colors: { ...c, glow_color: e.target.value } } as any
                              });
                            }}
                            className="h-6 w-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] uppercase text-white">{editingTemplate.schema?.colors?.glow_color || '#3B82F6'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">خط حاشیه</label>
                        <div className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingTemplate.schema?.colors?.border_color || '#e2e8f0'}
                            onChange={(e) => {
                              const s = editingTemplate.schema || {};
                              const c = s.colors || {};
                              setEditingTemplate({
                                ...editingTemplate,
                                schema: { ...s, colors: { ...c, border_color: e.target.value } } as any
                              });
                            }}
                            className="h-6 w-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] uppercase text-white">{editingTemplate.schema?.colors?.border_color || '#E2E8F0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout & Architecture */}
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-[10px] text-amber-500 font-bold block flex items-center gap-1">
                      <Layout className="h-3.5 w-3.5" />
                      چیدمان و ساختار
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">مدل هدر</label>
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="split">دو ستونه افقی</option>
                          <option value="centered">عمودی متمرکز</option>
                          <option value="bento">کاشی بنتو</option>
                          <option value="content_creator">اینفلوئنسر</option>
                          <option value="hero_cover">کاور بزرگ</option>
                          <option value="minimal_inline">خطی مینیمال</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">موقعیت آواتار</label>
                        <select
                          value={editingTemplate.schema?.layout?.avatar_position || 'overlap-center'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, avatar_position: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-amber-400 font-bold"
                        >
                          <option value="overlap-center">روی کاور وسط</option>
                          <option value="overlap-right">روی کاور راست</option>
                          <option value="overlap-left">روی کاور چپ</option>
                          <option value="below-center">زیر کاور وسط</option>
                          <option value="below-right">زیر کاور راست</option>
                          <option value="floating-top">شناور بالا</option>
                          <option value="inside-header">داخل هدر</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">شکل آواتار</label>
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="circle">دایره</option>
                          <option value="square">مربع</option>
                          <option value="rounded-square">مربع گوشه‌گرد</option>
                          <option value="squircle">اسکویرکل</option>
                          <option value="glowing-ring">حلقه نورانی</option>
                          <option value="hexagon">شش‌ضلعی</option>
                          <option value="diamond">لوزی</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">اندازه آواتار</label>
                        <select
                          value={editingTemplate.schema?.layout?.avatar_size || 'lg'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, avatar_size: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="sm">کوچک</option>
                          <option value="md">متوسط</option>
                          <option value="lg">بزرگ</option>
                          <option value="xl">خیلی بزرگ</option>
                          <option value="giant">غول‌آسا</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">گوشه کارت</label>
                        <select
                          value={editingTemplate.schema?.layout?.card_radius || 'lg'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, card_radius: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="none">صاف</option>
                          <option value="sm">کم</option>
                          <option value="md">متوسط</option>
                          <option value="lg">زیاد</option>
                          <option value="xl">خیلی زیاد</option>
                          <option value="pill">کپسولی</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">حاشیه کارت</label>
                        <select
                          value={editingTemplate.schema?.layout?.card_border || 'none'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, card_border: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="none">بدون حاشیه</option>
                          <option value="thin">خط ظریف</option>
                          <option value="solid-accent">خط رنگی</option>
                          <option value="double">دو خطی</option>
                          <option value="glow">درخشان</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">استایل دکمه‌ها</label>
                        <select
                          value={editingTemplate.schema?.layout?.button_style || 'pill'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, button_style: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="pill">کپسولی</option>
                          <option value="rounded">گوشه‌گرد</option>
                          <option value="glass">شیشه‌ای</option>
                          <option value="gradient">گرادینت</option>
                          <option value="sharp">صاف</option>
                          <option value="3d-press">سه‌بعدی</option>
                          <option value="neon">نئونی</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">شبکه‌های اجتماعی</label>
                        <select
                          value={editingTemplate.schema?.layout?.social_display_mode || 'grid-squares'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, social_display_mode: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="grid-squares">کاشی ۴تایی</option>
                          <option value="compact-chips">چیپ افقی</option>
                          <option value="horizontal-bubbles">حباب گرد</option>
                          <option value="vertical-rows">سطرهای عریض</option>
                          <option value="bento-tiles">کاشی بنتو</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">ارتفاع کاور</label>
                        <select
                          value={editingTemplate.schema?.layout?.cover_height || 'standard'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, cover_height: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="none">بدون کاور</option>
                          <option value="compact">کوچک</option>
                          <option value="standard">استاندارد</option>
                          <option value="large">بزرگ</option>
                          <option value="hero">پانوراما</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">کادر بیوگرافی</label>
                        <select
                          value={editingTemplate.schema?.layout?.bio_style || 'card-boxed'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, bio_style: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="card-boxed">کادر بسته</option>
                          <option value="bubble">حباب نقل‌قول</option>
                          <option value="minimal">ساده</option>
                          <option value="quote">استایل نقل‌قول</option>
                          <option value="gradient-border">کادر درخشان</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">جلوه ویژه</label>
                        <select
                          value={editingTemplate.schema?.effects?.style || 'none'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const ef = s.effects || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, effects: { ...ef, style: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-amber-400 font-bold"
                        >
                          <option value="none">ساده</option>
                          <option value="glassmorphism">شیشه‌ای</option>
                          <option value="neon-glow">نئونی</option>
                          <option value="gold-glow">طلایی</option>
                          <option value="mesh-gradient">گرادینت مش</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">سایه کارت</label>
                        <select
                          value={editingTemplate.schema?.layout?.card_shadow || 'xl'}
                          onChange={(e) => {
                            const s = editingTemplate.schema || {};
                            const l = s.layout || {};
                            setEditingTemplate({
                              ...editingTemplate,
                              schema: { ...s, layout: { ...l, card_shadow: e.target.value } } as any
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                        >
                          <option value="none">بدون سایه</option>
                          <option value="sm">ملایم</option>
                          <option value="md">متوسط</option>
                          <option value="xl">عمیق</option>
                          <option value="2xl">فوق عمیق</option>
                          <option value="colored-glow">نور رنگی</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                    <div>
                      <label className="block text-slate-400 mb-1 text-[10px] flex items-center gap-1 font-bold">
                        <Type className="h-3.5 w-3.5 text-amber-500" />
                        فونت
                      </label>
                      <select
                        value={editingTemplate.schema?.typography?.font_family || 'Vazir'}
                        onChange={(e) => {
                          const s = editingTemplate.schema || {};
                          const t = s.typography || {};
                          setEditingTemplate({
                            ...editingTemplate,
                            schema: { ...s, typography: { ...t, font_family: e.target.value } } as any
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none font-bold"
                      >
                        <option value="Vazir">وزیر</option>
                        <option value="Shabnam">شبنم</option>
                        <option value="IranYekan">ایران یکان</option>
                        <option value="Sahel">ساحل</option>
                        <option value="Samim">صمیم</option>
                        <option value="Tahoma">تاهما</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[10px]">اندازه عنوان</label>
                      <input
                        type="text"
                        value={editingTemplate.schema?.typography?.title_size || '22px'}
                        onChange={(e) => {
                          const s = editingTemplate.schema || {};
                          const t = s.typography || {};
                          setEditingTemplate({
                            ...editingTemplate,
                            schema: { ...s, typography: { ...t, title_size: e.target.value } } as any
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-center font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[10px]">اندازه متن</label>
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="py-2 px-4 bg-slate-950 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition font-bold"
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
                className="py-2.5 px-6 bg-amber-600 hover:bg-amber-500 rounded-xl text-white transition font-bold flex items-center gap-2 shadow-lg"
              >
                <Save className="h-4 w-4" />
                <span>ذخیره نهایی قالب در سیستم</span>
              </button>
            </div>
          </div>

          {/* Right: Live Visual Preview */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center flex items-center justify-center gap-1">
              <Eye className="h-3.5 w-3.5 text-amber-500" />
              پیش‌نمایش زنده بصری (Live Realtime Mockup)
            </span>
            {(() => {
              const tSchema = editingTemplate.schema || {};
              const isDarkTheme = ['dark', 'neon', 'cyber', 'gold', 'glass'].includes(tSchema.theme || '');
              const pColor = tSchema.colors?.primary || '#2563eb';
              const sColor = tSchema.colors?.secondary || '#dbeafe';
              const bColor = tSchema.colors?.background || '#f8fafc';
              const txtColor = tSchema.colors?.text || (isDarkTheme ? '#f8fafc' : '#0f172a');
              const txtSecColor = tSchema.colors?.text_secondary || (isDarkTheme ? '#94a3b8' : '#64748b');
              const cardBg = tSchema.colors?.card_bg || (isDarkTheme ? '#0f172a' : '#ffffff');

              const avatarShape = tSchema.layout?.avatar_shape || 'circle';
              const avatarPos = tSchema.layout?.avatar_position || 'overlap-center';
              const headerStyle = tSchema.layout?.header_style || 'split';
              const buttonStyle = tSchema.layout?.button_style || 'pill';
              const cardBorder = tSchema.layout?.card_border || 'none';
              const cardRadius = tSchema.layout?.card_radius || 'lg';
              const fxStyle = tSchema.effects?.style || 'none';
              const coverHeight = tSchema.layout?.cover_height || 'standard';
              const socialMode = tSchema.layout?.social_display_mode || 'grid-squares';

              const isCircleAvatar = avatarShape === 'circle';
              const isGlowingAvatar = avatarShape === 'glowing-ring';
              const isHexagon = avatarShape === 'hexagon';
              const isDiamond = avatarShape === 'diamond';
              const isSquircle = avatarShape === 'squircle';

              const radiusClass = 
                cardRadius === 'none' ? 'rounded-none' :
                cardRadius === 'sm' ? 'rounded-xl' :
                cardRadius === 'md' ? 'rounded-2xl' :
                cardRadius === 'lg' ? 'rounded-3xl' :
                cardRadius === 'xl' ? 'rounded-[32px]' : 'rounded-[40px]';

              return (
                <div 
                  className="w-full max-w-[320px] mx-auto rounded-[40px] border-4 border-slate-800 bg-slate-950 p-3 shadow-2xl overflow-hidden aspect-[9/16] flex flex-col justify-between"
                  style={{ backgroundColor: bColor }}
                >
                  <div 
                    className={`w-full h-full overflow-hidden p-4 text-right flex flex-col justify-between transition relative ${radiusClass} ${
                      fxStyle === 'glassmorphism' ? 'backdrop-blur-md bg-white/10 border border-white/20 shadow-xl' :
                      fxStyle === 'neon-glow' ? 'border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' :
                      fxStyle === 'gold-glow' ? 'border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : ''
                    }`}
                    style={{ 
                      backgroundColor: fxStyle === 'glassmorphism' ? undefined : cardBg, 
                      color: txtColor,
                      fontFamily: tSchema.typography?.font_family || 'iranyekan',
                      borderColor: cardBorder === 'solid-accent' ? pColor : cardBorder === 'double' ? pColor : cardBorder === 'thin' ? (isDarkTheme ? 'rgba(255,255,255,0.1)' : '#e2e8f0') : undefined,
                      borderWidth: cardBorder === 'solid-accent' ? '2px' : cardBorder === 'double' ? '3px' : cardBorder === 'thin' ? '1px' : undefined,
                      borderStyle: cardBorder === 'double' ? 'double' : undefined
                    }}
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[8px]">
                        <span className="px-2 py-0.5 rounded-full text-[7px] font-bold" style={{ backgroundColor: sColor, color: pColor }}>
                          {editingTemplate.name || 'قالب اختصاصی'}
                        </span>
                        <span className="text-[7px] font-mono text-slate-400">{editingTemplate.slug || 'slug'}</span>
                      </div>

                      {/* Mock Cover */}
                      {coverHeight !== 'none' && (
                        <div 
                          className={`w-full rounded-xl relative overflow-hidden flex items-center justify-center text-[8px] text-slate-400 shadow-inner ${
                            coverHeight === 'compact' ? 'h-10' :
                            coverHeight === 'large' ? 'h-16' :
                            coverHeight === 'hero' ? 'h-20' : 'h-12'
                          }`}
                          style={{ backgroundColor: `${pColor}20` }}
                        >
                          <span>کاور اختصاصی</span>
                        </div>
                      )}

                      {/* Avatar Position mock */}
                      {avatarPos.startsWith('overlap-') && (
                        <div className={`-mt-6 z-10 relative flex ${
                          avatarPos === 'overlap-right' ? 'justify-start pr-2' :
                          avatarPos === 'overlap-left' ? 'justify-end pl-2' : 'justify-center'
                        }`}>
                          <div 
                            className={`h-10 w-10 overflow-hidden border-2 bg-slate-300 flex items-center justify-center font-bold text-xs shadow-md ${
                              isCircleAvatar ? 'rounded-full' : 
                              isGlowingAvatar ? 'rounded-full ring-2 ring-cyan-400' : 
                              isSquircle ? 'rounded-2xl' : 
                              isDiamond ? 'rotate-45 scale-90 rounded-md' : 'rounded-lg'
                            }`} 
                            style={{ borderColor: pColor }}
                          >
                            <span className={isDiamond ? '-rotate-45' : ''}>👤</span>
                          </div>
                        </div>
                      )}

                      {avatarPos.startsWith('below-') && (
                        <div className={`pt-0.5 flex ${
                          avatarPos === 'below-right' ? 'justify-start' : 'justify-center'
                        }`}>
                          <div className={`h-9 w-9 overflow-hidden border bg-slate-300 flex items-center justify-center font-bold text-xs ${isCircleAvatar ? 'rounded-full' : 'rounded-lg'}`} style={{ borderColor: pColor }}>
                            👤
                          </div>
                        </div>
                      )}

                      {/* Header layouts */}
                      {headerStyle === 'bento' ? (
                        <div className="p-2 bg-slate-800/40 border border-slate-700/40 rounded-xl flex items-center gap-2">
                          {avatarPos === 'inside-header' && (
                            <div className={`h-8 w-8 overflow-hidden border shrink-0 bg-slate-300 flex items-center justify-center font-bold text-xs ${isCircleAvatar ? 'rounded-full' : 'rounded-lg'}`}>👤</div>
                          )}
                          <div>
                            <h4 className="text-[10px] font-black" style={{ color: txtColor }}>نام و نام خانوادگی</h4>
                            <p className="text-[7.5px] font-bold" style={{ color: pColor }}>عنوان شغلی یا سمت سازمانی</p>
                          </div>
                        </div>
                      ) : headerStyle === 'content_creator' ? (
                        <div className="flex flex-col items-center text-center space-y-1 pt-0.5">
                          {avatarPos === 'inside-header' && (
                            <div className="h-9 w-9 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-500 shrink-0">
                              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs">👤</div>
                            </div>
                          )}
                          <div>
                            <h4 className="text-[10px] font-black" style={{ color: txtColor }}>نام و نام خانوادگی</h4>
                            <p className="text-[8px] font-bold text-pink-400">تولیدکننده محتوا / رسانه</p>
                          </div>
                        </div>
                      ) : headerStyle === 'split' ? (
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-500/20">
                          {avatarPos === 'inside-header' && (
                            <div className={`h-8 w-8 overflow-hidden border shrink-0 bg-slate-300 flex items-center justify-center font-bold text-xs ${isCircleAvatar ? 'rounded-full' : 'rounded-md'}`} style={{ borderColor: pColor }}>
                              👤
                            </div>
                          )}
                          <div>
                            <h4 className="text-[10px] font-black" style={{ color: txtColor }}>نام و نام خانوادگی</h4>
                            <p className="text-[8px] font-bold" style={{ color: pColor }}>مدیریت ارشد / کارشناس</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-0.5">
                          {avatarPos === 'inside-header' && (
                            <div className={`h-9 w-9 overflow-hidden border p-0.5 bg-slate-300 flex items-center justify-center font-bold text-xs ${isCircleAvatar ? 'rounded-full' : 'rounded-lg'}`} style={{ borderColor: pColor }}>
                              👤
                            </div>
                          )}
                          <div>
                            <h4 className="text-[10px] font-black" style={{ color: txtColor }}>نام و نام خانوادگی</h4>
                            <p className="text-[8px] font-bold mt-0.5" style={{ color: pColor }}>عنوان شغلی یا سمت تخصصی</p>
                          </div>
                        </div>
                      )}

                      <p className="text-[7.5px] leading-relaxed text-center opacity-85" style={{ color: txtSecColor }}>
                        این متن بیوگرافی و معرفی کوتاه فردی یا شرکتی در قالب انتخابی است.
                      </p>

                      {/* Action Button mock */}
                      <div 
                        className={`w-full py-1.5 text-center text-[8px] font-bold text-white shadow-sm transition ${
                          buttonStyle === 'pill' ? 'rounded-full' :
                          buttonStyle === 'glass' ? 'rounded-xl bg-white/20 border border-white/30 backdrop-blur-md' :
                          buttonStyle === 'gradient' ? 'rounded-xl bg-gradient-to-r from-amber-500 to-amber-700' :
                          buttonStyle === 'neon' ? 'rounded-xl border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] text-cyan-300' :
                          buttonStyle === '3d-press' ? 'rounded-xl border-b-4 border-slate-950/40 active:translate-y-0.5' : 'rounded-lg'
                        }`}
                        style={{ backgroundColor: !['glass', 'gradient', 'neon'].includes(buttonStyle) ? pColor : undefined }}
                      >
                        📥 ذخیره کارت در مخاطبین
                      </div>

                      {/* Socials mock */}
                      {socialMode === 'vertical-rows' ? (
                        <div className="space-y-1 pt-1">
                          {['واتساپ', 'اینستاگرام'].map((social, i) => (
                            <div key={social} className="flex items-center justify-between p-1 px-2 rounded-lg border text-[7px]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                              <span className="font-bold">{social}</span>
                              {i === 0 ? <MessageCircle className="h-3 w-3" style={{ color: pColor }} /> : <Globe className="h-3 w-3" style={{ color: pColor }} />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1 pt-1">
                          {['تماس', 'واتساپ', 'تلگرام', 'سایت'].map((social, i) => (
                            <div key={social} className="flex flex-col items-center justify-center p-1 rounded-md border text-[7px]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                              {i === 0 && <Phone className="h-2.5 w-2.5" style={{ color: pColor }} />}
                              {i === 1 && <MessageCircle className="h-2.5 w-2.5" style={{ color: pColor }} />}
                              {i === 2 && <Send className="h-2.5 w-2.5" style={{ color: pColor }} />}
                              {i === 3 && <Globe className="h-2.5 w-2.5" style={{ color: pColor }} />}
                              <span className="text-[5.5px] font-bold mt-0.5" style={{ color: txtSecColor }}>{social}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Templates List */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
            <h3 className="font-bold text-xs text-slate-300">لیست تمامی قالب‌های فعال و اختصاصی سیستم ({templates.length} قالب)</h3>
          </div>

          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="p-3 font-bold">تصویر</th>
                <th className="p-3 font-bold">نام قالب</th>
                <th className="p-3 font-bold">شناسه فنی</th>
                <th className="p-3 font-bold">نوع دسترسی</th>
                <th className="p-3 font-bold">تم و استایل</th>
                <th className="p-3 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((temp) => {
                let schema: any = temp.schema;
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
                    <td className="p-3">
                      <div className="h-10 w-16 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative">
                        {temp.thumbnail ? (
                          <img src={getImageUrl(temp.thumbnail)} alt={temp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 font-bold">بدون عکس</div>
                        )}
                        <div className="absolute bottom-0 right-0 left-0 h-1" style={{ backgroundColor: schema?.colors?.primary || '#3b82f6' }} />
                      </div>
                    </td>
                    <td className="p-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span>{temp.name}</span>
                        {temp.is_premium && (
                          <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded text-[9px] font-bold border border-amber-500/20">VIP</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{temp.slug}</td>
                    <td className="p-3">
                      {temp.is_premium ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 rounded-full text-amber-400 text-[9px] font-bold border border-amber-500/20">ویژه (VIP)</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 rounded-full text-slate-400 text-[9px]">رایگان / عمومی</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800 text-[10px] font-mono text-slate-300 uppercase">
                        {schema.theme || 'light'}
                      </span>
                    </td>
                    <td className="p-3 text-left space-x-2 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
                          alert('کد JSON این قالب در حافظه کپی شد!');
                        }}
                        className="py-1 px-2.5 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-300 font-mono text-[11px] border border-slate-800 transition"
                      >
                        کپی JSON
                      </button>

                      <button
                        onClick={() => {
                          setEditingTemplate({
                            ...temp,
                            schema: schema
                          });
                        }}
                        className="py-1 px-3 bg-amber-600/20 hover:bg-amber-600/30 rounded-lg text-amber-400 font-bold border border-amber-500/30 transition text-[11px]"
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
