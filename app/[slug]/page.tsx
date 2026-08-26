'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { dbService, Card, Template, getImageUrl, parseCardFields, getSectionOrders, toUUID, toPersianDigits, toEnglishDigits } from '../../lib/directus';
import { saveCardToContacts } from '../../lib/vcard';
import { StyledQRCode } from '../../components/ui/StyledQRCode';
import { downloadStyledQRCode } from '../../lib/styledQrCode';
import BrandLogo from '../../components/BrandLogo';
import { 
  Phone, Mail, Globe, MapPin, Share2, Download, 
  Linkedin, Instagram, Send, MessageCircle, Link as LinkIcon, 
  Eye, Calendar, Check, AlertTriangle, ChevronLeft, CreditCard, Copy,
  Bell, UserPlus, RefreshCw, X
} from 'lucide-react';

const getDirectusBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/cms';
  }
  let raw = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus-iuao17eclszuzc06zaqzodkr.89.42.199.190.sslip.io';
  if (raw && !/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  return raw.replace(/\/+$/, '');
};

const DIRECTUS_BASE_URL = getDirectusBaseUrl();

export default function PublicCardPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVCardGenerated, setIsVCardGenerated] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);

  // Subscribe / Newsletter States
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeMobile, setSubscribeMobile] = useState('');
  const [subscribeCode, setSubscribeCode] = useState('');
  const [subscribeStep, setSubscribeStep] = useState<'mobile' | 'code' | 'success'>('mobile');
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);

  const handleSubscribeSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setSubscribeError(null);
    setSubscribeLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: subscribeMobile, purpose: 'subscribe' })
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'خطا در ارسال کد تایید');
      }
      setSubscribeMessage(json.message || 'کد تایید پیامکی ارسال شد.');
      setSubscribeCode('');
      setSubscribeStep('code');
    } catch (err: any) {
      setSubscribeError(err.message);
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleSubscribeVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setSubscribeError(null);
    setSubscribeLoading(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: subscribeMobile,
          code: subscribeCode,
          purpose: 'subscribe',
          card_id: card.id
        })
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'کد تایید معتبر نیست.');
      }
      setSubscribeStep('success');
      setSubscribeMessage(json.message || 'عضویت شما با موفقیت ثبت شد!');
    } catch (err: any) {
      setSubscribeError(err.message);
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    const isBankField = fieldName === 'bank_card' || fieldName === 'bank_account' || fieldName === 'bank_shaba';
    const textToCopy = isBankField ? toEnglishDigits(text) : text;
    navigator.clipboard.writeText(textToCopy);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderShareModal = () => {
    if (!card) return null;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = `کارت ویزیت هوشمند ${card.first_name || ''} ${card.last_name || ''}`.trim();

    // Resolve template defaults and custom theme colors for modal
    let tmplDefaults = {
      primary: '#2563eb',
      secondary: '#3b82f6',
      background: '#0f172a',
      card_bg: '#1e293b',
      text: '#ffffff'
    };

    const currentTemplate = templates.find(t => t.id === card?.template_id || t.slug === card?.template_id);
    const schemaObj = currentTemplate?.schema_json || currentTemplate?.schema;
    if (schemaObj) {
      let schemaColors = schemaObj.colors || schemaObj;
      if (schemaColors) {
        tmplDefaults = {
          primary: schemaColors.primary || tmplDefaults.primary,
          secondary: schemaColors.secondary || tmplDefaults.secondary,
          background: schemaColors.background || tmplDefaults.background,
          card_bg: schemaColors.card_bg || tmplDefaults.card_bg,
          text: schemaColors.text || tmplDefaults.text,
        };
      }
    }

    const modalPrimaryColor = card.custom_colors?.primary?.trim() ? card.custom_colors.primary : tmplDefaults.primary;
    const modalSecondaryColor = card.custom_colors?.secondary?.trim() ? card.custom_colors.secondary : tmplDefaults.secondary;
    const modalBgColor = card.custom_colors?.background?.trim() ? card.custom_colors.background : tmplDefaults.background;
    const modalTextColor = card.custom_colors?.text?.trim() ? card.custom_colors.text : tmplDefaults.text;
    const modalCardBg = card.custom_colors?.card_bg?.trim() ? card.custom_colors.card_bg : tmplDefaults.card_bg;

    return (
      <AnimatePresence>
        {activeShareId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveShareId(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="border rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 text-right relative overflow-hidden rtl"
              dir="rtl"
              style={{
                backgroundColor: modalCardBg || '#1e293b',
                color: modalTextColor || '#ffffff',
                borderColor: `${modalPrimaryColor}45`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="p-2 rounded-xl border flex items-center justify-center shadow-sm"
                    style={{ 
                      backgroundColor: `${modalPrimaryColor}20`, 
                      borderColor: `${modalPrimaryColor}40`, 
                      color: modalPrimaryColor 
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm" style={{ color: modalTextColor }}>اشتراک‌گذاری کارت</h3>
                    <p className="text-[10px] opacity-75" style={{ color: modalTextColor }}>ارسال و اشتراک سریع با دیگران</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setActiveShareId(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: modalTextColor }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mini Profile Card Preview */}
              <div 
                className="p-3 rounded-2xl border flex items-center gap-3"
                style={{ 
                  backgroundColor: `${modalBgColor}90`, 
                  borderColor: `${modalPrimaryColor}30` 
                }}
              >
                <div 
                  className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border"
                  style={{ borderColor: `${modalPrimaryColor}40`, backgroundColor: `${modalCardBg}bb` }}
                >
                  <img 
                    src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} 
                    alt="profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs truncate" style={{ color: modalTextColor }}>{card.first_name} {card.last_name}</h4>
                  <p className="text-[10px] opacity-75 truncate" style={{ color: modalTextColor }}>{card.job_title || card.company || 'کارت ویزیت دیجیتال'}</p>
                  <span className="text-[9px] font-mono block mt-0.5" dir="ltr" style={{ color: modalPrimaryColor }}>/{card.slug}</span>
                </div>
              </div>

              {/* Copy Link Button */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ 
                    backgroundColor: modalPrimaryColor, 
                    color: '#ffffff',
                    boxShadow: `0 8px 20px ${modalPrimaryColor}40`
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl font-bold text-xs transition flex items-center justify-between hover:brightness-110 active:scale-[0.98] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    <span>کپی لینک کارت ویزیت</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono transition ${copied ? 'bg-emerald-500 text-white font-bold' : 'bg-white/20 text-white'}`}>
                    {copied ? 'کپی شد ✓' : 'کپی'}
                  </span>
                </button>
              </div>

              {/* Styled QR Code Section */}
              <div 
                className="p-3 rounded-2xl border flex items-center justify-between gap-3"
                style={{ 
                  backgroundColor: `${modalBgColor}90`, 
                  borderColor: `${modalPrimaryColor}30` 
                }}
              >
                <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                  <StyledQRCode value={shareUrl} size={64} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block" style={{ color: modalTextColor }}>کد QR اختصاصی</span>
                  <span className="text-[10px] opacity-75 block mt-0.5" style={{ color: modalTextColor }}>اسکن و اشتراک سریع</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadStyledQRCode(shareUrl, `qrcode-${card.slug}.png`, 1000)}
                  style={{ 
                    backgroundColor: `${modalSecondaryColor}25`, 
                    borderColor: `${modalSecondaryColor}45`, 
                    color: modalTextColor 
                  }}
                  className="px-2.5 py-1.5 border rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 shrink-0 hover:brightness-110 cursor-pointer"
                  title="دانلود کیوآرکد"
                >
                  <Download className="h-3.5 w-3.5" style={{ color: modalPrimaryColor }} />
                  <span>دانلود</span>
                </button>
              </div>

              {/* Direct Messengers Share Grid */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold block px-0.5 opacity-75" style={{ color: modalTextColor }}>ارسال مستقیم در پیام‌رسان‌ها:</span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 rounded-xl flex items-center gap-2 text-[11px] font-bold transition active:scale-[0.98]"
                  >
                    <Send className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span>تلگرام</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n' + shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 rounded-xl flex items-center gap-2 text-[11px] font-bold transition active:scale-[0.98]"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>واتساپ</span>
                  </a>

                  {/* SMS */}
                  <a
                    href={`sms:?body=${encodeURIComponent(shareTitle + '\n' + shareUrl)}`}
                    className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded-xl flex items-center gap-2 text-[11px] font-bold transition active:scale-[0.98]"
                  >
                    <Phone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>پیامک (SMS)</span>
                  </a>

                  {/* Twitter / X */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl flex items-center gap-2 text-[11px] font-bold transition active:scale-[0.98]"
                  >
                    <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>توییتر / X</span>
                  </a>
                </div>

                {/* Native Mobile OS Share (if supported) */}
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.share({
                        title: shareTitle,
                        text: `${card.first_name || ''} ${card.last_name || ''} - ${card.job_title || ''}`,
                        url: shareUrl
                      }).catch(() => {});
                    }}
                    style={{ 
                      backgroundColor: `${modalPrimaryColor}15`, 
                      borderColor: `${modalPrimaryColor}30`, 
                      color: modalTextColor 
                    }}
                    className="w-full mt-1.5 py-2 border rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition hover:brightness-110 cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" style={{ color: modalPrimaryColor }} />
                    <span>اشتراک با سایر برنامه‌های گوشی</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  useEffect(() => {
    if (!slug) return;
    const loadCard = async () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );
      const deviceName = isMobile ? 'موبایل' : 'دسکتاپ';
      
      let referrerName = 'مستقیم';
      if (typeof document !== 'undefined' && document.referrer) {
        if (document.referrer.includes('t.me') || document.referrer.includes('telegram')) referrerName = 'تلگرام';
        else if (document.referrer.includes('instagram')) referrerName = 'اینستاگرام';
        else if (document.referrer.includes('google')) referrerName = 'گوگل';
        else if (document.referrer.includes('linkedin')) referrerName = 'لینکدین';
        else referrerName = 'سایت خارجی';
      }

      const countries = ['ایران', 'ایران', 'ایران', 'امارات', 'کانادا', 'آلمان'];
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];

      try {
        setConnectionError(false);
        let apiCard: Card | null = null;
        const res = await fetch(`${DIRECTUS_BASE_URL}/items/cards?filter[slug][_eq]=${encodeURIComponent(slug as string)}`);
        if (res.ok) {
          const json = await res.json();
          apiCard = json?.data?.[0];
        }

        if (apiCard) {
          const parsedCard = parseCardFields(apiCard);
          setCard(parsedCard);
          
          const fullName = `${parsedCard.first_name || ''} ${parsedCard.last_name || ''}`.trim();
          if (fullName) {
            document.title = `کارت ویزیت ${fullName} | مگاکارت`;
          } else if (parsedCard.company) {
            document.title = `کارت ویزیت ${parsedCard.company} | مگاکارت`;
          } else {
            document.title = 'کارت ویزیت دیجیتال | مگاکارت';
          }

          dbService.logVisit(parsedCard.id, deviceName, referrerName, randomCountry);
          
          // Fetch templates dynamically
          try {
            const templatesRes = await fetch(`${DIRECTUS_BASE_URL}/items/templates`);
            if (templatesRes.ok) {
              const templJson = await templatesRes.json();
              const templData = templJson?.data || [];
              const parsedTemplates = templData.map((temp: any) => {
                let parsedSchema = temp.schema;
                if (typeof parsedSchema === 'string') {
                  try {
                    parsedSchema = JSON.parse(parsedSchema);
                  } catch {
                    parsedSchema = null;
                  }
                }
                return { ...temp, schema: parsedSchema };
              });
              setTemplates(parsedTemplates);
            }
          } catch (e) {
            console.warn('Failed to fetch templates:', e);
          }
          setIsLoading(false);
          return;
        }
        
        // Card was not found (status 200 but empty array), so not a network error, just doesn't exist
        setIsLoading(false);
      } catch (err) {
        console.warn('Direct Directus fetch failed.', err);
        setConnectionError(true);
        setIsLoading(false);
      }
    };
    setTimeout(loadCard, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 rtl font-sans" dir="rtl" style={{ fontFamily: 'var(--font-vazirmatn), sans-serif' }}>
        <div className="text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin"></div>
            <div className="absolute h-8 w-8 bg-amber-500/10 rounded-full animate-ping"></div>
          </div>
          <p className="text-xs font-semibold text-slate-400">در حال بارگذاری کارت ویزیت مگاکارت...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 rtl font-sans" dir="rtl" style={{ fontFamily: 'var(--font-vazirmatn), sans-serif' }}>
        <div className="text-center space-y-4 max-w-md bg-slate-900 border border-red-500/20 p-8 rounded-3xl shadow-xl">
          <div className="h-16 w-16 bg-red-500/10 text-red-400 flex items-center justify-center rounded-full mx-auto shadow-inner animate-bounce">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold">خطا در اتصال به سرور!</h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            امکان ارتباط با پایگاه داده وجود ندارد. لطفاً اتصال اینترنت خود را بررسی کرده و مجدداً تلاش نمایید.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl transition font-medium w-full text-xs"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 rtl font-sans" dir="rtl" style={{ fontFamily: 'var(--font-vazirmatn), sans-serif' }}>
        <div className="text-center space-y-4 max-w-md bg-slate-900 border border-slate-800/30 p-8 rounded-3xl shadow-xl">
          <AlertTriangle className="h-14 w-14 text-amber-500 mx-auto animate-pulse" />
          <h1 className="text-xl font-bold">کارت ویزیت یافت نشد!</h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            متأسفانه کارت ویزیت دیجیتال با آدرس <span className="font-mono text-amber-400 font-bold">/{slug}</span> وجود ندارد یا توسط مالک آن غیرفعال شده است.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition font-medium w-full text-xs"
          >
            برگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  // Get social values
  const { phone, mobile, extra_phones, whatsapp, telegram, instagram, linkedin, website, email } = card.social_links || {};
  const activeSocialCount = [phone, email, telegram, whatsapp, instagram, linkedin, website].filter(Boolean).length;
  const socialColsClass = activeSocialCount <= 1 ? 'grid-cols-1' : activeSocialCount === 2 ? 'grid-cols-2' : activeSocialCount === 3 ? 'grid-cols-3' : 'grid-cols-4';

  // Download VCF Contact Handler
  const handleDownloadVCard = async () => {
    if (!card) return;
    const success = await saveCardToContacts(card);
    if (success) {
      setIsVCardGenerated(true);
      setTimeout(() => setIsVCardGenerated(false), 3000);
    }
  };

  // Share Card Link
  const handleShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Template Renders
  const templateId = card.template_id;
  const cleanTId = (templateId || '').toLowerCase();
  const cleanTUuid = toUUID(templateId);

  const isClassic = !templateId || cleanTId === 'temp-1' || cleanTId === 'classic' || cleanTUuid === '11111111-1111-1111-1111-111111111111';
  const isBento = cleanTId === 'temp-2' || cleanTId === 'bento' || cleanTUuid === '22222222-2222-2222-2222-222222222222';
  const isContentCreator = cleanTId === 'temp-3' || cleanTId === 'content-creator' || cleanTUuid === '33333333-3333-3333-3333-333333333333';
  const isNeonGlass = cleanTId === 'temp-4' || cleanTId === 'neon-glass' || cleanTUuid === '44444444-4444-4444-4444-444444444444';
  const isMinimal = cleanTId === 'temp-5' || cleanTId === 'minimal' || cleanTUuid === '55555555-5555-5555-5555-555555555555';
  const isLuxuryDark = cleanTId === 'temp-6' || cleanTId === 'luxury-dark' || cleanTUuid === '66666666-6666-6666-6666-666666666666';
  const isCustomTemplate = !isClassic && !isBento && !isContentCreator && !isNeonGlass && !isMinimal && !isLuxuryDark;

  // Template Default Colors Fallback
  let tmplDefaults = {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    background: '#f1f5f9',
    card_bg: '#ffffff',
    text: '#1e293b',
  };

  if (isBento) {
    tmplDefaults = {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#0f172a',
      card_bg: '#1e293b',
      text: '#f8fafc',
    };
  } else if (isContentCreator) {
    tmplDefaults = {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      background: '#09090b',
      card_bg: '#18181b',
      text: '#fafafa',
    };
  } else if (isLuxuryDark) {
    tmplDefaults = {
      primary: '#f59e0b',
      secondary: '#d97706',
      background: '#0c0a09',
      card_bg: '#1c1917',
      text: '#fef3c7',
    };
  } else if (isNeonGlass) {
    tmplDefaults = {
      primary: '#06b6d4',
      secondary: '#3b82f6',
      background: '#0f172a',
      card_bg: 'rgba(15, 23, 42, 0.85)',
      text: '#ffffff',
    };
  } else if (isMinimal) {
    tmplDefaults = {
      primary: '#0f172a',
      secondary: '#475569',
      background: '#f8fafc',
      card_bg: '#ffffff',
      text: '#0f172a',
    };
  } else if (isCustomTemplate) {
    const matchedTemp = templates.find(t => toUUID(t.id) === cleanTUuid || (t.slug && t.slug.toLowerCase() === cleanTId));
    const schemaColors = matchedTemp?.schema?.default_colors || matchedTemp?.schema?.colors || (matchedTemp as any)?.default_colors;
    if (schemaColors) {
      tmplDefaults = {
        primary: schemaColors.primary || tmplDefaults.primary,
        secondary: schemaColors.secondary || tmplDefaults.secondary,
        background: schemaColors.background || tmplDefaults.background,
        card_bg: schemaColors.card_bg || tmplDefaults.card_bg,
        text: schemaColors.text || tmplDefaults.text,
      };
    }
  }

  // Priority logic: User's custom_colors overrides template defaults
  const primaryColor = card.custom_colors?.primary?.trim() ? card.custom_colors.primary : tmplDefaults.primary;
  const secondaryColor = card.custom_colors?.secondary?.trim() ? card.custom_colors.secondary : tmplDefaults.secondary;
  const bgColor = card.custom_colors?.background?.trim() ? card.custom_colors.background : tmplDefaults.background;
  const textCol = card.custom_colors?.text?.trim() ? card.custom_colors.text : tmplDefaults.text;
  const cardBgColor = card.custom_colors?.card_bg?.trim() ? card.custom_colors.card_bg : tmplDefaults.card_bg;

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 rtl text-right font-sans relative" dir="rtl" style={{ backgroundColor: bgColor, fontFamily: 'var(--font-vazirmatn), sans-serif' }}>
      {/* Dynamic Injecting Custom CSS */}
      {card.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: card.custom_css }} />
      )}

      {/* Floating Status Warning for Draft */}
      {card.status === 'draft' && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-amber-500 text-slate-950 font-medium px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-2 text-sm max-w-md mx-auto animate-bounce">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>این کارت در حالت پیش‌نویس (Draft) قرار دارد و فقط برای شما قابل مشاهده است.</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-transparent relative overflow-hidden">
        
        {/* TEMPLATE 1: CLASSIC (DEFAULT) */}
        {isClassic && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-xl overflow-hidden border border-slate-200 transition-all"
            style={{ backgroundColor: cardBgColor, color: textCol }}
          >
            {/* Cover photo */}
            <div className="h-36 bg-slate-300 relative">
              <img 
                src={getImageUrl(card.cover_image) || '/cover-fallback.avif'} 
                alt="cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50"></div>
              
              {/* Share button wrapper */}
              <div className="absolute top-4 left-4 z-40">
                <button 
                  type="button"
                  onClick={() => setActiveShareId('open')}
                  className="p-2.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition active:scale-95 cursor-pointer"
                  title="اشتراک‌گذاری کارت"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Profile Pic overlapping cover */}
            <div className="px-6 -mt-16 relative z-10 flex justify-between items-end">
              <div className="h-28 w-28 rounded-2xl border-4 border-white overflow-hidden shadow-md bg-white">
                <img 
                  src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} 
                  alt="profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left pb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-500">
                  <Eye className="h-3 w-3" />
                  {card.views_count?.toLocaleString('fa-IR')} بازدید
                </span>
              </div>
            </div>

            {/* User Info & Dynamic Ordered Sections */}
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold">{card.first_name} {card.last_name}</h1>
                <p className="text-sm font-semibold mt-1 opacity-90" style={{ color: primaryColor }}>{card.job_title}</p>
                <p className="text-xs opacity-75 mt-0.5">{card.company}</p>
              </div>

              {getSectionOrders(card).map((secKey) => {
                switch (secKey) {
                  case 'save_contact':
                    return (
                      <div key="sec_save_contact" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                          onClick={handleDownloadVCard}
                          className="w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 shadow-md transition-all text-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {isVCardGenerated ? <Check className="h-5 w-5 text-white" /> : <Download className="h-5 w-5" />}
                          <span>{isVCardGenerated ? 'ذخیره شد' : 'ذخیره در مخاطبین'}</span>
                        </button>
                        <button 
                          onClick={() => { setShowSubscribeModal(true); setSubscribeStep('mobile'); setSubscribeError(null); setSubscribeMessage(null); }}
                          className="w-full py-3 px-4 rounded-xl font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 flex items-center justify-center gap-2 transition-all text-sm shadow-sm"
                        >
                          <Bell className="h-5 w-5 text-emerald-700" />
                          <span>دنبال کردن (عضویت)</span>
                        </button>
                      </div>
                    );

                  case 'bio':
                    return card.bio ? (
                      <div key="sec_bio" className="p-4 bg-slate-50 rounded-2xl text-xs leading-relaxed border border-slate-100 opacity-90 whitespace-pre-line" style={{ color: textCol }}>
                        {card.bio}
                      </div>
                    ) : null;

                  case 'primary_actions':
                    return (mobile || (extra_phones && extra_phones.length > 0)) ? (
                      <div key="sec_primary_actions" className="space-y-3 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">شماره تماس‌های دیگر</h3>
                        <div className="space-y-2">
                          {mobile && (
                            <a href={`tel:${mobile}`} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100 text-xs">
                              <span className="flex items-center gap-2 font-semibold">
                                <Phone className="h-4 w-4 text-blue-600" />
                                تلفن همراه (موبایل):
                              </span>
                              <span className="font-sans text-slate-600 font-bold">{toPersianDigits(mobile)}</span>
                            </a>
                          )}
                          {extra_phones && extra_phones.map((ph: string, idx: number) => (
                            <a key={idx} href={`tel:${ph}`} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100 text-xs">
                              <span className="flex items-center gap-2 font-semibold">
                                <Phone className="h-4 w-4 text-slate-500" />
                                شماره تماس جانبی {toPersianDigits(idx + 1)}:
                              </span>
                              <span className="font-sans text-slate-600 font-bold">{toPersianDigits(ph)}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null;

                  case 'social_links':
                    return (
                      <div key="sec_social_links" className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">راه‌های ارتباطی</h3>
                        <div className="flex flex-wrap gap-2.5">
                          {phone && (
                            <a href={`tel:${phone}`} className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 rounded-xl transition border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)', color: textCol }}>
                              <Phone className="h-5 w-5 mb-1" style={{ color: primaryColor }} />
                              <span className="text-[10px] font-medium opacity-80">تماس</span>
                            </a>
                          )}
                          {email && (
                            <a href={`mailto:${email}`} className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 rounded-xl transition border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)', color: textCol }}>
                              <Mail className="h-5 w-5 text-amber-500 mb-1" />
                              <span className="text-[10px] font-medium opacity-80">ایمیل</span>
                            </a>
                          )}
                          {telegram && (
                            <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 rounded-xl transition border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)', color: textCol }}>
                              <Send className="h-5 w-5 text-sky-500 mb-1" />
                              <span className="text-[10px] font-medium opacity-80">تلگرام</span>
                            </a>
                          )}
                          {whatsapp && (
                            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 rounded-xl transition border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)', color: textCol }}>
                              <MessageCircle className="h-5 w-5 text-emerald-500 mb-1" />
                              <span className="text-[10px] font-medium opacity-80">واتساپ</span>
                            </a>
                          )}
                          {instagram && (
                            <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 rounded-xl transition border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)', color: textCol }}>
                              <Instagram className="h-5 w-5 text-pink-500 mb-1" />
                              <span className="text-[10px] font-medium opacity-80">اینستا</span>
                            </a>
                          )}
                          {linkedin && (
                            <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 rounded-xl transition border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)', color: textCol }}>
                              <Linkedin className="h-5 w-5 text-indigo-600 mb-1" />
                              <span className="text-[10px] font-medium opacity-80">لینکدین</span>
                            </a>
                          )}
                          {website && (
                            <a href={`https://${website}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 rounded-xl transition border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)', color: textCol }}>
                              <Globe className="h-5 w-5 text-violet-600 mb-1" />
                              <span className="text-[10px] font-medium opacity-80">وبسایت</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );

                  case 'custom_buttons':
                    return (card.custom_buttons && card.custom_buttons.length > 0) ? (
                      <div key="sec_custom_buttons" className="space-y-2.5 pt-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">لینک‌های کاربردی</h3>
                        {card.custom_buttons.map((btn) => (
                          <a
                            key={btn.id}
                            href={btn.url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between font-semibold transition text-sm"
                            style={{ color: btn.color || primaryColor }}
                          >
                            <span className="flex items-center gap-2">
                              <LinkIcon className="h-4 w-4" />
                              {btn.label}
                            </span>
                            <ChevronLeft className="h-4 w-4" />
                          </a>
                        ))}
                      </div>
                    ) : null;

                  case 'location':
                    return (card.neshan || card.balad || card.waze || card.googlemap || card.address) ? (
                      <div key="sec_location" className="space-y-3 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">مسیریابی و نشانی</h3>
                        {(card.neshan || card.balad || card.waze || card.googlemap) && (
                          <div className="grid grid-cols-2 gap-2.5">
                            {card.neshan && (
                              <a href={card.neshan} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100 text-xs font-bold">
                                <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>مسیریابی با نشان</span>
                              </a>
                            )}
                            {card.balad && (
                              <a href={card.balad} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100 text-xs font-bold">
                                <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                                <span>مسیریابی با بلد</span>
                              </a>
                            )}
                            {card.waze && (
                              <a href={card.waze} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100 text-xs font-bold">
                                <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>مسیریابی با ویز</span>
                              </a>
                            )}
                            {card.googlemap && (
                              <a href={card.googlemap} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100 text-xs font-bold">
                                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                                <span>گوگل مپ</span>
                              </a>
                            )}
                          </div>
                        )}
                        {card.address && (
                          <div className="p-4 bg-slate-50 rounded-2xl text-xs leading-relaxed border border-slate-100 font-medium text-slate-700">
                            {toPersianDigits(card.address)}
                          </div>
                        )}
                      </div>
                    ) : null;

                  case 'bank_info':
                    return (card.bank_card || card.bank_account || card.bank_shaba) ? (
                      <div key="sec_bank_info" className="space-y-3 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4" style={{ color: primaryColor }} />
                          <span>اطلاعات حساب و کارت بانکی</span>
                        </h3>
                        <div className="space-y-2.5">
                          {card.bank_card && (
                            <div 
                              onClick={() => handleCopyText(card.bank_card || '', 'bank_card')}
                              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                              title="کلیک برای کپی آسان"
                            >
                              <div>
                                <span className="text-[10px] text-slate-400 block mb-1 font-semibold">شماره کارت</span>
                                <span className="font-mono font-bold tracking-widest text-slate-700 dir-ltr select-all">{toEnglishDigits(card.bank_card)}</span>
                              </div>
                              <div className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-700 transition flex items-center gap-1">
                                {copiedField === 'bank_card' ? <span className="text-[10px] font-bold text-emerald-600">کپی شد!</span> : <Copy className="h-4 w-4" />}
                              </div>
                            </div>
                          )}
                          {card.bank_account && (
                            <div 
                              onClick={() => handleCopyText(card.bank_account || '', 'bank_account')}
                              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                              title="کلیک برای کپی آسان"
                            >
                              <div>
                                <span className="text-[10px] text-slate-400 block mb-1 font-semibold">شماره حساب</span>
                                <span className="font-mono font-bold text-slate-700 dir-ltr select-all">{toEnglishDigits(card.bank_account)}</span>
                              </div>
                              <div className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-700 transition flex items-center gap-1">
                                {copiedField === 'bank_account' ? <span className="text-[10px] font-bold text-emerald-600">کپی شد!</span> : <Copy className="h-4 w-4" />}
                              </div>
                            </div>
                          )}
                          {card.bank_shaba && (
                            <div 
                              onClick={() => handleCopyText(card.bank_shaba || '', 'bank_shaba')}
                              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                              title="کلیک برای کپی آسان"
                            >
                              <div>
                                <span className="text-[10px] text-slate-400 block mb-1 font-semibold">شماره شبا (IR)</span>
                                <span className="font-mono font-bold text-slate-700 text-left dir-ltr select-all">{toEnglishDigits(card.bank_shaba)}</span>
                              </div>
                              <div className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-700 transition flex items-center gap-1">
                                {copiedField === 'bank_shaba' ? <span className="text-[10px] font-bold text-emerald-600">کپی شد!</span> : <Copy className="h-4 w-4" />}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;

                  default:
                    return null;
                }
              })}

              {/* Footer Powered By */}
              <div className="flex items-center justify-center gap-2 pt-8 opacity-60 text-[11px] font-medium text-slate-400">
                <BrandLogo size="sm" className="h-5 w-5" />
                <span>قدرت گرفته از سامانه کارت ویزیت دیجیتال مگاکارت</span>
              </div>

            </div>
          </div>
        )}

        {/* TEMPLATE 2: BENTO GRID (MODULAR BENTO TILES) */}
        {isBento && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-5 space-y-3.5 transition-all"
            style={{ backgroundColor: bgColor || '#0f172a', color: textCol || '#f8fafc' }}
          >
            {/* Top Header Bento Box: Avatar + Info */}
            <div 
              className="p-5 rounded-2xl border relative overflow-hidden flex flex-col items-center text-center space-y-3.5 shadow-md"
              style={{ backgroundColor: cardBgColor || '#1e293b', borderColor: `${primaryColor}30` }}
            >
              {/* Background cover watermark */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <img src={getImageUrl(card.cover_image) || '/cover-fallback.avif'} alt="" className="w-full h-full object-cover blur-sm" />
              </div>

              {/* Share & Views Top Row */}
              <div className="w-full flex justify-between items-center z-10 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full font-semibold text-slate-300">
                  <Eye className="h-3 w-3 text-indigo-400" />
                  {card.views_count?.toLocaleString('fa-IR')} بازدید
                </span>
                <div>
                  <button 
                    type="button"
                    onClick={() => setActiveShareId('open')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition active:scale-95 cursor-pointer"
                    title="اشتراک‌گذاری کارت"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Avatar */}
              <div className="relative z-10">
                <div className="h-24 w-24 rounded-2xl border-2 border-indigo-400/50 overflow-hidden shadow-xl bg-slate-900 mx-auto">
                  <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Identity */}
              <div className="relative z-10 space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">{card.first_name} {card.last_name}</h1>
                <p className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 inline-block border border-indigo-500/30">
                  {card.job_title}
                </p>
                {card.company && <p className="text-xs text-slate-400 mt-1">{card.company}</p>}
              </div>
            </div>

            {/* Save Contact & Subscribe 2-Column Bento Tile */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleDownloadVCard}
                className="py-3.5 px-3 rounded-2xl font-bold text-white flex flex-col items-center justify-center gap-1.5 shadow-lg transition active:scale-95 text-xs text-center"
                style={{ backgroundColor: primaryColor || '#6366f1' }}
              >
                {isVCardGenerated ? <Check className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                <span>{isVCardGenerated ? 'ذخیره شد' : 'ذخیره مخاطب'}</span>
              </button>
              <button 
                onClick={() => { setShowSubscribeModal(true); setSubscribeStep('mobile'); setSubscribeError(null); setSubscribeMessage(null); }}
                className="py-3.5 px-3 rounded-2xl font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 flex flex-col items-center justify-center gap-1.5 transition active:scale-95 text-xs text-center"
              >
                <Bell className="h-5 w-5 text-emerald-400" />
                <span>عضویت در خبرنامه</span>
              </button>
            </div>

            {/* Bio Bento Tile */}
            {card.bio && (
              <div 
                className="p-4 rounded-2xl border text-xs leading-relaxed text-slate-300 space-y-1.5 relative overflow-hidden"
                style={{ backgroundColor: cardBgColor || '#1e293b', borderColor: `${primaryColor}20` }}
              >
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">درباره من / بیوگرافی</span>
                <p className="whitespace-pre-line">{card.bio}</p>
              </div>
            )}

            {/* Social Bento Grid Tiles (2x2 or 3x2) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 px-1">شبکه‌ها و راه‌های ارتباطی</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {phone && (
                  <a href={`tel:${phone}`} className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-1 group transition">
                    <Phone className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-bold text-white">تماس مستقیم</span>
                    <span className="text-[9px] text-slate-400 font-mono">{toPersianDigits(phone)}</span>
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-1 group transition">
                    <Mail className="h-5 w-5 text-amber-400 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-bold text-white">ارسال ایمیل</span>
                    <span className="text-[9px] text-slate-400 truncate max-w-full">{email}</span>
                  </a>
                )}
                {telegram && (
                  <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-1 group transition">
                    <Send className="h-5 w-5 text-sky-400 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-bold text-white">تلگرام</span>
                    <span className="text-[9px] text-slate-400">@{telegram}</span>
                  </a>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-1 group transition">
                    <MessageCircle className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-bold text-white">واتساپ</span>
                    <span className="text-[9px] text-slate-400">گفتگو</span>
                  </a>
                )}
                {instagram && (
                  <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-1 group transition">
                    <Instagram className="h-5 w-5 text-pink-400 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-bold text-white">اینستاگرام</span>
                    <span className="text-[9px] text-slate-400">@{instagram}</span>
                  </a>
                )}
                {linkedin && (
                  <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-1 group transition">
                    <Linkedin className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-bold text-white">لینکدین</span>
                    <span className="text-[9px] text-slate-400">پروفایل</span>
                  </a>
                )}
              </div>
            </div>

            {/* Custom Link Buttons Bento Tiles */}
            {card.custom_buttons && card.custom_buttons.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 px-1">لینک‌ها و دسترسی سریع</span>
                <div className="space-y-2">
                  {card.custom_buttons.map((btn) => (
                    <a
                      key={btn.id}
                      href={btn.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3.5 bg-slate-800/90 hover:bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-between transition group"
                    >
                      <span className="flex items-center gap-2.5 font-bold text-xs text-white">
                        <LinkIcon className="h-4 w-4 text-indigo-400" />
                        {btn.label}
                      </span>
                      <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:-translate-x-1 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Navigation Bento Tile */}
            {(card.neshan || card.balad || card.waze || card.googlemap || card.address) && (
              <div className="p-4 bg-slate-800/90 rounded-2xl border border-white/10 space-y-3">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>نشانی و مسیریابی</span>
                </span>
                {card.address && <p className="text-xs text-slate-300 leading-relaxed">{toPersianDigits(card.address)}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {card.neshan && (
                    <a href={card.neshan} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-center font-bold text-emerald-400 border border-emerald-500/20">
                      مسیریابی نشان
                    </a>
                  )}
                  {card.googlemap && (
                    <a href={card.googlemap} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-center font-bold text-cyan-400 border border-cyan-500/20">
                      گوگل مپ
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Bank Info Bento Tile */}
            {(card.bank_card || card.bank_account || card.bank_shaba) && (
              <div className="p-4 bg-slate-800/90 rounded-2xl border border-white/10 space-y-2.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  <span>اطلاعات حساب و واریز</span>
                </span>
                {card.bank_card && (
                  <div onClick={() => handleCopyText(card.bank_card || '', 'bank_card')} className="p-3 bg-slate-900/80 rounded-xl border border-white/5 flex items-center justify-between text-xs cursor-pointer">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">شماره کارت</span>
                      <span className="font-mono font-bold text-white">{card.bank_card}</span>
                    </div>
                    <Copy className="h-4 w-4 text-slate-400" />
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4 opacity-40 text-[10px] text-slate-400">
              <span>Bento Card System by MegaCard</span>
            </div>
          </div>
        )}

        {/* TEMPLATE 3: CONTENT CREATOR & INFLUENCER (BIO-LINK SHOWCASE) */}
        {isContentCreator && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-2xl overflow-hidden p-5 space-y-5 transition-all relative"
            style={{ backgroundColor: bgColor || '#09090b', color: textCol || '#fafafa' }}
          >
            {/* Top Creator Hero Header */}
            <div className="relative pt-6 pb-2 text-center space-y-3.5">
              {/* Cover Banner background with overlay */}
              <div className="absolute top-0 inset-x-0 h-32 rounded-2xl overflow-hidden border border-white/10 opacity-75">
                <img src={getImageUrl(card.cover_image) || '/cover-fallback.avif'} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent"></div>
              </div>

              {/* Share Floating Button */}
              <div className="absolute top-3 left-3 z-20">
                <button 
                  type="button"
                  onClick={() => setActiveShareId('open')}
                  className="p-2.5 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition active:scale-95 border border-white/20 cursor-pointer"
                  title="اشتراک‌گذاری کارت"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* Creator Avatar with glowing ring */}
              <div className="relative z-10 pt-6">
                <div className="relative inline-block">
                  <div className="absolute -inset-1 rounded-full blur-md bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-70 animate-pulse"></div>
                  <div className="h-28 w-28 rounded-full border-4 border-zinc-900 overflow-hidden relative shadow-2xl mx-auto bg-zinc-950">
                    <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Name & Title */}
              <div className="relative z-10 space-y-1">
                <h1 className="text-2xl font-black text-white tracking-tight">{card.first_name} {card.last_name}</h1>
                <p className="text-xs font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {card.job_title}
                </p>
                {card.company && <p className="text-xs text-zinc-400">{card.company}</p>}
              </div>

              {/* Views & Follow Pill */}
              <div className="relative z-10 flex items-center justify-center gap-2 pt-1">
                <span className="px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full text-[11px] font-bold border border-pink-500/20">
                  ★ {card.views_count?.toLocaleString('fa-IR')} بازدید کننده
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button 
                onClick={handleDownloadVCard}
                className="py-3 px-4 rounded-xl font-black text-white flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition active:scale-95 text-xs"
                style={{ backgroundImage: `linear-gradient(to right, ${primaryColor || '#ec4899'}, ${secondaryColor || '#8b5cf6'})` }}
              >
                {isVCardGenerated ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                <span>{isVCardGenerated ? 'ذخیره شد' : 'ذخیره مخاطب'}</span>
              </button>
              <button 
                onClick={() => { setShowSubscribeModal(true); setSubscribeStep('mobile'); setSubscribeError(null); setSubscribeMessage(null); }}
                className="py-3 px-4 rounded-xl font-extrabold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-95 text-xs"
              >
                <Bell className="h-4 w-4 text-emerald-400" />
                <span>عضویت VIP</span>
              </button>
            </div>

            {/* Bio Story Box */}
            {card.bio && (
              <div className="p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed whitespace-pre-line shadow-inner">
                {card.bio}
              </div>
            )}

            {/* Highlighted Bio-Link Buttons Stack */}
            {card.custom_buttons && card.custom_buttons.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-black text-zinc-400 tracking-wider uppercase block">لینک‌های برتر و پورتفولیو</span>
                {card.custom_buttons.map((btn) => (
                  <a
                    key={btn.id}
                    href={btn.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-gradient-to-r from-zinc-900 to-zinc-800/90 hover:from-pink-950/40 hover:to-purple-950/40 border border-zinc-800 hover:border-pink-500/40 rounded-2xl flex items-center justify-between font-bold text-xs text-white transition-all shadow-md group"
                  >
                    <span className="flex items-center gap-3">
                      <span className="p-2 bg-pink-500/20 text-pink-400 rounded-xl group-hover:scale-110 transition">
                        <LinkIcon className="h-4 w-4" />
                      </span>
                      <span>{btn.label}</span>
                    </span>
                    <ChevronLeft className="h-4 w-4 text-zinc-400 group-hover:-translate-x-1 transition" />
                  </a>
                ))}
              </div>
            )}

            {/* Social Icons Bar */}
            <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2.5">
              <span className="text-xs font-bold text-zinc-400 block text-center">شبکه‌های اجتماعی و کانال‌ها</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {instagram && (
                  <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="p-3 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-2xl border border-pink-500/30 transition hover:scale-110">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {telegram && (
                  <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="p-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30 transition hover:scale-110">
                    <Send className="h-5 w-5" />
                  </a>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 transition hover:scale-110">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
                {linkedin && (
                  <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 transition hover:scale-110">
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="p-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30 transition hover:scale-110">
                    <Phone className="h-5 w-5" />
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 transition hover:scale-110">
                    <Mail className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Address & Navigation */}
            {(card.neshan || card.balad || card.waze || card.googlemap || card.address) && (
              <div className="p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <span className="font-bold text-pink-400 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>لوکیشن و آدرس</span>
                </span>
                {card.address && <p className="text-zinc-300 leading-relaxed">{toPersianDigits(card.address)}</p>}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 opacity-30 text-[10px] text-zinc-500">
              <span>Bio-Link Creator Template by MegaCard</span>
            </div>
          </div>
        )}

        {/* TEMPLATE 2: NEON GLASS (DARK FUTURISTIC) */}
        {isNeonGlass && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border transition-all p-6 space-y-6"
            style={{ 
              backgroundColor: cardBgColor || 'rgba(15, 23, 42, 0.85)', 
              borderColor: `${primaryColor}40`,
              color: textCol || '#ffffff',
              boxShadow: `0 10px 40px -10px ${primaryColor}40`
            }}
          >
            {/* Cover photo */}
            <div className="h-32 bg-slate-800 rounded-2xl overflow-hidden relative border border-white/10 shadow-lg">
              <img 
                src={getImageUrl(card.cover_image) || '/cover-fallback.avif'} 
                alt="cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
            </div>

            {/* Header branding info */}
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-slate-300">
                <Eye className="h-3 w-3 text-cyan-400" />
                {card.views_count?.toLocaleString('fa-IR')} بازدید
              </span>

              <div>
                <button 
                  type="button"
                  onClick={() => setActiveShareId('open')}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition active:scale-95 cursor-pointer"
                  title="اشتراک‌گذاری کارت"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Profile visual */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div 
                  className="absolute -inset-1 rounded-full blur opacity-40 animate-pulse" 
                  style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                ></div>
                <div className="h-28 w-28 rounded-full border-2 border-white/50 overflow-hidden relative bg-slate-950">
                  <img 
                    src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} 
                    alt="profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">{card.first_name} {card.last_name}</h1>
                <p className="text-sm font-semibold mt-1 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">{card.job_title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.company}</p>
              </div>
            </div>

            {getSectionOrders(card).map((secKey) => {
              switch (secKey) {
                case 'save_contact':
                  return (
                    <div key="sec_temp2_save" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={handleDownloadVCard}
                        className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-cyan-500/20 transition-all text-sm text-slate-950"
                        style={{ backgroundImage: `linear-gradient(to left, ${primaryColor}, ${secondaryColor})` }}
                      >
                        {isVCardGenerated ? <Check className="h-5 w-5 text-slate-950" /> : <Download className="h-5 w-5" />}
                        <span className="font-extrabold">{isVCardGenerated ? 'ذخیره شد' : 'ذخیره مخاطب'}</span>
                      </button>
                      <button 
                        onClick={() => { setShowSubscribeModal(true); setSubscribeStep('mobile'); setSubscribeError(null); setSubscribeMessage(null); }}
                        className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-all text-sm"
                      >
                        <Bell className="h-5 w-5 text-emerald-400" />
                        <span>عضویت در کلاب</span>
                      </button>
                    </div>
                  );
                case 'bio':
                  return card.bio ? (
                    <div key="sec_temp2_bio" className="p-4 bg-white/5 rounded-2xl text-xs leading-relaxed border border-white/10 text-slate-300 whitespace-pre-line">
                      {card.bio}
                    </div>
                  ) : null;
                case 'primary_actions':
                  return (mobile || (extra_phones && extra_phones.length > 0)) ? (
                    <div key="sec_temp2_primary" className="space-y-3 pt-4 border-t border-white/10">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">شماره تماس‌های دیگر</h3>
                      <div className="space-y-2">
                        {mobile && (
                          <a href={`tel:${mobile}`} className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 text-xs text-white">
                            <span className="flex items-center gap-2 font-semibold text-slate-300">
                              <Phone className="h-4 w-4 text-cyan-400" />
                              تلفن همراه (موبایل):
                            </span>
                            <span className="font-mono font-bold text-cyan-400">{mobile}</span>
                          </a>
                        )}
                        {extra_phones && extra_phones.map((ph: string, idx: number) => (
                          <a key={idx} href={`tel:${ph}`} className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 text-xs text-white">
                            <span className="flex items-center gap-2 font-semibold text-slate-300">
                              <Phone className="h-4 w-4 text-slate-400" />
                              شماره تماس جانبی {idx + 1}:
                            </span>
                            <span className="font-mono font-bold text-slate-300">{ph}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null;
                case 'social_links':
                  return (
                    <div key="sec_temp2_social" className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">راه‌های ارتباطی سریع</h3>
                      <div className="flex flex-wrap gap-2.5">
                        {phone && (
                          <a href={`tel:${phone}`} className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                            <Phone className="h-5 w-5 text-cyan-400 mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-slate-400">تماس</span>
                          </a>
                        )}
                        {email && (
                          <a href={`mailto:${email}`} className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                            <Mail className="h-5 w-5 text-amber-400 mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-slate-400">ایمیل</span>
                          </a>
                        )}
                        {telegram && (
                          <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                            <Send className="h-5 w-5 text-sky-400 mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-slate-400">تلگرام</span>
                          </a>
                        )}
                        {whatsapp && (
                          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                            <MessageCircle className="h-5 w-5 text-emerald-400 mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-slate-400">واتساپ</span>
                          </a>
                        )}
                        {instagram && (
                          <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                            <Instagram className="h-5 w-5 text-pink-400 mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-slate-400">اینستا</span>
                          </a>
                        )}
                        {linkedin && (
                          <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                            <Linkedin className="h-5 w-5 text-indigo-400 mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-slate-400">لینکدین</span>
                          </a>
                        )}
                        {website && (
                          <a href={`https://${website}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                            <Globe className="h-5 w-5 text-violet-400 mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-slate-400">وبسایت</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                case 'custom_buttons':
                  return card.custom_buttons && card.custom_buttons.length > 0 ? (
                    <div key="sec_temp2_custom" className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">شبکه‌های تخصصی</h3>
                      {card.custom_buttons.map((btn) => (
                        <a
                          key={btn.id}
                          href={btn.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3.5 px-4 rounded-xl border border-white/10 hover:bg-white/10 flex items-center justify-between font-semibold transition text-sm bg-white/5"
                        >
                          <span className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" style={{ color: btn.color || primaryColor }} />
                            {btn.label}
                          </span>
                          <ChevronLeft className="h-4 w-4 opacity-50" />
                        </a>
                      ))}
                    </div>
                  ) : null;
                case 'location':
                  return (card.neshan || card.balad || card.waze || card.googlemap || card.address) ? (
                    <div key="sec_temp2_loc" className="space-y-3 pt-4 border-t border-white/10">
                      {(card.neshan || card.balad || card.waze || card.googlemap) && (
                        <>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">مسیریابی روی نقشه</h3>
                          <div className="grid grid-cols-2 gap-2.5">
                            {card.neshan && (
                              <a href={card.neshan} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 text-xs font-bold text-white">
                                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span>نقشه نشان</span>
                              </a>
                            )}
                            {card.balad && (
                              <a href={card.balad} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 text-xs font-bold text-white">
                                <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                                <span>نقشه بلد</span>
                              </a>
                            )}
                            {card.waze && (
                              <a href={card.waze} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 text-xs font-bold text-white">
                                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                                <span>مسیریاب ویز</span>
                              </a>
                            )}
                            {card.googlemap && (
                              <a href={card.googlemap} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 text-xs font-bold text-white">
                                <MapPin className="h-4 w-4 text-red-400 shrink-0" />
                                <span>گوگل مپ</span>
                              </a>
                            )}
                          </div>
                        </>
                      )}
                      {card.address && (
                        <div className="space-y-2 pt-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-cyan-400" />
                            <span>نشانی و آدرس حضوری</span>
                          </h3>
                          <div className="p-4 bg-white/5 rounded-2xl text-xs leading-relaxed border border-white/5 font-medium text-slate-300">
                            {card.address}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                case 'bank_info':
                  return (card.bank_card || card.bank_account || card.bank_shaba) ? (
                    <div key="sec_temp2_bank" className="space-y-3 pt-4 border-t border-white/10">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-cyan-400" />
                        <span>اطلاعات حساب و کارت بانکی</span>
                      </h3>
                      <div className="space-y-2.5">
                        {card.bank_card && (
                          <div 
                            onClick={() => handleCopyText(card.bank_card || '', 'bank_card')}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-1 font-semibold">شماره کارت</span>
                              <span className="font-mono font-bold tracking-widest text-white">{card.bank_card}</span>
                            </div>
                            <div className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition flex items-center gap-1">
                              {copiedField === 'bank_card' ? <span className="text-[10px] font-bold text-emerald-400">کپی شد!</span> : <Copy className="h-4 w-4" />}
                            </div>
                          </div>
                        )}
                        {card.bank_account && (
                          <div 
                            onClick={() => handleCopyText(card.bank_account || '', 'bank_account')}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-1 font-semibold">شماره حساب</span>
                              <span className="font-mono font-bold text-white">{card.bank_account}</span>
                            </div>
                            <div className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition flex items-center gap-1">
                              {copiedField === 'bank_account' ? <span className="text-[10px] font-bold text-emerald-400">کپی شد!</span> : <Copy className="h-4 w-4" />}
                            </div>
                          </div>
                        )}
                        {card.bank_shaba && (
                          <div 
                            onClick={() => handleCopyText(card.bank_shaba || '', 'bank_shaba')}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-1 font-semibold">شماره شبا (IR)</span>
                              <span className="font-mono font-bold text-white text-left" dir="ltr">{card.bank_shaba}</span>
                            </div>
                            <div className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition flex items-center gap-1">
                              {copiedField === 'bank_shaba' ? <span className="text-[10px] font-bold text-emerald-400">کپی شد!</span> : <Copy className="h-4 w-4" />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                default:
                  return null;
              }
            })}

            {/* Footer */}
            <div className="text-center pt-8 opacity-30 text-[10px]">
              <span>Powered by Twin Digital Business Card system</span>
            </div>
          </div>
        )}

        {/* TEMPLATE 3: MINIMAL (CLEAN MODERN ART) */}
        {isMinimal && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-lg overflow-hidden border border-slate-100 transition-all text-slate-900 p-6 sm:p-8 space-y-6"
            style={{ backgroundColor: cardBgColor, color: textCol }}
          >
            {/* Cover photo with integrated share button */}
            <div className="h-32 rounded-2xl overflow-hidden relative bg-slate-100 border border-slate-100 shrink-0">
              <img 
                src={getImageUrl(card.cover_image) || '/cover-fallback.avif'} 
                alt="cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 z-30">
                <button 
                  type="button"
                  onClick={() => setActiveShareId('open')}
                  className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition active:scale-95 shadow-sm cursor-pointer"
                  title="اشتراک‌گذاری کارت"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[10px] text-white/80 font-mono">
                /{card.slug}
              </div>
            </div>

            {/* Portrait Card */}
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-100 shrink-0">
                <img 
                  src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} 
                  alt="profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight">{card.first_name} {card.last_name}</h1>
                <p className="text-xs font-semibold opacity-80" style={{ color: primaryColor }}>{card.job_title}</p>
                <p className="text-[11px] opacity-60">{card.company}</p>
              </div>
            </div>

            {getSectionOrders(card).map((secKey) => {
              switch (secKey) {
                case 'save_contact':
                  return (
                    <div key="sec_temp3_save" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button 
                        onClick={handleDownloadVCard}
                        className="w-full py-3 rounded-xl border border-slate-900 font-bold flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all text-xs"
                      >
                        <Download className="h-4 w-4" />
                        <span>{isVCardGenerated ? 'ذخیره شد' : 'ذخیره مخاطب'}</span>
                      </button>
                      <button 
                        onClick={() => { setShowSubscribeModal(true); setSubscribeStep('mobile'); setSubscribeError(null); setSubscribeMessage(null); }}
                        className="w-full py-3 rounded-xl border border-emerald-600 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center gap-2 transition-all text-xs"
                      >
                        <Bell className="h-4 w-4 text-emerald-700" />
                        <span>عضویت در کلاب</span>
                      </button>
                    </div>
                  );
                case 'bio':
                  return card.bio ? (
                    <p key="sec_temp3_bio" className="text-xs leading-relaxed opacity-75 border-r-2 border-slate-200 pr-3 font-normal whitespace-pre-line">
                      {card.bio}
                    </p>
                  ) : null;
                case 'primary_actions':
                  return (mobile || (extra_phones && extra_phones.length > 0)) ? (
                    <div key="sec_temp3_primary" className="space-y-2 pt-2">
                      <h3 className="text-[11px] font-bold tracking-wider uppercase opacity-40">تماس‌های دیگر</h3>
                      <div className="space-y-1.5">
                        {mobile && (
                          <a href={`tel:${mobile}`} className="flex items-center justify-between py-2 border-b border-slate-100 text-xs text-slate-800">
                            <span className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              تلفن همراه:
                            </span>
                            <span className="font-mono font-bold">{mobile}</span>
                          </a>
                        )}
                        {extra_phones && extra_phones.map((ph: string, idx: number) => (
                          <a key={idx} href={`tel:${ph}`} className="flex items-center justify-between py-2 border-b border-slate-100 text-xs text-slate-800">
                            <span className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              تلفن جانبی {idx + 1}:
                            </span>
                            <span className="font-mono font-semibold text-slate-600">{ph}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null;
                case 'social_links':
                  return (
                    <div key="sec_temp3_social" className="space-y-4">
                      <h3 className="text-[11px] font-bold tracking-wider uppercase opacity-40">تماس و شبکه‌های اجتماعی</h3>
                      <div className="space-y-2">
                        {phone && (
                          <a href={`tel:${phone}`} className="flex items-center gap-3.5 py-1.5 hover:opacity-80 transition text-sm">
                            <span className="p-2 bg-slate-50 rounded-lg"><Phone className="h-4 w-4 text-slate-600" /></span>
                            <span className="font-mono text-xs">{phone}</span>
                          </a>
                        )}
                        {email && (
                          <a href={`mailto:${email}`} className="flex items-center gap-3.5 py-1.5 hover:opacity-80 transition text-sm">
                            <span className="p-2 bg-slate-50 rounded-lg"><Mail className="h-4 w-4 text-slate-600" /></span>
                            <span className="text-xs">{email}</span>
                          </a>
                        )}
                        {website && (
                          <a href={`https://${website}`} target="_blank" rel="noreferrer" className="flex items-center gap-3.5 py-1.5 hover:opacity-80 transition text-sm">
                            <span className="p-2 bg-slate-50 rounded-lg"><Globe className="h-4 w-4 text-slate-600" /></span>
                            <span className="text-xs">{website}</span>
                          </a>
                        )}
                        {telegram && (
                          <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="flex items-center gap-3.5 py-1.5 hover:opacity-80 transition text-sm">
                            <span className="p-2 bg-slate-50 rounded-lg"><Send className="h-4 w-4 text-slate-600" /></span>
                            <span className="text-xs">@{telegram}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                case 'custom_buttons':
                  return card.custom_buttons && card.custom_buttons.length > 0 ? (
                    <div key="sec_temp3_custom" className="space-y-2">
                      <h3 className="text-[11px] font-bold tracking-wider uppercase opacity-40">دکمه‌های اختصاصی</h3>
                      {card.custom_buttons.map((btn) => (
                        <a
                          key={btn.id}
                          href={btn.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 flex items-center justify-between font-medium hover:opacity-70 transition border-b border-slate-100 text-xs"
                        >
                          <span>{btn.label}</span>
                          <ChevronLeft className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  ) : null;
                case 'location':
                  return (card.neshan || card.balad || card.waze || card.googlemap || card.address) ? (
                    <div key="sec_temp3_loc" className="space-y-2.5 pt-2">
                      {(card.neshan || card.balad || card.waze || card.googlemap) && (
                        <>
                          <h3 className="text-[11px] font-bold tracking-wider uppercase opacity-40">موقعیت روی نقشه</h3>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {card.neshan && (
                              <a href={card.neshan} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 text-slate-700">
                                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                <span>نشان</span>
                              </a>
                            )}
                            {card.balad && (
                              <a href={card.balad} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 text-slate-700">
                                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                <span>بلد</span>
                              </a>
                            )}
                            {card.waze && (
                              <a href={card.waze} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 text-slate-700">
                                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                <span>ویز</span>
                              </a>
                            )}
                            {card.googlemap && (
                              <a href={card.googlemap} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 text-slate-700">
                                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                <span>گوگل‌مپ</span>
                              </a>
                            )}
                          </div>
                        </>
                      )}
                      {card.address && (
                        <div className="space-y-2 pt-2">
                          <h3 className="text-[11px] font-bold tracking-wider uppercase opacity-40 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            <span>نشانی و آدرس حضوری</span>
                          </h3>
                          <div className="p-3 bg-slate-50 rounded-xl text-xs leading-relaxed border border-slate-100 font-medium text-slate-700">
                            {card.address}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                case 'bank_info':
                  return (card.bank_card || card.bank_account || card.bank_shaba) ? (
                    <div key="sec_temp3_bank" className="space-y-2 pt-2">
                      <h3 className="text-[11px] font-bold tracking-wider uppercase opacity-40 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                        <span>اطلاعات حساب و کارت بانکی</span>
                      </h3>
                      <div className="space-y-2">
                        {card.bank_card && (
                          <div 
                            onClick={() => handleCopyText(card.bank_card || '', 'bank_card')}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[9px] text-slate-400 block mb-0.5 font-semibold">شماره کارت</span>
                              <span className="font-mono font-bold tracking-widest text-slate-700">{card.bank_card}</span>
                            </div>
                            <div className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-750 transition flex items-center gap-1">
                              {copiedField === 'bank_card' ? <span className="text-[9px] font-bold text-emerald-600">کپی شد!</span> : <Copy className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        )}
                        {card.bank_account && (
                          <div 
                            onClick={() => handleCopyText(card.bank_account || '', 'bank_account')}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[9px] text-slate-400 block mb-0.5 font-semibold">شماره حساب</span>
                              <span className="font-mono font-bold text-slate-700">{card.bank_account}</span>
                            </div>
                            <div className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-750 transition flex items-center gap-1">
                              {copiedField === 'bank_account' ? <span className="text-[9px] font-bold text-emerald-600">کپی شد!</span> : <Copy className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        )}
                        {card.bank_shaba && (
                          <div 
                            onClick={() => handleCopyText(card.bank_shaba || '', 'bank_shaba')}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[9px] text-slate-400 block mb-0.5 font-semibold">شماره شبا</span>
                              <span className="font-mono font-bold text-slate-700">{card.bank_shaba}</span>
                            </div>
                            <div className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-750 transition flex items-center gap-1">
                              {copiedField === 'bank_shaba' ? <span className="text-[9px] font-bold text-emerald-600">کپی شد!</span> : <Copy className="h-3.5 w-3.5" />}
                            </div>
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
        )}

        {/* TEMPLATE 4: LUXURY DARK */}
        {isLuxuryDark && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border transition-all p-6 sm:p-8 space-y-6"
            style={{ 
              backgroundColor: cardBgColor || '#0c0a09',
              borderColor: primaryColor || '#e2b53e',
              color: textCol || '#fef3c7',
              boxShadow: `0 10px 50px -15px ${primaryColor}40`
            }}
          >
            {/* Cover photo with luxury gold VIP badge & Share Button */}
            <div className="h-36 rounded-2xl overflow-hidden relative border border-amber-500/30 shrink-0 shadow-lg grayscale hover:grayscale-0 transition-all duration-500">
              <img 
                src={getImageUrl(card.cover_image) || '/cover-fallback.avif'} 
                alt="cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>

              {/* VIP luxury chip & Share on cover */}
              <div className="absolute top-3 right-3 z-20">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-[#e2b53e] uppercase tracking-wider border border-amber-500/30">
                  VIP LUXURY
                </span>
              </div>

              <div className="absolute top-3 left-3 z-30">
                <button 
                  type="button"
                  onClick={() => setActiveShareId('open')}
                  className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-[#e2b53e] backdrop-blur-md transition active:scale-95 border border-amber-500/30 shadow-md cursor-pointer"
                  title="اشتراک‌گذاری کارت"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Portrait Layout */}
            <div className="text-center space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full border-2 border-[#e2b53e] p-1 shadow-inner">
                <img 
                  src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} 
                  alt="profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider text-white">{card.first_name} {card.last_name}</h1>
                <p className="text-xs uppercase tracking-widest text-[#e2b53e] font-semibold mt-1">{card.job_title}</p>
                <p className="text-[11px] opacity-60 mt-0.5">{card.company}</p>
              </div>
            </div>

            {getSectionOrders(card).map((secKey) => {
              switch (secKey) {
                case 'save_contact':
                  return (
                    <div key="sec_temp4_save" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button 
                        onClick={handleDownloadVCard}
                        className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs bg-gradient-to-l from-[#f59e0b] to-[#d97706] text-black hover:opacity-95 shadow-md shadow-amber-500/10"
                      >
                        <Download className="h-4 w-4" />
                        <span>{isVCardGenerated ? 'مخاطب ذخیره شد' : 'ذخیره در مخاطبان'}</span>
                      </button>
                      <button 
                        onClick={() => { setShowSubscribeModal(true); setSubscribeStep('mobile'); setSubscribeError(null); setSubscribeMessage(null); }}
                        className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs bg-amber-500/10 hover:bg-amber-500/20 text-[#e2b53e] border border-amber-500/30"
                      >
                        <Bell className="h-4 w-4 text-[#e2b53e]" />
                        <span>عضویت در کلاب</span>
                      </button>
                    </div>
                  );
                case 'bio':
                  return card.bio ? (
                    <div key="sec_temp4_bio" className="p-4 bg-stone-900 rounded-xl text-xs leading-relaxed border border-amber-500/10 text-stone-300 text-center relative whitespace-pre-line">
                      <span className="absolute -top-3 right-4 bg-[#0c0a09] px-2 text-[10px] text-[#e2b53e] font-bold">درباره من</span>
                      {card.bio}
                    </div>
                  ) : null;
                case 'primary_actions':
                  return (mobile || (extra_phones && extra_phones.length > 0)) ? (
                    <div key="sec_temp4_primary" className="space-y-3 pt-4 border-t border-amber-500/15">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-center">راه‌های ارتباطی ثانویه</h3>
                      <div className="space-y-2">
                        {mobile && (
                          <a href={`tel:${mobile}`} className="flex items-center justify-between p-3.5 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 text-xs">
                            <span className="flex items-center gap-2 text-stone-300">
                              <Phone className="h-4 w-4 text-[#e2b53e]" />
                              تلفن همراه (موبایل):
                            </span>
                            <span className="font-mono text-[#e2b53e] font-bold">{mobile}</span>
                          </a>
                        )}
                        {extra_phones && extra_phones.map((ph: string, idx: number) => (
                          <a key={idx} href={`tel:${ph}`} className="flex items-center justify-between p-3.5 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 text-xs">
                            <span className="flex items-center gap-2 text-stone-300">
                              <Phone className="h-4 w-4 text-stone-400" />
                              شماره تماس کمکی {idx + 1}:
                            </span>
                            <span className="font-mono text-stone-200 font-semibold">{ph}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null;
                case 'social_links':
                  return (
                    <div key="sec_temp4_social" className="space-y-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-center">کانال‌های ارتباطی لوکس</h3>
                      <div className="flex flex-wrap gap-2.5">
                        {phone && (
                          <a href={`tel:${phone}`} className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                            <Phone className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-stone-400">تماس</span>
                          </a>
                        )}
                        {email && (
                          <a href={`mailto:${email}`} className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                            <Mail className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-stone-400">ایمیل</span>
                          </a>
                        )}
                        {telegram && (
                          <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                            <Send className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-stone-400">تلگرام</span>
                          </a>
                        )}
                        {whatsapp && (
                          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                            <MessageCircle className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-stone-400">واتساپ</span>
                          </a>
                        )}
                        {instagram && (
                          <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                            <Instagram className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-stone-400">اینستا</span>
                          </a>
                        )}
                        {linkedin && (
                          <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                            <Linkedin className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-stone-400">لینکدین</span>
                          </a>
                        )}
                        {website && (
                          <a href={`https://${website}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                            <Globe className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                            <span className="text-[10px] text-stone-400">وبسایت</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                case 'custom_buttons':
                  return card.custom_buttons && card.custom_buttons.length > 0 ? (
                    <div key="sec_temp4_custom" className="space-y-2.5">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-center">لینک‌های برتر</h3>
                      {card.custom_buttons.map((btn) => (
                        <a
                          key={btn.id}
                          href={btn.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3.5 px-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 bg-stone-900/60 flex items-center justify-between font-semibold transition text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <LinkIcon className="h-3.5 w-3.5 text-[#e2b53e]" />
                            <span className="text-white">{btn.label}</span>
                          </span>
                          <ChevronLeft className="h-4 w-4 text-[#e2b53e]" />
                        </a>
                      ))}
                    </div>
                  ) : null;
                case 'location':
                  return (card.neshan || card.balad || card.waze || card.googlemap || card.address) ? (
                    <div key="sec_temp4_loc" className="space-y-3 pt-4 border-t border-amber-500/15">
                      {(card.neshan || card.balad || card.waze || card.googlemap) && (
                        <>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-center">مسیریابی مجلل</h3>
                          <div className="grid grid-cols-2 gap-2.5">
                            {card.neshan && (
                              <a href={card.neshan} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 text-xs text-amber-100 font-semibold">
                                <MapPin className="h-4 w-4 text-[#e2b53e]" />
                                <span>نقشه نشان</span>
                              </a>
                            )}
                            {card.balad && (
                              <a href={card.balad} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 text-xs text-amber-100 font-semibold">
                                <MapPin className="h-4 w-4 text-[#e2b53e]" />
                                <span>نقشه بلد</span>
                              </a>
                            )}
                            {card.waze && (
                              <a href={card.waze} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 text-xs text-amber-100 font-semibold">
                                <MapPin className="h-4 w-4 text-[#e2b53e]" />
                                <span>مسیریاب ویز</span>
                              </a>
                            )}
                            {card.googlemap && (
                              <a href={card.googlemap} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 text-xs text-amber-100 font-semibold">
                                <MapPin className="h-4 w-4 text-[#e2b53e]" />
                                <span>گوگل مپ VIP</span>
                              </a>
                            )}
                          </div>
                        </>
                      )}
                      {card.address && (
                        <div className="space-y-2 pt-2">
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-center flex items-center justify-center gap-1.5">
                            <MapPin className="h-4 w-4 text-[#e2b53e]" />
                            <span>نشانی و دفتر مرکزی</span>
                          </h3>
                          <div className="p-4 bg-stone-900/60 rounded-2xl text-xs leading-relaxed border border-amber-500/10 text-stone-200 text-center">
                            {card.address}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                case 'bank_info':
                  return (card.bank_card || card.bank_account || card.bank_shaba) ? (
                    <div key="sec_temp4_bank" className="space-y-3 pt-4 border-t border-amber-500/15">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-center flex items-center justify-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-[#e2b53e]" />
                        <span>شماره حساب و کارت VIP</span>
                      </h3>
                      <div className="space-y-2.5">
                        {card.bank_card && (
                          <div 
                            onClick={() => handleCopyText(card.bank_card || '', 'bank_card')}
                            className="p-3 bg-stone-900/60 hover:bg-stone-900/95 rounded-xl border border-amber-500/10 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[9px] text-stone-500 block mb-0.5 font-bold uppercase tracking-wider">شماره کارت</span>
                              <span className="font-mono font-bold tracking-widest text-[#e2b53e]">{card.bank_card}</span>
                            </div>
                            <div className="p-1.5 bg-amber-500/10 hover:bg-amber-500/25 rounded-lg text-[#e2b53e] transition flex items-center gap-1">
                              {copiedField === 'bank_card' ? <span className="text-[9px] font-bold text-emerald-400">کپی شد!</span> : <Copy className="h-4 w-4" />}
                            </div>
                          </div>
                        )}
                        {card.bank_account && (
                          <div 
                            onClick={() => handleCopyText(card.bank_account || '', 'bank_account')}
                            className="p-3 bg-stone-900/60 hover:bg-stone-900/95 rounded-xl border border-amber-500/10 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[9px] text-stone-500 block mb-0.5 font-bold uppercase tracking-wider">شماره حساب</span>
                              <span className="font-mono font-bold text-[#e2b53e]">{card.bank_account}</span>
                            </div>
                            <div className="p-1.5 bg-amber-500/10 hover:bg-amber-500/25 rounded-lg text-[#e2b53e] transition flex items-center gap-1">
                              {copiedField === 'bank_account' ? <span className="text-[9px] font-bold text-emerald-400">کپی شد!</span> : <Copy className="h-4 w-4" />}
                            </div>
                          </div>
                        )}
                        {card.bank_shaba && (
                          <div 
                            onClick={() => handleCopyText(card.bank_shaba || '', 'bank_shaba')}
                            className="p-3 bg-stone-900/60 hover:bg-stone-900/95 rounded-xl border border-amber-500/10 flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98]"
                            title="کلیک برای کپی آسان"
                          >
                            <div>
                              <span className="text-[9px] text-stone-500 block mb-0.5 font-bold uppercase tracking-wider">شماره شبا (IR)</span>
                              <span className="font-mono font-bold text-[#e2b53e] text-left" dir="ltr">{card.bank_shaba}</span>
                            </div>
                            <div className="p-1.5 bg-amber-500/10 hover:bg-amber-500/25 rounded-lg text-[#e2b53e] transition flex items-center gap-1">
                              {copiedField === 'bank_shaba' ? <span className="text-[9px] font-bold text-emerald-400">کپی شد!</span> : <Copy className="h-4 w-4" />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                default:
                  return null;
              }
            })}

            {/* Footer */}
            <div className="text-center pt-8 opacity-20 text-[9px] uppercase tracking-wider font-mono">
              <span>Luxury Edition // Twin System</span>
            </div>
          </div>
        )}

        {/* DYNAMIC FALLBACK FOR CUSTOM DIRECTUS TEMPLATES */}
        {isCustomTemplate && (() => {
          const matchedTemp = templates.find(t => 
            toUUID(t.id) === toUUID(templateId) || 
            t.id === templateId || 
            t.slug === templateId || 
            (t.slug && templateId && t.slug.toLowerCase() === templateId.toLowerCase())
          );
          let tSchema: any = matchedTemp?.schema || {};
          if (typeof tSchema === 'string') {
            try { tSchema = JSON.parse(tSchema); } catch { tSchema = {}; }
          }
          
          // Schema-specific extractions
          const isDarkTheme = ['dark', 'neon', 'cyber', 'gold', 'glass'].includes(tSchema.theme || '') || tSchema.theme === 'dark';
          const tColors = tSchema.colors || {};
          const tTypography = tSchema.typography || {};
          const tLayout = tSchema.layout || {};
          const tFx = tSchema.effects || {};

          // Color palette: User custom colors override template schema colors
          const pColor = primaryColor;
          const sColor = secondaryColor;
          const bColor = bgColor;
          const txtColor = textCol;
          const txtSecColor = card.custom_colors?.secondary?.trim() 
            ? card.custom_colors.secondary 
            : card.custom_colors?.text?.trim() 
            ? card.custom_colors.text 
            : (tColors.text_secondary || (isDarkTheme ? '#94a3b8' : '#64748b'));
          const cardBg = cardBgColor;

          // Layout & FX properties
          const avatarPosition = tLayout.avatar_position || 'overlap-center';
          const avatarShape = tLayout.avatar_shape || 'circle';
          const avatarSize = tLayout.avatar_size || 'md';
          const headerStyle = tLayout.header_style || 'split';
          const buttonStyle = tLayout.button_style || 'pill';
          const cardRadius = tLayout.card_radius || 'lg';
          const cardBorder = tLayout.card_border || 'none';
          const coverHeight = tLayout.cover_height || 'standard';
          const socialMode = tLayout.social_display_mode || 'grid-squares';
          const bioStyle = tLayout.bio_style || 'card-boxed';
          const fxStyle = tFx.style || 'none';

          const isCircleAvatar = avatarShape === 'circle';
          const isGlowingAvatar = avatarShape === 'glowing-ring';
          const isSquareAvatar = avatarShape === 'square';
          const isHexagon = avatarShape === 'hexagon';
          const isDiamond = avatarShape === 'diamond';
          const isSquircle = avatarShape === 'squircle';

          const avatarRadiusClass = isCircleAvatar || isGlowingAvatar ? 'rounded-full' : isSquircle ? 'rounded-3xl' : isHexagon ? '[clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]' : isSquareAvatar ? 'rounded-2xl' : 'rounded-3xl';
          const avatarSizeClass = avatarSize === 'sm' ? 'h-16 w-16' : avatarSize === 'lg' ? 'h-28 w-28' : avatarSize === 'xl' ? 'h-32 w-32' : 'h-24 w-24';
          const buttonRadiusClass = buttonStyle === 'pill' ? 'rounded-full' : buttonStyle === 'sharp' ? 'rounded-none' : 'rounded-2xl';
          const radiusClass = cardRadius === 'none' ? 'rounded-none' : cardRadius === 'sm' ? 'rounded-xl' : cardRadius === 'md' ? 'rounded-2xl' : cardRadius === 'lg' ? 'rounded-3xl' : cardRadius === 'xl' ? 'rounded-[32px]' : 'rounded-[40px]';

          return (
            <div 
              className={`${radiusClass} shadow-xl overflow-hidden transition-all p-5 space-y-5 relative ${
                fxStyle === 'glassmorphism' ? 'backdrop-blur-xl bg-slate-900/80 border border-white/20 shadow-2xl' :
                fxStyle === 'neon-glow' ? 'border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.35)]' :
                fxStyle === 'gold-glow' ? 'border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.35)]' :
                fxStyle === 'mesh-gradient' ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-zinc-900 text-white' : ''
              }`}
              style={{ 
                backgroundColor: fxStyle !== 'glassmorphism' && fxStyle !== 'mesh-gradient' ? cardBg : undefined, 
                color: txtColor,
                fontFamily: tTypography.font_family ? `var(--font-${tTypography.font_family.toLowerCase()}), var(--font-vazirmatn), sans-serif` : 'var(--font-vazirmatn), sans-serif',
                borderColor: cardBorder === 'solid-accent' ? pColor : cardBorder === 'double' ? pColor : cardBorder === 'thin' ? (isDarkTheme ? 'rgba(255,255,255,0.1)' : '#e2e8f0') : undefined,
                borderWidth: cardBorder === 'solid-accent' ? '2px' : cardBorder === 'double' ? '4px' : cardBorder === 'thin' ? '1px' : undefined,
                borderStyle: cardBorder === 'double' ? 'double' : undefined
              }}
            >
              {/* Floating Top Avatar Position */}
              {avatarPosition === 'floating-top' && (
                <div className="flex justify-center -mb-2 z-10 relative">
                  <div className={`${avatarSizeClass} overflow-hidden border-4 p-0.5 shadow-xl bg-slate-900 ${avatarRadiusClass} ${isGlowingAvatar ? 'ring-4 ring-amber-400/80 animate-pulse' : ''} ${isDiamond ? 'rotate-45 scale-90' : ''}`} style={{ borderColor: pColor }}>
                    <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className={`w-full h-full object-cover ${avatarRadiusClass} ${isDiamond ? '-rotate-45 scale-125' : ''}`} />
                  </div>
                </div>
              )}

              {/* Cover photo with integrated share button */}
              {coverHeight !== 'none' && (card.cover_image ? (
                <div className={`w-full rounded-2xl overflow-hidden relative border border-slate-200/20 shadow-sm shrink-0 ${
                  coverHeight === 'compact' ? 'h-24' :
                  coverHeight === 'large' ? 'h-44' :
                  coverHeight === 'hero' ? 'h-56' : 'h-36'
                }`}>
                  <img 
                    src={getImageUrl(card.cover_image) || '/cover-fallback.avif'} 
                    alt="cover" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 z-30">
                    <button 
                      type="button"
                      onClick={() => setActiveShareId('open')}
                      className="p-2 rounded-full transition active:scale-95 shadow-md bg-black/50 hover:bg-black/70 text-white backdrop-blur-md cursor-pointer"
                      title="اشتراک‌گذاری کارت"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end items-center z-20 relative">
                  <div>
                    <button 
                      type="button"
                      onClick={() => setActiveShareId('open')}
                      className="p-2 rounded-full transition active:scale-95 shadow-sm cursor-pointer"
                      style={{ backgroundColor: sColor, color: pColor }}
                      title="اشتراک‌گذاری کارت"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Overlapping Avatar Positions */}
              {avatarPosition.startsWith('overlap-') && (
                <div className={`-mt-16 z-10 relative flex ${
                  avatarPosition === 'overlap-right' ? 'justify-start pr-4' :
                  avatarPosition === 'overlap-left' ? 'justify-end pl-4' : 'justify-center'
                }`}>
                  <div className={`${avatarSizeClass} overflow-hidden border-4 p-0.5 shadow-xl bg-slate-900 ${avatarRadiusClass} ${isGlowingAvatar ? 'ring-4 ring-amber-400/80 animate-pulse' : ''} ${isDiamond ? 'rotate-45 scale-90' : ''}`} style={{ borderColor: pColor }}>
                    <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className={`w-full h-full object-cover ${avatarRadiusClass} ${isDiamond ? '-rotate-45 scale-125' : ''}`} />
                  </div>
                </div>
              )}

              {/* Below Cover Avatar Positions */}
              {avatarPosition.startsWith('below-') && (
                <div className={`pt-1 flex ${
                  avatarPosition === 'below-right' ? 'justify-start' : 'justify-center'
                }`}>
                  <div className={`${avatarSizeClass} overflow-hidden border-2 p-0.5 shadow-md bg-slate-900 ${avatarRadiusClass} ${isGlowingAvatar ? 'ring-2 ring-amber-400' : ''} ${isDiamond ? 'rotate-45 scale-90' : ''}`} style={{ borderColor: pColor }}>
                    <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className={`w-full h-full object-cover ${avatarRadiusClass} ${isDiamond ? '-rotate-45 scale-125' : ''}`} />
                  </div>
                </div>
              )}

              {/* Header Info Layout */}
              {headerStyle === 'bento' ? (
                <div className="p-4 bg-black/5 dark:bg-white/5 border border-slate-200/10 rounded-2xl flex items-center gap-4">
                  {avatarPosition === 'inside-header' && (
                    <div className={`${avatarSizeClass} overflow-hidden border-2 shrink-0 bg-slate-900 ${avatarRadiusClass} ${isGlowingAvatar ? 'ring-4 ring-amber-400/80 animate-pulse' : ''} ${isDiamond ? 'rotate-45 scale-90' : ''}`} style={{ borderColor: pColor }}>
                      <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className={`w-full h-full object-cover ${avatarRadiusClass} ${isDiamond ? '-rotate-45 scale-125' : ''}`} />
                    </div>
                  )}
                  <div className="text-right">
                    <h1 className="text-xl font-black" style={{ fontSize: tTypography.title_size || '22px' }}>{card.first_name} {card.last_name}</h1>
                    <p className="text-xs font-bold mt-0.5" style={{ color: pColor }}>{card.job_title}</p>
                    {card.company && <p className="text-[11px]" style={{ color: txtSecColor }}>{card.company}</p>}
                  </div>
                </div>
              ) : headerStyle === 'content_creator' ? (
                <div className="text-center space-y-2">
                  {avatarPosition === 'inside-header' && (
                    <div className={`h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-500 mx-auto shadow-xl ${isDiamond ? 'rotate-45 scale-90' : ''}`}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                        <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className={`w-full h-full object-cover ${isDiamond ? '-rotate-45 scale-125' : ''}`} />
                      </div>
                    </div>
                  )}
                  <h1 className="text-2xl font-black" style={{ fontSize: tTypography.title_size || '22px' }}>{card.first_name} {card.last_name}</h1>
                  <p className="text-xs font-bold text-pink-400">{card.job_title || 'تولیدکننده محتوا'}</p>
                  {card.company && <p className="text-[11px]" style={{ color: txtSecColor }}>{card.company}</p>}
                </div>
              ) : headerStyle === 'split' ? (
                <div className="flex items-center gap-4 pb-2 border-b border-slate-200/20">
                  {avatarPosition === 'inside-header' && (
                    <div className={`${avatarSizeClass} overflow-hidden border-2 shrink-0 bg-slate-900 ${avatarRadiusClass} ${isGlowingAvatar ? 'ring-4 ring-amber-400/80 animate-pulse' : ''} ${isDiamond ? 'rotate-45 scale-90' : ''}`} style={{ borderColor: pColor }}>
                      <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className={`w-full h-full object-cover ${avatarRadiusClass} ${isDiamond ? '-rotate-45 scale-125' : ''}`} />
                    </div>
                  )}
                  <div className="text-right">
                    <h1 className="text-xl font-black" style={{ fontSize: tTypography.title_size || '22px' }}>{card.first_name} {card.last_name}</h1>
                    <p className="text-xs font-bold mt-0.5" style={{ color: pColor }}>{card.job_title}</p>
                    {card.company && <p className="text-[11px]" style={{ color: txtSecColor }}>{card.company}</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  {avatarPosition === 'inside-header' && (
                    <div className={`${avatarSizeClass} overflow-hidden border-2 p-0.5 mx-auto mb-2 bg-slate-900 ${avatarRadiusClass} ${isGlowingAvatar ? 'ring-4 ring-amber-400/80 animate-pulse' : ''} ${isDiamond ? 'rotate-45 scale-90' : ''}`} style={{ borderColor: pColor }}>
                      <img src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} alt="profile" className={`w-full h-full object-cover ${avatarRadiusClass} ${isDiamond ? '-rotate-45 scale-125' : ''}`} />
                    </div>
                  )}
                  <h1 className="text-2xl font-black" style={{ fontSize: tTypography.title_size || '22px' }}>{card.first_name} {card.last_name}</h1>
                  <p className="text-xs font-bold" style={{ color: pColor }}>{card.job_title}</p>
                  {card.company && <p className="text-[11px]" style={{ color: txtSecColor }}>{card.company}</p>}
                </div>
              )}

              {/* DYNAMIC SECTIONS ORDERING FOR CUSTOM TEMPLATE */}
              {getSectionOrders(card).map((secKey) => {
                switch (secKey) {
                  case 'save_contact':
                    return (
                      <div key="sec_cust_save" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button 
                          onClick={handleDownloadVCard}
                          className={`w-full py-3 px-4 font-bold flex items-center justify-center gap-2 transition hover:opacity-90 text-xs shadow-md ${buttonRadiusClass} ${
                            buttonStyle === 'glass' ? 'bg-white/10 border border-white/20 backdrop-blur-md text-white' :
                            buttonStyle === 'gradient' ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white' :
                            buttonStyle === 'neon' ? 'border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] text-cyan-300' :
                            buttonStyle === '3d-press' ? 'border-b-4 border-black/40 active:translate-y-0.5' : ''
                          }`}
                          style={{ backgroundColor: !['glass', 'gradient', 'neon'].includes(buttonStyle) ? pColor : undefined, color: '#ffffff' }}
                        >
                          <Download className="h-4 w-4" />
                          <span>{isVCardGenerated ? 'مخاطب ذخیره شد' : 'ذخیره در مخاطبان'}</span>
                        </button>
                        <button 
                          onClick={() => { setShowSubscribeModal(true); setSubscribeStep('mobile'); setSubscribeError(null); setSubscribeMessage(null); }}
                          className={`w-full py-3 px-4 font-bold flex items-center justify-center gap-2 transition hover:opacity-90 text-xs border ${buttonRadiusClass}`}
                          style={{ borderColor: pColor, color: pColor, backgroundColor: 'rgba(0,0,0,0.02)' }}
                        >
                          <Bell className="h-4 w-4" />
                          <span>عضویت در خبرنامه</span>
                        </button>
                      </div>
                    );
                  case 'bio':
                    return card.bio ? (
                      <div 
                        key="sec_cust_bio"
                        className={bioStyle === 'card-boxed' ? "p-3.5 rounded-2xl text-xs leading-relaxed text-center relative border whitespace-pre-line" : "text-xs leading-relaxed text-center relative whitespace-pre-line opacity-90"}
                        style={{ 
                          borderColor: sColor, 
                          backgroundColor: bioStyle === 'card-boxed' ? (isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)') : undefined,
                          fontSize: tTypography.body_size || '14px',
                          color: txtSecColor
                        }}
                      >
                        {card.bio}
                      </div>
                    ) : null;
                  case 'primary_actions':
                    return (mobile || (extra_phones && extra_phones.length > 0)) ? (
                      <div key="sec_cust_primary" className="space-y-2 pt-4 border-t" style={{ borderColor: sColor }}>
                        <span className="text-[10px] font-bold block text-center" style={{ color: txtSecColor }}>تلفن‌های تماس اضافی</span>
                        <div className="space-y-2">
                          {mobile && (
                            <a href={`tel:${mobile}`} className="flex items-center justify-between p-3 rounded-xl border transition text-xs hover:scale-[1.01]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                              <span className="flex items-center gap-2 font-semibold">
                                <Phone className="h-4 w-4" style={{ color: pColor }} />
                                <span style={{ color: txtColor }}>تلفن همراه (موبایل):</span>
                              </span>
                              <span className="font-mono font-bold" style={{ color: pColor }}>{mobile}</span>
                            </a>
                          )}
                          {extra_phones && extra_phones.map((ph: string, idx: number) => (
                            <a key={idx} href={`tel:${ph}`} className="flex items-center justify-between p-3 rounded-xl border transition text-xs hover:scale-[1.01]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                              <span className="flex items-center gap-2 font-semibold">
                                <Phone className="h-4 w-4" style={{ color: pColor }} />
                                <span style={{ color: txtColor }}>شماره تماس جانبی {idx + 1}:</span>
                              </span>
                              <span className="font-mono font-bold" style={{ color: pColor }}>{ph}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  case 'social_links':
                    const socialsFull = [
                      phone ? { key: 'phone', label: 'تماس', href: `tel:${phone}`, icon: Phone, val: phone } : null,
                      whatsapp ? { key: 'whatsapp', label: 'واتساپ', href: `https://wa.me/${whatsapp}`, icon: MessageCircle, val: whatsapp } : null,
                      telegram ? { key: 'telegram', label: 'تلگرام', href: `https://t.me/${telegram}`, icon: Send, val: telegram } : null,
                      instagram ? { key: 'instagram', label: 'اینستاگرام', href: `https://instagram.com/${instagram}`, icon: Instagram, val: instagram } : null,
                      linkedin ? { key: 'linkedin', label: 'لینکدین', href: `https://linkedin.com/in/${linkedin}`, icon: Linkedin, val: linkedin } : null,
                      email ? { key: 'email', label: 'ایمیل', href: `mailto:${email}`, icon: Mail, val: email } : null,
                      website ? { key: 'website', label: 'وبسایت', href: `https://${website}`, icon: Globe, val: website } : null,
                    ].filter(Boolean) as { key: string; label: string; href: string; icon: any; val: string }[];

                    if (socialsFull.length === 0) return null;

                    return (
                      <div key="sec_cust_social" className="space-y-2">
                        <span className="text-[10px] font-bold block text-center" style={{ color: txtSecColor }}>اطلاعات تماس</span>
                        {socialMode === 'vertical-rows' ? (
                          <div className="space-y-2">
                            {socialsFull.map((item) => {
                              const IconComp = item.icon;
                              return (
                                <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl border transition text-xs hover:scale-[1.01]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                  <span className="font-bold">{item.label}</span>
                                  <IconComp className="h-4 w-4" style={{ color: pColor }} />
                                </a>
                              );
                            })}
                          </div>
                        ) : socialMode === 'compact-chips' ? (
                          <div className="flex flex-wrap gap-2">
                            {socialsFull.map((item) => {
                              const IconComp = item.icon;
                              return (
                                <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 px-3 rounded-full border text-xs transition hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                  <IconComp className="h-3.5 w-3.5" style={{ color: pColor }} />
                                  <span className="font-bold">{item.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        ) : socialMode === 'horizontal-bubbles' ? (
                          <div className="flex flex-wrap justify-center gap-3 py-1">
                            {socialsFull.map((item) => {
                              const IconComp = item.icon;
                              return (
                                <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full border flex items-center justify-center transition hover:scale-110 shadow-sm" style={{ borderColor: sColor, backgroundColor: pColor + '15' }}>
                                  <IconComp className="h-5 w-5" style={{ color: pColor }} />
                                </a>
                              );
                            })}
                          </div>
                        ) : socialMode === 'bento-tiles' ? (
                          <div className="grid grid-cols-2 gap-2">
                            {socialsFull.map((item) => {
                              const IconComp = item.icon;
                              return (
                                <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-2xl border text-xs transition hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                  <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: pColor + '20' }}>
                                    <IconComp className="h-4 w-4" style={{ color: pColor }} />
                                  </div>
                                  <div className="overflow-hidden">
                                    <span className="font-bold block text-xs truncate" style={{ color: txtColor }}>{item.label}</span>
                                    <span className="text-[10px] opacity-70 truncate block">{item.val}</span>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2.5">
                            {socialsFull.map((item) => {
                              const IconComp = item.icon;
                              return (
                                <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className="flex-1 min-w-[70px] flex flex-col items-center justify-center p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                  <IconComp className="h-4 w-4 mb-1" style={{ color: pColor }} />
                                  <span className="text-[9px]" style={{ color: txtSecColor }}>{item.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  case 'custom_buttons':
                    return card.custom_buttons && card.custom_buttons.length > 0 ? (
                      <div key="sec_cust_custom" className="space-y-2">
                        <span className="text-[10px] font-bold block text-center" style={{ color: txtSecColor }}>لینک‌های برتر</span>
                        {card.custom_buttons.map((btn) => (
                          <a
                            key={btn.id}
                            href={btn.url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3 px-4 rounded-xl border flex items-center justify-between font-semibold transition text-xs hover:scale-[1.01]"
                            style={{ 
                              borderColor: sColor, 
                              backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <LinkIcon className="h-3.5 w-3.5" style={{ color: pColor }} />
                              <span style={{ color: txtColor }}>{btn.label}</span>
                            </span>
                            <ChevronLeft className="h-4 w-4" style={{ color: pColor }} />
                          </a>
                        ))}
                      </div>
                    ) : null;
                  case 'location':
                    return (card.neshan || card.balad || card.waze || card.googlemap || card.address) ? (
                      <div key="sec_cust_loc" className="space-y-2 pt-4 border-t" style={{ borderColor: sColor }}>
                        {(card.neshan || card.balad || card.waze || card.googlemap) && (
                          <>
                            <span className="text-[10px] font-bold block text-center" style={{ color: txtSecColor }}>مسیریاب و موقعیت مکانی</span>
                            <div className="grid grid-cols-2 gap-2">
                              {card.neshan && (
                                <a href={card.neshan} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                                  <span className="text-[10px] font-bold" style={{ color: txtColor }}>مسیریاب نشان</span>
                                </a>
                              )}
                              {card.balad && (
                                <a href={card.balad} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                  <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                                  <span className="text-[10px] font-bold" style={{ color: txtColor }}>مسیریاب بلد</span>
                                </a>
                              )}
                              {card.waze && (
                                <a href={card.waze} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                                  <span className="text-[10px] font-bold" style={{ color: txtColor }}>مسیریاب ویز</span>
                                </a>
                              )}
                              {card.googlemap && (
                                <a href={card.googlemap} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                  <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                                  <span className="text-[10px] font-bold" style={{ color: txtColor }}>گوگل مپ</span>
                                </a>
                              )}
                            </div>
                          </>
                        )}
                        {card.address && (
                          <div className="space-y-2 pt-2">
                            <span className="text-[10px] font-bold block text-center" style={{ color: txtSecColor }}>نشانی و آدرس حضوری</span>
                            <div className="p-3.5 rounded-xl border text-xs leading-relaxed font-medium text-center" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', color: txtColor }}>
                              {card.address}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null;
                  case 'bank_info':
                    return (card.bank_card || card.bank_account || card.bank_shaba) ? (
                      <div key="sec_cust_bank" className="space-y-2.5 pt-4 border-t" style={{ borderColor: sColor }}>
                        <span className="text-[10px] font-bold block text-center" style={{ color: txtSecColor }}>اطلاعات حساب و کارت بانکی</span>
                        <div className="space-y-2">
                          {card.bank_card && (
                            <div 
                              onClick={() => handleCopyText(card.bank_card || '', 'bank_card')}
                              className="p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98] hover:scale-[1.01]" 
                              style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
                              title="کلیک برای کپی آسان"
                            >
                              <div>
                                <span className="text-[10px] block mb-1 font-semibold" style={{ color: txtSecColor }}>شماره کارت</span>
                                <span className="font-mono font-bold tracking-widest" style={{ color: txtColor }}>{card.bank_card}</span>
                              </div>
                              <div className="p-1.5 rounded-lg transition flex items-center gap-1" style={{ color: pColor }}>
                                {copiedField === 'bank_card' ? <span className="text-[10px] font-bold text-emerald-500">کپی شد!</span> : <Copy className="h-4 w-4" />}
                              </div>
                            </div>
                          )}
                          {card.bank_account && (
                            <div 
                              onClick={() => handleCopyText(card.bank_account || '', 'bank_account')}
                              className="p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98] hover:scale-[1.01]" 
                              style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
                              title="کلیک برای کپی آسان"
                            >
                              <div>
                                <span className="text-[10px] block mb-1 font-semibold" style={{ color: txtSecColor }}>شماره حساب</span>
                                <span className="font-mono font-bold" style={{ color: txtColor }}>{card.bank_account}</span>
                              </div>
                              <div className="p-1.5 rounded-lg transition flex items-center gap-1" style={{ color: pColor }}>
                                {copiedField === 'bank_account' ? <span className="text-[10px] font-bold text-emerald-500">کپی شد!</span> : <Copy className="h-4 w-4" />}
                              </div>
                            </div>
                          )}
                          {card.bank_shaba && (
                            <div 
                              onClick={() => handleCopyText(card.bank_shaba || '', 'bank_shaba')}
                              className="p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition active:scale-[0.98] hover:scale-[1.01]" 
                              style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
                              title="کلیک برای کپی آسان"
                            >
                              <div>
                                <span className="text-[10px] block mb-1 font-semibold" style={{ color: txtSecColor }}>شماره شبا (IR)</span>
                                <span className="font-mono font-bold text-left block" dir="ltr" style={{ color: txtColor }}>{card.bank_shaba}</span>
                              </div>
                              <div className="p-1.5 rounded-lg transition flex items-center gap-1" style={{ color: pColor }}>
                                {copiedField === 'bank_shaba' ? <span className="text-[10px] font-bold text-emerald-500">کپی شد!</span> : <Copy className="h-4 w-4" />}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  default:
                    return null;
                }
              })}

              {/* Footer */}
              <div className="text-center pt-4 opacity-35 text-[8px] uppercase tracking-wider font-mono" style={{ color: txtSecColor }}>
                <span>{matchedTemp?.name || 'CUSTOM CARD'} {"// POWERED BY MEGACARD"}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SHARE MODAL */}
      {renderShareModal()}

      {/* NEWSLETTER SUBSCRIBE MODAL */}
      <AnimatePresence>
        {showSubscribeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowSubscribeModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowSubscribeModal(false)}
                className="absolute left-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-2 pt-2">
                <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                  <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">عضویت در خبرنامه پیامکی</h3>
                <p className="text-xs text-slate-400">
                  با عضویت در خبرنامه <span className="font-bold text-white">{card?.first_name} {card?.last_name}</span>، پیامک‌های اطلاع‌رسانی، تخفیف‌ها و اخبار جدید را دریافت کنید.
                </p>
              </div>

              {subscribeError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center font-medium">
                  {subscribeError}
                </div>
              )}

              {subscribeStep === 'mobile' && (
                <form onSubmit={handleSubscribeSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 block">شماره تلفن همراه شما:</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="09123456789"
                      value={subscribeMobile}
                      onChange={(e) => setSubscribeMobile(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-mono tracking-widest focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={subscribeLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {subscribeLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>ارسال کد تایید پیامکی</span>
                  </button>
                </form>
              )}

              {subscribeStep === 'code' && (
                <form onSubmit={handleSubscribeVerifyOtp} className="space-y-4">
                  <div className="text-xs text-slate-400 text-center">
                    کد تایید ۵ رقمی به شماره <span className="font-mono text-emerald-400 font-bold">{subscribeMobile}</span> پیامک شد:
                  </div>
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      required
                      maxLength={5}
                      placeholder="12345"
                      value={subscribeCode}
                      onChange={(e) => setSubscribeCode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-2xl font-mono tracking-widest font-bold focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setSubscribeStep('mobile')}
                      className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                    >
                      اصلاح شماره
                    </button>
                    <button 
                      type="submit"
                      disabled={subscribeLoading}
                      className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {subscribeLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>تایید و عضویت</span>
                    </button>
                  </div>
                </form>
              )}

              {subscribeStep === 'success' && (
                <div className="text-center space-y-4 py-3">
                  <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-emerald-400">{subscribeMessage}</p>
                  <button 
                    onClick={() => setShowSubscribeModal(false)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    بستن پنجره
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
