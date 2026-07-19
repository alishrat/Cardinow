'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  dbService, authService, initializeDB, Card, Tenant, Template, Plan, Subscription, Transaction, UserSession, CardAnalytics, toUUID
} from '../../lib/directus';
import { 
  Plus, Edit2, Trash2, Globe, ExternalLink, Copy, Check, Eye, Save, Search, 
  Settings, User, LogOut, LayoutGrid, CreditCard, BarChart2, ShieldCheck, 
  Users, Building, DollarSign, ArrowLeft, Sliders, Smartphone, Palette, 
  Code, Link2, Trash, CheckSquare, Sparkles, HelpCircle, RefreshCw, Star, ArrowRight,
  Phone, Mail, Send, MessageCircle, ChevronLeft, MapPin, Instagram
} from 'lucide-react';

function generateRandomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('cards');

  // Database States
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<CardAnalytics[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Auth Forms
  const [loginEmail, setLoginEmail] = useState(''); // also serves as loginId (email or mobile)
  const [loginPassword, setLoginPassword] = useState('');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerMobile, setRegisterMobile] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);

  // Customer Panel States
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardSuccess, setCardSuccess] = useState<string | null>(null);
  const [isCopiedSlug, setIsCopiedSlug] = useState<string | null>(null);
  const [newBtnLabel, setNewBtnLabel] = useState('');
  const [newBtnUrl, setNewBtnUrl] = useState('');
  const [newExtraPhone, setNewExtraPhone] = useState('');
  
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleFileUpload = async (file: File, type: 'profile' | 'cover') => {
    if (!editingCard) return;
    if (type === 'profile') setUploadingProfile(true);
    else setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/directus/files', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('خطا در بارگذاری فایل در سرور دایرکتوس.');
      }

      const json = await res.json();
      const fileId = json?.data?.id;
      if (!fileId) {
        throw new Error('شناسه فایل از سرور دایرکتوس دریافت نشد.');
      }

      // Construct directus assets URL
      let rawBaseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://directus-iuao17eclszuzc06zaqzodkr.89.42.199.190.sslip.io';
      if (rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl)) {
        rawBaseUrl = `https://${rawBaseUrl}`;
      }
      const cleanedBaseUrl = rawBaseUrl.replace(/\/+$/, '');
      const fileUrl = `${cleanedBaseUrl}/assets/${fileId}`;

      if (type === 'profile') {
        setEditingCard({ ...editingCard, profile_image: fileUrl });
      } else {
        setEditingCard({ ...editingCard, cover_image: fileUrl });
      }
    } catch (err: any) {
      alert('خطا در بارگذاری تصویر: ' + err.message);
    } finally {
      if (type === 'profile') setUploadingProfile(false);
      else setUploadingCover(false);
    }
  };
  
  // Simulated Bank Gate Modal / Offline Payment Submission
  const [payingPlan, setPayingPlan] = useState<Plan | null>(null);
  const [simulatedGateway, setSimulatedGateway] = useState('کارت به کارت (پرداخت آفلاین)');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [offlineRefId, setOfflineRefId] = useState('');
  const [offlineDepositTime, setOfflineDepositTime] = useState('');
  const [offlineNote, setOfflineNote] = useState('');

  // Tenant Panel States
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Template Management States
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [adminCardsSearch, setAdminCardsSearch] = useState<string>('');

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  async function refreshData() {
    setApiError(null);
    setIsSyncing(true);
    try {
      const [
        fetchedTenants,
        fetchedTemplates,
        fetchedPlans,
        fetchedSubscriptions,
        fetchedTransactions,
        fetchedAnalytics,
        fetchedCards
      ] = await Promise.all([
        dbService.getTenants(),
        dbService.getTemplates(),
        dbService.getPlans(),
        dbService.getSubscriptions(),
        dbService.getTransactions(),
        dbService.getAllAnalytics(),
        dbService.getCards()
      ]);

      setTenants(fetchedTenants);
      setTemplates(fetchedTemplates);
      setPlans(fetchedPlans);
      setSubscriptions(fetchedSubscriptions);
      setTransactions(fetchedTransactions);
      setAnalytics(fetchedAnalytics);

      const session = authService.getCurrentUser();
      if (session) {
        if (session.role === 'customer') {
          setCards(fetchedCards.filter(c => toUUID(c.user_id) === toUUID(session.id)));
        } else {
          setCards(fetchedCards);
        }
        if (session.tenant_id) {
          const tid = session.tenant_id;
          const found = fetchedTenants.find(t => toUUID(t.id) === toUUID(tid));
          if (found) setSelectedTenant(found);
        }

        // Fetch users for admin/tenant to manage
        if (session.role === 'admin' || session.role === 'tenant') {
          try {
            const fetchedUsers = await dbService.getAllUsers();
            setAllUsers(fetchedUsers);
          } catch (usersErr) {
            console.warn('Could not fetch users list:', usersErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching data for dashboard:', err);
      setApiError('عدم اتصال به پایگاه داده آنلاین. لطفاً مطمئن شوید که اتصال اینترنت برقرار است و سرور به درستی اجرا می‌شود.');
    } finally {
      setIsSyncing(false);
    }
  }

  // Load state
  useEffect(() => {
    initializeDB();
    const loadSession = async () => {
      setLoading(true);
      const session = authService.getCurrentUser();
      setUser(session);

      await refreshData();
      setLoading(false);
    };
    loadSession();
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setAuthError('لطفاً ایمیل یا شماره موبایل خود را وارد کنید.');
      return;
    }
    setAuthError(null);
    try {
      const session = await authService.login(loginEmail, loginPassword);
      if (session) {
        setUser(session);
        setActiveTab(session.role === 'customer' ? 'cards' : session.role === 'tenant' ? 'tenant-settings' : 'admin-tenants');
        refreshData();
      } else {
        setAuthError('کاربری با این مشخصات یافت نشد. لطفاً ابتدا ثبت‌نام کنید.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'خطایی در ارتباط با سرور رخ داد.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerFirstName || !registerLastName || !registerEmail || !registerMobile || !registerPassword) {
      setAuthError('لطفاً تمامی فیلدها را با دقت پر کنید.');
      return;
    }
    setAuthError(null);
    try {
      const session = await authService.register(
        registerFirstName,
        registerLastName,
        registerEmail,
        registerMobile,
        registerPassword
      );
      setUser(session);
      setActiveTab('cards');
      refreshData();
    } catch (err: any) {
      setAuthError(err.message || 'خطایی در فرآیند ثبت‌نام رخ داد.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setEditingCard(null);
    setEditingPlan(null);
  };

  // Switch tabs based on Role
  useEffect(() => {
    if (user) {
      const determineTab = () => {
        if (user.role === 'customer') {
          setActiveTab('cards');
        } else if (user.role === 'tenant') {
          setActiveTab('tenant-settings');
        } else if (user.role === 'admin') {
          setActiveTab('admin-tenants');
        }
      };
      setTimeout(determineTab, 0);
    }
  }, [user]);

  // --- CUSTOMER ACTIONS ---
  const handleAddNewCard = async () => {
    if (!user || isCreatingCard) return;
    setIsCreatingCard(true);
    setCardError(null);
    setCardSuccess(null);
    const defaultTemplate = templates[0]?.id || 'temp-1';
    const newCard: Card = {
      id: 'c-' + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      tenant_id: user.tenant_id || 't-1',
      template_id: defaultTemplate,
      slug: 'my-link-' + Math.floor(Math.random() * 1000),
      status: 'draft',
      first_name: 'نام',
      last_name: 'خانوادگی',
      job_title: 'سمت کاری شما',
      company: 'نام شرکت یا برند',
      bio: 'توضیحات کوتاهی درباره تخصص و فعالیت‌های خود بنویسید.',
      neshan: '',
      waze: '',
      balad: '',
      googlemap: '',
      social_links: {
        phone: '',
        mobile: '',
        extra_phones: [],
        whatsapp: '',
        telegram: '',
        instagram: '',
        linkedin: '',
        website: '',
        email: ''
      },
      custom_buttons: [],
      custom_colors: {
        primary: '#3b82f6',
        secondary: '#1d4ed8',
        background: '#f1f5f9',
        text: '#1e293b',
        card_bg: '#ffffff'
      },
      custom_css: '',
      views_count: 0
    };
    try {
      await dbService.saveCard(newCard);
      setEditingCard(newCard);
      setCardSuccess('کارت ویزیت جدید با موفقیت ایجاد شد و وارد حالت ویرایش شدید.');
      await refreshData();
    } catch (err: any) {
      setCardError('خطا در اتصال به پایگاه داده هنگام ساخت کارت جدید: ' + err.message);
    } finally {
      setIsCreatingCard(false);
    }
  };

  const handleSaveCard = async () => {
    if (!editingCard || isSavingCard) return;
    setIsSavingCard(true);
    setCardError(null);
    setCardSuccess(null);
    try {
      await dbService.saveCard(editingCard);
      setEditingCard(null);
      setCardSuccess('تغییرات کارت ویزیت با موفقیت در دیتابیس ذخیره شد.');
      await refreshData();
    } catch (err: any) {
      setCardError('خطا در اتصال به سرور هنگام ذخیره‌سازی کارت: ' + err.message);
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('آیا از حذف این کارت ویزیت اطمینان کامل دارید؟ این عمل غیرقابل بازگشت است.')) {
      try {
        await dbService.deleteCard(cardId);
        if (editingCard?.id === cardId) setEditingCard(null);
        await refreshData();
      } catch (err: any) {
        alert('خطا در اتصال به سرور هنگام حذف کارت: ' + err.message);
      }
    }
  };

  const handleCopyCardLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/card/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setIsCopiedSlug(slug);
    setTimeout(() => setIsCopiedSlug(null), 2000);
  };

  const handleAddCustomBtn = () => {
    if (!editingCard || !newBtnLabel || !newBtnUrl) return;
    const currentBtns = editingCard.custom_buttons || [];
    const newBtn = {
      id: 'b-' + Math.random().toString(36).substr(2, 9),
      label: newBtnLabel,
      url: newBtnUrl.startsWith('http') ? newBtnUrl : `https://${newBtnUrl}`,
      color: editingCard.custom_colors?.primary || '#3b82f6'
    };
    const updated = {
      ...editingCard,
      custom_buttons: [...currentBtns, newBtn]
    };
    setEditingCard(updated);
    setNewBtnLabel('');
    setNewBtnUrl('');
  };

  const handleRemoveCustomBtn = (btnId: string) => {
    if (!editingCard) return;
    const updated = {
      ...editingCard,
      custom_buttons: (editingCard.custom_buttons || []).filter(b => b.id !== btnId)
    };
    setEditingCard(updated);
  };

  // --- SUBSCRIPTION SIMULATOR ---
  const handleInitiatePayment = (plan: Plan) => {
    setPayingPlan(plan);
  };

  const handleProcessSimulatedPayment = () => {
    if (!user || !payingPlan) return;
    
    const isOffline = simulatedGateway.includes('کارت به کارت') || simulatedGateway.includes('آفلاین');
    
    if (isOffline) {
      if (!offlineRefId.trim()) {
        alert('لطفاً شماره ارجاع / کد رهگیری تراکنش را وارد نمایید.');
        return;
      }
      if (!offlineDepositTime.trim()) {
        alert('لطفاً تاریخ و زمان واریز تراکنش را وارد نمایید.');
        return;
      }
    }

    setIsProcessingPayment(true);
    
    setTimeout(async () => {
      try {
        if (isOffline) {
          // Create a pending transaction for manual admin verification
          const newTx: Transaction = {
            id: generateRandomUUID(),
            user_id: user.id,
            tenant_id: user.tenant_id || 't-1',
            amount: payingPlan.price,
            gateway: 'کارت به کارت (آفلاین)',
            authority: 'AUTH-OFF-' + Math.random().toString(36).substring(3, 10).toUpperCase(),
            ref_id: offlineRefId.trim(),
            status: 'pending',
            payload: { 
              offline: true, 
              deposit_time: offlineDepositTime.trim(), 
              note: offlineNote.trim(),
              plan_id: payingPlan.id,
              plan_title: payingPlan.title,
              plan_duration: payingPlan.duration_days
            },
            created_at: new Date().toISOString()
          };
          await dbService.saveTransaction(newTx);
          
          setIsProcessingPayment(false);
          setPayingPlan(null);
          setOfflineRefId('');
          setOfflineDepositTime('');
          setOfflineNote('');
          await refreshData();
          alert(`درخواست فعال‌سازی اشتراک پلن "${payingPlan.title}" با کد رهگیری ${newTx.ref_id} ثبت گردید. پس از بررسی و تایید توسط مدیریت، اشتراک شما فعال خواهد شد.`);
        } else {
          // 1. Create Transaction
          const newTx: Transaction = {
            id: generateRandomUUID(),
            user_id: user.id,
            tenant_id: user.tenant_id || 't-1',
            amount: payingPlan.price,
            gateway: simulatedGateway,
            authority: 'AUTH-' + Math.random().toString(36).substring(3, 10).toUpperCase(),
            ref_id: Math.floor(Math.random() * 89999999 + 10000000).toString(),
            status: 'success',
            payload: { simulated: true, cardLimitIncrease: true },
            created_at: new Date().toISOString()
          };
          await dbService.saveTransaction(newTx);

          // 2. Create/Extend Subscription
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(startDate.getDate() + payingPlan.duration_days);

          const newSub: Subscription = {
            id: generateRandomUUID(),
            user_id: user.id,
            plan_id: payingPlan.id,
            status: 'active',
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
          };
          await dbService.saveSubscription(newSub);

          setIsProcessingPayment(false);
          setPayingPlan(null);
          await refreshData();
          alert(`پرداخت مبلغ ${payingPlan.price.toLocaleString('fa-IR')} تومان با موفقیت در درگاه شبیه‌سازی شده تراکنش تایید و اشتراک شما فعال گردید!`);
        }
      } catch (err: any) {
        setIsProcessingPayment(false);
        alert('خطا در ثبت اشتراک و تراکنش در سیستم: ' + err.message);
      }
    }, 1500);
  };

  // --- TENANT ACTIONS ---
  const handleSaveTenantSettings = async () => {
    if (!selectedTenant) return;
    try {
      await dbService.saveTenant(selectedTenant);
      await refreshData();
      alert('تنظیمات برند و نمایندگی شما با موفقیت ذخیره گردید و روی پورتال شما اعمال شد.');
    } catch (err: any) {
      alert('خطا در ذخیره‌سازی تنظیمات برند در سیستم: ' + err.message);
    }
  };

  const handleAddNewPlan = () => {
    if (!user) return;
    const newPlan: Plan = {
      id: 'p-' + Math.random().toString(36).substring(2, 9),
      tenant_id: user.tenant_id || 't-1',
      title: 'پلن نمایندگی جدید',
      price: 250000,
      duration_days: 90,
      features: ['ساخت کارت ویزیت', 'دسترسی به تمام تم ها'],
      is_active: true
    };
    setEditingPlan(newPlan);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    try {
      await dbService.savePlan(editingPlan);
      setEditingPlan(null);
      await refreshData();
    } catch (err: any) {
      alert('خطا در ذخیره‌سازی پلن نمایندگی در سیستم: ' + err.message);
    }
  };

  const handleAdminVerifyOfflinePayment = async (tx: Transaction, approved: boolean) => {
    try {
      if (approved) {
        // 1. Update transaction status
        const updatedTx: Transaction = {
          ...tx,
          status: 'success'
        };
        await dbService.saveTransaction(updatedTx);

        // 2. Create or extend Subscription
        const planDuration = tx.payload?.plan_duration || 30;
        const planId = tx.payload?.plan_id;
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + planDuration);

        const newSub: Subscription = {
          id: generateRandomUUID(),
          user_id: tx.user_id,
          plan_id: planId,
          status: 'active',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        };
        await dbService.saveSubscription(newSub);

        alert(`پرداخت تراکنش به شماره ${tx.ref_id} با موفقیت تایید و اشتراک کاربر بلافاصله فعال گردید.`);
      } else {
        // Update transaction status to failed
        const updatedTx: Transaction = {
          ...tx,
          status: 'failed'
        };
        await dbService.saveTransaction(updatedTx);
        alert(`پرداخت تراکنش به شماره ${tx.ref_id} رد شد.`);
      }
      await refreshData();
    } catch (err: any) {
      alert('خطا در تایید تراکنش بانکی: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 rtl" dir="rtl">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <span className="mt-4 text-slate-400 text-sm font-semibold">لطفاً چند لحظه منتظر بمانید...</span>
      </div>
    );
  }

  // --- RENDER 1: AUTHENTICATION (NOT LOGGED IN) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 rtl text-right font-sans" dir="rtl">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6 lg:p-10 relative">
          
          {/* Brand/Information column */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>اتصال ابری امن و پایدار</span>
              </div>
              <h2 className="text-3xl font-black text-white">کاردینو (Cardinow)</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                سامانه هوشمند طراحی و مدیریت کارت ویزیت دیجیتال و نمایندگی اختصاصی. برای ورود یا ثبت‌نام رایگان از فرم زیر استفاده کنید.
              </p>
            </div>

            <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/40">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>ساخت کارت ویزیت دیجیتال شخصی و رسمی</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span>طرح‌های بصری متنوع و قالب‌های از پیش‌طراحی‌شده</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>ویرایش آنلاین، اطلاعات تماس کامل و دکمه‌های اقدام</span>
              </div>
            </div>
          </div>

          {/* Form column */}
          <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-center space-y-6">
            
            {/* Tab Selection */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 pb-3 text-sm font-bold transition-all ${
                  authMode === 'login' 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : 'text-slate-400 hover:text-white'
                }`}
              >
                ورود به حساب کاربری
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={`flex-1 pb-3 text-sm font-bold transition-all ${
                  authMode === 'register' 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : 'text-slate-400 hover:text-white'
                }`}
              >
                ایجاد حساب جدید (ثبت نام)
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {authMode === 'login' ? 'خوش آمدید' : 'ثبت نام در کاردینو'}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {authMode === 'login' 
                  ? 'با وارد کردن ایمیل خود، دسترسی آنی به پنل مدیریت پیدا کنید.' 
                  : 'با ایجاد حساب کاربری رایگان، کارت ویزیت دیجیتال هوشمند خود را بسازید.'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                {authError}
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">ایمیل یا شماره موبایل:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="name@example.com یا 09123456789"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">رمز عبور:</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/10"
                >
                  ورود به حساب
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">نام:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: علی"
                      value={registerFirstName}
                      onChange={(e) => setRegisterFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">نام خانوادگی:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: علوی"
                      value={registerLastName}
                      onChange={(e) => setRegisterLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">آدرس ایمیل:</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">شماره موبایل:</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="09123456789"
                    value={registerMobile}
                    onChange={(e) => setRegisterMobile(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">رمز عبور:</label>
                  <input 
                    type="password" 
                    required
                    placeholder="رمز عبور شما (حداقل ۶ کاراکتر)"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10"
                >
                  ایجاد حساب و ورود به پنل
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <span 
                onClick={() => router.push('/')}
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                برگشت به صفحه معرفی سامانه
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Active Subscription metadata helper
  const userSub = subscriptions.find(s => toUUID(s.user_id) === toUUID(user.id) && s.status === 'active');
  const userPlan = userSub ? plans.find(p => toUUID(p.id) === toUUID(userSub.plan_id)) : null;

  // --- RENDER 2: DASHBOARD MAIN SHELL ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans rtl text-right" dir="rtl">
      
      {/* GLOBAL TOPBAR HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div 
              onClick={() => router.push('/')}
              className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl cursor-pointer"
            >
              ک
            </div>
            <div>
              <span className="text-sm font-bold block text-white">پنل هوشمند مدیریت کاردینو</span>
              <p className="text-[10px] text-slate-400 font-medium">پایگاه داده آنلاین امن و پویا</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Quick Session Identity tag */}
            <div className="hidden sm:flex flex-col text-left items-end">
              <span className="text-xs font-bold text-white">{user.name}</span>
              <span className="text-[9px] bg-slate-800 text-slate-300 font-extrabold px-2 py-0.5 rounded-md mt-0.5">
                {user.role === 'customer' ? 'مشتری پلتفرم' : user.role === 'tenant' ? 'نماینده انحصاری' : 'مدیر ارشد سامانه'}
              </span>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 bg-red-950/40 hover:bg-red-900/30 text-red-400 rounded-xl border border-red-900/30 transition-all flex items-center gap-1.5 text-xs font-bold px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج از حساب</span>
            </button>

          </div>

        </div>
      </header>

      <div className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        
        {/* SIDEBAR NAVIGATION CONTROLS */}
        <aside className="md:w-64 shrink-0 flex flex-col gap-4">
          
          {/* Main Workspaces selector */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">پیشخوان کاربری</span>
            
            <div className="flex flex-col gap-1.5">
              
              {/* CUSTOMER TABS */}
              {user.role === 'customer' && (
                <>
                  <button
                    onClick={() => { setEditingCard(null); setActiveTab('cards'); }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'cards' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    کارت‌های ویزیت من
                  </button>

                  <button
                    onClick={() => { setEditingCard(null); setActiveTab('billing'); }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'billing' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    خرید و ارتقای اشتراک
                  </button>

                  <button
                    onClick={() => { setEditingCard(null); setActiveTab('analytics'); }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'analytics' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <BarChart2 className="h-4 w-4" />
                    آمار بازدید کارت‌ها
                  </button>
                </>
              )}

              {/* TENANT TABS */}
              {user.role === 'tenant' && (
                <>
                  <button
                    onClick={() => setActiveTab('tenant-settings')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'tenant-settings' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    برندینگ و اطلاعات نماینده
                  </button>

                  <button
                    onClick={() => setActiveTab('tenant-plans')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'tenant-plans' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Sliders className="h-4 w-4" />
                    مدیریت پلن‌های اشتراک
                  </button>

                  <button
                    onClick={() => setActiveTab('tenant-transactions')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'tenant-transactions' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    تراکنش‌های مشتریان شما
                  </button>
                </>
              )}

              {/* ADMIN TABS */}
              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('admin-tenants')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'admin-tenants' 
                      ? 'bg-amber-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Building className="h-4 w-4" />
                    مدیریت نمایندگان (Tenants)
                  </button>

                  <button
                    onClick={() => setActiveTab('admin-cards')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'admin-cards' 
                      ? 'bg-amber-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    نظارت بر کارت‌های ویزیت
                  </button>

                  <button
                    onClick={() => setActiveTab('admin-users')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'admin-users' 
                      ? 'bg-amber-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    مدیریت کاربران سامانه
                  </button>

                  <button
                    onClick={() => setActiveTab('admin-analytics')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'admin-analytics' 
                      ? 'bg-amber-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <BarChart2 className="h-4 w-4" />
                    آمار کلی بازدیدهای پلتفرم
                  </button>

                  <button
                    onClick={() => setActiveTab('admin-transactions')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'admin-transactions' 
                      ? 'bg-amber-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    کل تراکنش‌های مالی پلتفرم
                  </button>

                  <button
                    onClick={() => setActiveTab('admin-templates')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                      activeTab === 'admin-templates' 
                      ? 'bg-amber-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Palette className="h-4 w-4" />
                    مدیریت قالب‌های ظاهری
                  </button>
                </>
              )}

            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-xs space-y-3.5">
            <span className="font-bold text-white block">وضعیت اشتراک شما:</span>
            {user.role === 'customer' ? (
              userSub ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 block flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5" />
                    اشتراک فعال: {userPlan?.title || 'طرح اختصاصی'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">تا تاریخ {userSub.end_date}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 block">فاقد اشتراک فعال</span>
                  <button 
                    onClick={() => setActiveTab('billing')}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] font-extrabold text-white transition"
                  >
                    خرید اشتراک آنی
                  </button>
                </div>
              )
            ) : (
              <div className="p-3 bg-slate-950 rounded-xl text-slate-400 leading-relaxed text-[10px]">
                پورتال مدیریتی فعال با دسترسی کامل به ابزارهای ویرایش هوشمند.
              </div>
            )}
          </div>

        </aside>

        {/* MAIN PANEL CONTENT SPACE */}
        <main className="flex-grow bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 min-w-0 flex flex-col gap-6 relative">
          
          {/* PAYMENT GATEWAY MODAL (SIMULATED & OFFLINE) */}
          {payingPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]" dir="rtl">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-black text-white">تسویه حساب و فعال‌سازی اشتراک</h4>
                  <button 
                    onClick={() => setPayingPlan(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 transition text-base"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-850 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">پلن انتخابی:</span>
                    <span className="font-extrabold text-white text-sm">{payingPlan.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">مدت زمان اعتبار:</span>
                    <span className="font-bold text-slate-200">{payingPlan.duration_days} روز</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-850">
                    <span className="text-slate-400">مبلغ نهایی قابل پرداخت:</span>
                    <span className="font-black text-amber-400 text-sm">{(payingPlan.price || 0).toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-400">تومان</span></span>
                  </div>
                </div>

                {/* Tab Switcher for Offline vs Online */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedGateway('کارت به کارت (پرداخت آفلاین)');
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      simulatedGateway === 'کارت به کارت (پرداخت آفلاین)'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    کارت به کارت (پرداخت آفلاین)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedGateway('زرین‌پال');
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      simulatedGateway !== 'کارت به کارت (پرداخت آفلاین)'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    درگاه آنلاین شبیه‌ساز
                  </button>
                </div>

                {simulatedGateway === 'کارت به کارت (پرداخت آفلاین)' ? (
                  /* OFFLINE PAYMENT FORM */
                  <div className="space-y-3.5 text-right">
                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-1.5 text-xs text-slate-300">
                      <p className="font-bold text-blue-400">📌 اطلاعات حساب بانکی کاردینو جهت واریز:</p>
                      <div className="flex justify-between">
                        <span>شماره کارت بانک پاسارگاد:</span>
                        <span className="font-mono text-white font-bold tracking-wider">۵۰۲۲-۲۹۱۰-۱۲۳۴-۵۶۷۸</span>
                      </div>
                      <div className="flex justify-between">
                        <span>به نام شرکت:</span>
                        <span className="text-white font-bold">کاردینو دیجیتال سیستم</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed pt-1.5 border-t border-slate-850/40">
                        مبلغ پلن را به شماره کارت فوق انتقال داده و کد رهگیری/شماره سند را در فرم زیر ثبت نمایید تا اشتراک شما توسط ادمین تایید شود.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 block">کد رهگیری / شماره ارجاع تراکنش:</label>
                        <input
                          type="text"
                          required
                          value={offlineRefId}
                          onChange={(e) => setOfflineRefId(e.target.value)}
                          placeholder="مثال: ۹۸۷۶۵۴۳۲۱۰"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 block">تاریخ و ساعت دقیق واریز:</label>
                        <input
                          type="text"
                          required
                          value={offlineDepositTime}
                          onChange={(e) => setOfflineDepositTime(e.target.value)}
                          placeholder="مثال: امروز ساعت ۱۴:۳۰"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 block">توضیحات واریز (نام بانک مبدا یا نام واریزکننده):</label>
                        <textarea
                          rows={2}
                          value={offlineNote}
                          onChange={(e) => setOfflineNote(e.target.value)}
                          placeholder="مثال: واریز از کارت بانک ملی به نام محمد..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SIMULATED ONLINE GATEWAYS */
                  <div className="space-y-4 text-right">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 block">یکی از درگاه‌های شتاب را انتخاب کنید:</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['زرین‌پال', 'زیبال', 'به‌پرداخت ملت', 'سامان کیش'].map((gate) => (
                          <div 
                            key={gate}
                            onClick={() => setSimulatedGateway(gate)}
                            className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                              simulatedGateway === gate 
                              ? 'border-blue-500 bg-blue-500/10 text-white font-bold' 
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/40'
                            }`}
                          >
                            {gate}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-[10px] text-blue-400 leading-relaxed">
                      ⚠️ این یک تراکنش شبیه‌سازی شده کامل است که بلافاصله تایید شده و اشتراک را فعال می‌سازد.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <button 
                    onClick={() => setPayingPlan(null)}
                    className="py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-slate-400 hover:bg-slate-800"
                  >
                    انصراف
                  </button>
                  <button 
                    onClick={handleProcessSimulatedPayment}
                    disabled={isProcessingPayment}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                    <span>ثبت و تایید پرداخت</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
              CUSTOMER MODE: CARDS TAB
             ============================================== */}
          {user.role === 'customer' && activeTab === 'cards' && (
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
                                  src={card.profile_image || 'https://picsum.photos/150/150?random=1'} 
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
                                onClick={() => handleCopyCardLink(card.slug)}
                                className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-[10px] font-bold border border-slate-800 hover:border-slate-750 transition"
                                title="کپی لینک اختصاصی"
                              >
                                {isCopiedSlug === card.slug ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>

                              <a
                                href={`/card/${card.slug}`}
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

                      <button 
                        onClick={handleSaveCard}
                        disabled={isSavingCard}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl text-xs font-black text-white transition flex items-center gap-1.5"
                      >
                        {isSavingCard ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {isSavingCard ? 'در حال ذخیره...' : 'ذخیره نهایی'}
                      </button>
                    </div>

                    {/* Editor Form fields */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 text-xs">
                      
                      {/* Name & Slug */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-400">نام کوچک:</label>
                          <input 
                            type="text" 
                            value={editingCard.first_name} 
                            onChange={(e) => setEditingCard({ ...editingCard, first_name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-400">نام خانوادگی:</label>
                          <input 
                            type="text" 
                            value={editingCard.last_name} 
                            onChange={(e) => setEditingCard({ ...editingCard, last_name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-400">لینک اختصاصی کارت (Slug):</label>
                          <input 
                            type="text" 
                            value={editingCard.slug} 
                            onChange={(e) => setEditingCard({ ...editingCard, slug: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-left font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-400">وضعیت نمایش کارت:</label>
                          <select 
                            value={editingCard.status}
                            onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none"
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
                            value={editingCard.job_title} 
                            onChange={(e) => setEditingCard({ ...editingCard, job_title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-400">نام شرکت / برند:</label>
                          <input 
                            type="text" 
                            value={editingCard.company} 
                            onChange={(e) => setEditingCard({ ...editingCard, company: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none"
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
                                handleFileUpload(e.dataTransfer.files[0], 'profile');
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
                                  handleFileUpload(e.target.files[0], 'profile');
                                }
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
                                  src={editingCard.profile_image} 
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

                        {/* Cover Image Direct Upload */}
                        <div className="space-y-1">
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
                                  src={editingCard.cover_image} 
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
                                <span className="text-[10px] leading-tight">برای بارگذاری کلیک کنید یا بکشید اینجا</span>
                                <span className="text-[8px] text-slate-600">فرمت‌های مجاز: JPG, PNG</span>
                              </div>
                            )}
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
                          value={editingCard.bio} 
                          onChange={(e) => setEditingCard({ ...editingCard, bio: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none"
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
                      <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
                        <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Palette className="h-4 w-4 text-blue-400" />
                          تنظیمات رنگ اختصاصی کارت
                        </h5>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block">رنگ اصلی:</span>
                            <div className="flex gap-1">
                              <input 
                                type="color" 
                                value={editingCard.custom_colors?.primary || '#3b82f6'} 
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), primary: e.target.value }
                                })}
                                className="h-7 w-7 rounded bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={editingCard.custom_colors?.primary || '#3b82f6'}
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), primary: e.target.value }
                                })}
                                className="w-full px-1 py-0.5 bg-slate-950 text-[10px] font-mono rounded"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block">رنگ پس‌زمینه کارت:</span>
                            <div className="flex gap-1">
                              <input 
                                type="color" 
                                value={editingCard.custom_colors?.card_bg || '#ffffff'} 
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), card_bg: e.target.value }
                                })}
                                className="h-7 w-7 rounded bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={editingCard.custom_colors?.card_bg || '#ffffff'}
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), card_bg: e.target.value }
                                })}
                                className="w-full px-1 py-0.5 bg-slate-950 text-[10px] font-mono rounded"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block">رنگ کل لندینگ:</span>
                            <div className="flex gap-1">
                              <input 
                                type="color" 
                                value={editingCard.custom_colors?.background || '#f1f5f9'} 
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), background: e.target.value }
                                })}
                                className="h-7 w-7 rounded bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={editingCard.custom_colors?.background || '#f1f5f9'}
                                onChange={(e) => setEditingCard({
                                  ...editingCard,
                                  custom_colors: { ...(editingCard.custom_colors || {}), background: e.target.value }
                                })}
                                className="w-full px-1 py-0.5 bg-slate-950 text-[10px] font-mono rounded"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

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
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400">نقشه بلد (Balad):</span>
                            <input 
                              type="text" 
                              value={editingCard.balad || ''} 
                              onChange={(e) => setEditingCard({ ...editingCard, balad: e.target.value })}
                              placeholder="https://balad.ir/location?..."
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400">مسیریاب ویز (Waze):</span>
                            <input 
                              type="text" 
                              value={editingCard.waze || ''} 
                              onChange={(e) => setEditingCard({ ...editingCard, waze: e.target.value })}
                              placeholder="https://waze.com/ul?..."
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400">گوگل مپ (Google Maps):</span>
                            <input 
                              type="text" 
                              value={editingCard.googlemap || ''} 
                              onChange={(e) => setEditingCard({ ...editingCard, googlemap: e.target.value })}
                              placeholder="https://maps.google.com/..."
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono"
                            />
                          </div>
                        </div>
                      </div>

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
                                social_links: { ...(editingCard.social_links || {}), phone: e.target.value }
                              })}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px]"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400">تلفن همراه (موبایل):</span>
                            <input 
                              type="text" 
                              value={editingCard.social_links?.mobile || ''} 
                              onChange={(e) => setEditingCard({
                                ...editingCard,
                                social_links: { ...(editingCard.social_links || {}), mobile: e.target.value }
                              })}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px]"
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
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono"
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
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono"
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
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono"
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
                              onChange={(e) => setNewExtraPhone(e.target.value)}
                              className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-[11px]"
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
                              <span>{btn.label} <span className="opacity-40 font-mono">({btn.url})</span></span>
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
                              className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded text-[11px]"
                            />
                            <input 
                              type="text"
                              placeholder="آدرس لینک (URL)"
                              value={newBtnUrl}
                              onChange={(e) => setNewBtnUrl(e.target.value)}
                              className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-left font-mono"
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
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none text-left font-mono text-[11px]"
                        />
                      </div>

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

                      <div className="flex-grow overflow-y-auto bg-slate-900 text-slate-100 flex flex-col font-sans select-none" dir="rtl">
                        {(() => {
                          const templateId = editingCard.template_id;
                          const isClassic = templateId === 'temp-1' || templateId === 'classic' || templateId === '11111111-1111-1111-1111-111111111111';
                          const isNeonGlass = templateId === 'temp-2' || templateId === 'neon-glass' || templateId === '22222222-2222-2222-2222-222222222222';
                          const isMinimal = templateId === 'temp-3' || templateId === 'minimal' || templateId === '33333333-3333-3333-3333-333333333333';
                          const isLuxuryDark = templateId === 'temp-4' || templateId === 'luxury-dark' || templateId === '44444444-4444-4444-4444-444444444444';

                          const primaryColor = editingCard.custom_colors?.primary || '#3b82f6';
                          const secondaryColor = editingCard.custom_colors?.secondary || '#64748b';
                          const cardBg = editingCard.custom_colors?.card_bg || '#ffffff';
                          const textColor = editingCard.custom_colors?.text || '#1e293b';

                          // Check if it is a custom template from Directus (not one of the 4 hardcoded)
                          const isCustomTemplate = !isClassic && !isNeonGlass && !isMinimal && !isLuxuryDark;
                          const activeTemplate = templates.find(t => toUUID(t.id) === toUUID(templateId));

                          return (
                            <>
                              {/* Classic Style */}
                              {isClassic && (
                                <div className="w-full min-h-full bg-slate-100 text-slate-850 flex flex-col font-sans" style={{ backgroundColor: cardBg, color: textColor }}>
                                  {/* Cover photo */}
                                  <div className="h-20 bg-slate-300 relative shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30"></div>
                                    <div className="h-full w-full bg-blue-600/20"></div>
                                  </div>

                                  {/* Profile Pic overlapping cover */}
                                  <div className="px-3 -mt-6 relative z-10 flex justify-between items-end">
                                    <div className="h-14 w-14 rounded-xl border-2 border-white overflow-hidden shadow-sm bg-white">
                                      <img 
                                        src={editingCard.profile_image || 'https://picsum.photos/150/150?random=1'} 
                                        alt="profile" 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span className="text-[7px] bg-slate-200/80 px-1.5 py-0.5 rounded-full text-slate-600 font-bold">
                                      پیش‌نمایش کلاسیک
                                    </span>
                                  </div>

                                  {/* Info */}
                                  <div className="p-3 space-y-3.5 flex-grow">
                                    <div>
                                      <h4 className="text-xs font-black" style={{ color: textColor }}>{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                                      <p className="text-[9px] font-bold mt-0.5" style={{ color: primaryColor }}>{editingCard.job_title || 'سمت شغلی'}</p>
                                      <p className="text-[8px] opacity-70">{editingCard.company || 'نام برند یا شرکت'}</p>
                                    </div>

                                    {editingCard.bio && (
                                      <div className="p-2 bg-white/60 rounded-xl text-[8px] leading-relaxed border border-slate-200/50 opacity-90">
                                        {editingCard.bio}
                                      </div>
                                    )}

                                    {/* Contact grid */}
                                    <div className="grid grid-cols-4 gap-1.5">
                                      {['تلفن', 'واتساپ', 'تلگرام', 'اینستا'].map((social, i) => (
                                        <div key={social} className="flex flex-col items-center justify-center p-1 bg-white/80 rounded-lg border border-slate-100">
                                          {i === 0 && <Phone className="h-3 w-3 text-blue-500" />}
                                          {i === 1 && <MessageCircle className="h-3 w-3 text-emerald-500" />}
                                          {i === 2 && <Send className="h-3 w-3 text-sky-500" />}
                                          {i === 3 && <Instagram className="h-3 w-3 text-pink-500" />}
                                          <span className="text-[6px] font-bold mt-0.5 text-slate-500">{social}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Custom buttons */}
                                    {editingCard.custom_buttons && editingCard.custom_buttons.length > 0 && (
                                      <div className="space-y-1">
                                        {editingCard.custom_buttons.map((btn) => (
                                          <div 
                                            key={btn.id}
                                            className="p-1.5 bg-white rounded-lg border border-slate-200/50 flex items-center justify-between text-[8px] font-bold"
                                            style={{ color: btn.color || primaryColor }}
                                          >
                                            <span>{btn.label}</span>
                                            <span className="opacity-30">➔</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Neon Glass Style */}
                              {isNeonGlass && (
                                <div className="w-full min-h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-slate-100 p-3.5 space-y-3.5 flex flex-col justify-between font-sans">
                                  <div className="space-y-3.5 pt-2 flex-grow">
                                    <div className="flex justify-between items-center text-[7px]">
                                      <span className="px-1.5 py-0.5 bg-white/10 rounded-full text-slate-300">
                                        پیش‌نمایش نئون
                                      </span>
                                      <span className="text-purple-400 font-extrabold uppercase text-[6px]">NEON GLASS</span>
                                    </div>

                                    {/* Profile Visual */}
                                    <div className="flex flex-col items-center text-center space-y-1.5">
                                      <div className="relative">
                                        <div className="absolute -inset-1 rounded-full blur bg-gradient-to-r from-purple-500 to-pink-500 opacity-40 animate-pulse"></div>
                                        <div className="h-14 w-14 rounded-full border border-white/30 overflow-hidden relative bg-slate-950">
                                          <img 
                                            src={editingCard.profile_image || 'https://picsum.photos/150/150?random=1'} 
                                            alt="profile" 
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="text-xs font-black text-white">{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                                        <p className="text-[8px] font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mt-0.5">{editingCard.job_title || 'سمت شغلی'}</p>
                                      </div>
                                    </div>

                                    {editingCard.bio && (
                                      <div className="p-2 bg-white/5 rounded-xl text-[7px] leading-relaxed border border-white/10 text-slate-300">
                                        {editingCard.bio}
                                      </div>
                                    )}

                                    {/* Neon Grid */}
                                    <div className="grid grid-cols-4 gap-1.5">
                                      {['تلفن', 'واتساپ', 'تلگرام', 'اینستا'].map((social, i) => (
                                        <div key={social} className="flex flex-col items-center justify-center p-1 bg-white/5 border border-white/10 rounded-lg">
                                          {i === 0 && <Phone className="h-3 w-3 text-blue-400" />}
                                          {i === 1 && <MessageCircle className="h-3 w-3 text-emerald-400" />}
                                          {i === 2 && <Send className="h-3 w-3 text-sky-400" />}
                                          {i === 3 && <Instagram className="h-3 w-3 text-pink-400" />}
                                          <span className="text-[6px] font-bold mt-0.5 text-slate-400">{social}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Custom buttons */}
                                    {editingCard.custom_buttons && editingCard.custom_buttons.length > 0 && (
                                      <div className="space-y-1">
                                        {editingCard.custom_buttons.map((btn) => (
                                          <div 
                                            key={btn.id}
                                            className="p-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between text-[8px] font-bold text-white shadow-sm"
                                          >
                                            <span style={{ color: btn.color || '#a855f7' }}>{btn.label}</span>
                                            <span className="opacity-40">➔</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Minimal Style */}
                              {isMinimal && (
                                <div className="w-full min-h-full bg-zinc-50 text-zinc-900 p-3.5 space-y-3.5 flex flex-col justify-between font-sans" style={{ backgroundColor: cardBg, color: textColor }}>
                                  <div className="space-y-3.5 pt-2 flex-grow">
                                    <div className="flex justify-between items-center text-[7px] opacity-50 uppercase text-[6px]">
                                      <span>پیش‌نمایش مینیمال</span>
                                      <span>MINIMAL</span>
                                    </div>

                                    {/* Portrait Card */}
                                    <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-zinc-200 shadow-sm" style={{ backgroundColor: cardBg === '#ffffff' ? '#ffffff' : cardBg }}>
                                      <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-100 shrink-0">
                                        <img 
                                          src={editingCard.profile_image || 'https://picsum.photos/150/150?random=1'} 
                                          alt="profile" 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="text-right">
                                        <h4 className="text-xs font-black" style={{ color: textColor }}>{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                                        <p className="text-[8px] font-bold" style={{ color: primaryColor }}>{editingCard.job_title || 'سمت شغلی'}</p>
                                        <p className="text-[7px] opacity-60">{editingCard.company || 'نام برند یا شرکت'}</p>
                                      </div>
                                    </div>

                                    {editingCard.bio && (
                                      <p className="text-[7.5px] leading-relaxed opacity-75 border-r-2 border-zinc-300 pr-2" style={{ borderColor: primaryColor }}>
                                        {editingCard.bio}
                                      </p>
                                    )}

                                    {/* Minimal contact list */}
                                    <div className="space-y-1">
                                      <span className="text-[7px] font-bold opacity-40 block">ارتباط سریع</span>
                                      <div className="flex items-center gap-2 py-0.5 text-[8px] border-b border-zinc-100">
                                        <span className="p-0.5 bg-zinc-100 rounded flex items-center justify-center"><Phone className="h-2 w-2 text-zinc-600" /></span>
                                        <span className="font-sans opacity-80">{editingCard.social_links?.phone || '۰۹۱۲۳۴۵۶۷۸۹'}</span>
                                      </div>
                                    </div>

                                    {/* Custom buttons */}
                                    {editingCard.custom_buttons && editingCard.custom_buttons.length > 0 && (
                                      <div className="space-y-1 pt-1">
                                        {editingCard.custom_buttons.map((btn) => (
                                          <div 
                                            key={btn.id}
                                            className="py-1 px-2 border rounded-md flex items-center justify-between text-[7.5px]"
                                            style={{ borderColor: primaryColor, color: btn.color || textColor }}
                                          >
                                            <span>{btn.label}</span>
                                            <span>➔</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Luxury VIP Style */}
                              {isLuxuryDark && (
                                <div className="w-full min-h-full bg-[#0c0a09] text-amber-100 p-3.5 space-y-3.5 flex flex-col justify-between border border-amber-500/20 font-sans">
                                  <div className="space-y-3.5 pt-2 flex-grow">
                                    <div className="flex justify-between items-center text-[7px]">
                                      <span className="px-1.5 py-0.5 bg-amber-500/10 rounded-full text-amber-400 font-bold border border-amber-500/20">
                                        پیش‌نمایش لوکس
                                      </span>
                                      <span className="text-amber-500">★</span>
                                    </div>

                                    {/* Centered Luxury Avatar */}
                                    <div className="flex flex-col items-center text-center space-y-1.5">
                                      <div className="h-14 w-14 rounded-full border-2 border-amber-500 overflow-hidden shadow-lg p-0.5 bg-[#0c0a09]">
                                        <img 
                                          src={editingCard.profile_image || 'https://picsum.photos/150/150?random=1'} 
                                          alt="profile" 
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-black text-amber-100">{editingCard.first_name || 'نام'} {editingCard.last_name || 'خانوادگی'}</h4>
                                        <p className="text-[8px] font-bold text-amber-400 mt-0.5">{editingCard.job_title || 'سمت شغلی'}</p>
                                      </div>
                                    </div>

                                    {editingCard.bio && (
                                      <p className="text-[7.5px] leading-relaxed text-stone-300 text-center px-1">
                                        {editingCard.bio}
                                      </p>
                                    )}

                                    {/* Luxury Gold Buttons */}
                                    <div className="grid grid-cols-4 gap-1.5">
                                      {['تلفن', 'واتساپ', 'تلگرام', 'اینستا'].map((social, i) => (
                                        <div key={social} className="flex flex-col items-center justify-center p-1 bg-stone-900 border border-amber-500/20 rounded-lg text-amber-300">
                                          {i === 0 && <Phone className="h-3 w-3 text-amber-500" />}
                                          {i === 1 && <MessageCircle className="h-3 w-3 text-emerald-500" />}
                                          {i === 2 && <Send className="h-3 w-3 text-sky-400" />}
                                          {i === 3 && <Instagram className="h-3 w-3 text-pink-500" />}
                                          <span className="text-[6px] font-bold mt-0.5 text-stone-400">{social}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Custom buttons */}
                                    {editingCard.custom_buttons && editingCard.custom_buttons.length > 0 && (
                                      <div className="space-y-1">
                                        {editingCard.custom_buttons.map((btn) => (
                                          <div 
                                            key={btn.id}
                                            className="p-1.5 bg-stone-900 border border-amber-500/30 rounded-lg flex items-center justify-between text-[8px] font-bold text-amber-300"
                                          >
                                            <span>{btn.label}</span>
                                            <span className="opacity-40">➔</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Fallback Custom Template */}
                              {isCustomTemplate && (() => {
                                const tSchema = activeTemplate?.schema || {};
                                const isDarkTheme = tSchema.theme === 'dark';
                                const tColors = tSchema.colors || {};
                                const tLayout = tSchema.layout || {};

                                const pColor = tColors.primary || '#8d5b4c';
                                const sColor = tColors.secondary || '#f4ece1';
                                const bColor = tColors.background || '#faf6f0';
                                const txtColor = tColors.text || '#2d221e';
                                const txtSecColor = tColors.text_secondary || '#6e5a53';
                                const customCardBg = isDarkTheme ? '#18181b' : '#ffffff';
                                
                                const isCircleAvatar = (tLayout.avatar_shape || 'circle') === 'circle';
                                const isSplitHeader = tLayout.header_style === 'split';

                                return (
                                  <div 
                                    className="w-full min-h-full transition-all p-3.5 space-y-3.5 flex flex-col justify-between text-right font-sans"
                                    style={{ 
                                      backgroundColor: customCardBg, 
                                      color: txtColor
                                    }}
                                  >
                                    <div className="space-y-3.5 flex-grow">
                                      <div className="flex justify-between items-center text-[7px]">
                                        <span className="px-1.5 py-0.5 rounded-full text-[6px] font-bold" style={{ backgroundColor: sColor, color: pColor }}>
                                          {activeTemplate?.name || 'قالب اختصاصی'}
                                        </span>
                                      </div>

                                      {isSplitHeader ? (
                                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                                          <div className="h-10 w-10 overflow-hidden border shrink-0" style={{ borderColor: pColor, borderRadius: isCircleAvatar ? '9999px' : '6px' }}>
                                            <img 
                                              src={editingCard.profile_image || 'https://picsum.photos/150/150?random=1'} 
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
                                              src={editingCard.profile_image || 'https://picsum.photos/150/150?random=1'} 
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

                                      {editingCard.bio && (
                                        <p className="text-[7.5px] leading-relaxed text-center" style={{ color: txtSecColor }}>
                                          {editingCard.bio}
                                        </p>
                                      )}

                                      {/* Mini Contact Buttons */}
                                      <div className="grid grid-cols-4 gap-1.5 pt-2">
                                        {['تلفن', 'واتساپ', 'تلگرام', 'سایت'].map((social, i) => (
                                          <div key={social} className="flex flex-col items-center justify-center p-1 rounded-md border text-[7px]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                            {i === 0 && <Phone className="h-3 w-3 text-blue-500" style={{ color: pColor }} />}
                                            {i === 1 && <MessageCircle className="h-3 w-3 text-emerald-500" style={{ color: pColor }} />}
                                            {i === 2 && <Send className="h-3 w-3 text-sky-500" style={{ color: pColor }} />}
                                            {i === 3 && <Globe className="h-3 w-3 text-zinc-500" style={{ color: pColor }} />}
                                            <span className="text-[5.5px] font-bold mt-0.5" style={{ color: txtSecColor }}>{social}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ==============================================
              CUSTOMER MODE: BILLING TAB
             ============================================== */}
          {user.role === 'customer' && activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-white">شارژ کیف پول و ارتقای طرح اشتراک</h2>
                <p className="text-xs text-slate-400 mt-1">با خرید اشتراک، سقف ساخت کارت و تم‌های اختصاصی برای شما افزایش می‌یابد.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {plans.filter(p => toUUID(p.tenant_id) === toUUID('t-1')).map((plan) => (
                  <div key={plan.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between gap-5 hover:border-blue-600/40 transition">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-white text-sm">{plan.title}</h4>
                        <span className="text-[10px] text-slate-500">مدت دوره: {plan.duration_days} روز</span>
                      </div>

                      <div className="py-2.5 border-t border-b border-slate-900/60 flex items-baseline gap-1">
                        {plan.price === 0 ? (
                          <span className="text-xl font-bold text-emerald-400">رایگان</span>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-white">{(plan.price).toLocaleString('fa-IR')}</span>
                            <span className="text-[10px] text-slate-400 font-bold">تومان</span>
                          </>
                        )}
                      </div>

                      <ul className="space-y-2 text-[10px] text-slate-400 leading-relaxed font-medium">
                        {(plan.features || []).map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleInitiatePayment(plan)}
                      disabled={plan.price === 0}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                        plan.price === 0 
                        ? 'bg-slate-900 text-slate-600 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {plan.price === 0 ? 'پیش‌فرض ثبت‌نام' : 'خرید و ارتقای پلن'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Transactions list */}
              <div className="pt-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="h-4.5 w-4.5 text-blue-400" />
                  تاریخچه فاکتورها و تراکنش‌های بانکی شما:
                </h3>

                <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] font-bold">
                      <tr>
                        <th className="p-3">مبلغ پرداختی</th>
                        <th className="p-3">درگاه بانکی</th>
                        <th className="p-3">کد پیگیری مرجع</th>
                        <th className="p-3">تاریخ پرداخت</th>
                        <th className="p-3">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 text-slate-300">
                      {transactions.filter(t => toUUID(t.user_id) === toUUID(user.id)).map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold">{tx.amount.toLocaleString('fa-IR')} تومان</td>
                          <td className="p-3">{tx.gateway}</td>
                          <td className="p-3 font-mono">{tx.ref_id}</td>
                          <td className="p-3 opacity-70">{tx.created_at.split('T')[0]}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded-full">
                              موفقیت‌آمیز
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==============================================
              CUSTOMER MODE: ANALYTICS TAB
             ============================================== */}
          {user.role === 'customer' && activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-white">گزارشات و آنالیز ترافیک بازدیدکنندگان</h2>
                <p className="text-xs text-slate-400 mt-1">آمار تحلیلی مربوط به مرورگر، منابع ترافیک و ورودی‌های کارت‌های دیجیتال شما.</p>
              </div>

              {cards.length === 0 ? (
                <p className="text-slate-500 text-xs py-6 text-center">هیچ کارت فعالی برای دریافت آمار بازدید وجود ندارد.</p>
              ) : (
                <div className="space-y-8">
                  {cards.map((card) => {
                    const cardLogs = analytics.filter(a => toUUID(a.card_id) === toUUID(card.id));
                    
                    // Device counts helper
                    const mobileCount = cardLogs.filter(l => l.device.includes('موبایل')).length;
                    const desktopCount = cardLogs.filter(l => l.device.includes('دسکتاپ')).length;
                    const totalVisits = cardLogs.length || card.views_count || 0;

                    // Referrers calculation
                    const refCounts: Record<string, number> = {};
                    cardLogs.forEach(l => {
                      refCounts[l.referrer] = (refCounts[l.referrer] || 0) + 1;
                    });

                    return (
                      <div key={card.id} className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                          <span className="font-bold text-white text-sm">{card.first_name} {card.last_name} ({card.slug}/)</span>
                          <span className="text-xs font-semibold text-blue-400">{totalVisits} بازدید کل</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                          
                          {/* Device Breakdown Visual */}
                          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/60 space-y-3">
                            <span className="font-bold text-white block">نوع دستگاه بازدیدکنندگان:</span>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px] text-slate-400">
                                <span>موبایل: {mobileCount} بازدید ({totalVisits > 0 ? Math.round((mobileCount/totalVisits)*100) : 0}٪)</span>
                                <span>دسکتاپ: {desktopCount} بازدید ({totalVisits > 0 ? Math.round((desktopCount/totalVisits)*100) : 0}٪)</span>
                              </div>

                              {/* Progress bar visual */}
                              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                                <div 
                                  className="h-full bg-blue-500 transition-all duration-500" 
                                  style={{ width: `${totalVisits > 0 ? (mobileCount / totalVisits) * 100 : 50}%` }}
                                ></div>
                                <div 
                                  className="h-full bg-indigo-500 transition-all duration-500" 
                                  style={{ width: `${totalVisits > 0 ? (desktopCount / totalVisits) * 100 : 50}%` }}
                                ></div>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">اکثریت بازدیدکنندگان با گوشی‌های تلفن همراه کارت شما را اسکن یا لمس کرده‌اند.</p>
                            </div>
                          </div>

                          {/* Referrer traffic sources list */}
                          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/60 space-y-3">
                            <span className="font-bold text-white block">منابع ارجاع و کلیک ترافیک:</span>
                            <div className="space-y-2">
                              {Object.entries(refCounts).length === 0 ? (
                                <p className="text-slate-500 text-[10px] py-2">اطلاعاتی ثبت نشده (ترافیک ورودی مستقیم)</p>
                              ) : (
                                Object.entries(refCounts).map(([ref, count]) => (
                                  <div key={ref} className="flex justify-between items-center py-1 border-b border-slate-850/60 last:border-b-0">
                                    <span className="font-bold text-slate-300">{ref}</span>
                                    <span className="font-mono text-blue-400 font-bold">{count} کلیک</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ==============================================
              TENANT MODE: SETTINGS TAB
             ============================================== */}
          {user.role === 'tenant' && activeTab === 'tenant-settings' && selectedTenant && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-white">تنظیمات پورتال و برندینگ نمایندگی (White-Label)</h2>
                <p className="text-xs text-slate-400 mt-1">هویت بصری نمایندگی، دامنه و قوانین کارمزد خود را در این بخش سفارشی‌سازی کنید.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">نام نمایندگی / پرتال تجاری:</label>
                    <input 
                      type="text" 
                      value={selectedTenant.name} 
                      onChange={(e) => setSelectedTenant({ ...selectedTenant, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">دامنه اختصاصی متصل شده (Custom Domain):</label>
                    <input 
                      type="text" 
                      value={selectedTenant.custom_domain || ''} 
                      onChange={(e) => setSelectedTenant({ ...selectedTenant, custom_domain: e.target.value })}
                      placeholder="e.g. card.mybrand.ir"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-left font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">شعار بازاریابی پرتال:</label>
                    <input 
                      type="text" 
                      value={selectedTenant.settings?.slogan || ''} 
                      onChange={(e) => setSelectedTenant({ 
                        ...selectedTenant, 
                        settings: { ...(selectedTenant.settings || {}), slogan: e.target.value } 
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">رنگ سازمانی اختصاصی هدر (Hex Code):</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={selectedTenant.brand_color || '#3b82f6'} 
                        onChange={(e) => setSelectedTenant({ ...selectedTenant, brand_color: e.target.value })}
                        className="h-9 w-9 rounded cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={selectedTenant.brand_color || '#3b82f6'} 
                        onChange={(e) => setSelectedTenant({ ...selectedTenant, brand_color: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-white block">وضعیت نمایندگی در سیستم</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="font-bold text-emerald-400">نمایندگی فعال و مجاز به فروش اشتراک</span>
                    </div>

                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      کارمزد پایه کسر شده توسط سیستم مبدا به عنوان پورسانت زیرساخت برابر با <span className="text-white font-bold">{selectedTenant.settings?.commission_rate || 10}٪</span> تراکنش‌های دریافتی است. مابقی وجه به کیف پول نمایندگی شما انتقال می‌یابد.
                    </p>
                  </div>

                  <button 
                    onClick={handleSaveTenantSettings}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
                  >
                    ذخیره و هماهنگ‌سازی تنظیمات
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ==============================================
              TENANT MODE: PLANS TAB
             ============================================== */}
          {user.role === 'tenant' && activeTab === 'tenant-plans' && (
            <div className="space-y-6">
              
              {!editingPlan ? (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <h2 className="text-xl font-bold text-white">تعریف و تنظیم پلن‌های تعرفه‌ای اشتراک</h2>
                      <p className="text-xs text-slate-400 mt-1">پلن‌های تجاری و رایگان نمایندگی خود را ایجاد و اصلاح نمایید.</p>
                    </div>

                    <button
                      onClick={handleAddNewPlan}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-extrabold text-white transition flex items-center gap-1.5 shadow"
                    >
                      <Plus className="h-4 w-4" />
                      تعریف پلن فروش جدید
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {plans.filter(p => toUUID(p.tenant_id) === toUUID(user.tenant_id)).map((plan) => (
                      <div key={plan.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-sm">{plan.title}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              plan.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {plan.is_active ? 'فعال در نمایندگی' : 'غیرفعال'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1">مدت زمان اعتبار: {plan.duration_days} روز</span>
                          <p className="text-emerald-400 font-extrabold text-xs mt-2">{plan.price.toLocaleString('fa-IR')} تومان</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPlan(plan)}
                            className="flex-grow py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-[10px] font-bold border border-slate-800 hover:border-slate-750 transition"
                          >
                            ویرایش جزئیات پلن
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-6 max-w-lg mx-auto text-xs">
                  <h4 className="text-sm font-bold text-white border-b border-slate-850 pb-3">ویرایشگر پلن فروش نمایندگی</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">عنوان طرح فروش:</span>
                      <input 
                        type="text" 
                        value={editingPlan.title} 
                        onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-400">قیمت طرح (تومان):</span>
                        <input 
                          type="number" 
                          value={editingPlan.price} 
                          onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-left font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-400">مدت اعتبار طرح (روز):</span>
                        <input 
                          type="number" 
                          value={editingPlan.duration_days} 
                          onChange={(e) => setEditingPlan({ ...editingPlan, duration_days: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-left font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-400 block">وضعیت در پرتال:</span>
                      <select
                        value={editingPlan.is_active ? 'true' : 'false'}
                        onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.value === 'true' })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
                      >
                        <option value="true">طرح فعال و عمومی برای خرید</option>
                        <option value="false">غیرفعال کردن موقت طرح</option>
                      </select>
                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button 
                      onClick={() => setEditingPlan(null)}
                      className="py-2.5 rounded-xl border border-slate-800 bg-slate-950 font-bold"
                    >
                      لغو و خروج
                    </button>
                    <button 
                      onClick={handleSavePlan}
                      className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white"
                    >
                      ثبت نهایی پلن در سیستم
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==============================================
              TENANT MODE: TRANSACTIONS TAB
             ============================================== */}
          {user.role === 'tenant' && activeTab === 'tenant-transactions' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-white">تراکنش‌های مالی و گزارش پرداخت نمایندگی</h2>
                <p className="text-xs text-slate-400 mt-1">لیست تراکنش‌های ثبت‌شده توسط مشتریان تحت پورتال نمایندگی شما.</p>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] font-bold">
                    <tr>
                      <th className="p-3">مبلغ پرداختی</th>
                      <th className="p-3">نام کاربر مشتری</th>
                      <th className="p-3">درگاه بانکی واسط</th>
                      <th className="p-3">کد رهگیری شتاب</th>
                      <th className="p-3">تاریخ تراکنش</th>
                      <th className="p-3">پورسانت شما</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-300">
                    {transactions.filter(t => toUUID(t.tenant_id) === toUUID(user.tenant_id)).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold">{tx.amount.toLocaleString('fa-IR')} تومان</td>
                        <td className="p-3">علی علوی (u-1)</td>
                        <td className="p-3">{tx.gateway}</td>
                        <td className="p-3 font-mono">{tx.ref_id}</td>
                        <td className="p-3 opacity-70">{tx.created_at.split('T')[0]}</td>
                        <td className="p-3 font-bold text-emerald-400">
                          {Math.round(tx.amount * 0.9).toLocaleString('fa-IR')} تومان (۹۰٪)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              ADMIN MODE: ALL TENANTS TAB
             ============================================== */}
          {user.role === 'admin' && activeTab === 'admin-tenants' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-white">مدیریت کل نمایندگان و کارمزد سامانه (Tenants Overview)</h2>
                <p className="text-xs text-slate-400 mt-1">نظارت بر عملکرد پورتال‌ها، تایید نمایندگی‌های جدید و ویرایش کارمزد سامانه.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {tenants.map((ten) => {
                  const tenantTxs = transactions.filter(t => toUUID(t.tenant_id) === toUUID(ten.id));
                  const totalRevenue = tenantTxs.reduce((sum, tx) => sum + tx.amount, 0);

                  return (
                    <div key={ten.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between gap-5">
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-white text-sm">{ten.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            ten.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {ten.status === 'active' ? 'مجاز / فعال' : 'غیرفعال'}
                          </span>
                        </div>

                        <div className="space-y-1.5 opacity-80 leading-relaxed">
                          <p>دامنه پرتال: <span className="font-mono text-blue-400">{ten.custom_domain || 'عدم اتصال'}</span></p>
                          <p>کارمزد دریافتی پلتفرم شما: <span className="text-amber-400 font-bold">{ten.settings?.commission_rate || 10}٪</span></p>
                          <p className="font-bold text-white">درآمد کلی پرتال: {totalRevenue.toLocaleString('fa-IR')} تومان</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const newStatus = ten.status === 'active' ? 'inactive' : 'active';
                            const updated = tenants.map(t => t.id === ten.id ? { ...t, status: newStatus as any } : t);
                            setTenants(updated);
                            try {
                              await dbService.saveTenant({ ...ten, status: newStatus as any });
                              await refreshData();
                              alert('وضعیت تایید و دسترسی نماینده تغییر یافت.');
                            } catch (err: any) {
                              alert('خطا در ثبت وضعیت نماینده در سیستم: ' + err.message);
                            }
                          }}
                          className="flex-grow py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-[10px] font-bold border border-slate-800 transition text-amber-400"
                        >
                          تغییر لایسنس وضعیت
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==============================================
              ADMIN MODE: ALL TRANSACTIONS TAB
             ============================================== */}
          {user.role === 'admin' && activeTab === 'admin-transactions' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-white">گزارش امور مالی و درآمد کل سامانه کاردینو</h2>
                <p className="text-xs text-slate-400 mt-1">مشاهده تمامی پرداخت‌های ثبت‌شده مشتریان درگاه‌های کل کشور به تفکیک پرتال همراه با تایید پرداخت‌های آفلاین.</p>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] font-bold">
                    <tr>
                      <th className="p-3">مبلغ کل تراکنش</th>
                      <th className="p-3">پرتال نماینده</th>
                      <th className="p-3">درگاه پرداخت</th>
                      <th className="p-3">کد رهگیری / مرجع</th>
                      <th className="p-3">تاریخ ثبت</th>
                      <th className="p-3">وضعیت</th>
                      <th className="p-3">جزئیات آفلاین / عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-300">
                    {transactions.map((tx) => {
                      const associatedTenant = tenants.find(t => toUUID(t.id) === toUUID(tx.tenant_id));
                      const isOffline = tx.payload?.offline === true || tx.gateway?.includes('آفلاین');
                      return (
                        <tr key={tx.id} className="hover:bg-slate-900/40 align-middle">
                          <td className="p-3 font-bold text-white">{tx.amount.toLocaleString('fa-IR')} تومان</td>
                          <td className="p-3">{associatedTenant?.name || 'سایت اصلی کاردینو'}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 font-medium">
                              {tx.gateway}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-200">{tx.ref_id}</td>
                          <td className="p-3 opacity-70">{tx.created_at ? tx.created_at.split('T')[0] : '-'}</td>
                          <td className="p-3">
                            {tx.status === 'success' && (
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-full text-[9px]">
                                ✓ موفق و تایید شده
                              </span>
                            )}
                            {tx.status === 'failed' && (
                              <span className="px-2.5 py-1 bg-red-500/10 text-red-400 font-bold rounded-full text-[9px]">
                                ✕ رد شده
                              </span>
                            )}
                            {tx.status === 'pending' && (
                              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold rounded-full text-[9px] animate-pulse">
                                ⏳ در انتظار تایید
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {isOffline ? (
                              <div className="space-y-2 py-1">
                                <div className="p-2 bg-slate-900 rounded-lg text-[10px] text-slate-400 space-y-1">
                                  <p>🕰️ ساعت واریز: <span className="text-slate-200 font-bold">{tx.payload?.deposit_time || 'نامشخص'}</span></p>
                                  {tx.payload?.note && <p>✍️ یادداشت: <span className="text-slate-200">{tx.payload?.note}</span></p>}
                                  {tx.payload?.plan_title && <p>📦 پلن درخواستی: <span className="text-blue-400 font-bold">{tx.payload?.plan_title}</span></p>}
                                </div>
                                {tx.status === 'pending' && (
                                  <div className="flex gap-1.5 pt-1">
                                    <button
                                      onClick={() => handleAdminVerifyOfflinePayment(tx, true)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[9px] transition"
                                    >
                                      تایید و فعال‌سازی
                                    </button>
                                    <button
                                      onClick={() => handleAdminVerifyOfflinePayment(tx, false)}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[9px] transition"
                                    >
                                      رد تراکنش
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              ADMIN MODE: TEMPLATE MANAGEMENT TAB
             ============================================== */}
          {user.role === 'admin' && activeTab === 'admin-templates' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">مدیریت قالب‌های اختصاصی کاردینو</h2>
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
                            <label className="block text-slate-400 mb-1 text-[10px]">رنگ ثانویه (بک‌گراند دکمه)</label>
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
                            <label className="block text-slate-400 mb-1 text-[10px]">پس‌زمینه کل کارت</label>
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
                            <label className="block text-slate-400 mb-1 text-[10px]">رنگ متن توضیحات</label>
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

                      {/* Typography */}
                      <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                        <div>
                          <label className="block text-slate-400 mb-1 text-[10px]">خانواده فونت فارسی</label>
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
                                <span className="font-bold" style={{ color: pColor }}>کارت هوشمند</span>
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
                                    <h4 className="text-[10px] font-black" style={{ fontSize: tSchema.typography?.title_size || '11px' }}>دکتر پارسا حسینی</h4>
                                    <p className="text-[8px] font-bold" style={{ color: pColor }}>بنیان‌گذار هولدینگ فناوری</p>
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
                                    <h4 className="text-[11px] font-black" style={{ fontSize: tSchema.typography?.title_size || '12px' }}>دکتر پارسا حسینی</h4>
                                    <p className="text-[8px] font-bold mt-0.5" style={{ color: pColor }}>بنیان‌گذار هولدینگ فناوری</p>
                                  </div>
                                </div>
                              )}

                              <p className="text-[7px] leading-relaxed text-center" style={{ color: txtSecColor, fontSize: tSchema.typography?.body_size || '8px' }}>
                                طراحی حرفه‌ای، خلاقانه و متمایز برند شخصی با راهکارهای نوین ارتباطی دیجیتال.
                              </p>

                              {/* Contacts */}
                              <div className="grid grid-cols-4 gap-1.5">
                                {['تلفن', 'اینستاگرام', 'تلگرام', 'واتساپ'].map((soc, i) => (
                                  <div key={soc} className="flex flex-col items-center justify-center p-1 rounded-lg border text-[7px]" style={{ borderColor: sColor, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                    {i === 0 && <Phone className="h-3 w-3 text-blue-500" style={{ color: pColor }} />}
                                    {i === 1 && <Instagram className="h-3 w-3 text-pink-500" style={{ color: pColor }} />}
                                    {i === 2 && <Send className="h-3 w-3 text-sky-500" style={{ color: pColor }} />}
                                    {i === 3 && <MessageCircle className="h-3 w-3 text-emerald-500" style={{ color: pColor }} />}
                                    <span className="text-[6px] font-bold mt-0.5" style={{ color: txtSecColor }}>{soc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button className="w-full py-2 font-bold text-white text-[8px] rounded-lg transition hover:opacity-90" style={{ backgroundColor: pColor }}>
                              ذخیره مخاطب
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                /* Templates Table list */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-xs">
                  <div className="p-4 bg-slate-950 border-b border-slate-800 font-bold text-slate-300">
                    لیست قالب‌های بارگذاری شده در سیستم ({templates.length} قالب)
                  </div>
                  <table className="w-full text-right">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] font-bold">
                      <tr>
                        <th className="p-3">نام قالب</th>
                        <th className="p-3">شناسه یکتا (slug)</th>
                        <th className="p-3">نوع دسترسی</th>
                        <th className="p-3">تم بصری</th>
                        <th className="p-3">ابعاد آواتار</th>
                        <th className="p-3 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 text-slate-300">
                      {templates.map((temp) => {
                        const schema = temp.schema || {};
                        return (
                          <tr key={temp.id} className="hover:bg-slate-850/20">
                            <td className="p-3 font-bold flex items-center gap-2">
                              <span 
                                className="h-3 w-3 rounded-full border border-white/20" 
                                style={{ backgroundColor: schema.colors?.primary || '#8d5b4c' }}
                              />
                              {temp.name}
                            </td>
                            <td className="p-3 font-mono text-amber-500">{temp.slug}</td>
                            <td className="p-3">
                              {temp.is_premium ? (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[9px] font-bold">VIP (طلایی)</span>
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
          )}

          {/* ==============================================
              ADMIN MODE: ALL CARDS MONITORING TAB
             ============================================== */}
          {user.role === 'admin' && activeTab === 'admin-cards' && (() => {
            const filteredAdminCards = cards.filter(card => {
              const term = adminCardsSearch.toLowerCase().trim();
              if (!term) return true;
              return (
                card.first_name?.toLowerCase().includes(term) ||
                card.last_name?.toLowerCase().includes(term) ||
                card.job_title?.toLowerCase().includes(term) ||
                card.company?.toLowerCase().includes(term) ||
                card.slug?.toLowerCase().includes(term)
              );
            });

            return (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">نظارت و مدیریت کارت‌های ویزیت دیجیتال کاربران</h2>
                    <p className="text-xs text-slate-400 mt-1">مشاهده، فیلتر و حذف تمامی کارت‌های ساخته‌شده در کل سامانه کاردینو.</p>
                  </div>
                  <div className="text-xs bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 font-bold text-slate-300">
                    تعداد کل کارت‌ها: <span className="text-blue-400">{cards.length}</span>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={adminCardsSearch}
                    onChange={(e) => setAdminCardsSearch(e.target.value)}
                    placeholder="جستجو در نام، نام خانوادگی، شغل، شرکت یا آدرس Slug کارت..."
                    className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {filteredAdminCards.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl space-y-3">
                    <LayoutGrid className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="text-slate-500 text-xs font-bold">هیچ کارت ویزیتی با این مشخصات یافت نشد!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredAdminCards.map((card) => {
                      const template = templates.find(t => toUUID(t.id) === toUUID(card.template_id));
                      const cardTenant = tenants.find(t => toUUID(t.id) === toUUID(card.tenant_id));
                      return (
                        <div 
                          key={card.id} 
                          className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden p-4 flex flex-col justify-between gap-4 hover:border-blue-500/40 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                              <img 
                                src={card.profile_image || 'https://picsum.photos/150/150?random=1'} 
                                alt="avatar" 
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-white text-xs truncate">{card.first_name} {card.last_name}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black shrink-0 ${
                                  card.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {card.status === 'published' ? 'انتشار' : 'پیش‌نویس'}
                                </span>
                              </div>
                              <p className="text-[10px] text-blue-400 font-semibold truncate">{card.job_title || 'بدون عنوان شغلی'}</p>
                              <p className="text-[9px] text-slate-500 truncate">{card.company || 'نام سازمان ثبت نشده'}</p>
                            </div>
                          </div>

                          <div className="py-2.5 border-t border-b border-slate-900 flex flex-col gap-1.5 text-[10px] text-slate-400">
                            <div className="flex justify-between">
                              <span>آدرس اختصاصی:</span>
                              <span className="font-mono text-blue-400 font-bold">{card.slug}/</span>
                            </div>
                            <div className="flex justify-between">
                              <span>قالب ظاهری:</span>
                              <span className="text-slate-200 font-bold">{template?.name || 'کلاسیک'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>نماینده / پرتال:</span>
                              <span className="text-amber-500 font-bold">{cardTenant?.name || 'سایت اصلی کاردینو'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>آمار بازدید:</span>
                              <span className="text-emerald-400 font-bold">{card.views_count?.toLocaleString('fa-IR') || 0} بازدید</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              onClick={() => {
                                setEditingCard(card);
                                setActiveTab('cards');
                              }}
                              className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg text-[9px] font-bold border border-slate-800 hover:border-slate-750 transition flex items-center justify-center gap-1"
                            >
                              <Edit2 className="h-2.5 w-2.5 text-blue-400" />
                              ویرایش
                            </button>

                            <button
                              onClick={() => handleCopyCardLink(card.slug)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 hover:border-slate-750 transition"
                              title="کپی لینک کارت"
                            >
                              {isCopiedSlug === card.slug ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>

                            <a
                              href={`/card/${card.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 hover:border-slate-750 transition text-blue-400"
                              title="مشاهده آنلاین"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>

                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-1.5 bg-slate-900 hover:bg-red-950/20 rounded-lg border border-slate-800 hover:border-red-900/30 transition text-red-400"
                              title="حذف دائمی کارت"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ==============================================
              ADMIN MODE: ALL USERS LIST TAB
             ============================================== */}
          {user.role === 'admin' && activeTab === 'admin-users' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">مدیریت کاربران سامانه</h2>
                  <p className="text-xs text-slate-400 mt-1">مشاهده، نظارت و مدیریت تمامی کاربران عضو شده در سامانه.</p>
                </div>
                <div className="text-xs bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 font-bold text-slate-300">
                  تعداد کل کاربران: <span className="text-blue-400">{allUsers.length}</span>
                </div>
              </div>

              {/* Users table */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-850">
                      <tr>
                        <th className="py-3 px-4">شناسه کاربر</th>
                        <th className="py-3 px-4">نام و نام خانوادگی</th>
                        <th className="py-3 px-4">پست الکترونیک (ایمیل)</th>
                        <th className="py-3 px-4">نقش دسترسی</th>
                        <th className="py-3 px-4">شناسه نماینده (Tenant ID)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {allUsers.map((u) => {
                        const associatedTenant = tenants.find(t => toUUID(t.id) === toUUID(u.tenant_id));
                        return (
                          <tr key={u.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 px-4 font-mono text-slate-500 text-[10px]">{u.id}</td>
                            <td className="py-3 px-4 font-bold text-white">{u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'کاربر بدون نام'}</td>
                            <td className="py-3 px-4 font-mono text-blue-400">{u.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                u.role === 'admin' 
                                  ? 'bg-red-500/10 text-red-400' 
                                  : u.role === 'tenant' 
                                    ? 'bg-amber-500/10 text-amber-400' 
                                    : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {u.role === 'admin' ? 'مدیر ارشد' : u.role === 'tenant' ? 'نماینده' : 'مشتری'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {u.tenant_id ? (
                                <span className="text-amber-500 font-bold">{associatedTenant?.name || u.tenant_id}</span>
                              ) : (
                                <span className="text-slate-500">پرتال اصلی</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
              ADMIN MODE: PLATFORM ANALYTICS TAB
             ============================================== */}
          {user.role === 'admin' && activeTab === 'admin-analytics' && (() => {
            const totalViews = cards.reduce((sum, c) => sum + (c.views_count || 0), 0);
            const avgViews = cards.length > 0 ? Math.round(totalViews / cards.length) : 0;
            const topCard = [...cards].sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0];

            return (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-5">
                  <h2 className="text-xl font-bold text-white">آمار کلی بازدیدهای پلتفرم</h2>
                  <p className="text-xs text-slate-400 mt-1">مشاهده و تحلیل گزارش‌های زنده بازدید کارت‌های دیجیتال کاربران در کل سیستم.</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-2">
                    <span className="text-slate-400 text-xs font-bold block">مجموع کل بازدیدها</span>
                    <span className="text-3xl font-black text-emerald-400 block">{totalViews.toLocaleString('fa-IR')}</span>
                    <p className="text-[10px] text-slate-500">تعداد کل دفعات باز شدن کارت‌ها توسط کاربران در سطح وب.</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-2">
                    <span className="text-slate-400 text-xs font-bold block">میانگین بازدید هر کارت</span>
                    <span className="text-3xl font-black text-blue-400 block">{avgViews.toLocaleString('fa-IR')}</span>
                    <p className="text-[10px] text-slate-500">میانگین آماری تعداد کلیک و بازدید برای هر کارت ویزیت فعال.</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-2">
                    <span className="text-slate-400 text-xs font-bold block">محبوب‌ترین کارت ویزیت</span>
                    {topCard ? (
                      <>
                        <span className="text-lg font-black text-amber-400 truncate block">{topCard.first_name} {topCard.last_name}</span>
                        <p className="text-[10px] text-slate-400">آدرس: <span className="text-blue-400 font-bold font-mono">card/{topCard.slug}</span> ({topCard.views_count?.toLocaleString('fa-IR')} بازدید)</p>
                      </>
                    ) : (
                      <span className="text-slate-500 text-xs block">کارتی یافت نشد</span>
                    )}
                  </div>
                </div>

                {/* Popular Cards Table */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-white">رتبه‌بندی کارت‌های ویزیت بر اساس بیشترین بازدید</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-850">
                        <tr>
                          <th className="py-3 px-4">رتبه</th>
                          <th className="py-3 px-4">صاحب کارت</th>
                          <th className="py-3 px-4">آدرس اختصاصی (Slug)</th>
                          <th className="py-3 px-4">شغل و شرکت</th>
                          <th className="py-3 px-4">تعداد بازدیدها</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {[...cards].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).map((card, idx) => (
                          <tr key={card.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 px-4 font-bold text-blue-500">{(idx + 1).toLocaleString('fa-IR')}#</td>
                            <td className="py-3 px-4 font-bold text-white">{card.first_name} {card.last_name}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">/card/{card.slug}</td>
                            <td className="py-3 px-4 text-slate-400">{card.job_title} | {card.company || 'شخصی'}</td>
                            <td className="py-3 px-4 text-emerald-400 font-bold">{(card.views_count || 0).toLocaleString('fa-IR')} بازدید</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        </main>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 rtl" dir="rtl">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <span className="mt-4 text-slate-400 text-sm font-semibold">در حال بارگذاری پنل کاردینو...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
