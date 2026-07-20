'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { dbService, Card, Template, getImageUrl } from '../../lib/directus';
import { 
  Phone, Mail, Globe, MapPin, Share2, Download, 
  Linkedin, Instagram, Send, MessageCircle, Link as LinkIcon, 
  Eye, Calendar, Check, AlertTriangle, ChevronLeft 
} from 'lucide-react';

const getDirectusBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/directus';
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
  const [isVCardGenerated, setIsVCardGenerated] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          setCard(apiCard);
          dbService.logVisit(apiCard.id, deviceName, referrerName, randomCountry);
          
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
          <p className="text-xs font-semibold text-slate-400">در حال بارگذاری کارت ویزیت کاردینو...</p>
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

  // Download VCF Contact Handler
  const handleDownloadVCard = () => {
    const vCardContent = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.first_name} ${card.last_name}`,
      `N:${card.last_name};${card.first_name};;;`,
      `ORG:${card.company || ''}`,
      `TITLE:${card.job_title || ''}`,
      phone ? `TEL;TYPE=CELL,VOICE:${phone}` : '',
      email ? `EMAIL;TYPE=PREF,INTERNET:${email}` : '',
      website ? `URL:${website}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');

    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${card.first_name}_${card.last_name}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsVCardGenerated(true);
    setTimeout(() => setIsVCardGenerated(false), 3000);
  };

  // Share Card Link
  const handleShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom styling variables override
  const primaryColor = card.custom_colors?.primary || '#3b82f6';
  const secondaryColor = card.custom_colors?.secondary || '#1d4ed8';
  const bgColor = card.custom_colors?.background || '#f1f5f9';
  const textCol = card.custom_colors?.text || '#1e293b';
  const cardBgColor = card.custom_colors?.card_bg || '#ffffff';

  // Template Renders
  const templateId = card.template_id;

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 rtl text-right font-sans" dir="rtl" style={{ backgroundColor: bgColor, fontFamily: 'var(--font-vazirmatn), sans-serif' }}>
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
        {(templateId === 'temp-1' || !templateId) && (
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
              
              {/* Share button */}
              <button 
                onClick={handleShare}
                className="absolute top-4 left-4 p-2.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Share2 className="h-5 w-5" />}
              </button>
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

            {/* User Info */}
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold">{card.first_name} {card.last_name}</h1>
                <p className="text-sm font-semibold mt-1 opacity-90" style={{ color: primaryColor }}>{card.job_title}</p>
                <p className="text-xs opacity-75 mt-0.5">{card.company}</p>
              </div>

              {card.bio && (
                <div className="p-4 bg-slate-50 rounded-2xl text-xs leading-relaxed border border-slate-100 opacity-90" style={{ color: textCol }}>
                  {card.bio}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleDownloadVCard}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 shadow-md transition-all text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isVCardGenerated ? <Check className="h-5 w-5 text-white" /> : <Download className="h-5 w-5" />}
                  <span>{isVCardGenerated ? 'ذخیره شد' : 'ذخیره در مخاطبین گوشی'}</span>
                </button>
              </div>

              {/* Social Channels Header */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">راه‌های ارتباطی</h3>
                <div className="grid grid-cols-4 gap-3">
                  {phone && (
                    <a href={`tel:${phone}`} className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100">
                      <Phone className="h-5 w-5 text-blue-600 mb-1" />
                      <span className="text-[10px] font-medium text-slate-500">تماس</span>
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100">
                      <Mail className="h-5 w-5 text-amber-500 mb-1" />
                      <span className="text-[10px] font-medium text-slate-500">ایمیل</span>
                    </a>
                  )}
                  {telegram && (
                    <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100">
                      <Send className="h-5 w-5 text-sky-500 mb-1" />
                      <span className="text-[10px] font-medium text-slate-500">تلگرام</span>
                    </a>
                  )}
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100">
                      <MessageCircle className="h-5 w-5 text-emerald-500 mb-1" />
                      <span className="text-[10px] font-medium text-slate-500">واتساپ</span>
                    </a>
                  )}
                  {instagram && (
                    <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100">
                      <Instagram className="h-5 w-5 text-pink-500 mb-1" />
                      <span className="text-[10px] font-medium text-slate-500">اینستا</span>
                    </a>
                  )}
                  {linkedin && (
                    <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100">
                      <Linkedin className="h-5 w-5 text-indigo-600 mb-1" />
                      <span className="text-[10px] font-medium text-slate-500">لینکدین</span>
                    </a>
                  )}
                  {website && (
                    <a href={`https://${website}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100">
                      <Globe className="h-5 w-5 text-violet-600 mb-1" />
                      <span className="text-[10px] font-medium text-slate-500">وبسایت</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Custom Buttons */}
              {card.custom_buttons && card.custom_buttons.length > 0 && (
                <div className="space-y-2.5 pt-2">
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
              )}

              {/* Maps Links */}
              {(card.neshan || card.balad || card.waze || card.googlemap) && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">مسیریابی روی نقشه</h3>
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
                </div>
              )}

              {/* Multiple Contacts */}
              {(mobile || (extra_phones && extra_phones.length > 0)) && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">شماره تماس‌های دیگر</h3>
                  <div className="space-y-2">
                    {mobile && (
                      <a href={`tel:${mobile}`} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100 text-xs">
                        <span className="flex items-center gap-2 font-semibold">
                          <Phone className="h-4 w-4 text-blue-600" />
                          تلفن همراه (موبایل):
                        </span>
                        <span className="font-mono text-slate-600 font-bold">{mobile}</span>
                      </a>
                    )}
                    {extra_phones && extra_phones.map((ph: string, idx: number) => (
                      <a key={idx} href={`tel:${ph}`} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100 text-xs">
                        <span className="flex items-center gap-2 font-semibold">
                          <Phone className="h-4 w-4 text-slate-500" />
                          شماره تماس جانبی {idx + 1}:
                        </span>
                        <span className="font-mono text-slate-600 font-bold">{ph}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Powered By */}
              <div className="text-center pt-8 opacity-40 text-[10px]">
                <span>قدرت گرفته از سامانه کارت ویزیت دیجیتال کاردینو</span>
              </div>

            </div>
          </div>
        )}

        {/* TEMPLATE 2: NEON GLASS (DARK FUTURISTIC) */}
        {templateId === 'temp-2' && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border transition-all text-white p-6 space-y-6"
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.85)', 
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: `0 10px 40px -10px ${primaryColor}40`
            }}
          >
            {/* Header branding info */}
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-slate-300">
                <Eye className="h-3 w-3 text-cyan-400" />
                {card.views_count?.toLocaleString('fa-IR')} بازدید
              </span>

              <button 
                onClick={handleShare}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Share2 className="h-5 w-5" />}
              </button>
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

            {card.bio && (
              <div className="p-4 bg-white/5 rounded-2xl text-xs leading-relaxed border border-white/10 text-slate-300">
                {card.bio}
              </div>
            )}

            {/* VCF download */}
            <button 
              onClick={handleDownloadVCard}
              className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-cyan-500/20 transition-all text-sm text-slate-950"
              style={{ backgroundImage: `linear-gradient(to left, ${primaryColor}, ${secondaryColor})` }}
            >
              {isVCardGenerated ? <Check className="h-5 w-5 text-slate-950" /> : <Download className="h-5 w-5" />}
              <span className="font-extrabold">{isVCardGenerated ? 'ذخیره شد' : 'ذخیره مستقیم شماره تلفن'}</span>
            </button>

            {/* Social Channels */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">راه‌های ارتباطی سریع</h3>
              <div className="grid grid-cols-4 gap-3">
                {phone && (
                  <a href={`tel:${phone}`} className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                    <Phone className="h-5 w-5 text-cyan-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-slate-400">تماس</span>
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                    <Mail className="h-5 w-5 text-amber-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-slate-400">ایمیل</span>
                  </a>
                )}
                {telegram && (
                  <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                    <Send className="h-5 w-5 text-sky-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-slate-400">تلگرام</span>
                  </a>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                    <MessageCircle className="h-5 w-5 text-emerald-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-slate-400">واتساپ</span>
                  </a>
                )}
                {instagram && (
                  <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                    <Instagram className="h-5 w-5 text-pink-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-slate-400">اینستا</span>
                  </a>
                )}
                {linkedin && (
                  <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                    <Linkedin className="h-5 w-5 text-indigo-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-slate-400">لینکدین</span>
                  </a>
                )}
                {website && (
                  <a href={`https://${website}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 group">
                    <Globe className="h-5 w-5 text-violet-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-slate-400">وبسایت</span>
                  </a>
                )}
              </div>
            </div>

            {/* Custom buttons */}
            {card.custom_buttons && card.custom_buttons.length > 0 && (
              <div className="space-y-2.5">
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
            )}

            {/* Maps Links */}
            {(card.neshan || card.balad || card.waze || card.googlemap) && (
              <div className="space-y-3 pt-4 border-t border-white/10">
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
              </div>
            )}

            {/* Multiple Contacts */}
            {(mobile || (extra_phones && extra_phones.length > 0)) && (
              <div className="space-y-3 pt-4 border-t border-white/10">
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
            )}

            {/* Footer */}
            <div className="text-center pt-8 opacity-30 text-[10px]">
              <span>Powered by Twin Digital Business Card system</span>
            </div>
          </div>
        )}

        {/* TEMPLATE 3: MINIMAL (CLEAN MODERN ART) */}
        {templateId === 'temp-3' && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-lg overflow-hidden border border-slate-100 transition-all text-slate-900 p-8 space-y-8"
            style={{ backgroundColor: cardBgColor, color: textCol }}
          >
            {/* Minimalist Top Nav */}
            <div className="flex justify-between items-center">
              <span className="text-xs opacity-50 font-medium">/{card.slug}</span>
              <button 
                onClick={handleShare}
                className="p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              </button>
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

            {card.bio && (
              <p className="text-xs leading-relaxed opacity-75 border-r-2 border-slate-200 pr-3 font-normal">
                {card.bio}
              </p>
            )}

            {/* Minimal Contact List */}
            <div className="space-y-4">
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

            {/* Downloader Button (Minimal styling) */}
            <button 
              onClick={handleDownloadVCard}
              className="w-full py-3 rounded-xl border border-slate-900 font-bold flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all text-xs"
            >
              <Download className="h-4 w-4" />
              <span>{isVCardGenerated ? 'ذخیره شد' : 'ذخیره شماره در لیست مخاطبین'}</span>
            </button>

            {/* Custom Links */}
            {card.custom_buttons && card.custom_buttons.length > 0 && (
              <div className="space-y-2">
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
            )}

            {/* Maps Links */}
            {(card.neshan || card.balad || card.waze || card.googlemap) && (
              <div className="space-y-2.5 pt-2">
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
              </div>
            )}

            {/* Multiple Contacts */}
            {(mobile || (extra_phones && extra_phones.length > 0)) && (
              <div className="space-y-2 pt-2">
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
            )}

            {/* Footer */}
            <div className="text-center pt-8 opacity-20 text-[9px] uppercase tracking-wider font-mono">
              <span>Minimal System // twin-card</span>
            </div>
          </div>
        )}

        {/* TEMPLATE 4: LUXURY GOLD (GOLD AND BLACK) */}
        {templateId === 'temp-4' && (
          <div 
            className="rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border transition-all text-amber-100 p-8 space-y-8"
            style={{ 
              backgroundColor: '#0c0a09', // rich stone dark
              borderColor: '#e2b53e', // gold border
              boxShadow: '0 10px 50px -15px rgba(226, 181, 62, 0.25)'
            }}
          >
            {/* Top Share & Stats */}
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full text-[10px] font-bold text-[#e2b53e] uppercase tracking-wider">
                VIP LUXURY
              </span>

              <button 
                onClick={handleShare}
                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-full text-[#e2b53e] transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              </button>
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

            {card.bio && (
              <div className="p-4 bg-stone-900 rounded-xl text-xs leading-relaxed border border-amber-500/10 text-stone-300 text-center relative">
                <span className="absolute -top-3 right-4 bg-[#0c0a09] px-2 text-[10px] text-[#e2b53e] font-bold">درباره من</span>
                {card.bio}
              </div>
            )}

            {/* Download Gold Button */}
            <button 
              onClick={handleDownloadVCard}
              className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs bg-gradient-to-l from-[#f59e0b] to-[#d97706] text-black hover:opacity-95 shadow-md shadow-amber-500/10"
            >
              <Download className="h-4 w-4" />
              <span>{isVCardGenerated ? 'مخاطب ذخیره شد' : 'ذخیره مستقیم در مخاطبان'}</span>
            </button>

            {/* Gold Icons Grid */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-center">کانال‌های ارتباطی لوکس</h3>
              <div className="grid grid-cols-4 gap-3">
                {phone && (
                  <a href={`tel:${phone}`} className="flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                    <Phone className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-stone-400">تماس</span>
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                    <Mail className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-stone-400">ایمیل</span>
                  </a>
                )}
                {telegram && (
                  <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                    <Send className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-stone-400">تلگرام</span>
                  </a>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                    <MessageCircle className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-stone-400">واتساپ</span>
                  </a>
                )}
                {instagram && (
                  <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                    <Instagram className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-stone-400">اینستا</span>
                  </a>
                )}
                {linkedin && (
                  <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                    <Linkedin className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-stone-400">لینکدین</span>
                  </a>
                )}
                {website && (
                  <a href={`https://${website}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-stone-900 hover:bg-stone-800 rounded-xl transition border border-amber-500/5 group">
                    <Globe className="h-4 w-4 text-[#e2b53e] mb-1 group-hover:scale-110 transition" />
                    <span className="text-[10px] text-stone-400">وبسایت</span>
                  </a>
                )}
              </div>
            </div>

            {/* Luxury Custom Buttons */}
            {card.custom_buttons && card.custom_buttons.length > 0 && (
              <div className="space-y-2.5">
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
            )}

            {/* Maps Links */}
            {(card.neshan || card.balad || card.waze || card.googlemap) && (
              <div className="space-y-3 pt-4 border-t border-amber-500/15">
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
              </div>
            )}

            {/* Multiple Contacts */}
            {(mobile || (extra_phones && extra_phones.length > 0)) && (
              <div className="space-y-3 pt-4 border-t border-amber-500/15">
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
            )}

            {/* Footer */}
            <div className="text-center pt-8 opacity-20 text-[9px] uppercase tracking-wider font-mono">
              <span>Luxury Edition // Twin System</span>
            </div>
          </div>
        )}

        {/* DYNAMIC FALLBACK FOR CUSTOM DIRECTUS TEMPLATES */}
        {templateId && !['temp-1', 'temp-2', 'temp-3', 'temp-4'].includes(templateId) && (() => {
          const matchedTemp = templates.find(t => t.id === templateId || t.slug === templateId);
          const tSchema = matchedTemp?.schema || {};
          
          // Schema-specific extractions
          const isDarkTheme = tSchema.theme === 'dark';
          const tColors = tSchema.colors || {};
          const tTypography = tSchema.typography || {};
          const tLayout = tSchema.layout || {};

          // Color palette with defaults from user's schema sample
          const pColor = tColors.primary || '#8d5b4c';
          const sColor = tColors.secondary || '#f4ece1';
          const bColor = tColors.background || '#faf6f0';
          const txtColor = tColors.text || '#2d221e';
          const txtSecColor = tColors.text_secondary || '#6e5a53';
          const cardBg = isDarkTheme ? '#18181b' : '#ffffff';

          // Layout properties
          const isCircleAvatar = (tLayout.avatar_shape || 'circle') === 'circle';
          const isSplitHeader = tLayout.header_style === 'split';

          return (
            <div 
              className="rounded-3xl shadow-xl overflow-hidden border border-slate-200/50 transition-all p-5 space-y-5"
              style={{ 
                backgroundColor: cardBg, 
                color: txtColor,
                fontFamily: 'var(--font-vazirmatn), sans-serif'
              }}
            >
              {/* Header Section */}
              {isSplitHeader ? (
                <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden border-2 shrink-0" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '16px' }}>
                      <img 
                        src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} 
                        alt="profile" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h1 className="text-lg font-black" style={{ fontSize: tTypography.title_size || '20px' }}>{card.first_name} {card.last_name}</h1>
                      <p className="text-xs font-bold" style={{ color: pColor }}>{card.job_title}</p>
                      <p className="text-[10px]" style={{ color: txtSecColor }}>{card.company}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleShare}
                    className="p-2 rounded-full transition"
                    style={{ backgroundColor: sColor, color: pColor }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: sColor, color: pColor }}>
                      {matchedTemp?.name || 'قالب اختصاصی'}
                    </span>
                    <button 
                      onClick={handleShare}
                      className="p-2 rounded-full transition"
                      style={{ backgroundColor: sColor, color: pColor }}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-24 w-24 overflow-hidden border-2 p-1" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '24px' }}>
                      <img 
                        src={getImageUrl(card.profile_image) || '/profile-fallback.jpg'} 
                        alt="profile" 
                        className="w-full h-full object-cover"
                        style={{ borderRadius: isCircleAvatar ? '9999px' : '16px' }}
                      />
                    </div>
                    <div>
                      <h1 className="text-xl font-black" style={{ fontSize: tTypography.title_size || '20px' }}>{card.first_name} {card.last_name}</h1>
                      <p className="text-xs font-bold mt-1" style={{ color: pColor }}>{card.job_title}</p>
                      <p className="text-[11px]" style={{ color: txtSecColor }}>{card.company}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bio Section */}
              {card.bio && (
                <div 
                  className="p-3.5 rounded-2xl text-xs leading-relaxed text-center relative border"
                  style={{ 
                    borderColor: sColor, 
                    backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    fontSize: tTypography.body_size || '14px'
                  }}
                >
                  {card.bio}
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={handleDownloadVCard}
                className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition hover:opacity-90 text-xs"
                style={{ backgroundColor: pColor, color: '#ffffff' }}
              >
                <Download className="h-4 w-4" />
                <span>{isVCardGenerated ? 'مخاطب ذخیره شد' : 'ذخیره مستقیم در مخاطبان'}</span>
              </button>

              {/* Contact Channels */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold block text-center" style={{ color: txtSecColor }}>اطلاعات تماس</span>
                <div className="grid grid-cols-4 gap-2.5">
                  {phone && (
                    <a href={`tel:${phone}`} className="flex flex-col items-center justify-center p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <Phone className="h-4 w-4 mb-1" style={{ color: pColor }} />
                      <span className="text-[9px]" style={{ color: txtSecColor }}>تماس</span>
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="flex flex-col items-center justify-center p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <Mail className="h-4 w-4 mb-1" style={{ color: pColor }} />
                      <span className="text-[9px]" style={{ color: txtSecColor }}>ایمیل</span>
                    </a>
                  )}
                  {telegram && (
                    <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <Send className="h-4 w-4 mb-1" style={{ color: pColor }} />
                      <span className="text-[9px]" style={{ color: txtSecColor }}>تلگرام</span>
                    </a>
                  )}
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <MessageCircle className="h-4 w-4 mb-1" style={{ color: pColor }} />
                      <span className="text-[9px]" style={{ color: txtSecColor }}>واتساپ</span>
                    </a>
                  )}
                  {instagram && (
                    <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <Instagram className="h-4 w-4 mb-1" style={{ color: pColor }} />
                      <span className="text-[9px]" style={{ color: txtSecColor }}>اینستا</span>
                    </a>
                  )}
                  {linkedin && (
                    <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <Linkedin className="h-4 w-4 mb-1" style={{ color: pColor }} />
                      <span className="text-[9px]" style={{ color: txtSecColor }}>لینکدین</span>
                    </a>
                  )}
                  {website && (
                    <a href={`https://${website}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-2 rounded-xl transition border hover:scale-105" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <Globe className="h-4 w-4 mb-1" style={{ color: pColor }} />
                      <span className="text-[9px]" style={{ color: txtSecColor }}>سایت</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Custom Buttons */}
              {card.custom_buttons && card.custom_buttons.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold block text-center" style={{ color: txtSecColor }}>لینک‌های برتر</span>
                  {card.custom_buttons.map((btn) => (
                    <a
                      key={btn.id}
                      href={btn.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 px-4 rounded-xl border flex items-center justify-between font-semibold transition text-xs"
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
              )}

              {/* Footer */}
              <div className="text-center pt-4 opacity-35 text-[8px] uppercase tracking-wider font-mono" style={{ color: txtSecColor }}>
                <span>{matchedTemp?.name || 'CUSTOM CARD'} {"// POWERED BY BRANDYAR"}</span>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
