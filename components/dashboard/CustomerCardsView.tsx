'use client';

import React from 'react';
import { 
  Plus, Edit2, Trash2, Globe, ExternalLink, Copy, Check, Eye, Save, 
  Settings, User, LayoutGrid, CreditCard, BarChart2, ShieldCheck, 
  Users, Building, DollarSign, ArrowLeft, Sliders, Smartphone, Palette, 
  Code, Link2, Trash, CheckSquare, Sparkles, HelpCircle, RefreshCw, Star, ArrowRight,
  Phone, Mail, Send, MessageCircle, ChevronLeft, MapPin, Instagram, Linkedin, Download, QrCode,
  GripVertical, MoveUp, MoveDown, Layers, RotateCcw, AlignRight, Share2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, Template, toUUID, getImageUrl, dbService, toJalaliDate, SECTION_DEFINITIONS, getSectionOrders, DEFAULT_SECTION_ORDERS, toPersianDigits, toEnglishDigits } from '../../lib/directus';
import { saveCardToContacts } from '../../lib/vcard';
import ProfileImageCropperModal from './ProfileImageCropperModal';

export function getTemplateDefaultColors(templateId?: string | null, templatesList: Template[] = []) {
  const cleanTId = (templateId || '').toLowerCase();
  const cleanTUuid = toUUID(templateId);

  const isClassic = !templateId || cleanTId === 'temp-1' || cleanTId === 'classic' || cleanTUuid === '11111111-1111-1111-1111-111111111111';
  const isNeonGlass = cleanTId === 'temp-2' || cleanTId === 'neon-glass' || cleanTUuid === '22222222-2222-2222-2222-222222222222';
  const isMinimal = cleanTId === 'temp-3' || cleanTId === 'minimal' || cleanTUuid === '33333333-3333-3333-3333-333333333333';
  const isLuxuryDark = cleanTId === 'temp-4' || cleanTId === 'luxury-dark' || cleanTUuid === '44444444-4444-4444-4444-444444444444';

  if (isLuxuryDark) {
    return {
      primary: '#f59e0b',
      secondary: '#d97706',
      background: '#0c0a09',
      card_bg: '#1c1917',
      text: '#fef3c7',
    };
  }
  if (isNeonGlass) {
    return {
      primary: '#06b6d4',
      secondary: '#3b82f6',
      background: '#0f172a',
      card_bg: '#0f172a',
      text: '#ffffff',
    };
  }
  if (isMinimal) {
    return {
      primary: '#0f172a',
      secondary: '#475569',
      background: '#f8fafc',
      card_bg: '#ffffff',
      text: '#0f172a',
    };
  }
  if (!isClassic) {
    const activeT = templatesList.find(t => toUUID(t.id) === cleanTUuid || (t.slug && t.slug.toLowerCase() === cleanTId));
    const schemaColors = activeT?.schema?.default_colors || activeT?.schema?.colors || (activeT as any)?.default_colors;
    if (schemaColors) {
      return {
        primary: schemaColors.primary || '#2563eb',
        secondary: schemaColors.secondary || '#3b82f6',
        background: schemaColors.background || '#f1f5f9',
        card_bg: schemaColors.card_bg || '#ffffff',
        text: schemaColors.text || '#1e293b',
      };
    }
  }

  return {
    primary: '#2563eb',
    secondary: '#3b82f6',
    background: '#f1f5f9',
    card_bg: '#ffffff',
    text: '#1e293b',
  };
}

export interface CustomerCardsViewProps {
  user: any;
  cards: Card[];
  templates: Template[];
  editingCard: Card | null;
  setEditingCard: (card: Card | null) => void;
  isCreatingCard: boolean;
  isSavingCard: boolean;
  cardError: string | null;
  setCardError: (err: string | null) => void;
  cardSuccess: string | null;
  setCardSuccess: (msg: string | null) => void;
  isCopiedSlug: string | null;
  setIsCopiedSlug: (slug: string | null) => void;
  newBtnLabel: string;
  setNewBtnLabel: (val: string) => void;
  newBtnUrl: string;
  setNewBtnUrl: (val: string) => void;
  newExtraPhone: string;
  setNewExtraPhone: (val: string) => void;
  uploadingProfile: boolean;
  uploadingCover: boolean;
  handleFileUpload: (file: File, type: 'profile' | 'cover') => Promise<void>;
  handleAddNewCard: () => Promise<void>;
  handleSaveCard: () => Promise<void>;
  handleDeleteCard: (id: string) => Promise<void>;
  handleCopyCardLink: (slug: string) => void;
  handleAddCustomBtn: () => void;
  handleRemoveCustomBtn: (id: string) => void;
  userSub?: any;
  userPlan?: any;
  onNavigateToBilling?: () => void;
}

export function CustomerCardsView({
  user,
  cards,
  templates,
  editingCard,
  setEditingCard,
  isCreatingCard,
  isSavingCard,
  cardError,
  setCardError,
  cardSuccess,
  setCardSuccess,
  isCopiedSlug,
  setIsCopiedSlug,
  newBtnLabel,
  setNewBtnLabel,
  newBtnUrl,
  setNewBtnUrl,
  newExtraPhone,
  setNewExtraPhone,
  uploadingProfile,
  uploadingCover,
  handleFileUpload,
  handleAddNewCard,
  handleSaveCard,
  handleDeleteCard,
  handleCopyCardLink,
  handleAddCustomBtn,
  handleRemoveCustomBtn,
  userSub,
  userPlan,
  onNavigateToBilling
}: CustomerCardsViewProps) {
  const [editorTab, setEditorTab] = React.useState<'info' | 'contact' | 'maps' | 'bank' | 'advanced' | 'layout'>('info');
  const [previewCopiedField, setPreviewCopiedField] = React.useState<string | null>(null);
  const [pendingProfileCropFile, setPendingProfileCropFile] = React.useState<File | null>(null);

  // Drag and drop reordering handlers for card builder
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !editingCard) return;
    const currentOrders = getSectionOrders(editingCard);
    const items = Array.from(currentOrders);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEditingCard({
      ...editingCard,
      section_orders: items
    });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!editingCard) return;
    const currentOrders = getSectionOrders(editingCard);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrders.length) return;

    const items = Array.from(currentOrders);
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);

    setEditingCard({
      ...editingCard,
      section_orders: items
    });
  };

  const handleResetSectionOrders = () => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      section_orders: DEFAULT_SECTION_ORDERS
    });
  };

  // QR Code Modal State
  const [selectedQrCard, setSelectedQrCard] = React.useState<Card | null>(null);
  const [downloadingQr, setDownloadingQr] = React.useState(false);

  // Real-time Slug Check State
  const [slugStatus, setSlugStatus] = React.useState<'empty' | 'too_short' | 'checking' | 'taken' | 'available'>('empty');
  const [isSlugTouched, setIsSlugTouched] = React.useState(false);

  // Reset isSlugTouched whenever editingCard opens/changes
  React.useEffect(() => {
    setIsSlugTouched(false);
  }, [editingCard?.id]);

  React.useEffect(() => {
    if (!editingCard || !isSlugTouched) return;
    const rawSlug = (editingCard.slug || '').trim().toLowerCase();
    if (!rawSlug) {
      setSlugStatus('empty');
      return;
    }
    if (rawSlug.length < 2) {
      setSlugStatus('too_short');
      return;
    }

    // Local check against existing cards list in state
    const isTakenLocally = cards.some(
      c => toUUID(c.id) !== toUUID(editingCard.id) && (c.slug || '').trim().toLowerCase() === rawSlug
    );
    if (isTakenLocally) {
      setSlugStatus('taken');
      return;
    }

    // Async check against Directus DB
    let isMounted = true;
    setSlugStatus('checking');

    const timer = setTimeout(async () => {
      try {
        const existing = await dbService.getCardBySlug(rawSlug);
        if (!isMounted) return;
        if (existing && toUUID(existing.id) !== toUUID(editingCard.id) && (existing.slug || '').trim().toLowerCase() === rawSlug) {
          setSlugStatus('taken');
        } else {
          setSlugStatus('available');
        }
      } catch {
        if (isMounted) {
          setSlugStatus(isTakenLocally ? 'taken' : 'available');
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [editingCard?.slug, editingCard?.id, cards, isSlugTouched]);

  // Dynamic Base URL Helper
  const getCardBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
      return window.location.origin;
    }
    return 'https://megacard.ir';
  };

  const handleDownloadQrCode = async (card: Card) => {
    if (!card) return;
    setDownloadingQr(true);
    try {
      const baseUrl = getCardBaseUrl();
      const cardUrl = `${baseUrl}/${card.slug}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(cardUrl)}`;

      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${card.slug || 'card'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      const baseUrl = getCardBaseUrl();
      const cardUrl = `${baseUrl}/${card.slug}`;
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(cardUrl)}`, '_blank');
    } finally {
      setDownloadingQr(false);
    }
  };

  const handlePreviewCopyText = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const isBankField = fieldName === 'bank_card' || fieldName === 'bank_account' || fieldName === 'bank_shaba';
      const textToCopy = isBankField ? toEnglishDigits(text) : text;
      navigator.clipboard.writeText(textToCopy);
    }
    setPreviewCopiedField(fieldName);
    setTimeout(() => setPreviewCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Notifications */}
      {cardError && (
        <div className="p-4 bg-red-950/40 border border-red-900/40 rounded-2xl text-red-200 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{cardError}</span>
          </div>
          <button onClick={() => setCardError(null)} className="text-red-400 hover:text-red-200 transition text-sm">✕</button>
        </div>
      )}
      {cardSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-200 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{cardSuccess}</span>
          </div>
          <button onClick={() => setCardSuccess(null)} className="text-emerald-400 hover:text-emerald-200 transition text-sm">✕</button>
        </div>
      )}

      {/* If NOT editing, render standard cards workspace index */}
      {!editingCard ? (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-white">مدیریت کارت‌های ویزیت دیجیتال</h2>
              <p className="text-xs text-slate-400 mt-1">لیست کارت‌های فعال و پیش‌نویس شما در سامانه.</p>
            </div>

            <button
              onClick={handleAddNewCard}
              disabled={isCreatingCard}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl text-xs font-extrabold text-white transition flex items-center gap-1.5 shadow shadow-blue-600/10"
            >
              {isCreatingCard ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isCreatingCard ? 'در حال ایجاد...' : 'ساخت کارت ویزیت جدید'}
            </button>
          </div>

          {/* Prominent Subscription Alert/Banner */}
          {user.role === 'customer' && (
            userSub ? (
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">طرح فعال شما:</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-md">
                        {userPlan?.title || 'طرح اختصاصی'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      شما دسترسی کامل به ابزارهای ساخت کارت و قالب‌ها دارید (اعتبار: از {toJalaliDate(userSub.start_date)} تا {toJalaliDate(userSub.end_date)})
                    </p>
                  </div>
                </div>
                {onNavigateToBilling && (
                  <button
                    onClick={onNavigateToBilling}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border border-slate-700 shrink-0 w-full md:w-auto justify-center"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    مدیریت یا تمدید اشتراک
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-950/20 to-blue-950/20 border border-amber-900/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-amber-950/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-amber-400">فاقد اشتراک فعال هستید!</h4>
                    <p className="text-[10px] text-slate-300">
                      برای حذف محدودیت تعداد بازدید، فعال‌سازی پیوندهای کارت‌های خود و ویرایش پیشرفته، اشتراک خود را تهیه کنید.
                    </p>
                  </div>
                </div>
                {onNavigateToBilling && (
                  <button
                    onClick={onNavigateToBilling}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow shadow-blue-600/20 shrink-0 w-full md:w-auto justify-center"
                  >
                    <CreditCard className="h-4 w-4" />
                    شروع و خرید اشتراک
                  </button>
                )}
              </div>
            )
          )}

          {cards.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl space-y-4">
              <LayoutGrid className="h-12 w-12 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">هیچ کارت ویزیت هوشمندی ندارید!</p>
                <p className="text-slate-500 text-xs">همین حالا با کلیک روی دکمه بالا، اولین هویت دیجیتال اختصاصی خود را خلق کنید.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {cards.map((card) => {
                const template = templates.find(t => toUUID(t.id) === toUUID(card.template_id));
                return (
                  <div 
                    key={card.id} 
                    className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden p-4 flex flex-col justify-between gap-4 group hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                        <img 
                          src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} 
                          alt="avatar" 
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{card.first_name} {card.last_name}</h3>
                        <p className="text-[11px] text-blue-400 font-semibold truncate">{card.job_title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{card.company}</p>
                      </div>
                    </div>

                    <div className="py-2 border-t border-b border-slate-900 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">تم: <span className="text-slate-200 font-bold">{template?.name || 'کلاسیک'}</span></span>
                      <span className="text-slate-400">بازدید کل: <span className="text-emerald-400 font-bold">{card.views_count?.toLocaleString('fa-IR') || 0}</span></span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        card.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {card.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </div>

                    {/* Actions bar */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingCard(card)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-[10px] font-bold border border-slate-800 hover:border-slate-750 transition flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="h-3 w-3 text-blue-400" />
                        ویرایش کارت
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedQrCard(card)}
                        className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-[10px] font-bold border border-slate-800 hover:border-slate-750 transition text-amber-400"
                        title="مشاهده و دانلود کیوآرکد (QR Code)"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopyCardLink(card.slug)}
                        className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-[10px] font-bold border border-slate-800 hover:border-slate-750 transition"
                        title="کپی لینک اختصاصی"
                      >
                        {isCopiedSlug === card.slug ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>

                      <a
                        href={`/${card.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-[10px] font-bold border border-slate-800 hover:border-slate-750 transition text-blue-400"
                        title="مشاهده آنلاین کارت"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 bg-slate-900 hover:bg-red-950/20 rounded-xl text-[10px] font-bold border border-slate-800 hover:border-red-900/30 transition text-red-400"
                        title="حذف دائمی کارت"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ==============================================
            SANDBOX LIVE CARD EDITOR (SPLIT SCREEN)
           ============================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingCard(null)}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-400"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
                <div>
                  <h4 className="text-sm font-bold text-white">ویرایشگر زنده کارت ویزیت</h4>
                  <p className="text-[10px] text-slate-500">تمامی تغییرات به صورت پیش‌نمایش در موبایل قابل مشاهده است.</p>
                </div>
              </div>

              {/* Action Buttons: View Card, QR Code, Save Changes (Compact Icon Only) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedQrCard(editingCard)}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/30 rounded-xl transition flex items-center justify-center shrink-0"
                  title="مشاهده و دانلود کد QR کارت"
                >
                  <QrCode className="h-4 w-4" />
                </button>

                <a
                  href={`/${editingCard.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 hover:border-blue-500/40 rounded-xl transition flex items-center justify-center shrink-0"
                  title="مشاهده آنلاین کارت در زبانه جدید"
                >
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                </a>

                <button
                  type="button"
                  onClick={handleSaveCard}
                  disabled={isSavingCard}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl transition flex items-center justify-center shadow shadow-blue-600/20 shrink-0"
                  title="ذخیره تمامی تغییرات"
                >
                  {isSavingCard ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Tabs Navigation (Grid-based, highly responsive & beautifully compact to avoid horizontal scrolling) */}
            <div className="grid grid-cols-6 bg-slate-900/40 p-1 rounded-xl gap-1 text-[10px] sm:text-xs font-bold border border-slate-850">
              <button 
                type="button"
                onClick={() => setEditorTab('info')}
                className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${editorTab === 'info' ? 'bg-blue-600 text-white shadow shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="text-[9px] sm:text-[11px] truncate">اصلی</span>
              </button>
              <button 
                type="button"
                onClick={() => setEditorTab('contact')}
                className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${editorTab === 'contact' ? 'bg-blue-600 text-white shadow shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span className="text-[9px] sm:text-[11px] truncate">ارتباط</span>
              </button>
              <button 
                type="button"
                onClick={() => setEditorTab('maps')}
                className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${editorTab === 'maps' ? 'bg-blue-600 text-white shadow shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
              >
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-[9px] sm:text-[11px] truncate">نقشه</span>
              </button>
              <button 
                type="button"
                onClick={() => setEditorTab('bank')}
                className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${editorTab === 'bank' ? 'bg-blue-600 text-white shadow shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
              >
                <CreditCard className="h-4 w-4 shrink-0" />
                <span className="text-[9px] sm:text-[11px] truncate">بانک</span>
              </button>
              <button 
                type="button"
                onClick={() => setEditorTab('advanced')}
                className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${editorTab === 'advanced' ? 'bg-blue-600 text-white shadow shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
              >
                <Code className="h-4 w-4 shrink-0" />
                <span className="text-[9px] sm:text-[11px] truncate">دکمه‌ها</span>
              </button>
              <button 
                type="button"
                onClick={() => setEditorTab('layout')}
                className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${editorTab === 'layout' ? 'bg-blue-600 text-white shadow shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
              >
                <GripVertical className="h-4 w-4 shrink-0" />
                <span className="text-[9px] sm:text-[11px] truncate">چیدمان</span>
              </button>
            </div>

            {/* Editor Form fields */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 text-xs">

              {editorTab === 'info' && (
                <div className="space-y-4 pt-2">
                  {/* Name & Slug */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">نام کوچک:</label>
                      <input 
                        type="text" 
                        value={editingCard.first_name || ''} 
                        onChange={(e) => setEditingCard({ ...editingCard, first_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">نام خانوادگی:</label>
                      <input 
                        type="text" 
                        value={editingCard.last_name || ''} 
                        onChange={(e) => setEditingCard({ ...editingCard, last_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-300 text-xs">لینک اختصاصی کارت (Slug):</label>
                        {isSlugTouched && slugStatus === 'available' && (
                          <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                            <Check className="h-3 w-3" /> آزاد
                          </span>
                        )}
                        {isSlugTouched && slugStatus === 'taken' && (
                          <span className="text-[10px] text-red-400 font-extrabold flex items-center gap-1 bg-red-500/15 px-2 py-0.5 rounded-md border border-red-500/30">
                            ✕ تکراری
                          </span>
                        )}
                        {isSlugTouched && slugStatus === 'checking' && (
                          <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-md">
                            <RefreshCw className="h-3 w-3 animate-spin" /> ...
                          </span>
                        )}
                        {isSlugTouched && slugStatus === 'too_short' && (
                          <span className="text-[9px] text-amber-400 font-medium px-1.5 py-0.5 bg-amber-500/10 rounded">
                            حداقل ۲ حرف
                          </span>
                        )}
                      </div>

                      <div 
                        className={`flex items-center bg-slate-900 border rounded-lg overflow-hidden transition ${
                          isSlugTouched && slugStatus === 'available' 
                            ? 'border-emerald-500/80 bg-emerald-950/10' 
                            : isSlugTouched && slugStatus === 'taken' 
                            ? 'border-red-500/80 bg-red-950/10' 
                            : 'border-slate-800 focus-within:border-blue-500'
                        }`}
                        dir="ltr"
                      >
                        <span className="px-2.5 py-2 bg-slate-800/80 text-slate-400 font-mono text-xs border-r border-slate-700/80 select-none shrink-0 dir-ltr">
                          {getCardBaseUrl().replace(/^https?:\/\//, '')}/
                        </span>
                        <input 
                          type="text" 
                          dir="ltr"
                          value={editingCard.slug || ''} 
                          onFocus={() => setIsSlugTouched(true)}
                          onChange={(e) => {
                            setIsSlugTouched(true);
                            setEditingCard({ ...editingCard, slug: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') });
                          }}
                          className="w-full px-2.5 py-2 bg-transparent text-left font-mono text-xs text-white focus:outline-none"
                          placeholder="ali-alavi"
                        />
                      </div>

                      {/* Helper status text */}
                      <div className="h-4 flex items-center">
                        {isSlugTouched && slugStatus === 'available' && (
                          <p className="text-[10px] text-emerald-400 font-medium dir-ltr text-right truncate w-full">
                            ✓ آدرس نهایی: <span className="font-mono underline">{getCardBaseUrl()}/{editingCard.slug}</span>
                          </p>
                        )}
                        {isSlugTouched && slugStatus === 'taken' && (
                          <p className="text-[10px] text-red-400 font-medium truncate w-full">
                            ✕ این لینک قبلاً ثبت شده است. لطفاً لینک دیگری تایپ کنید.
                          </p>
                        )}
                        {isSlugTouched && slugStatus === 'too_short' && (
                          <p className="text-[10px] text-amber-400 font-medium truncate w-full">
                            ⚠ حداقل ۲ کاراکتر انگلیسی وارد کنید.
                          </p>
                        )}
                        {(!isSlugTouched || slugStatus === 'empty') && (
                          <p className="text-[10px] text-slate-500 truncate w-full">
                            فقط حروف انگلیسی، اعداد و خط تیره (-) | نمونه: ali-alavi
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">وضعیت نمایش کارت:</label>
                      <select 
                        value={editingCard.status || 'draft'}
                        onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                      >
                        <option value="draft">پیش‌نویس (خصوصی)</option>
                        <option value="published">منتشر شده (عمومی)</option>
                      </select>
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">سمت شغلی:</label>
                      <input 
                        type="text" 
                        value={editingCard.job_title || ''} 
                        onChange={(e) => setEditingCard({ ...editingCard, job_title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">نام شرکت / برند:</label>
                      <input 
                        type="text" 
                        value={editingCard.company || ''} 
                        onChange={(e) => setEditingCard({ ...editingCard, company: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                      />
                    </div>
                  </div>

                  {/* Profile Image & Cover Image Direct Upload */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Profile Image Direct Upload */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">تصویر اصلی پروفایل:</label>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) {
                            setPendingProfileCropFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => document.getElementById('profile-file-input')?.click()}
                        className="h-28 border-2 border-dashed border-slate-800 hover:border-blue-500 bg-slate-900 rounded-lg flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden group p-2 text-center"
                      >
                        <input 
                          id="profile-file-input"
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setPendingProfileCropFile(e.target.files[0]);
                            }
                            e.target.value = '';
                          }}
                          className="hidden" 
                        />
                        
                        {uploadingProfile ? (
                          <div className="flex flex-col items-center gap-1">
                            <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                            <span className="text-[10px] text-slate-400">در حال آپلود...</span>
                          </div>
                        ) : editingCard.profile_image ? (
                          <>
                            <img 
                              src={getImageUrl(editingCard.profile_image)} 
                              alt="Profile" 
                              className="w-full h-full object-cover rounded" 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <span className="text-[10px] text-white bg-blue-600 px-2 py-1 rounded">تغییر تصویر</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-slate-500">
                            <User className="h-6 w-6" />
                            <span className="text-[10px] leading-tight">برای بارگذاری کلیک کنید یا بکشید اینجا</span>
                            <span className="text-[8px] text-slate-600">فرمت‌های مجاز: JPG, PNG</span>
                          </div>
                        )}
                      </div>
                      {editingCard.profile_image && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCard({ ...editingCard, profile_image: '' });
                          }}
                          className="text-[10px] text-red-400 hover:underline mt-1"
                        >
                          حذف تصویر
                        </button>
                      )}
                    </div>

                    {/* Cover Image Direct Upload & URL */}
                    <div className="space-y-2">
                      <label className="font-bold text-slate-400">تصویر کاور:</label>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) {
                            handleFileUpload(e.dataTransfer.files[0], 'cover');
                          }
                        }}
                        onClick={() => document.getElementById('cover-file-input')?.click()}
                        className="h-28 border-2 border-dashed border-slate-800 hover:border-blue-500 bg-slate-900 rounded-lg flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden group p-2 text-center"
                      >
                        <input 
                          id="cover-file-input"
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], 'cover');
                            }
                            e.target.value = '';
                          }}
                          className="hidden" 
                        />
                        
                        {uploadingCover ? (
                          <div className="flex flex-col items-center gap-1">
                            <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                            <span className="text-[10px] text-slate-400">در حال آپلود...</span>
                          </div>
                        ) : editingCard.cover_image ? (
                          <>
                            <img 
                              src={getImageUrl(editingCard.cover_image)} 
                              alt="Cover" 
                              className="w-full h-full object-cover rounded" 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <span className="text-[10px] text-white bg-blue-600 px-2 py-1 rounded">تغییر کاور</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-slate-500">
                            <Palette className="h-6 w-6" />
                            <span className="text-[10px] leading-tight">برای بارگذاری تصویر کلیک کنید یا بکشید اینجا</span>
                            <span className="text-[8px] text-slate-600">فرمت‌های مجاز: JPG, PNG</span>
                          </div>
                        )}
                      </div>

                      {/* Direct URL input for Cover Image */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-slate-400">یا لینک مستقیم تصویر کاور (URL):</span>
                        <input 
                          type="text"
                          placeholder="https://..."
                          value={editingCard.cover_image || ''}
                          onChange={(e) => setEditingCard({ ...editingCard, cover_image: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-white font-mono dir-ltr text-left"
                        />
                      </div>

                      {editingCard.cover_image && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCard({ ...editingCard, cover_image: '' });
                          }}
                          className="text-[10px] text-red-400 hover:underline mt-1"
                        >
                          حذف تصویر کاور
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Biography */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">درباره من (بیوگرافی):</label>
                    <textarea 
                      rows={3}
                      value={editingCard.bio || ''} 
                      onChange={(e) => setEditingCard({ ...editingCard, bio: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                    />
                  </div>

                  {/* Choose Visual Template */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-400 block">انتخاب قالب ظاهری کارت (Template):</label>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map((temp) => (
                        <div 
                          key={temp.id}
                          onClick={() => setEditingCard({ ...editingCard, template_id: temp.id })}
                          className={`p-3 rounded-xl border text-right cursor-pointer transition ${
                            editingCard.template_id === temp.id 
                            ? 'border-blue-500 bg-blue-500/10' 
                            : 'border-slate-850 bg-slate-900/40 hover:bg-slate-900'
                          }`}
                        >
                          <span className="font-bold text-white block text-xs">{temp.name}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block">{temp.is_premium ? 'طرح ویژه (VIP)' : 'طرح استاندارد'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CUSTOM COLORS */}
                  {(() => {
                    const activeDefaults = getTemplateDefaultColors(editingCard.template_id, templates);
                    const curPrimary = editingCard.custom_colors?.primary?.trim() ? editingCard.custom_colors.primary : activeDefaults.primary;
                    const curSecondary = editingCard.custom_colors?.secondary?.trim() ? editingCard.custom_colors.secondary : activeDefaults.secondary;
                    const curText = editingCard.custom_colors?.text?.trim() ? editingCard.custom_colors.text : activeDefaults.text;
                    const curCardBg = editingCard.custom_colors?.card_bg?.trim() ? editingCard.custom_colors.card_bg : activeDefaults.card_bg;
                    const curBg = editingCard.custom_colors?.background?.trim() ? editingCard.custom_colors.background : activeDefaults.background;

                    return (
                      <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                            <Palette className="h-4 w-4 text-blue-400" />
                            تنظیمات رنگ اختصاصی کارت
                          </h5>
                          <button
                            type="button"
                            onClick={() => setEditingCard({ ...editingCard, custom_colors: {} })}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-medium hover:underline flex items-center gap-1 transition"
                            title="بازنشانی رنگ‌ها به حالت اولیه قالب"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>بازنشانی به رنگ‌های اصلی قالب</span>
                          </button>
                        </div>

                        {/* Palette presets */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-bold block">پالت‌های آماده با یک کلیک:</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingCard({
                                ...editingCard,
                                custom_colors: { primary: '#2563eb', secondary: '#3b82f6', text: '#1e293b', card_bg: '#ffffff', background: '#f8fafc' }
                              })}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-blue-400 hover:border-blue-500 flex items-center gap-1"
                            >
                              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                              آبی مدرن
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCard({
                                ...editingCard,
                                custom_colors: { primary: '#10b981', secondary: '#059669', text: '#f1f5f9', card_bg: '#064e3b', background: '#022c22' }
                              })}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-emerald-400 hover:border-emerald-500 flex items-center gap-1"
                            >
                              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                              زمردی تاریک
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCard({
                                ...editingCard,
                                custom_colors: { primary: '#d97706', secondary: '#f59e0b', text: '#fef3c7', card_bg: '#1c1917', background: '#0c0a09' }
                              })}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-amber-400 hover:border-amber-500 flex items-center gap-1"
                            >
                              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                              طلایی لاکچری
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCard({
                                ...editingCard,
                                custom_colors: { primary: '#a855f7', secondary: '#ec4899', text: '#f8fafc', card_bg: '#1e1b4b', background: '#0f172a' }
                              })}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-purple-400 hover:border-purple-500 flex items-center gap-1"
                            >
                              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                              نئون بنفش
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCard({
                                ...editingCard,
                                custom_colors: { primary: '#475569', secondary: '#64748b', text: '#0f172a', card_bg: '#f1f5f9', background: '#ffffff' }
                              })}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-slate-300 hover:border-slate-500 flex items-center gap-1"
                            >
                              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                              مینیمال روشن
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block">رنگ اصلی (Primary):</span>
                            <div className="flex gap-1">
                              <input 
                                type="color" 
                                value={curPrimary} 
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), primary: e.target.value }
                                })}
                                className="h-7 w-7 rounded bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={curPrimary}
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), primary: e.target.value }
                                })}
                                className="w-full px-1 py-0.5 bg-slate-950 text-[10px] font-mono rounded text-white dir-ltr text-center"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block">رنگ ثانویه (Secondary):</span>
                            <div className="flex gap-1">
                              <input 
                                type="color" 
                                value={curSecondary} 
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), secondary: e.target.value }
                                })}
                                className="h-7 w-7 rounded bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={curSecondary}
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), secondary: e.target.value }
                                })}
                                className="w-full px-1 py-0.5 bg-slate-950 text-[10px] font-mono rounded text-white dir-ltr text-center"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block">رنگ متن اصلی (Text):</span>
                            <div className="flex gap-1">
                              <input 
                                type="color" 
                                value={curText} 
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), text: e.target.value }
                                })}
                                className="h-7 w-7 rounded bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={curText}
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), text: e.target.value }
                                })}
                                className="w-full px-1 py-0.5 bg-slate-950 text-[10px] font-mono rounded text-white dir-ltr text-center"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block">رنگ بدنه کارت (Card):</span>
                            <div className="flex gap-1">
                              <input 
                                type="color" 
                                value={curCardBg} 
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), card_bg: e.target.value }
                                })}
                                className="h-7 w-7 rounded bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={curCardBg}
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), card_bg: e.target.value }
                                })}
                                className="w-full px-1 py-0.5 bg-slate-950 text-[10px] font-mono rounded text-white dir-ltr text-center"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block">رنگ پس‌زمینه (Background):</span>
                            <div className="flex gap-1">
                              <input 
                                type="color" 
                                value={curBg} 
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), background: e.target.value }
                                })}
                                className="h-7 w-7 rounded bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={curBg}
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), background: e.target.value }
                                })}
                                className="w-full px-1 py-0.5 bg-slate-950 text-[10px] font-mono rounded text-white dir-ltr text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {editorTab === 'contact' && (
                <div className="space-y-4 pt-2">
                  {/* SOCIAL LINKS */}
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Link2 className="h-4 w-4 text-blue-400" />
                      آدرس شبکه‌های اجتماعی و تماس
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">تلفن ثابت:</span>
                        <input 
                          type="text" 
                          value={editingCard.social_links?.phone || ''} 
                          onChange={(e) => setEditingCard({
                            ...editingCard,
                            social_links: { ...(editingCard.social_links || {}), phone: toPersianDigits(e.target.value) }
                          })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">تلفن همراه (موبایل):</span>
                        <input 
                          type="text" 
                          value={editingCard.social_links?.mobile || ''} 
                          onChange={(e) => setEditingCard({
                            ...editingCard,
                            social_links: { ...(editingCard.social_links || {}), mobile: toPersianDigits(e.target.value) }
                          })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">ایمیل:</span>
                        <input 
                          type="text" 
                          value={editingCard.social_links?.email || ''} 
                          onChange={(e) => setEditingCard({
                            ...editingCard,
                            social_links: { ...(editingCard.social_links || {}), email: e.target.value }
                          })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">تلگرام (بدون @):</span>
                        <input 
                          type="text" 
                          value={editingCard.social_links?.telegram || ''} 
                          onChange={(e) => setEditingCard({
                            ...editingCard,
                            social_links: { ...(editingCard.social_links || {}), telegram: e.target.value }
                          })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">اینستاگرام (بدون @):</span>
                        <input 
                          type="text" 
                          value={editingCard.social_links?.instagram || ''} 
                          onChange={(e) => setEditingCard({
                            ...editingCard,
                            social_links: { ...(editingCard.social_links || {}), instagram: e.target.value }
                          })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>
                    </div>

                    {/* MULTIPLE PHONE NUMBERS */}
                    <div className="border-t border-slate-800 pt-3 space-y-2">
                      <span className="text-[10px] font-bold text-white block">شماره تماس‌های ثابت/همراه اضافی دیگر:</span>
                      
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="مثلاً: ۰۲۱۸۸۸۸۸۸۸۸ یا ۰۹۱۲۳۴۵۶۷۸۹"
                          value={newExtraPhone}
                          onChange={(e) => setNewExtraPhone(toPersianDigits(e.target.value))}
                          className="flex-grow px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newExtraPhone.trim()) return;
                            const currentExtra = editingCard.social_links?.extra_phones || [];
                            setEditingCard({
                              ...editingCard,
                              social_links: {
                                ...(editingCard.social_links || {}),
                                extra_phones: [...currentExtra, newExtraPhone.trim()]
                              }
                            });
                            setNewExtraPhone('');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-[11px] text-white font-bold transition"
                        >
                          افزودن شماره
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(editingCard.social_links?.extra_phones || []).map((ph, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded-full">
                            <span>{ph}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentExtra = editingCard.social_links?.extra_phones || [];
                                setEditingCard({
                                  ...editingCard,
                                  social_links: {
                                    ...(editingCard.social_links || {}),
                                    extra_phones: currentExtra.filter((_, i) => i !== idx)
                                  }
                                });
                              }}
                              className="text-red-400 hover:text-red-300 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* PHYSICAL ADDRESS */}
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      آدرس و نشانی متنی
                    </h5>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">نشانی دقیق پستی / دفتر کار شما:</label>
                      <textarea 
                        rows={3}
                        value={editingCard.address || ''} 
                        onChange={(e) => setEditingCard({ ...editingCard, address: e.target.value })}
                        placeholder="تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-white text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editorTab === 'maps' && (
                <div className="space-y-4 pt-2">
                  {/* MAPS LINKS */}
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      لینک‌های آدرس روی نقشه (نشان، بلد، ویز و گوگل مپ)
                    </h5>
                    <p className="text-[10px] text-slate-400">لینک مستقیم موقعیت مکانی خود را روی نقشه‌های مختلف قرار دهید تا کاربران بتوانند به راحتی شما را مسیریابی کنند.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">نقشه نشان (Neshan):</span>
                        <input 
                          type="text" 
                          value={editingCard.neshan || ''} 
                          onChange={(e) => setEditingCard({ ...editingCard, neshan: e.target.value })}
                          placeholder="https://neshan.org/maps/..."
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">نقشه بلد (Balad):</span>
                        <input 
                          type="text" 
                          value={editingCard.balad || ''} 
                          onChange={(e) => setEditingCard({ ...editingCard, balad: e.target.value })}
                          placeholder="https://balad.ir/location?..."
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">مسیریاب ویز (Waze):</span>
                        <input 
                          type="text" 
                          value={editingCard.waze || ''} 
                          onChange={(e) => setEditingCard({ ...editingCard, waze: e.target.value })}
                          placeholder="https://waze.com/ul?..."
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">گوگل مپ (Google Maps):</span>
                        <input 
                          type="text" 
                          value={editingCard.googlemap || ''} 
                          onChange={(e) => setEditingCard({ ...editingCard, googlemap: e.target.value })}
                          placeholder="https://maps.google.com/..."
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editorTab === 'bank' && (
                <div className="space-y-4 pt-2">
                  {/* FINANCIAL INFO */}
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-blue-400" />
                      اطلاعات حساب و کارت بانکی
                    </h5>
                    <p className="text-[10px] text-slate-400">با افزودن این اطلاعات، مخاطبان به سادگی می‌توانند مبالغ را برای شما کارت به کارت یا انتقال دهند.</p>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">شماره کارت بانکی (۱۶ رقمی):</span>
                        <input 
                          type="text" 
                          maxLength={19}
                          value={editingCard.bank_card || ''} 
                          onChange={(e) => setEditingCard({ ...editingCard, bank_card: toPersianDigits(e.target.value) })}
                          placeholder="۶۰۳۷۹۹۱۸۱۲۳۴۵۶۷۸"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">شماره حساب بانکی:</span>
                        <input 
                          type="text" 
                          value={editingCard.bank_account || ''} 
                          onChange={(e) => setEditingCard({ ...editingCard, bank_account: toPersianDigits(e.target.value) })}
                          placeholder="مثلاً: ۱-۲۳۴۵۶-..."
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">شماره شبا (IBAN - با IR شروع می‌شود):</span>
                        <input 
                          type="text" 
                          maxLength={26}
                          value={editingCard.bank_shaba || ''} 
                          onChange={(e) => setEditingCard({ ...editingCard, bank_shaba: toPersianDigits(e.target.value) })}
                          placeholder="IR1201200000000123456789"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editorTab === 'advanced' && (
                <div className="space-y-4 pt-2">
                  {/* CUSTOM BUTTONS CREATOR */}
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-blue-400" />
                      ایجاد دکمه‌های لینک دلخواه (مانند کاتالوگ، رزومه، وقت قبلی)
                    </h5>

                    <div className="space-y-3">
                      {/* list existing buttons */}
                      {(editingCard.custom_buttons || []).map((btn) => (
                        <div key={btn.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[11px]">
                          <span className="text-white">{btn.label} <span className="opacity-40 font-mono">({btn.url})</span></span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveCustomBtn(btn.id)}
                            className="text-red-400 hover:text-red-300 font-bold"
                          >
                            حذف
                          </button>
                        </div>
                      ))}

                      {/* Inputs row */}
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="عنوان دکمه (مثلا: دانلود کاتالوگ شرکت)"
                          value={newBtnLabel}
                          onChange={(e) => setNewBtnLabel(e.target.value)}
                          className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-white"
                        />
                        <input 
                          type="text" 
                          placeholder="آدرس لینک (URL)"
                          value={newBtnUrl}
                          onChange={(e) => setNewBtnUrl(e.target.value)}
                          className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono text-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCustomBtn}
                        className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-[10px] font-bold border border-blue-600/20 transition"
                      >
                        افزودن دکمه جدید
                      </button>
                    </div>
                  </div>

                  {/* CSS CUSTOM BLOCK */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400 flex items-center gap-1.5">
                      <Code className="h-4 w-4 text-amber-500" />
                      تزریق کدهای CSS اختصاصی (مخصوص طراحان حرفه‌ای):
                    </label>
                    <textarea 
                      rows={3}
                      placeholder=".my-card { filter: blur(0px); } ... "
                      value={editingCard.custom_css || ''} 
                      onChange={(e) => setEditingCard({ ...editingCard, custom_css: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-left font-mono text-[11px] text-white"
                    />
                  </div>
                </div>
              )}

              {editorTab === 'layout' && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <GripVertical className="h-4 w-4 text-amber-400" />
                          مدیریت چیدمان و اولویت بخش‌ها (Drag & Drop Builder)
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1">
                          با جابه‌جایی آیکون یا دکمه‌های بالا/پایین، چیدمان دقیق کارت خود را شخصی‌سازی کنید.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetSectionOrders}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium flex items-center gap-1 transition"
                        title="بازنشانی چیدمان به حالت پیش‌فرض"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                        <span>بازنشانی پیش‌فرض</span>
                      </button>
                    </div>

                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="card-sections-droppable">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-2.5 p-1 rounded-xl transition ${
                              snapshot.isDraggingOver ? 'bg-blue-950/20 border border-blue-500/30' : ''
                            }`}
                          >
                            {getSectionOrders(editingCard).map((secId, index) => {
                              const def = SECTION_DEFINITIONS.find((d) => d.id === secId) || {
                                id: secId,
                                title: secId,
                                description: 'بخش سفارشی کارت',
                                icon: 'Layers',
                              };

                              const renderIcon = () => {
                                switch (secId) {
                                  case 'save_contact':
                                    return <Download className="h-4 w-4 text-amber-400 shrink-0" />;
                                  case 'bio':
                                    return <AlignRight className="h-4 w-4 text-sky-400 shrink-0" />;
                                  case 'primary_actions':
                                    return <Phone className="h-4 w-4 text-emerald-400 shrink-0" />;
                                  case 'social_links':
                                    return <Share2 className="h-4 w-4 text-pink-400 shrink-0" />;
                                  case 'custom_buttons':
                                    return <ExternalLink className="h-4 w-4 text-violet-400 shrink-0" />;
                                  case 'location':
                                    return <MapPin className="h-4 w-4 text-red-400 shrink-0" />;
                                  case 'bank_info':
                                    return <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />;
                                  default:
                                    return <Layers className="h-4 w-4 text-blue-400 shrink-0" />;
                                }
                              };

                              return (
                                <Draggable key={secId} draggableId={secId} index={index}>
                                  {(draggableProvided, draggableSnapshot) => (
                                    <div
                                      ref={draggableProvided.innerRef}
                                      {...draggableProvided.draggableProps}
                                      className={`p-3 bg-slate-950 border rounded-xl flex items-center justify-between gap-3 transition ${
                                        draggableSnapshot.isDragging
                                          ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02] bg-slate-900 z-50'
                                          : 'border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                          {...draggableProvided.dragHandleProps}
                                          className="p-1.5 text-slate-500 hover:text-amber-400 cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-900 transition"
                                          title="برای جابه‌جایی بکشید"
                                        >
                                          <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                                          {renderIcon()}
                                        </div>
                                        <div className="min-w-0 text-right">
                                          <h6 className="text-xs font-bold text-white truncate">{def.title}</h6>
                                          <p className="text-[10px] text-slate-400 truncate">{def.description}</p>
                                        </div>
                                      </div>

                                      {/* Quick Up/Down Buttons */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleMoveSection(index, 'up')}
                                          disabled={index === 0}
                                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-900 rounded-lg transition"
                                          title="انتقال به بالا"
                                        >
                                          <MoveUp className="h-4 w-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleMoveSection(index, 'down')}
                                          disabled={index === getSectionOrders(editingCard).length - 1}
                                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-900 rounded-lg transition"
                                          title="انتقال به پایین"
                                        >
                                          <MoveDown className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Live mobile preview iframe simulation */}
          <div className="lg:col-span-5 flex flex-col justify-start items-center space-y-4">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-emerald-400 animate-pulse" />
              شبیه‌ساز پیش‌نمایش زنده در گوشی مخاطب:
            </span>

            <div className="w-[300px] h-[580px] bg-slate-950 border-8 border-slate-800 rounded-[36px] shadow-2xl relative overflow-hidden flex flex-col shrink-0">
              {/* Notch representation */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-950 mr-1"></div>
                <div className="h-1 w-8 rounded-full bg-slate-900"></div>
              </div>

              {(() => {
                const templateId = editingCard.template_id;
                const cleanTId = (templateId || '').toLowerCase();
                const cleanTUuid = toUUID(templateId);

                const isClassic = !templateId || cleanTId === 'temp-1' || cleanTId === 'classic' || cleanTUuid === '11111111-1111-1111-1111-111111111111';
                const isNeonGlass = cleanTId === 'temp-2' || cleanTId === 'neon-glass' || cleanTUuid === '22222222-2222-2222-2222-222222222222';
                const isMinimal = cleanTId === 'temp-3' || cleanTId === 'minimal' || cleanTUuid === '33333333-3333-3333-3333-333333333333';
                const isLuxuryDark = cleanTId === 'temp-4' || cleanTId === 'luxury-dark' || cleanTUuid === '44444444-4444-4444-4444-444444444444';

                const tmplDefaults = getTemplateDefaultColors(templateId, templates);

                const primaryColor = editingCard.custom_colors?.primary?.trim() ? editingCard.custom_colors.primary : tmplDefaults.primary;
                const secondaryColor = editingCard.custom_colors?.secondary?.trim() ? editingCard.custom_colors.secondary : tmplDefaults.secondary;
                const cardBg = editingCard.custom_colors?.card_bg?.trim() ? editingCard.custom_colors.card_bg : tmplDefaults.card_bg;
                const textColor = editingCard.custom_colors?.text?.trim() ? editingCard.custom_colors.text : tmplDefaults.text;
                const bgColor = editingCard.custom_colors?.background?.trim() ? editingCard.custom_colors.background : tmplDefaults.background;

                // Check if it is a custom template from Directus (not one of the 4 hardcoded)
                const isCustomTemplate = !isClassic && !isNeonGlass && !isMinimal && !isLuxuryDark;
                const activeTemplate = templates.find(t => toUUID(t.id) === toUUID(templateId));

                return (
                  <div className="flex-grow overflow-y-auto flex flex-col font-sans select-none transition-colors duration-200" dir="rtl" style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'var(--font-vazirmatn), sans-serif', fontFeatureSettings: "'ss01'" }}>
                    {/* Inject user's custom CSS live inside preview */}
                    {editingCard.custom_css && (
                      <style dangerouslySetInnerHTML={{ __html: editingCard.custom_css }} />
                    )}

                      {/* Classic Style */}
                      {isClassic && (
                        <div className="w-full min-h-full bg-slate-100 text-slate-850 flex flex-col font-sans" style={{ backgroundColor: cardBg, color: textColor }}>
                          {/* Cover photo */}
                          <div className="h-20 bg-slate-300 relative shrink-0 overflow-hidden">
                            <img 
                              src={getImageUrl(editingCard.cover_image) || '/cover-fallback.avif'} 
                              alt="cover" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30"></div>
                          </div>

                          {/* Profile Pic overlapping cover */}
                          <div className="px-3 -mt-6 relative z-10 flex justify-between items-end">
                            <div className="h-14 w-14 rounded-xl border-2 border-white overflow-hidden shadow-sm bg-white">
                              <img 
                                src={getImageUrl(editingCard.profile_image) || '/profile-fallback.jpg'} 
                                alt="profile" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[7px] bg-slate-200/80 px-1.5 py-0.5 rounded-full text-slate-600 font-bold flex items-center gap-1">
                              <Eye className="h-2.5 w-2.5" />
                              {(editingCard.views_count || 0).toLocaleString('fa-IR')} بازدید
                            </span>
                          </div>

                          {/* Info & Dynamic Ordered Sections */}
                          <div className="p-3 space-y-3 flex-grow overflow-y-auto">
                            <div>
                              <h4 className="text-xs font-black" style={{ color: textColor }}>{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                              <p className="text-[9px] font-bold mt-0.5" style={{ color: primaryColor }}>{editingCard.job_title || 'سمت شغلی'}</p>
                              <p className="text-[8px] opacity-70" style={{ color: textColor }}>{editingCard.company || 'نام برند یا شرکت'}</p>
                            </div>

                            {getSectionOrders(editingCard).map((secKey) => {
                              switch (secKey) {
                                case 'save_contact':
                                  return (
                                    <div 
                                      key="sec_classic_save"
                                      onClick={() => editingCard && saveCardToContacts(editingCard)}
                                      className="w-full py-1.5 rounded-lg text-white flex items-center justify-center gap-1 text-[8px] font-bold shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition" 
                                      style={{ backgroundColor: primaryColor }}
                                    >
                                      <Download className="h-2.5 w-2.5" />
                                      <span>ذخیره در مخاطبین گوشی</span>
                                    </div>
                                  );
                                case 'bio':
                                  return editingCard.bio ? (
                                    <div key="sec_classic_bio" className="p-2 bg-white/60 rounded-xl text-[8px] leading-relaxed border border-slate-200/50 opacity-90 whitespace-pre-line" style={{ color: textColor }}>
                                      {editingCard.bio}
                                    </div>
                                  ) : null;
                                case 'primary_actions':
                                  return (editingCard.social_links?.mobile || (editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.length > 0)) ? (
                                    <div key="sec_classic_primary" className="space-y-1 pt-1.5 border-t border-slate-200/50">
                                      <h5 className="text-[7.5px] font-bold opacity-60">تلفن‌های همراه</h5>
                                      <div className="space-y-1">
                                        {editingCard.social_links?.mobile && (
                                          <div className="flex items-center justify-between p-1 bg-white border border-slate-200 rounded-lg text-[7px] font-bold" style={{ color: textColor }}>
                                            <span>موبایل اصلی:</span>
                                            <span className="font-mono text-slate-500">{editingCard.social_links.mobile}</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.map((ph: string, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between p-1 bg-white border border-slate-200 rounded-lg text-[7px] font-bold" style={{ color: textColor }}>
                                            <span>تلفن جانبی {idx + 1}:</span>
                                            <span className="font-mono text-slate-500">{ph}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null;
                                case 'social_links':
                                  return (
                                    <div key="sec_classic_social" className="space-y-1">
                                      <h5 className="text-[7.5px] font-bold opacity-60">راه‌های ارتباطی</h5>
                                      <div className="grid grid-cols-4 gap-1">
                                        {editingCard.social_links?.phone && (
                                          <div className="flex flex-col items-center justify-center p-1 bg-white/80 border border-slate-200/40 rounded-lg text-[6.5px] font-bold shadow-sm" style={{ color: textColor }}>
                                            <Phone className="h-3 w-3 text-blue-500 mb-0.5" />
                                            <span>تماس</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.mobile && (
                                          <div className="flex flex-col items-center justify-center p-1 bg-white/80 border border-slate-200/40 rounded-lg text-[6.5px] font-bold shadow-sm" style={{ color: textColor }}>
                                            <Phone className="h-3 w-3 text-emerald-500 mb-0.5" />
                                            <span>موبایل</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.email && (
                                          <div className="flex flex-col items-center justify-center p-1 bg-white/80 border border-slate-200/40 rounded-lg text-[6.5px] font-bold shadow-sm" style={{ color: textColor }}>
                                            <Mail className="h-3 w-3 text-blue-400 mb-0.5" />
                                            <span>ایمیل</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.telegram && (
                                          <div className="flex flex-col items-center justify-center p-1 bg-white/80 border border-slate-200/40 rounded-lg text-[6.5px] font-bold shadow-sm" style={{ color: textColor }}>
                                            <Send className="h-3 w-3 text-sky-500 mb-0.5" />
                                            <span>تلگرام</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.whatsapp && (
                                          <div className="flex flex-col items-center justify-center p-1 bg-white/80 border border-slate-200/40 rounded-lg text-[6.5px] font-bold shadow-sm" style={{ color: textColor }}>
                                            <MessageCircle className="h-3 w-3 text-emerald-500 mb-0.5" />
                                            <span>واتساپ</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.instagram && (
                                          <div className="flex flex-col items-center justify-center p-1 bg-white/80 border border-slate-200/40 rounded-lg text-[6.5px] font-bold shadow-sm" style={{ color: textColor }}>
                                            <Instagram className="h-3 w-3 text-pink-500 mb-0.5" />
                                            <span>اینستا</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.linkedin && (
                                          <div className="flex flex-col items-center justify-center p-1 bg-white/80 border border-slate-200/40 rounded-lg text-[6.5px] font-bold shadow-sm" style={{ color: textColor }}>
                                            <Linkedin className="h-3 w-3 text-indigo-600 mb-0.5" />
                                            <span>لینکدین</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.website && (
                                          <div className="flex flex-col items-center justify-center p-1 bg-white/80 border border-slate-200/40 rounded-lg text-[6.5px] font-bold shadow-sm" style={{ color: textColor }}>
                                            <Globe className="h-3 w-3 text-violet-600 mb-0.5" />
                                            <span>وبسایت</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                case 'custom_buttons':
                                  return (editingCard.custom_buttons && editingCard.custom_buttons.length > 0) ? (
                                    <div key="sec_classic_custom" className="space-y-1 pt-1.5 border-t border-slate-200/50">
                                      <h5 className="text-[7.5px] font-bold opacity-60">لینک‌های کاربردی</h5>
                                      {editingCard.custom_buttons.map((btn) => (
                                        <div 
                                          key={btn.id}
                                          className="p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-[7.5px] font-bold shadow-sm"
                                          style={{ borderRightColor: primaryColor, borderRightWidth: '3px', color: textColor }}
                                        >
                                          <span>{btn.label}</span>
                                          <span className="opacity-40">➔</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null;
                                case 'location':
                                  return (editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap || editingCard.address) ? (
                                    <div key="sec_classic_loc" className="space-y-1 pt-1.5 border-t border-slate-200/50">
                                      {(editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap) && (
                                        <>
                                          <h5 className="text-[7.5px] font-bold opacity-60">مسیریابی روی نقشه</h5>
                                          <div className="grid grid-cols-2 gap-1 mb-1">
                                            {editingCard.neshan && (
                                              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg text-[7px] font-bold" style={{ color: textColor }}>
                                                <MapPin className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                                                <span>نشان</span>
                                              </div>
                                            )}
                                            {editingCard.balad && (
                                              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg text-[7px] font-bold" style={{ color: textColor }}>
                                                <MapPin className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                                                <span>بلد</span>
                                              </div>
                                            )}
                                            {editingCard.waze && (
                                              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg text-[7px] font-bold" style={{ color: textColor }}>
                                                <MapPin className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                                                <span>ویز</span>
                                              </div>
                                            )}
                                            {editingCard.googlemap && (
                                              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg text-[7px] font-bold" style={{ color: textColor }}>
                                                <MapPin className="h-2.5 w-2.5 text-red-500 shrink-0" />
                                                <span>گوگل مپ</span>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                      {editingCard.address && (
                                        <>
                                          <h5 className="text-[7.5px] font-bold opacity-60 flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                                            <span>نشانی و دفتر مرکزی</span>
                                          </h5>
                                          <p className="p-2 bg-white/80 border border-slate-200/40 rounded-lg text-[7px] text-slate-700 leading-relaxed text-center">
                                            {editingCard.address}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  ) : null;
                                case 'bank_info':
                                  return (editingCard.bank_card || editingCard.bank_account || editingCard.bank_shaba) ? (
                                    <div key="sec_classic_bank" className="space-y-1.5 pt-1.5 border-t border-slate-200/50">
                                      <h5 className="text-[7.5px] font-bold opacity-60 flex items-center gap-1">
                                        <CreditCard className="h-3 w-3 text-[#e2b53e] shrink-0" />
                                        <span>شماره حساب و کارت</span>
                                      </h5>
                                      <div className="space-y-1">
                                        {editingCard.bank_card && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_card || '', 'bank_card')}
                                            className="p-1.5 bg-white/80 hover:bg-white border border-slate-200/40 rounded-lg flex items-center justify-between text-[7px] cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="opacity-60 font-bold text-emerald-600">{previewCopiedField === 'bank_card' ? 'کپی شد!' : 'کارت:'}</span>
                                            <span className="font-mono font-bold text-slate-700">{editingCard.bank_card}</span>
                                          </div>
                                        )}
                                        {editingCard.bank_account && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_account || '', 'bank_account')}
                                            className="p-1.5 bg-white/80 hover:bg-white border border-slate-200/40 rounded-lg flex items-center justify-between text-[7px] cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="opacity-60 font-bold text-emerald-600">{previewCopiedField === 'bank_account' ? 'کپی شد!' : 'حساب:'}</span>
                                            <span className="font-mono font-bold text-slate-700">{editingCard.bank_account}</span>
                                          </div>
                                        )}
                                        {editingCard.bank_shaba && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_shaba || '', 'bank_shaba')}
                                            className="p-1.5 bg-white/80 hover:bg-white border border-slate-200/40 rounded-lg flex items-center justify-between text-[7px] cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="opacity-60 font-bold text-emerald-600">{previewCopiedField === 'bank_shaba' ? 'کپی شد!' : 'شبا:'}</span>
                                            <span className="font-mono font-bold text-slate-700" dir="ltr">{editingCard.bank_shaba}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : null;
                                default:
                                  return null;
                              }
                            })}

                          </div>
                        </div>
                      )}

                      {/* Neon Glass Style */}
                      {isNeonGlass && (
                        <div className="w-full min-h-full bg-slate-950 text-slate-100 p-3 flex flex-col font-sans overflow-y-auto" style={{ backgroundColor: cardBg || '#0f172a', color: textColor || '#ffffff' }}>
                          <div className="p-3 bg-slate-900/80 border border-white/10 rounded-2xl relative overflow-hidden backdrop-blur space-y-3.5 flex-grow">
                            <div className="absolute top-0 right-0 h-10 w-10 bg-blue-500/10 rounded-full blur-xl"></div>
                            <div className="absolute bottom-0 left-0 h-10 w-10 bg-purple-500/10 rounded-full blur-xl"></div>

                            {/* Cover photo */}
                            <div className="h-16 bg-slate-800 rounded-xl overflow-hidden relative border border-white/10 shrink-0 shadow-md">
                              <img 
                                src={getImageUrl(editingCard.cover_image) || '/cover-fallback.avif'} 
                                alt="cover" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                            </div>

                            <div className="flex justify-between items-start">
                              <div className="h-12 w-12 rounded-xl border border-blue-500/30 overflow-hidden shrink-0 bg-zinc-950">
                                <img 
                                  src={getImageUrl(editingCard.profile_image) || '/profile-fallback.jpg'} 
                                  alt="profile" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[6px] text-blue-400 font-black tracking-widest bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Eye className="h-2 w-2 text-cyan-400" />
                                {(editingCard.views_count || 0).toLocaleString('fa-IR')} بازدید
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-white">{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                              <p className="text-[9px] text-blue-400 font-extrabold">{editingCard.job_title || 'سمت شغلی'}</p>
                              <p className="text-[8px] text-zinc-500 leading-tight">{editingCard.company || 'نام برند یا شرکت'}</p>
                            </div>

                            {editingCard.bio && (
                              <p className="text-[8px] text-zinc-400 leading-relaxed bg-zinc-950/60 p-2 border border-zinc-850 rounded-xl whitespace-pre-line">
                                {editingCard.bio}
                              </p>
                            )}

                            {/* VCF download */}
                            {/* DYNAMIC SECTIONS REORDERING ACCORDING TO getSectionOrders */}
                            {getSectionOrders(editingCard).map((secKey) => {
                              switch (secKey) {
                                case 'save_contact':
                                  return (
                                    <div 
                                      key="sec_neon_save"
                                      onClick={() => editingCard && saveCardToContacts(editingCard)}
                                      className="w-full py-1.5 rounded-lg text-slate-950 flex items-center justify-center gap-1 text-[8px] font-extrabold shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition shrink-0" 
                                      style={{ backgroundImage: `linear-gradient(to left, ${primaryColor}, ${secondaryColor})` }}
                                    >
                                      <Download className="h-2.5 w-2.5" />
                                      <span>ذخیره مستقیم شماره تلفن</span>
                                    </div>
                                  );
                                case 'bio':
                                  return editingCard.bio ? (
                                    <p key="sec_neon_bio" className="text-[8px] text-zinc-400 leading-relaxed bg-zinc-950/60 p-2 border border-zinc-850 rounded-xl whitespace-pre-line">
                                      {editingCard.bio}
                                    </p>
                                  ) : null;
                                case 'primary_actions':
                                  return (editingCard.social_links?.mobile || (editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.length > 0)) ? (
                                    <div key="sec_neon_primary" className="space-y-1.5 pt-1.5 border-t border-white/10">
                                      <h5 className="text-[7.5px] font-bold text-slate-400">تلفن‌های همراه دیگر</h5>
                                      <div className="space-y-1">
                                        {editingCard.social_links?.mobile && (
                                          <div className="flex items-center justify-between p-1 bg-white/5 border border-white/5 rounded-lg text-[7px] font-bold">
                                            <span>موبایل اصلی:</span>
                                            <span className="font-mono text-slate-300">{editingCard.social_links.mobile}</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.map((ph: string, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between p-1 bg-white/5 border border-white/5 rounded-lg text-[7px] font-bold">
                                            <span>تلفن جانبی {idx + 1}:</span>
                                            <span className="font-mono text-slate-300">{ph}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null;
                                case 'social_links':
                                  return (
                                    <div key="sec_neon_social" className="space-y-1.5">
                                      <h5 className="text-[7.5px] font-bold text-slate-400">راه‌های ارتباطی سریع</h5>
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {editingCard.social_links?.phone && (
                                          <div className="flex flex-col items-center justify-center p-1.5 bg-white/5 border border-white/5 rounded-lg text-[6.5px] font-bold">
                                            <Phone className="h-3 w-3 text-cyan-400 mb-0.5" />
                                            <span className="text-[5.5px] text-slate-400">تماس</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.email && (
                                          <div className="flex flex-col items-center justify-center p-1.5 bg-white/5 border border-white/5 rounded-lg text-[6.5px] font-bold">
                                            <Mail className="h-3 w-3 text-amber-400 mb-0.5" />
                                            <span className="text-[5.5px] text-slate-400">ایمیل</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.telegram && (
                                          <div className="flex flex-col items-center justify-center p-1.5 bg-white/5 border border-white/5 rounded-lg text-[6.5px] font-bold">
                                            <Send className="h-3 w-3 text-sky-400 mb-0.5" />
                                            <span className="text-[5.5px] text-slate-400">تلگرام</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.whatsapp && (
                                          <div className="flex flex-col items-center justify-center p-1.5 bg-white/5 border border-white/5 rounded-lg text-[6.5px] font-bold">
                                            <MessageCircle className="h-3 w-3 text-emerald-400 mb-0.5" />
                                            <span className="text-[5.5px] text-slate-400">واتساپ</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.instagram && (
                                          <div className="flex flex-col items-center justify-center p-1.5 bg-white/5 border border-white/5 rounded-lg text-[6.5px] font-bold">
                                            <Instagram className="h-3 w-3 text-pink-400 mb-0.5" />
                                            <span className="text-[5.5px] text-slate-400">اینستا</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.linkedin && (
                                          <div className="flex flex-col items-center justify-center p-1.5 bg-white/5 border border-white/5 rounded-lg text-[6.5px] font-bold">
                                            <Linkedin className="h-3 w-3 text-indigo-400 mb-0.5" />
                                            <span className="text-[5.5px] text-slate-400">لینکدین</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.website && (
                                          <div className="flex flex-col items-center justify-center p-1.5 bg-white/5 border border-white/5 rounded-lg text-[6.5px] font-bold">
                                            <Globe className="h-3 w-3 text-violet-400 mb-0.5" />
                                            <span className="text-[5.5px] text-slate-400">وبسایت</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                case 'custom_buttons':
                                  return (editingCard.custom_buttons && editingCard.custom_buttons.length > 0) ? (
                                    <div key="sec_neon_custom" className="space-y-1 pt-1.5 border-t border-white/10">
                                      <h5 className="text-[7.5px] font-bold text-slate-400">لینک‌های کاربردی</h5>
                                      {editingCard.custom_buttons.map((btn) => (
                                        <div 
                                          key={btn.id}
                                          className="p-1 bg-gradient-to-l from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg flex items-center justify-between text-[7.5px] font-bold text-blue-300"
                                        >
                                          <span>{btn.label}</span>
                                          <span className="text-purple-400">⚡</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null;
                                case 'location':
                                  return (editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap || editingCard.address) ? (
                                    <div key="sec_neon_loc" className="space-y-1.5 pt-1.5 border-t border-white/10">
                                      {(editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap) && (
                                        <>
                                          <h5 className="text-[7.5px] font-bold text-slate-400">مسیریابی روی نقشه</h5>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            {editingCard.neshan && (
                                              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-lg text-[7px] font-bold">
                                                <MapPin className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                                                <span>نشان</span>
                                              </div>
                                            )}
                                            {editingCard.balad && (
                                              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-lg text-[7px] font-bold">
                                                <MapPin className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                                                <span>بلد</span>
                                              </div>
                                            )}
                                            {editingCard.waze && (
                                              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-lg text-[7px] font-bold">
                                                <MapPin className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                                                <span>ویز</span>
                                              </div>
                                            )}
                                            {editingCard.googlemap && (
                                              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-lg text-[7px] font-bold">
                                                <MapPin className="h-2.5 w-2.5 text-red-400 shrink-0" />
                                                <span>گوگل مپ</span>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                      {editingCard.address && (
                                        <>
                                          <h5 className="text-[7.5px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                                            <span>نشانی و دفتر مرکزی</span>
                                          </h5>
                                          <p className="p-2 bg-white/5 border border-white/5 rounded-lg text-[7px] text-slate-300 leading-relaxed text-center">
                                            {editingCard.address}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  ) : null;
                                case 'bank_info':
                                  return (editingCard.bank_card || editingCard.bank_account || editingCard.bank_shaba) ? (
                                    <div key="sec_neon_bank" className="space-y-1.5 pt-1.5 border-t border-white/10">
                                      <h5 className="text-[7.5px] font-bold text-slate-400 flex items-center gap-1">
                                        <CreditCard className="h-3 w-3 text-purple-400 shrink-0" />
                                        <span>شماره حساب و کارت</span>
                                      </h5>
                                      <div className="space-y-1">
                                        {editingCard.bank_card && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_card || '', 'bank_card')}
                                            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-between text-[7px] cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-400 font-bold">{previewCopiedField === 'bank_card' ? 'کپی شد!' : 'کارت:'}</span>
                                            <span className="font-mono font-bold text-cyan-400">{editingCard.bank_card}</span>
                                          </div>
                                        )}
                                        {editingCard.bank_account && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_account || '', 'bank_account')}
                                            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-between text-[7px] cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-400 font-bold">{previewCopiedField === 'bank_account' ? 'کپی شد!' : 'حساب:'}</span>
                                            <span className="font-mono font-bold text-cyan-400">{editingCard.bank_account}</span>
                                          </div>
                                        )}
                                        {editingCard.bank_shaba && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_shaba || '', 'bank_shaba')}
                                            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-between text-[7px] cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-400 font-bold">{previewCopiedField === 'bank_shaba' ? 'کپی شد!' : 'شبا:'}</span>
                                            <span className="font-mono font-bold text-cyan-400" dir="ltr">{editingCard.bank_shaba}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : null;
                                default:
                                  return null;
                              }
                            })}

                          </div>
                        </div>
                      )}

                      {/* Minimal Style */}
                      {isMinimal && (
                        <div className="w-full min-h-full bg-stone-50 text-stone-800 p-3.5 space-y-3.5 flex flex-col font-sans overflow-y-auto" style={{ backgroundColor: cardBg, color: textColor }}>
                          
                          {/* Cover photo */}
                          <div className="h-16 rounded-xl overflow-hidden relative bg-stone-100 border border-stone-200 shrink-0">
                            <img 
                              src={getImageUrl(editingCard.cover_image) || '/cover-fallback.avif'} 
                              alt="cover" 
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex flex-col items-center text-center space-y-2 flex-grow">
                            <div className="h-14 w-14 rounded-full overflow-hidden border border-stone-200 p-0.5 bg-white shrink-0 relative">
                              <img 
                                src={getImageUrl(editingCard.profile_image) || '/profile-fallback.jpg'} 
                                alt="profile" 
                                className="w-full h-full object-cover rounded-full"
                              />
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="text-xs font-black text-stone-900">{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                              <p className="text-[8px] font-medium text-stone-500 uppercase tracking-widest">{editingCard.job_title || 'سمت شغلی'}</p>
                              {editingCard.company && <p className="text-[8px] text-stone-400">{editingCard.company}</p>}
                            </div>

                            {editingCard.bio && (
                              <p className="text-[8px] text-stone-600 leading-relaxed text-center px-2 whitespace-pre-line">
                                {editingCard.bio}
                              </p>
                            )}

                            {/* Minimal Dynamic Sections Reordering */}
                            {getSectionOrders(editingCard).map((secKey) => {
                              switch (secKey) {
                                case 'save_contact':
                                  return (
                                    <div 
                                      key="sec_min_save"
                                      onClick={() => editingCard && saveCardToContacts(editingCard)}
                                      className="w-full py-1 rounded-lg text-white flex items-center justify-center gap-1 text-[7.5px] font-bold shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition" 
                                      style={{ backgroundColor: primaryColor }}
                                    >
                                      <Download className="h-2.5 w-2.5" />
                                      <span>ذخیره در مخاطبین</span>
                                    </div>
                                  );
                                case 'bio':
                                  return editingCard.bio ? (
                                    <p key="sec_min_bio" className="text-[8px] text-stone-600 leading-relaxed text-center px-2 whitespace-pre-line">
                                      {editingCard.bio}
                                    </p>
                                  ) : null;
                                case 'primary_actions':
                                  return (editingCard.social_links?.mobile || (editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.length > 0)) ? (
                                    <div key="sec_min_primary" className="w-full space-y-1 pt-1.5 border-t border-stone-200">
                                      <h5 className="text-[7.5px] font-bold text-stone-500 text-right">تلفن‌های همراه</h5>
                                      <div className="space-y-1">
                                        {editingCard.social_links?.mobile && (
                                          <div className="flex items-center justify-between p-1 bg-white border border-stone-200 rounded-lg text-[7px] font-bold text-stone-700">
                                            <span>موبایل اصلی:</span>
                                            <span className="font-mono text-stone-500">{editingCard.social_links.mobile}</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.map((ph: string, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between p-1 bg-white border border-stone-200 rounded-lg text-[7px] font-bold text-stone-700">
                                            <span>تلفن جانبی {idx + 1}:</span>
                                            <span className="font-mono text-stone-500">{ph}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null;
                                case 'social_links':
                                  return (
                                    <div key="sec_min_social" className="w-full space-y-1 pt-1.5 border-t border-stone-200">
                                      <h5 className="text-[7.5px] font-bold text-stone-500 text-right">راه‌های ارتباطی</h5>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {editingCard.social_links?.phone && (
                                          <div className="p-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-1.5 text-[7px] font-bold text-stone-700">
                                            <Phone className="h-3 w-3 text-stone-500" />
                                            <span>تلفن ثابت</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.mobile && (
                                          <div className="p-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-1.5 text-[7px] font-bold text-stone-700">
                                            <Phone className="h-3 w-3 text-stone-500" />
                                            <span>موبایل</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.email && (
                                          <div className="p-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-1.5 text-[7px] font-bold text-stone-700">
                                            <Mail className="h-3 w-3 text-stone-500" />
                                            <span className="truncate">ایمیل</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.telegram && (
                                          <div className="p-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-1.5 text-[7px] font-bold text-stone-700">
                                            <Send className="h-3 w-3 text-stone-500" />
                                            <span>تلگرام</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.whatsapp && (
                                          <div className="p-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-1.5 text-[7px] font-bold text-stone-700">
                                            <MessageCircle className="h-3 w-3 text-stone-500" />
                                            <span>واتساپ</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.instagram && (
                                          <div className="p-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-1.5 text-[7px] font-bold text-stone-700">
                                            <Instagram className="h-3 w-3 text-stone-500" />
                                            <span>اینستاگرام</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.linkedin && (
                                          <div className="p-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-1.5 text-[7px] font-bold text-stone-700">
                                            <Linkedin className="h-3 w-3 text-stone-500" />
                                            <span>لینکدین</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.website && (
                                          <div className="p-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-1.5 text-[7px] font-bold text-stone-700">
                                            <Globe className="h-3 w-3 text-stone-500" />
                                            <span>وبسایت</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                case 'custom_buttons':
                                  return (editingCard.custom_buttons && editingCard.custom_buttons.length > 0) ? (
                                    <div key="sec_min_custom" className="w-full space-y-1 pt-1.5 border-t border-stone-200">
                                      <h5 className="text-[7.5px] font-bold text-stone-500 text-right">لینک‌های کاربردی</h5>
                                      {editingCard.custom_buttons.map((btn) => (
                                        <div 
                                          key={btn.id}
                                          className="p-1 bg-stone-900 text-white rounded-lg flex items-center justify-between text-[7.5px] font-bold shadow-sm"
                                        >
                                          <span>{btn.label}</span>
                                          <span>➔</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null;
                                case 'location':
                                  return (editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap || editingCard.address) ? (
                                    <div key="sec_min_loc" className="w-full space-y-1 pt-1.5 border-t border-stone-200">
                                      {(editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap) && (
                                        <>
                                          <h5 className="text-[7.5px] font-bold text-stone-500 text-right">مسیریابی آدرس</h5>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            {editingCard.neshan && (
                                              <div className="p-1 bg-white border border-stone-200 rounded-lg flex items-center gap-1 text-[7px] font-bold text-stone-700">
                                                <MapPin className="h-2.5 w-2.5 text-stone-500" />
                                                <span>نشان</span>
                                              </div>
                                            )}
                                            {editingCard.balad && (
                                              <div className="p-1 bg-white border border-stone-200 rounded-lg flex items-center gap-1 text-[7px] font-bold text-stone-700">
                                                <MapPin className="h-2.5 w-2.5 text-stone-500" />
                                                <span>بلد</span>
                                              </div>
                                            )}
                                            {editingCard.waze && (
                                              <div className="p-1 bg-white border border-stone-200 rounded-lg flex items-center gap-1 text-[7px] font-bold text-stone-700">
                                                <MapPin className="h-2.5 w-2.5 text-stone-500" />
                                                <span>ویز</span>
                                              </div>
                                            )}
                                            {editingCard.googlemap && (
                                              <div className="p-1 bg-white border border-stone-200 rounded-lg flex items-center gap-1 text-[7px] font-bold text-stone-700">
                                                <MapPin className="h-2.5 w-2.5 text-stone-500" />
                                                <span>گوگل مپ</span>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                      {editingCard.address && (
                                        <>
                                          <h5 className="text-[7.5px] font-bold text-stone-500 text-right flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3 text-stone-500 shrink-0" />
                                            <span>نشانی و دفتر مرکزی</span>
                                          </h5>
                                          <p className="p-2 bg-stone-100 rounded-lg text-[7px] text-stone-700 leading-relaxed text-center border border-stone-200/50">
                                            {editingCard.address}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  ) : null;
                                case 'bank_info':
                                  return (editingCard.bank_card || editingCard.bank_account || editingCard.bank_shaba) ? (
                                    <div key="sec_min_bank" className="w-full space-y-1.5 pt-1.5 border-t border-stone-200">
                                      <h5 className="text-[7.5px] font-bold text-stone-500 text-right flex items-center gap-1">
                                        <CreditCard className="h-3 w-3 text-stone-600 shrink-0" />
                                        <span>شماره حساب و کارت</span>
                                      </h5>
                                      <div className="space-y-1">
                                        {editingCard.bank_card && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_card || '', 'bank_card')}
                                            className="p-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg flex items-center justify-between text-[7px] text-stone-700 cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-600 font-bold">{previewCopiedField === 'bank_card' ? 'کپی شد!' : 'کارت:'}</span>
                                            <span className="font-mono font-bold">{editingCard.bank_card}</span>
                                          </div>
                                        )}
                                        {editingCard.bank_account && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_account || '', 'bank_account')}
                                            className="p-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg flex items-center justify-between text-[7px] text-stone-700 cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-600 font-bold">{previewCopiedField === 'bank_account' ? 'کپی شد!' : 'حساب:'}</span>
                                            <span className="font-mono font-bold">{editingCard.bank_account}</span>
                                          </div>
                                        )}
                                        {editingCard.bank_shaba && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_shaba || '', 'bank_shaba')}
                                            className="p-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg flex items-center justify-between text-[7px] text-stone-700 cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-600 font-bold">{previewCopiedField === 'bank_shaba' ? 'کپی شد!' : 'شبا:'}</span>
                                            <span className="font-mono font-bold" dir="ltr">{editingCard.bank_shaba}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : null;
                                default:
                                  return null;
                              }
                            })}

                          </div>
                        </div>
                      )}

                      {/* Luxury Dark Style */}
                      {isLuxuryDark && (
                        <div className="w-full min-h-full bg-stone-950 text-amber-100 p-3.5 space-y-3.5 flex flex-col font-sans overflow-y-auto" style={{ backgroundColor: cardBg, color: textColor }}>
                          <div className="border border-amber-500/20 bg-stone-900/60 p-3 rounded-2xl flex flex-col flex-grow space-y-3.5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full blur-2xl"></div>

                            {/* Cover photo */}
                            <div className="h-16 rounded-xl overflow-hidden relative border border-amber-500/30 shrink-0 shadow-md">
                              <img 
                                src={getImageUrl(editingCard.cover_image) || '/cover-fallback.avif'} 
                                alt="cover" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 to-transparent opacity-60"></div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-[5px] text-amber-500/70 font-mono tracking-widest uppercase border border-amber-500/10 px-2 py-0.5 rounded-full">
                                LUXURY COLLECTION
                              </span>
                              <div className="h-10 w-10 rounded-lg border-2 border-amber-500/40 overflow-hidden shrink-0">
                                <img 
                                  src={getImageUrl(editingCard.profile_image) || '/profile-fallback.jpg'} 
                                  alt="profile" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>

                            <div className="space-y-0.5 text-right">
                              <h4 className="text-xs font-serif font-bold text-amber-200 tracking-wide">{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                              <p className="text-[7.5px] font-mono uppercase tracking-wider text-amber-500">{editingCard.job_title || 'سمت شغلی'}</p>
                              {editingCard.company && <p className="text-[7px] text-stone-500">{editingCard.company}</p>}
                            </div>

                            {/* DYNAMIC SECTIONS REORDERING FOR LUXURY DARK */}
                            {getSectionOrders(editingCard).map((secKey) => {
                              switch (secKey) {
                                case 'save_contact':
                                  return (
                                    <div 
                                      key="sec_lux_save"
                                      onClick={() => editingCard && saveCardToContacts(editingCard)}
                                      className="w-full py-1 rounded-lg border border-amber-500/40 text-amber-200 flex items-center justify-center gap-1 text-[7.5px] font-bold shadow-sm cursor-pointer hover:bg-amber-500/10 transition shrink-0"
                                    >
                                      <Download className="h-2.5 w-2.5" />
                                      <span>ذخیره مستقیم کارت شخصی</span>
                                    </div>
                                  );
                                case 'bio':
                                  return editingCard.bio ? (
                                    <p key="sec_lux_bio" className="text-[7.5px] text-stone-400 leading-relaxed bg-stone-950/40 p-2 rounded-lg border border-stone-800/40 text-justify whitespace-pre-line">
                                      {editingCard.bio}
                                    </p>
                                  ) : null;
                                case 'primary_actions':
                                  return (editingCard.social_links?.mobile || (editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.length > 0)) ? (
                                    <div key="sec_lux_primary" className="space-y-1 pt-1.5 border-t border-stone-800/60">
                                      <h5 className="text-[7.5px] font-serif text-amber-500/70 text-right">شماره‌های همراه</h5>
                                      {editingCard.social_links?.mobile && (
                                        <div className="py-1 border-b border-stone-800/60 flex justify-between items-center text-[7px] text-stone-300">
                                          <span className="opacity-50">تلفن همراه اصلی:</span>
                                          <span className="font-mono text-amber-500/90">{editingCard.social_links.mobile}</span>
                                        </div>
                                      )}
                                      {editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.map((ph: string, idx: number) => (
                                        <div key={idx} className="py-1 border-b border-stone-800/60 flex justify-between items-center text-[7px] text-stone-300">
                                          <span className="opacity-50">تلفن همراه {idx + 1}:</span>
                                          <span className="font-mono text-amber-500/90">{ph}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null;
                                case 'social_links':
                                  return (
                                    <div key="sec_lux_social" className="space-y-1.5 pt-1 border-t border-stone-800/60">
                                      <h5 className="text-[7.5px] font-serif text-amber-500/70 text-right">راه‌های ارتباطی مجلل</h5>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {editingCard.social_links?.phone && (
                                          <div className="py-1 border-b border-stone-800/60 flex justify-between items-center text-[7px] text-stone-300">
                                            <span className="opacity-50 flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> ثابت</span>
                                            <span className="font-mono text-amber-500/90 truncate max-w-[80px]">{editingCard.social_links.phone}</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.email && (
                                          <div className="py-1 border-b border-stone-800/60 flex justify-between items-center text-[7px] text-stone-300">
                                            <span className="opacity-50 flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> ایمیل</span>
                                            <span className="font-mono text-amber-500/90 truncate max-w-[80px]">{editingCard.social_links.email}</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.telegram && (
                                          <div className="py-1 border-b border-stone-800/60 flex justify-between items-center text-[7px] text-stone-300">
                                            <span className="opacity-50 flex items-center gap-1"><Send className="h-2.5 w-2.5" /> تلگرام</span>
                                            <span className="font-mono text-amber-500/90 truncate max-w-[80px]">@{editingCard.social_links.telegram}</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.whatsapp && (
                                          <div className="py-1 border-b border-stone-800/60 flex justify-between items-center text-[7px] text-stone-300">
                                            <span className="opacity-50 flex items-center gap-1"><MessageCircle className="h-2.5 w-2.5" /> واتساپ</span>
                                            <span className="font-mono text-amber-500/90 truncate max-w-[80px]">{editingCard.social_links.whatsapp}</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.instagram && (
                                          <div className="py-1 border-b border-stone-800/60 flex justify-between items-center text-[7px] text-stone-300">
                                            <span className="opacity-50 flex items-center gap-1"><Instagram className="h-2.5 w-2.5" /> اینستاگرام</span>
                                            <span className="font-mono text-amber-500/90 truncate max-w-[80px]">@{editingCard.social_links.instagram}</span>
                                          </div>
                                        )}
                                        {editingCard.social_links?.linkedin && (
                                          <div className="py-1 border-b border-stone-800/60 flex justify-between items-center text-[7px] text-stone-300">
                                            <span className="opacity-50 flex items-center gap-1"><Linkedin className="h-2.5 w-2.5" /> لینکدین</span>
                                            <span className="font-mono text-amber-500/90 truncate max-w-[80px]">@{editingCard.social_links.linkedin}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                case 'custom_buttons':
                                  return (editingCard.custom_buttons && editingCard.custom_buttons.length > 0) ? (
                                    <div key="sec_lux_custom" className="space-y-1">
                                      {editingCard.custom_buttons.map((btn) => (
                                        <div 
                                          key={btn.id}
                                          className="p-1 bg-stone-900 border border-amber-500/30 rounded-lg flex items-center justify-between text-[8px] font-bold text-amber-300"
                                        >
                                          <span>{btn.label}</span>
                                          <span className="opacity-40">➔</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null;
                                case 'location':
                                  return (editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap || editingCard.address) ? (
                                    <div key="sec_lux_loc" className="space-y-1.5 pt-1.5 border-t border-stone-800/60">
                                      {(editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap) && (
                                        <>
                                          <h5 className="text-[7.5px] font-serif text-amber-500/70 text-right">مسیریابی آدرس</h5>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            {editingCard.neshan && (
                                              <div className="p-1 bg-stone-900 border border-amber-500/20 rounded text-[7px] flex items-center gap-1 text-amber-200">
                                                <MapPin className="h-2.5 w-2.5 text-amber-500" />
                                                <span>مسیریابی نشان</span>
                                              </div>
                                            )}
                                            {editingCard.balad && (
                                              <div className="p-1 bg-stone-900 border border-amber-500/20 rounded text-[7px] flex items-center gap-1 text-amber-200">
                                                <MapPin className="h-2.5 w-2.5 text-amber-500" />
                                                <span>مسیریابی بلد</span>
                                              </div>
                                            )}
                                            {editingCard.waze && (
                                              <div className="p-1 bg-stone-900 border border-amber-500/20 rounded text-[7px] flex items-center gap-1 text-amber-200">
                                                <MapPin className="h-2.5 w-2.5 text-amber-500" />
                                                <span>مسیریابی ویز</span>
                                              </div>
                                            )}
                                            {editingCard.googlemap && (
                                              <div className="p-1 bg-stone-900 border border-amber-500/20 rounded text-[7px] flex items-center gap-1 text-amber-200">
                                                <MapPin className="h-2.5 w-2.5 text-amber-500" />
                                                <span>مسیریابی گوگل مپ</span>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                      {editingCard.address && (
                                        <div className="space-y-1 pt-1.5">
                                          <h5 className="text-[7.5px] font-serif text-amber-500/70 text-right flex items-center gap-1 justify-end">
                                            <span>نشانی و دفتر مرکزی</span>
                                            <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                                          </h5>
                                          <p className="p-2 bg-stone-950/60 border border-amber-500/10 rounded-lg text-[7px] text-stone-200 leading-relaxed text-center">
                                            {editingCard.address}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ) : null;
                                case 'bank_info':
                                  return (editingCard.bank_card || editingCard.bank_account || editingCard.bank_shaba) ? (
                                    <div key="sec_lux_bank" className="space-y-1.5 pt-1.5 border-t border-stone-800/60">
                                      <h5 className="text-[7.5px] font-serif text-amber-500/70 text-right flex items-center gap-1 justify-end">
                                        <span>شماره حساب و کارت VIP</span>
                                        <CreditCard className="h-3 w-3 text-amber-500 shrink-0" />
                                      </h5>
                                      <div className="space-y-1">
                                        {editingCard.bank_card && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_card || '', 'bank_card')}
                                            className="p-1.5 bg-stone-950/60 hover:bg-stone-900 border border-amber-500/10 rounded-lg flex items-center justify-between text-[7px] text-stone-200 cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-400 font-bold">{previewCopiedField === 'bank_card' ? 'کپی شد!' : 'کارت:'}</span>
                                            <span className="font-mono font-bold text-amber-500">{editingCard.bank_card}</span>
                                          </div>
                                        )}
                                        {editingCard.bank_account && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_account || '', 'bank_account')}
                                            className="p-1.5 bg-stone-950/60 hover:bg-stone-900 border border-amber-500/10 rounded-lg flex items-center justify-between text-[7px] text-stone-200 cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-400 font-bold">{previewCopiedField === 'bank_account' ? 'کپی شد!' : 'حساب:'}</span>
                                            <span className="font-mono font-bold text-amber-500">{editingCard.bank_account}</span>
                                          </div>
                                        )}
                                        {editingCard.bank_shaba && (
                                          <div 
                                            onClick={() => handlePreviewCopyText(editingCard.bank_shaba || '', 'bank_shaba')}
                                            className="p-1.5 bg-stone-950/60 hover:bg-stone-900 border border-amber-500/10 rounded-lg flex items-center justify-between text-[7px] text-stone-200 cursor-pointer transition active:scale-[0.98]"
                                            title="کپی"
                                          >
                                            <span className="text-emerald-400 font-bold">{previewCopiedField === 'bank_shaba' ? 'کپی شد!' : 'شبا:'}</span>
                                            <span className="font-mono font-bold text-amber-500" dir="ltr">{editingCard.bank_shaba}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : null;
                                default:
                                  return null;
                              }
                            })}

                          </div>
                        </div>
                      )}

                      {/* Fallback Custom Template */}
                      {isCustomTemplate && (() => {
                        const tSchema = activeTemplate?.schema || {};
                        const isDarkTheme = tSchema.theme === 'dark';
                        const tColors = tSchema.colors || {};
                        const tLayout = tSchema.layout || {};

                        const pColor = editingCard.custom_colors?.primary || tColors.primary || '#8d5b4c';
                        const sColor = editingCard.custom_colors?.secondary || tColors.secondary || '#f4ece1';
                        const bColor = editingCard.custom_colors?.background || tColors.background || '#faf6f0';
                        const txtColor = editingCard.custom_colors?.text || tColors.text || '#2d221e';
                        const txtSecColor = tColors.text_secondary || '#6e5a53';
                        const customCardBg = editingCard.custom_colors?.card_bg || (isDarkTheme ? '#18181b' : '#ffffff');
                        
                        const isCircleAvatar = (tLayout.avatar_shape || 'circle') === 'circle';
                        const isSplitHeader = tLayout.header_style === 'split';

                        return (
                          <div 
                            className="w-full min-h-full transition-all p-3.5 space-y-3.5 flex flex-col justify-between text-right font-sans overflow-y-auto"
                            style={{ 
                              backgroundColor: customCardBg, 
                              color: txtColor
                            }}
                          >
                            <div className="space-y-3.5 flex-grow">
                              {/* Cover photo for Custom Template */}
                              <div className="h-20 bg-slate-200 relative shrink-0 overflow-hidden -mx-3.5 -mt-3.5 mb-2.5">
                                <img 
                                  src={getImageUrl(editingCard.cover_image) || '/cover-fallback.avif'} 
                                  alt="cover" 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30"></div>
                              </div>

                              <div className="flex justify-between items-center text-[7px]">
                                <span className="px-1.5 py-0.5 rounded-full text-[6px] font-bold" style={{ backgroundColor: sColor, color: pColor }}>
                                  {activeTemplate?.name || 'قالب اختصاصی'}
                                </span>
                              </div>

                              {isSplitHeader ? (
                                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                                  <div className="h-10 w-10 overflow-hidden border shrink-0" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '6px' }}>
                                    <img 
                                      src={getImageUrl(editingCard.profile_image) || '/profile-fallback.jpg'} 
                                      alt="profile" 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-black">{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                                    <p className="text-[8px] font-bold" style={{ color: pColor }}>{editingCard.job_title || 'سمت شغلی'}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-center space-y-1.5">
                                  <div className="h-12 w-12 overflow-hidden border p-0.5" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '8px' }}>
                                    <img 
                                      src={getImageUrl(editingCard.profile_image) || '/profile-fallback.jpg'} 
                                      alt="profile" 
                                      className="w-full h-full object-cover"
                                      style={{ borderRadius: isCircleAvatar ? '9999px' : '6px' }}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-black">{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                                    <p className="text-[8px] font-bold mt-0.5" style={{ color: pColor }}>{editingCard.job_title || 'سمت شغلی'}</p>
                                  </div>
                                </div>
                              )}

                              {/* DYNAMIC SECTIONS REORDERING FOR FALLBACK CUSTOM TEMPLATE */}
                              {getSectionOrders(editingCard).map((secKey) => {
                                switch (secKey) {
                                  case 'save_contact':
                                    return (
                                      <div 
                                        key="sec_cust_save"
                                        onClick={() => editingCard && saveCardToContacts(editingCard)}
                                        className="w-full py-1 rounded-lg text-white text-center text-[7.5px] font-bold cursor-pointer hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-1 shrink-0" 
                                        style={{ backgroundColor: pColor }}
                                      >
                                        <Download className="h-2.5 w-2.5" />
                                        <span>ذخیره در دفترچه مخاطبین</span>
                                      </div>
                                    );
                                  case 'bio':
                                    return editingCard.bio ? (
                                      <p key="sec_cust_bio" className="text-[7.5px] leading-relaxed text-center whitespace-pre-line" style={{ color: txtSecColor }}>
                                        {editingCard.bio}
                                      </p>
                                    ) : null;
                                  case 'primary_actions':
                                    return (editingCard.social_links?.mobile || (editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.length > 0)) ? (
                                      <div key="sec_cust_primary" className="space-y-1 pt-1.5 border-t" style={{ borderColor: sColor }}>
                                        <span className="text-[7px] font-bold block text-center" style={{ color: txtSecColor }}>تلفن‌های تماس همراه</span>
                                        <div className="space-y-1">
                                          {editingCard.social_links?.mobile && (
                                            <div className="flex items-center justify-between p-1 rounded border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <span className="flex items-center gap-1">
                                                <Phone className="h-2.5 w-2.5" style={{ color: pColor }} />
                                                <span style={{ color: txtColor }}>موبایل اصلی:</span>
                                              </span>
                                              <span className="font-mono font-bold" style={{ color: pColor }}>{editingCard.social_links.mobile}</span>
                                            </div>
                                          )}
                                          {editingCard.social_links?.extra_phones && editingCard.social_links.extra_phones.map((ph: string, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-1 rounded border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <span className="flex items-center gap-1">
                                                <Phone className="h-2.5 w-2.5" style={{ color: pColor }} />
                                                <span style={{ color: txtColor }}>تلفن جانبی {idx + 1}:</span>
                                              </span>
                                              <span className="font-mono font-bold" style={{ color: pColor }}>{ph}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null;
                                  case 'social_links':
                                    return (
                                      <div key="sec_cust_social" className="space-y-1">
                                        <h5 className="text-[7px] font-bold opacity-70">راه‌های ارتباطی</h5>
                                        <div className="grid grid-cols-4 gap-1">
                                          {editingCard.social_links?.phone && (
                                            <div className="flex flex-col items-center justify-center p-1 rounded-md border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <Phone className="h-2.5 w-2.5" style={{ color: pColor }} />
                                              <span className="text-[5.5px]" style={{ color: txtSecColor }}>تلفن</span>
                                            </div>
                                          )}
                                          {editingCard.social_links?.whatsapp && (
                                            <div className="flex flex-col items-center justify-center p-1 rounded-md border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <MessageCircle className="h-2.5 w-2.5" style={{ color: pColor }} />
                                              <span className="text-[5.5px]" style={{ color: txtSecColor }}>واتساپ</span>
                                            </div>
                                          )}
                                          {editingCard.social_links?.telegram && (
                                            <div className="flex flex-col items-center justify-center p-1 rounded-md border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <Send className="h-2.5 w-2.5" style={{ color: pColor }} />
                                              <span className="text-[5.5px]" style={{ color: txtSecColor }}>تلگرام</span>
                                            </div>
                                          )}
                                          {editingCard.social_links?.instagram && (
                                            <div className="flex flex-col items-center justify-center p-1 rounded-md border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <Instagram className="h-2.5 w-2.5" style={{ color: pColor }} />
                                              <span className="text-[5.5px]" style={{ color: txtSecColor }}>اینستا</span>
                                            </div>
                                          )}
                                          {editingCard.social_links?.linkedin && (
                                            <div className="flex flex-col items-center justify-center p-1 rounded-md border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <Linkedin className="h-2.5 w-2.5" style={{ color: pColor }} />
                                              <span className="text-[5.5px]" style={{ color: txtSecColor }}>لینکدین</span>
                                            </div>
                                          )}
                                          {editingCard.social_links?.email && (
                                            <div className="flex flex-col items-center justify-center p-1 rounded-md border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <Mail className="h-2.5 w-2.5" style={{ color: pColor }} />
                                              <span className="text-[5.5px]" style={{ color: txtSecColor }}>ایمیل</span>
                                            </div>
                                          )}
                                          {editingCard.social_links?.website && (
                                            <div className="flex flex-col items-center justify-center p-1 rounded-md border text-[6.5px]" style={{ borderColor: sColor }}>
                                              <Globe className="h-2.5 w-2.5" style={{ color: pColor }} />
                                              <span className="text-[5.5px]" style={{ color: txtSecColor }}>سایت</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  case 'custom_buttons':
                                    return (editingCard.custom_buttons && editingCard.custom_buttons.length > 0) ? (
                                      <div key="sec_cust_buttons" className="space-y-1">
                                        {editingCard.custom_buttons.map((btn) => (
                                          <div 
                                            key={btn.id}
                                            className="p-1 rounded border flex items-center justify-between text-[7px] font-bold"
                                            style={{ borderColor: sColor, color: pColor }}
                                          >
                                            <span>{btn.label}</span>
                                            <span className="opacity-40">➔</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null;
                                  case 'location':
                                    return (editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap || editingCard.address) ? (
                                      <div key="sec_cust_loc" className="space-y-1 pt-1.5 border-t" style={{ borderColor: sColor }}>
                                        {(editingCard.neshan || editingCard.balad || editingCard.waze || editingCard.googlemap) && (
                                          <>
                                            <h5 className="text-[7px] font-bold opacity-70">مسیریابی</h5>
                                            <div className="grid grid-cols-2 gap-1">
                                              {editingCard.neshan && (
                                                <div className="p-1 rounded border text-[6.5px] flex items-center gap-1 justify-center" style={{ borderColor: sColor }}>
                                                  <MapPin className="h-2.5 w-2.5" style={{ color: pColor }} />
                                                  <span style={{ color: txtSecColor }}>نشان</span>
                                                </div>
                                              )}
                                              {editingCard.balad && (
                                                <div className="p-1 rounded border text-[6.5px] flex items-center gap-1 justify-center" style={{ borderColor: sColor }}>
                                                  <MapPin className="h-2.5 w-2.5" style={{ color: pColor }} />
                                                  <span style={{ color: txtSecColor }}>بلد</span>
                                                </div>
                                              )}
                                              {editingCard.waze && (
                                                <div className="p-1 rounded border text-[6.5px] flex items-center gap-1 justify-center" style={{ borderColor: sColor }}>
                                                  <MapPin className="h-2.5 w-2.5" style={{ color: pColor }} />
                                                  <span style={{ color: txtSecColor }}>ویز</span>
                                                </div>
                                              )}
                                              {editingCard.googlemap && (
                                                <div className="p-1 rounded border text-[6.5px] flex items-center gap-1 justify-center" style={{ borderColor: sColor }}>
                                                  <MapPin className="h-2.5 w-2.5" style={{ color: pColor }} />
                                                  <span style={{ color: txtSecColor }}>گوگل مپ</span>
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        )}
                                        {editingCard.address && (
                                          <div className="space-y-1 pt-1">
                                            <span className="text-[7px] font-bold block text-center" style={{ color: txtSecColor }}>نشانی و آدرس حضوری</span>
                                            <div className="p-1.5 rounded border text-[6.5px] leading-relaxed text-center" style={{ borderColor: sColor, color: txtColor }}>
                                              {editingCard.address}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : null;
                                  case 'bank_info':
                                    return (editingCard.bank_card || editingCard.bank_account || editingCard.bank_shaba) ? (
                                      <div key="sec_cust_bank" className="space-y-1 pt-1.5 border-t" style={{ borderColor: sColor }}>
                                        <span className="text-[7px] font-bold block text-center" style={{ color: txtSecColor }}>اطلاعات حساب و کارت بانکی</span>
                                        <div className="space-y-1">
                                          {editingCard.bank_card && (
                                            <div 
                                              onClick={() => handlePreviewCopyText(editingCard.bank_card || '', 'bank_card')}
                                              className="p-1 rounded border flex items-center justify-between text-[6.5px] cursor-pointer transition active:scale-[0.98]" 
                                              style={{ borderColor: sColor }}
                                            >
                                              <div>
                                                <span className="text-[5.5px] block font-semibold" style={{ color: txtSecColor }}>شماره کارت</span>
                                                <span className="font-mono font-bold" style={{ color: txtColor }}>{editingCard.bank_card}</span>
                                              </div>
                                              <span className="text-[6px] font-bold text-emerald-500">{previewCopiedField === 'bank_card' ? 'کپی شد!' : 'کپی'}</span>
                                            </div>
                                          )}
                                          {editingCard.bank_account && (
                                            <div 
                                              onClick={() => handlePreviewCopyText(editingCard.bank_account || '', 'bank_account')}
                                              className="p-1 rounded border flex items-center justify-between text-[6.5px] cursor-pointer transition active:scale-[0.98]" 
                                              style={{ borderColor: sColor }}
                                            >
                                              <div>
                                                <span className="text-[5.5px] block font-semibold" style={{ color: txtSecColor }}>شماره حساب</span>
                                                <span className="font-mono font-bold" style={{ color: txtColor }}>{editingCard.bank_account}</span>
                                              </div>
                                              <span className="text-[6px] font-bold text-emerald-500">{previewCopiedField === 'bank_account' ? 'کپی شد!' : 'کپی'}</span>
                                            </div>
                                          )}
                                          {editingCard.bank_shaba && (
                                            <div 
                                              onClick={() => handlePreviewCopyText(editingCard.bank_shaba || '', 'bank_shaba')}
                                              className="p-1 rounded border flex items-center justify-between text-[6.5px] cursor-pointer transition active:scale-[0.98]" 
                                              style={{ borderColor: sColor }}
                                            >
                                              <div>
                                                <span className="text-[5.5px] block font-semibold" style={{ color: txtSecColor }}>شماره شبا</span>
                                                <span className="font-mono font-bold" dir="ltr" style={{ color: txtColor }}>{editingCard.bank_shaba}</span>
                                              </div>
                                              <span className="text-[6px] font-bold text-emerald-500">{previewCopiedField === 'bank_shaba' ? 'کپی شد!' : 'کپی'}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : null;
                                  default:
                                    return null;
                                }
                              })}

                              {/* Custom Buttons */}
                              {editingCard.custom_buttons && editingCard.custom_buttons.length > 0 && (
                                <div className="space-y-1 pt-1.5 border-t" style={{ borderColor: sColor }}>
                                  <h5 className="text-[7px] font-bold opacity-70">لینک‌های اختصاصی</h5>
                                  {editingCard.custom_buttons.map((btn) => (
                                    <div key={btn.id} className="p-1 rounded flex justify-between items-center text-[7px]" style={{ backgroundColor: sColor, color: pColor }}>
                                      <span>{btn.label}</span>
                                      <span>➔</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })()}
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      )}

      {/* ==============================================
          QR CODE PREVIEW & DOWNLOAD MODAL
         ============================================== */}
      {selectedQrCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 rtl" dir="rtl">
            
            <button
              onClick={() => setSelectedQrCard(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white text-lg transition p-1 hover:bg-slate-800 rounded-lg"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-2 shadow-inner">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base">کد QR اختصاصی کارت ویزیت</h3>
              <p className="text-xs text-slate-400">
                {selectedQrCard.first_name} {selectedQrCard.last_name} {selectedQrCard.job_title ? `(${selectedQrCard.job_title})` : ''}
              </p>
            </div>

            {/* QR Code Canvas Box */}
            <div className="bg-white p-4 rounded-2xl flex items-center justify-center border-4 border-slate-800 shadow-xl">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                  `${getCardBaseUrl()}/${selectedQrCard.slug}`
                )}`}
                alt="QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>

            {/* Direct URL Box */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs font-mono ltr" dir="ltr">
              <span className="text-slate-300 truncate max-w-[190px] text-[11px]">
                {getCardBaseUrl()}/{selectedQrCard.slug}
              </span>
              <button
                onClick={() => handleCopyCardLink(selectedQrCard.slug)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[10px] font-bold shrink-0 transition"
              >
                {isCopiedSlug === selectedQrCard.slug ? 'کپی شد ✓' : 'کپی لینک'}
              </button>
            </div>

            {/* Download & View buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleDownloadQrCode(selectedQrCard)}
                disabled={downloadingQr}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {downloadingQr ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>دانلود تصویر کیوآرکد (PNG)</span>
              </button>

              <a
                href={`/${selectedQrCard.slug}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                <span>مشاهده صفحه آنلاین کارت</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Profile Image Cropper Modal */}
      <ProfileImageCropperModal
        imageFile={pendingProfileCropFile}
        isOpen={!!pendingProfileCropFile}
        onClose={() => setPendingProfileCropFile(null)}
        onConfirmCrop={(croppedFile) => {
          handleFileUpload(croppedFile, 'profile');
          setPendingProfileCropFile(null);
        }}
      />

    </div>
  );
}
