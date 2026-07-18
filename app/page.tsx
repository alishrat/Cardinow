'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dbService, Template, Plan } from '../lib/directus';
import { 
  CreditCard, Smartphone, ShieldCheck, Sparkles, Zap, Award, 
  BarChart3, Globe2, ChevronLeft, ChevronRight, ArrowUpRight, CheckCircle2, 
  Users, Building2, Layers, Download, Check, Phone, MessageSquare, Send, Instagram, FileText
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'agencies'>('users');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchLandingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedTemplates, fetchedPlans] = await Promise.all([
        dbService.getTemplates(),
        dbService.getPlans() // Fetch all plans without restricting to tenant-id on the server-side query
      ]);
      setTemplates(fetchedTemplates);
      
      const targetTenantId = 't-1';
      const targetTenantUuid = 'a1111111-a111-a111-a111-a11111111111';
      const tenantPlans = fetchedPlans.filter(p => 
        !p.tenant_id || 
        p.tenant_id === targetTenantId || 
        p.tenant_id === targetTenantUuid
      );
      const filteredPlans = tenantPlans.length > 0 ? tenantPlans : fetchedPlans;
      // Sort plans ascending by price to arrange from Right to Left: Free (0) -> Silver (150k) -> Gold (490k)
      const sortedPlans = [...filteredPlans].sort((a, b) => (a.price || 0) - (b.price || 0));
      setPlans(sortedPlans);
    } catch (err: any) {
      console.error('Error fetching landing data:', err);
      setError('خطا در ارتباط با سرور دایرکتوس. لطفاً اتصال اینترنت خود را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (active) {
        fetchLandingData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleCopyDemoLink = (slug: string) => {
    const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/card/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(slug);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white rtl" dir="rtl">
      
      {/* 1. HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
              ک
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-l from-white to-slate-400 bg-clip-text text-transparent">سامانه کاردینو</span>
              <p className="text-[10px] text-blue-500 -mt-1 font-bold">کارت ویزیت دیجیتال</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-500 transition">امکانات کلیدی</a>
            <a href="#templates" className="hover:text-blue-500 transition">تم‌های اختصاصی</a>
            <a href="#plans" className="hover:text-blue-500 transition">تعرفه‌ها و پلن‌ها</a>
            <a href="#agencies" className="hover:text-blue-500 transition">بخش نمایندگی</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white border border-slate-800 hover:border-slate-700 bg-slate-900 transition flex items-center gap-1.5"
            >
              ورود به پنل کاربری
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => router.push('/dashboard?action=register')}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/10 transition"
            >
              ثبت‌نام رایگان
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden px-6">
        {/* Glow Effects */}
        <div className="absolute top-20 right-1/4 h-96 w-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-1/4 h-96 w-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Hero text */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>نسخه ۲.۰: کاملاً تعاملی با مدیریت زنده کدهای QR</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span className="bg-gradient-to-l from-white via-blue-200 to-indigo-400 bg-clip-text text-transparent block pb-2">
                هویت دیجیتال حرفه‌ای خود را بسازید!
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              در کمتر از ۳ دقیقه کارت ویزیت دیجیتال اختصاصی خود را با تم‌های شیک، مدیریت رنگ، بیوگرافی و لینک‌های تماس طراحی کنید. مخاطبان شما با یک کلیک شماره تلفن شما را ذخیره می‌کنند و از آمار بازدید دقیق بهره‌مند می‌شوید.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 text-sm"
              >
                <Zap className="h-4 w-4" />
                <span>شروع ساخت کارت ویزیت دیجیتال</span>
              </button>
              <a 
                href="#templates"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl font-bold border border-slate-800 transition text-center text-sm"
              >
                مشاهده تم‌های فعال
              </a>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-900 max-w-md mx-auto lg:mx-0">
              <div>
                <span className="text-2xl font-black text-white">+۱,۵۰۰</span>
                <p className="text-[11px] text-slate-400 mt-1">کارت‌های ویزیت فعال</p>
              </div>
              <div>
                <span className="text-2xl font-black text-white">+۴۲,۰۰۰</span>
                <p className="text-[11px] text-slate-400 mt-1">بازدید کل ماهیانه</p>
              </div>
              <div>
                <span className="text-2xl font-black text-white">+۲۴</span>
                <p className="text-[11px] text-slate-400 mt-1">نمایندگی فعال کشور</p>
              </div>
            </div>
          </div>

          {/* Interactive Live Card Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm group">
              {/* Card visual stack decoration */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-45 transition duration-500"></div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
                {/* Visual Cover Photo */}
                <div className="h-28 bg-slate-800 relative shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" 
                    alt="cover" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50"></div>
                  
                  {/* Status indicator overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[9px] bg-emerald-500/25 backdrop-blur-md text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>آنلاین / فعال</span>
                  </div>
                </div>

                {/* Avatar overlapping cover */}
                <div className="px-5 -mt-10 relative z-20 flex justify-between items-end" dir="rtl">
                  <div className="h-20 w-20 rounded-full border-4 border-slate-900 overflow-hidden shadow-lg bg-slate-900 shrink-0">
                    <img 
                      src="https://picsum.photos/150/150?random=120" 
                      alt="avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] bg-slate-850 text-slate-300 px-2.5 py-1 rounded-full border border-slate-800 font-bold">
                    ۱,۵۰۰+ بازدید
                  </span>
                </div>

                {/* Profile Details */}
                <div className="p-5 space-y-4 text-right" dir="rtl">
                  <div>
                    <h3 className="font-black text-white text-lg flex items-center gap-1">
                      دانیال راد
                      <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500/10 shrink-0" />
                    </h3>
                    <p className="text-xs text-blue-400 font-bold mt-0.5">توسعه‌دهنده فول‌استک و مشاور برندینگ</p>
                    <p className="text-[10px] text-slate-400">شرکت دانش بنیان کاردینو</p>
                  </div>

                  {/* Short Bio */}
                  <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">
                    خلاقیت در ساخت ابزارهای ارتباطی مدرن. من به شما کمک می‌کنم تا ارتباطات تجاری خود را هوشمندانه و بدون محدودیت کاغذ مدیریت کنید.
                  </p>

                  {/* Action grid (Socials) using Lucide Icons */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col items-center justify-center p-2 bg-slate-950/80 border border-slate-850 rounded-xl hover:border-blue-500/40 transition cursor-pointer">
                      <Phone className="h-4 w-4 text-emerald-400" />
                      <span className="text-[9px] font-bold mt-1.5 text-slate-400">تلفن</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-slate-950/80 border border-slate-850 rounded-xl hover:border-blue-500/40 transition cursor-pointer">
                      <MessageSquare className="h-4 w-4 text-emerald-500" />
                      <span className="text-[9px] font-bold mt-1.5 text-slate-400">واتساپ</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-slate-950/80 border border-slate-850 rounded-xl hover:border-blue-500/40 transition cursor-pointer">
                      <Send className="h-4 w-4 text-blue-400" />
                      <span className="text-[9px] font-bold mt-1.5 text-slate-400">تلگرام</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-slate-950/80 border border-slate-850 rounded-xl hover:border-blue-500/40 transition cursor-pointer">
                      <Instagram className="h-4 w-4 text-pink-400" />
                      <span className="text-[9px] font-bold mt-1.5 text-slate-400">اینستا</span>
                    </div>
                  </div>

                  {/* Save Contact Button */}
                  <div className="space-y-3">
                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10">
                      <Download className="h-4 w-4" />
                      ذخیره مستقیم شماره تلفن در گوشی
                    </button>

                    {/* Bottom Links */}
                    <div className="pt-3 border-t border-slate-850 flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">لینک اختصاصی تست:</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleCopyDemoLink('ali-alavi')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold transition text-[10px]"
                        >
                          {copiedLink === 'ali-alavi' ? 'کپی شد!' : 'کپی آدرس کارت'}
                        </button>
                        <button 
                          onClick={() => router.push('/card/ali-alavi')}
                          className="text-blue-400 hover:underline flex items-center font-bold"
                        >
                          مشاهده زنده
                          <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. KEY FEATURES */}
      <section id="features" className="py-20 bg-slate-900/40 border-t border-b border-slate-900 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">سامانه‌ای فراتر از یک کارت ویزیت ساده</h2>
            <p className="text-slate-400 text-sm">
              تمامی زیرساخت‌های لازم برای شبکه‌سازی، برندینگ، آنالیز بازدید و توسعه همکاری‌های نمایندگی را یکجا تجربه کنید.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="p-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-inner">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">طراحی کاملاً لمس‌محور و پاسخگو</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                کارت‌ها به طور اختصاصی برای تجربه کاربری تلفن‌های همراه طراحی شده‌اند تا در هر ابعادی از صفحه به شکلی چشم‌نواز نمایش داده شوند.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-inner">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">دانلود مستقیم فایل مخاطب (VCF)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                مخاطب تنها با لمس یک دکمه، نام کامل، سمت کاری، ایمیل و شماره تلفن شما را مستقیماً در مخاطبین آیفون یا اندروید خود ذخیره می‌کند.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">آمار بازدید زنده و پیشرفته</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                ردیابی کنید کارت شما چند بار دیده شده، از چه منابعی (اینستاگرام، مستقیم، لینکدین) کلیک شده و چه نوع دستگاه‌هایی داشته‌اند.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">سفارشی‌سازی ظاهر و رنگ‌ها</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                دسترسی کامل به ویرایشگر زنده برای تغییر تصویر پروفایل، عکس کاور، تم رنگی اختصاصی، دکمه‌های لینک و حتی کدهای CSS شخصی.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">پورتال اختصاصی نمایندگی (به زودی)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                می‌توانید نمایندگی اختصاصی بگیرید و سامانه را با برند، لوگو، دامنه و پلن‌های قیمت‌گذاری دلخواه خود عرضه کنید و ۱۰۰٪ سود ببرید. این قابلیت در برنامه‌های آینده به پنل افزوده می‌شود.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">امنیت و پایداری در دایرکتوس</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                اطلاعات شما با استاندارد بالا در پایگاه داده مستقل ذخیره می‌شود که سرعت بارگذاری خارق‌العاده و امنیت ارتباطات را فراهم می‌آورد.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. TEMPLATE GALLERY SHOWCASE */}
      <section id="templates" className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-slate-900 pb-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">قالب‌های ظاهری طراحی شده توسط کارشناسان هنری</h2>
              <p className="text-slate-400 text-xs">برای هر کسب‌وکار و سلیقه‌ای، تم متمایزی تدارک دیده‌ایم.</p>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold transition border border-slate-800"
            >
              طراحی اولین کارت در ویرایشگر
            </button>
          </div>

          {error ? (
            <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto">
              <span className="text-sm font-bold text-red-400 block">⚠️ خطا در بارگذاری قالب‌ها</span>
              <p className="text-slate-400 text-xs leading-relaxed">{error}</p>
              <button 
                onClick={fetchLandingData}
                className="px-6 py-2 bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition border border-slate-700"
              >
                تلاش مجدد
              </button>
            </div>
          ) : loading || templates.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4 animate-pulse">
                  <div className="h-44 bg-slate-800 rounded-xl"></div>
                  <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (() => {
            const activeTemplate = templates[currentSlide] || templates[0];
            const isClassic = activeTemplate.slug === 'classic' || activeTemplate.id === 'temp-1' || activeTemplate.id === '11111111-1111-1111-1111-111111111111';
            const isNeonGlass = activeTemplate.slug === 'neon-glass' || activeTemplate.id === 'temp-2' || activeTemplate.id === '22222222-2222-2222-2222-222222222222';
            const isMinimal = activeTemplate.slug === 'minimal' || activeTemplate.id === 'temp-3' || activeTemplate.id === '33333333-3333-3333-3333-333333333333';
            const isLuxuryDark = activeTemplate.slug === 'luxury-dark' || activeTemplate.id === 'temp-4' || activeTemplate.id === '44444444-4444-4444-4444-444444444444';

            const templateMeta: Record<string, { desc: string; styleName: string; features: string[]; bgClass: string; cardStyle: React.CSSProperties; mockCover: string; accentColor: string }> = {
              'classic': {
                desc: 'مناسب شرکت‌ها، سازمان‌ها و کسب‌وکارهای رسمی که به دنبال ارائه اطلاعات با ساختار کلاسیک، آیکون‌های استاندارد و چیدمان منظم اداری هستند.',
                styleName: 'کلاسیک اداری (Classic)',
                features: ['رنگ‌بندی پایدار و رسمی با کنتراست بالا', 'چیدمان هوشمند اطلاعات تماس و دکمه‌ها', 'طراحی مینیمال و همه‌پسند با کاربری آسان'],
                bgClass: 'bg-slate-100 text-slate-800',
                accentColor: 'bg-blue-600',
                mockCover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
                cardStyle: { backgroundColor: '#ffffff', color: '#1e293b' }
              },
              'neon-glass': {
                desc: 'ظاهری مدرن با افکت شیشه‌ای فرست‌شده (Glassmorphism) و لبه‌های درخشان نئونی، همراه با پس‌زمینه گرادینت کهکشانی متحرک.',
                styleName: 'گرادینت کهکشانی (Neon Glass)',
                features: ['افکت شیشه‌ای جذاب نیمه شفاف', 'گرادینت کهکشانی بنفش و سورمه‌ای', 'آیکون‌های تماس دایره‌ای با سایه نئون'],
                bgClass: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-slate-100',
                accentColor: 'bg-purple-500',
                mockCover: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80',
                cardStyle: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', color: '#f8fafc', borderColor: 'rgba(168, 85, 247, 0.4)' }
              },
              'minimal': {
                desc: 'طراحی کاملاً مینیمال، متوازن و مدرن با بیشترین تمرکز بر روی خوانایی بالا، فونت‌های شارپ و فاصله خالی مناسب.',
                styleName: 'مینیمال مدرن (Minimal)',
                features: ['تایپوگرافی بسیار خوانا و با اصالت', 'چیدمان ردیفی بدون شلوغی اضافه', 'دکمه‌های با کادر ظریف و استایل تخت'],
                bgClass: 'bg-zinc-50 text-zinc-900 border border-zinc-200',
                accentColor: 'bg-zinc-900',
                mockCover: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=600&q=80',
                cardStyle: { backgroundColor: '#ffffff', color: '#18181b' }
              },
              'luxury-dark': {
                desc: 'تم مشکی عمیق با رگه‌های طلایی اشرافی و جزئیات لوکس، فوق‌العاده برای پزشکان، طراحان خاص، وکلا و مدیران ارشد اجرایی.',
                styleName: 'تاریک و طلایی لاکچری (Luxury Dark)',
                features: ['خطوط جداکننده طلایی متالیک با ظرافت بالا', 'دکمه‌های شیب‌رنگ با تم زرد طلایی', 'آواتار دایره‌ای با قاب طلایی مجلل'],
                bgClass: 'bg-gradient-to-br from-stone-900 via-neutral-950 to-stone-900 text-amber-100',
                accentColor: 'bg-amber-500',
                mockCover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
                cardStyle: { backgroundColor: '#1c1917', color: '#fef08a', borderColor: '#d97706' }
              }
            };

            const meta = templateMeta[activeTemplate.slug] || {
              desc: 'قالب سفارشی‌سازی شده و منعطف برای هماهنگی کامل با هویت بصری منحصربه‌فرد کسب‌وکار شما.',
              styleName: activeTemplate.name,
              features: ['بارگذاری فوق‌العاده سریع به صورت استاتیک', 'پنل تنظیمات کاربری پویا و جامع', 'دسترسی دیتابیس مستقیم دایرکتوس'],
              bgClass: 'bg-slate-900 text-white',
              accentColor: 'bg-blue-500',
              mockCover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
              cardStyle: { backgroundColor: '#0f172a', color: '#f8fafc' }
            };

            const handleNext = () => {
              setCurrentSlide((prev) => (prev + 1) % templates.length);
            };

            const handlePrev = () => {
              setCurrentSlide((prev) => (prev - 1 + templates.length) % templates.length);
            };

            return (
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-10 lg:p-12 transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  
                  {/* Left Side: Template Info */}
                  <div className="lg:col-span-7 space-y-6 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-full border border-blue-500/20">
                          قالب پیش‌فرض سیستم
                        </span>
                        {activeTemplate.is_premium && (
                          <span className="px-3 py-1 bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black rounded-full shadow">
                            VIP ویژه
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                        {meta.styleName}
                      </h3>
                      
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                        {meta.desc}
                      </p>

                      <div className="pt-2 space-y-3">
                        <span className="text-[11px] font-bold text-slate-400 block">ویژگی‌های برجسته این قالب:</span>
                        <ul className="space-y-2.5">
                          {meta.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                              <span className={`h-2 w-2 rounded-full ${meta.accentColor} shrink-0`} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <button 
                          onClick={() => router.push(`/dashboard`)}
                          className="px-6 py-3 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/15 flex items-center gap-2 transition"
                        >
                          انتخاب این تم و ویرایش کارت
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={handlePrev}
                            className="h-10 w-10 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
                            title="قالب قبلی"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          
                          <button 
                            onClick={handleNext}
                            className="h-10 w-10 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
                            title="قالب بعدی"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Dots indicator */}
                      <div className="flex items-center gap-2 pt-2">
                        {templates.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              idx === currentSlide ? `w-8 ${meta.accentColor}` : 'w-2.5 bg-slate-800 hover:bg-slate-750'
                            }`}
                            title={`مشاهده قالب ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Virtual Interactive Mobile Phone Preview */}
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="w-[280px] h-[540px] rounded-[40px] border-[6px] border-slate-800 bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-white/10 shrink-0">
                      
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-b-2xl z-20"></div>

                      {/* Phone Screen Canvas container */}
                      <div className="flex-grow flex flex-col overflow-y-auto overflow-x-hidden relative scrollbar-hide text-right select-none font-sans" dir="rtl">
                        
                        {/* 1. CLASSIC TEMPLATE PREVIEW */}
                        {isClassic && (
                          <div className="w-full min-h-full bg-slate-100 text-slate-850 flex flex-col">
                            {/* Cover photo */}
                            <div className="h-24 bg-slate-300 relative shrink-0">
                              <img 
                                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" 
                                alt="cover" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
                            </div>

                            {/* Profile Pic overlapping cover */}
                            <div className="px-4 -mt-8 relative z-10 flex justify-between items-end">
                              <div className="h-16 w-16 rounded-xl border-2 border-white overflow-hidden shadow-sm bg-white">
                                <img 
                                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80" 
                                  alt="profile" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[8px] bg-slate-200/85 px-2 py-0.5 rounded-full text-slate-600 font-bold">
                                ۴۵۰ بازدید
                              </span>
                            </div>

                            {/* Info */}
                            <div className="p-4 space-y-4 flex-grow">
                              <div>
                                <h4 className="text-xs font-black text-slate-900">مهندس سارا راد</h4>
                                <p className="text-[9px] font-bold text-blue-600 mt-0.5">مدیر ارشد محصول (CPO)</p>
                                <p className="text-[8px] text-slate-500">شرکت دانش بنیان مپنا</p>
                              </div>

                              <div className="p-2.5 bg-white rounded-xl text-[8px] leading-relaxed border border-slate-100 text-slate-600 shadow-sm">
                                توسعه‌دهنده محصولات نرم‌افزاری مقیاس‌پذیر و برنده جوایز بین‌المللی طراحی رابط‌های دیجیتال.
                              </div>

                              {/* Contact grid */}
                              <div className="grid grid-cols-4 gap-2">
                                {['تلفن', 'واتساپ', 'تلگرام', 'اینستا'].map((social, i) => (
                                  <div key={social} className="flex flex-col items-center justify-center p-1.5 bg-white rounded-xl border border-slate-100">
                                    {i === 0 ? (
                                      <Phone className="h-3.5 w-3.5 text-blue-600" />
                                    ) : i === 1 ? (
                                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : i === 2 ? (
                                      <Send className="h-3.5 w-3.5 text-sky-500" />
                                    ) : (
                                      <Instagram className="h-3.5 w-3.5 text-pink-500" />
                                    )}
                                    <span className="text-[7px] font-bold mt-1 text-slate-500">{social}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Custom buttons */}
                              <div className="space-y-1.5">
                                <div className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-[8px] font-bold text-slate-700 shadow-sm">
                                  <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                  <span>دریافت رزومه کاری و پورتفولیو</span>
                                  <span className="opacity-30">➔</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. NEON GLASS TEMPLATE PREVIEW */}
                        {isNeonGlass && (
                          <div className="w-full min-h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-slate-100 p-4 space-y-4 flex flex-col justify-between">
                            <div className="space-y-4 pt-4">
                              <div className="flex justify-between items-center text-[8px]">
                                <span className="px-2 py-0.5 bg-white/10 rounded-full text-slate-300">
                                  ۱,۲۰۰ بازدید
                                </span>
                                <span className="text-purple-400 font-extrabold">NEON GLASS</span>
                              </div>

                              {/* Profile Visual */}
                              <div className="flex flex-col items-center text-center space-y-2">
                                <div className="relative">
                                  <div className="absolute -inset-1 rounded-full blur bg-gradient-to-r from-purple-500 to-pink-500 opacity-40 animate-pulse"></div>
                                  <div className="h-16 w-16 rounded-full border border-white/30 overflow-hidden relative bg-slate-950">
                                    <img 
                                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80" 
                                      alt="profile" 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs font-black text-white">مهندس سارا راد</h4>
                                  <p className="text-[9px] font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mt-0.5">طراح ارشد محصول</p>
                                </div>
                              </div>

                              <div className="p-2.5 bg-white/5 rounded-xl text-[8px] leading-relaxed border border-white/10 text-slate-300">
                                خلق رابط‌های کاربری جذاب مدرن با تلفیق تکنولوژی روز دنیا و ترندهای طراحی شیشه‌ای.
                              </div>

                              {/* Neon Grid */}
                              <div className="grid grid-cols-4 gap-2">
                                {['تلفن', 'واتساپ', 'تلگرام', 'اینستا'].map((social, i) => (
                                  <div key={social} className="flex flex-col items-center justify-center p-1.5 bg-white/5 border border-white/10 rounded-xl shadow-[0_0_8px_rgba(168,85,247,0.15)]">
                                    {i === 0 ? (
                                      <Phone className="h-3.5 w-3.5 text-purple-400" />
                                    ) : i === 1 ? (
                                      <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : i === 2 ? (
                                      <Send className="h-3.5 w-3.5 text-sky-400" />
                                    ) : (
                                      <Instagram className="h-3.5 w-3.5 text-pink-400" />
                                    )}
                                    <span className="text-[7px] font-bold mt-1 text-slate-400">{social}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-1.5">
                              <div className="p-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-[8px] font-bold text-white shadow-sm hover:bg-white/10">
                                <FileText className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                <span>دانلود رزومه (پورتفولیو شیشه‌ای)</span>
                                <span className="opacity-40">➔</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. MINIMAL TEMPLATE PREVIEW */}
                        {isMinimal && (
                          <div className="w-full min-h-full bg-zinc-50 text-zinc-900 p-4 space-y-4 flex flex-col justify-between">
                            <div className="space-y-4 pt-4">
                              <div className="flex justify-between items-center text-[8px] opacity-50 font-sans">
                                <span>/sara-rad</span>
                                <span>MINIMAL</span>
                              </div>

                              {/* Portrait Card */}
                              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-zinc-100 shrink-0">
                                  <img 
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80" 
                                    alt="profile" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-right">
                                  <h4 className="text-xs font-black text-zinc-900">سارا راد</h4>
                                  <p className="text-[8px] font-bold text-zinc-600">مدیر توسعه محصول</p>
                                  <p className="text-[7px] text-zinc-400">کاردینو</p>
                                </div>
                              </div>

                              <p className="text-[8px] leading-relaxed opacity-75 border-r-2 border-zinc-300 pr-2 text-zinc-700">
                                ساده‌ترین راه برای نمایش هویت کاری شما به دور از شلوغی‌های گرافیکی و با تمرکز صد درصدی بر محتوای متنی.
                              </p>

                              {/* Minimal contact list */}
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-bold opacity-40 block">ارتباط سریع</span>
                                <div className="flex items-center gap-2 py-1 text-[8px] font-medium border-b border-zinc-100">
                                  <span className="p-1 bg-zinc-100 rounded">
                                    <Phone className="h-2.5 w-2.5 text-zinc-700" />
                                  </span>
                                  <span className="font-sans text-zinc-600">۰۹۱۲۳۴۵۶۷۸۹</span>
                                </div>
                                <div className="flex items-center gap-2 py-1 text-[8px] font-medium border-b border-zinc-100">
                                  <span className="p-1 bg-zinc-100 rounded">
                                    <MessageSquare className="h-2.5 w-2.5 text-zinc-700" />
                                  </span>
                                  <span className="text-zinc-600">ارسال در واتساپ</span>
                                </div>
                              </div>
                            </div>

                            {/* Buttons */}
                            <button className="w-full py-2 border border-zinc-900 font-bold flex items-center justify-center gap-1.5 text-[8px] rounded-lg">
                              <FileText className="h-3 w-3 text-zinc-900 shrink-0" />
                              <span>دانلود مشخصات تماس سارا</span>
                            </button>
                          </div>
                        )}

                        {/* 4. LUXURY GOLD TEMPLATE PREVIEW */}
                        {isLuxuryDark && (
                          <div className="w-full min-h-full bg-[#0c0a09] text-amber-100 p-4 space-y-4 flex flex-col justify-between border border-amber-500/20">
                            <div className="space-y-4 pt-4">
                              <div className="flex justify-between items-center text-[8px]">
                                <span className="px-2 py-0.5 bg-amber-500/10 rounded-full text-amber-400 font-bold border border-amber-500/20">
                                  LUXURY VIP
                                </span>
                                <span className="text-amber-500">★</span>
                              </div>

                              {/* Centered Luxury Avatar */}
                              <div className="flex flex-col items-center text-center space-y-2">
                                <div className="h-16 w-16 rounded-full border-2 border-amber-500 overflow-hidden shadow-lg p-0.5 bg-[#0c0a09]">
                                  <img 
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80" 
                                    alt="profile" 
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-amber-100">دکتر مریم آریا</h4>
                                  <p className="text-[9px] font-bold text-amber-400 mt-0.5">جراح و متخصص پوست و مو</p>
                                </div>
                              </div>

                              <p className="text-[8px] leading-relaxed text-stone-300 text-center px-2">
                                خلق زیبایی طبیعی با بکارگیری به‌روزترین متدهای پزشکی و تکنولوژی‌های لیزر نوین جهانی.
                              </p>

                              {/* Luxury Gold Buttons */}
                              <div className="grid grid-cols-4 gap-2">
                                {['تلفن', 'واتساپ', 'تلگرام', 'اینستا'].map((social, i) => (
                                  <div key={social} className="flex flex-col items-center justify-center p-1.5 bg-stone-900 border border-amber-500/20 rounded-xl text-amber-300">
                                    {i === 0 ? (
                                      <Phone className="h-3.5 w-3.5 text-amber-400" />
                                    ) : i === 1 ? (
                                      <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                                    ) : i === 2 ? (
                                      <Send className="h-3.5 w-3.5 text-amber-400" />
                                    ) : (
                                      <Instagram className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                    <span className="text-[7px] font-bold mt-1 text-stone-400">{social}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Luxury actions */}
                            <div className="space-y-1.5">
                              <div className="p-2 bg-stone-900 border border-amber-500/30 rounded-xl flex items-center justify-between text-[8px] font-bold text-amber-300">
                                <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                <span>کتابچه سوابق درمانی کلینیک</span>
                                <span className="opacity-40">➔</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 5. FALLBACK CUSTOM TEMPLATE */}
                        {!isClassic && !isNeonGlass && !isMinimal && !isLuxuryDark && (() => {
                          const tSchema = activeTemplate.schema || {};
                          const isDarkTheme = tSchema.theme === 'dark';
                          const tColors = tSchema.colors || {};
                          const tTypography = tSchema.typography || {};
                          const tLayout = tSchema.layout || {};

                          const pColor = tColors.primary || '#8d5b4c';
                          const sColor = tColors.secondary || '#f4ece1';
                          const bColor = tColors.background || '#faf6f0';
                          const txtColor = tColors.text || '#2d221e';
                          const txtSecColor = tColors.text_secondary || '#6e5a53';
                          const cardBg = isDarkTheme ? '#18181b' : '#ffffff';
                          
                          const isCircleAvatar = (tLayout.avatar_shape || 'circle') === 'circle';
                          const isSplitHeader = tLayout.header_style === 'split';

                          return (
                            <div 
                              className="w-full min-h-full transition-all p-4 space-y-4 flex flex-col justify-between text-right"
                              dir="rtl"
                              style={{ 
                                backgroundColor: cardBg, 
                                color: txtColor
                              }}
                            >
                              <div className="space-y-4">
                                <div className="flex justify-between items-center text-[8px]">
                                  <span className="px-2 py-0.5 rounded-full text-[7px] font-bold" style={{ backgroundColor: sColor, color: pColor }}>
                                    {activeTemplate.name}
                                  </span>
                                  <span className="font-bold" style={{ color: pColor }}>قالب اختصاصی</span>
                                </div>

                                {isSplitHeader ? (
                                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                                    <div className="h-10 w-10 overflow-hidden border shrink-0" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '8px' }}>
                                      <img 
                                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80" 
                                        alt="profile" 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="text-[10px] font-black" style={{ fontSize: tTypography.title_size || '11px' }}>مهندس سارا راد</h4>
                                      <p className="text-[8px] font-bold" style={{ color: pColor }}>مدیر ارشد محصول (CPO)</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center text-center space-y-2">
                                    <div className="h-14 w-14 overflow-hidden border p-0.5" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '12px' }}>
                                      <img 
                                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80" 
                                        alt="profile" 
                                        className="w-full h-full object-cover"
                                        style={{ borderRadius: isCircleAvatar ? '9999px' : '10px' }}
                                      />
                                    </div>
                                    <div>
                                      <h4 className="text-[11px] font-black" style={{ fontSize: tTypography.title_size || '12px' }}>مهندس سارا راد</h4>
                                      <p className="text-[8px] font-bold mt-0.5" style={{ color: pColor }}>مدیر ارشد محصول (CPO)</p>
                                    </div>
                                  </div>
                                )}

                                <p className="text-[7px] leading-relaxed text-center" style={{ color: txtSecColor, fontSize: tTypography.body_size || '8px' }}>
                                  توسعه‌دهنده محصولات نرم‌افزاری مقیاس‌پذیر و برنده جوایز بین‌المللی طراحی رابط‌های دیجیتال.
                                </p>

                                {/* Mini Contact Buttons */}
                                <div className="grid grid-cols-4 gap-1.5">
                                  {['تلفن', 'واتساپ', 'تلگرام', 'سایت'].map((social, i) => (
                                    <div key={social} className="flex flex-col items-center justify-center p-1 rounded-lg border text-[7px]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                      <span className="text-[9px]">{i === 0 ? '📞' : i === 1 ? '💬' : i === 2 ? '✈️' : '📸'}</span>
                                      <span className="text-[6px] font-bold mt-0.5" style={{ color: txtSecColor }}>{social}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <button className="w-full py-2 font-bold text-white text-[8px] rounded-lg transition hover:opacity-90" style={{ backgroundColor: pColor }}>
                                انتخاب قالب {activeTemplate.name}
                              </button>
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 5. RESELLERS & TENANTS INVITATION */}
      <section id="agencies" className="py-20 bg-slate-900/30 border-t border-slate-900/80 px-6 relative">
        <div className="max-w-5xl mx-auto bg-gradient-to-tr from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-44 w-44 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-6">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">کسب درآمد میلیونی با اعطای نمایندگی (به زودی)</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">صاحب یک سامانه کامل کارت ویزیت دیجیتال شوید! (به زودی)</h2>
              <p className="text-slate-300 text-xs leading-relaxed">
                نمایندگان سیستم (Tenants) دسترسی به پورتال مدیریت اختصاصی خواهند داشت. آنها می‌توانند نام تجاری خود را ثبت کنند، رنگ تم هدر پنل را ویرایش کنند، لوگوی خود را بارگذاری و حتی پلن‌های فروش اختصاصی با قیمت‌گذاری‌های مستقل ایجاد کنند. این قابلیت به زودی در برنامه‌های آینده فعال خواهد شد.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 font-medium pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>برندینگ اختصاصی ۱۰۰٪ وایت‌لیبل</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>اتصال به دامنه‌های سفارشی</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>تعریف پلن‌های اشتراک دلخواه</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>مشاهده تراکنش‌ها و درگاه واسط مالی</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center space-y-5 w-full max-w-xs shadow-xl">
                <Building2 className="h-10 w-10 text-indigo-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-sm text-white">پک نمایندگی کاردینو</h4>
                  <p className="text-[10px] text-slate-500 mt-1">شروع کسب درآمد به عنوان نماینده مستقل</p>
                </div>
                <div className="bg-slate-900 py-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-xs text-slate-400 block -mb-0.5">کارمزد سامانه مبدا:</span>
                  <span className="text-lg font-black text-white">۱۰ الی ۱۵ درصد</span>
                </div>
                <button 
                  onClick={() => router.push('/dashboard?role=tenant')}
                  className="w-full py-2.5 bg-indigo-600/50 hover:bg-indigo-600/60 text-white/80 text-xs font-bold rounded-xl transition shadow shadow-indigo-600/10 cursor-not-allowed"
                  disabled
                >
                  تست پنل نمایندگی (به زودی)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SUBSCRIPTION PLANS */}
      <section id="plans" className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white">سرمایه‌گذاری روی هویت تجاری شما</h2>
            <p className="text-slate-400 text-xs">یکی از پلن‌های زیر را متناسب با نیاز خود فعال کرده و کارت ویزیت هوشمندتان را همین حالا منتشر کنید.</p>
          </div>

          {error ? (
            <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto">
              <span className="text-sm font-bold text-red-400 block">⚠️ خطا در بارگذاری پلن‌ها</span>
              <p className="text-slate-400 text-xs leading-relaxed">{error}</p>
              <button 
                onClick={fetchLandingData}
                className="px-6 py-2 bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition border border-slate-700"
              >
                تلاش مجدد
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-800 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-800 rounded w-1/3"></div>
                  </div>
                  <div className="h-10 bg-slate-800 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-800 rounded"></div>
                    <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-800 rounded w-4/5"></div>
                  </div>
                  <div className="h-10 bg-slate-800 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`bg-slate-900 border rounded-3xl p-6 relative flex flex-col justify-between gap-6 hover:translate-y-[-4px] transition-all duration-300 ${
                    plan.price > 0 && plan.price < 400000 
                    ? 'border-blue-600/50 shadow-lg shadow-blue-500/5' 
                    : plan.price >= 400000 
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' 
                    : 'border-slate-800'
                  }`}
                >
                  {plan.price >= 400000 && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-full shadow">
                      توصیه شده
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">مدت اعتبار: {plan.duration_days} روز</p>
                    </div>

                    <div className="py-2 border-t border-b border-slate-800 flex items-baseline gap-1.5">
                      {plan.price === 0 ? (
                        <span className="text-2xl font-black text-white">رایگان</span>
                      ) : (
                        <>
                          <span className="text-3xl font-black text-white">
                            {plan.price.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">تومان</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 font-normal">
                      {(plan.features || []).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => router.push('/dashboard')}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                      plan.price === 0 
                      ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                      : plan.price >= 400000 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow shadow-amber-500/10' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/10'
                    }`}
                  >
                    شروع با این پلن
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-black">
              ک
            </div>
            <div>
              <span className="font-bold text-slate-300 text-sm">سامانه کارت ویزیت دیجیتال کاردینو</span>
              <p className="text-[10px] text-slate-600">میزبانی امن داده‌ها با پایداری ۹۹.۹٪</p>
            </div>
          </div>

          <p className="text-center text-xs opacity-70">
            تمامی حقوق مادی و معنوی محفوظ است. توسعه یافته بر روی بستر کلود با بالاترین سطح حریم خصوصی.
          </p>

          <div className="flex gap-4 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-blue-500 transition">امکانات</a>
            <a href="#templates" className="hover:text-blue-500 transition">تم‌ها</a>
            <a href="#plans" className="hover:text-blue-500 transition">تعرفه‌ها</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
