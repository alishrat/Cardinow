// Directus Integration & State Management for Digital Business Card System

export interface Tenant {
  id: string;
  status: 'active' | 'inactive';
  name: string;
  custom_domain?: string | null;
  logo?: string | null; // URL or id
  brand_color?: string | null;
  settings?: {
    slogan?: string;
    contact_phone?: string;
    allow_custom_css?: boolean;
    commission_rate?: number;
  } | null;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string | null;
  schema?: any | null;
  is_premium: boolean;
  is_active: boolean;
}

export interface Plan {
  id: string;
  tenant_id?: string | null;
  title: string;
  price: number; // in Toman
  duration_days: number; // -1 means unlimited
  features: string[]; // parsed from json or string[]
  is_active: boolean;
  max_cards?: number; // -1 means unlimited
  allowed_templates?: string[] | any[];
  custom_domain?: boolean;
  remove_branding?: boolean;
}

export interface ProductService {
  id: string;
  tenant_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  is_active: boolean;
  type?: 'product' | 'service';
  created_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id?: string;
  status: 'active' | 'expired' | 'pending';
  start_date: string;
  end_date: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  tenant_id?: string | null;
  amount: number;
  gateway: string;
  authority: string;
  ref_id: string;
  status: 'success' | 'failed' | 'pending';
  payload?: any | null;
  created_at: string;
  receipt_Image?: string | null;
}

export interface Wallet {
  id: number | string;
  user_id: string;
  tenant_id?: string | null;
  balance: number;
  status: 'active' | 'frozen' | 'blocked';
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

export interface WalletTransaction {
  id?: number | string;
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
  wallet_id: number | string;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  reference_id?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'rejected';
  user_email?: string;
  user_name?: string;
}

export interface Card {
  id: string;
  user_id: string;
  tenant_id?: string | null;
  template_id: string;
  slug: string;
  status: 'draft' | 'published' | 'expired';
  profile_image?: string | null;
  cover_image?: string | null;
  first_name: string;
  last_name: string;
  job_title: string;
  company: string;
  bio: string;
  neshan?: string | null;
  waze?: string | null;
  balad?: string | null;
  googlemap?: string | null;
  bank_card?: string | null;
  bank_account?: string | null;
  bank_shaba?: string | null;
  address?: string | null;
  social_links?: {
    phone?: string;
    mobile?: string;
    extra_phones?: string[];
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
    email?: string;
    twitter?: string;
  } | null;
  custom_buttons?: Array<{
    id: string;
    label: string;
    url: string;
    icon?: string;
    color?: string;
  }> | null;
  custom_colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    card_bg?: string;
  } | null;
  section_orders?: string[] | string | null;
  custom_css?: string | null;
  views_count: number;
  expiry_date?: string | null;
  created_at?: string;
}

export interface CardAnalytics {
  id: string;
  card_id: string;
  device: string;
  referrer: string;
  country: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'tenant' | 'admin';
  tenant_id?: string | null; // If role is tenant
  access_token?: string | null;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'tenant' | 'admin';
  tenant_id?: string | null;
  access_token?: string | null;
}

// Directus API Base URL
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

const DIRECTUS_BASE_URL = {
  toString() {
    return getDirectusBaseUrl();
  }
} as any as string;

// Helper to convert Directus File ID (UUID) or relative path to a fully qualified URL
export function getImageUrl(idOrUrl: string | null | undefined): string {
  if (!idOrUrl) return '';
  // If it is a full URL, blob URL, base64 data, or relative path that isn't a simple UUID
  if (/^https?:\/\//i.test(idOrUrl) || idOrUrl.startsWith('blob:') || idOrUrl.startsWith('data:') || idOrUrl.startsWith('/') || idOrUrl.includes('?')) {
    return idOrUrl;
  }
  // Check if it is a UUID (Directus file ID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idOrUrl)) {
    let token = '';
    if (typeof window !== 'undefined') {
      try {
        const sessionStr = localStorage.getItem('digital_card_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session?.access_token) token = session.access_token;
        }
      } catch {}
    }
    const tokenQuery = token ? `?access_token=${encodeURIComponent(token)}` : '';
    return `/api/directus/assets/${idOrUrl}${tokenQuery}`;
  }
  return idOrUrl;
}

// Helper to convert English digits (0-9) and Arabic digits (٠-٩) to Persian digits (۰-۹)
export function toPersianDigits(n: string | number | null | undefined): string {
  if (n === null || n === undefined) return '';
  const str = String(n);
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str
    .replace(/[0-9]/g, (w) => farsiDigits[parseInt(w, 10)])
    .replace(/[٠-٩]/g, (w) => {
      const idx = '٠١٢٣٤٥٦٧٨٩'.indexOf(w);
      return idx !== -1 ? farsiDigits[idx] : w;
    });
}

// Helper to convert Persian/Arabic digits (۰-۹) to English digits (0-9)
export function toEnglishDigits(n: string | number | null | undefined): string {
  if (n === null || n === undefined) return '';
  const str = String(n);
  return str
    .replace(/[۰-۹]/g, (w) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(w)))
    .replace(/[٠-٩]/g, (w) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(w)));
}

// Helper to sanitize any database error messages, removing Directus technical branding
export function sanitizeDbError(errMsg: string): string {
  if (!errMsg) return 'خطای نامشخص در پایگاه داده';
  
  // Replace case-insensitive references to Directus/دایرکتوس with "پایگاه داده"
  let clean = errMsg
    .replace(/directus/gi, 'پایگاه داده')
    .replace(/دایرکتوس/gi, 'پایگاه داده');

  // Translate common unique validation failures into user-friendly Persian
  if (clean.toLowerCase().includes('slug') && (clean.toLowerCase().includes('unique') || clean.toLowerCase().includes('not unique') || clean.toLowerCase().includes('already exists'))) {
    return 'خطا: این آدرس یکتا (اسلاگ) قبلاً توسط کاربر دیگری ثبت شده است. لطفا آدرس (اسلاگ) دیگری انتخاب کنید.';
  }
  if (clean.toLowerCase().includes('email') && (clean.toLowerCase().includes('unique') || clean.toLowerCase().includes('not unique') || clean.toLowerCase().includes('already exists'))) {
    return 'خطا: حساب کاربری با این آدرس ایمیل قبلاً ثبت شده است.';
  }
  if (clean.toLowerCase().includes('phone') && (clean.toLowerCase().includes('unique') || clean.toLowerCase().includes('not unique') || clean.toLowerCase().includes('already exists'))) {
    return 'خطا: حساب کاربری با این شماره موبایل قبلاً ثبت شده است.';
  }

  // Remove common Directus JSON structure pollution
  clean = clean.replace(/"collection":\s*"[^"]*"/gi, '');
  clean = clean.replace(/"field":\s*"[^"]*"/gi, '');
  
  return clean;
}

// SEED DATA
const SEED_TENANTS: Tenant[] = [
  {
    id: 't-1',
    status: 'active',
    name: 'برند یار (نماینده اصلی)',
    custom_domain: 'brandyar.com',
    logo: 'https://picsum.photos/200?random=10',
    brand_color: '#3b82f6',
    settings: {
      slogan: 'هویت دیجیتال شما، تخصص ماست',
      contact_phone: '۰۹۱۲۳۴۵۶۷۸۹',
      allow_custom_css: true,
      commission_rate: 10,
    }
  },
  {
    id: 't-2',
    status: 'active',
    name: 'تک کارت (نمایندگی شیراز)',
    custom_domain: 'shiraz.techcard.ir',
    logo: 'https://picsum.photos/200?random=11',
    brand_color: '#10b981',
    settings: {
      slogan: 'کارت ویزیت دیجیتال مدرن در استان فارس',
      contact_phone: '۰۷۱۳۴۵۶۷۸۹۰',
      allow_custom_css: false,
      commission_rate: 15,
    }
  }
];

const SEED_TEMPLATES: Template[] = [
  {
    id: 'temp-1',
    name: 'کلاسیک اداری (Classic)',
    slug: 'classic',
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
    is_premium: false,
    is_active: true,
    schema: {
      default_colors: {
        primary: '#3b82f6',
        secondary: '#1d4ed8',
        background: '#f1f5f9',
        card_bg: '#ffffff',
        text: '#1e293b'
      }
    }
  },
  {
    id: 'temp-2',
    name: 'شبکه بنتو (Bento Grid)',
    slug: 'bento',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    is_premium: true,
    is_active: true,
    schema: {
      default_colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#0f172a',
        card_bg: '#1e293b',
        text: '#f8fafc'
      }
    }
  },
  {
    id: 'temp-3',
    name: 'محتوامحور و اینفلوئنسر (Content Creator)',
    slug: 'content-creator',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    is_premium: true,
    is_active: true,
    schema: {
      default_colors: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        background: '#09090b',
        card_bg: '#18181b',
        text: '#fafafa'
      }
    }
  },
  {
    id: 'temp-4',
    name: 'گرادینت کهکشانی (Neon Glass)',
    slug: 'neon-glass',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    is_premium: true,
    is_active: true,
    schema: {
      default_colors: {
        primary: '#06b6d4',
        secondary: '#3b82f6',
        background: '#0f172a',
        card_bg: 'rgba(15, 23, 42, 0.85)',
        text: '#ffffff'
      }
    }
  },
  {
    id: 'temp-5',
    name: 'مینیمال مدرن (Minimal)',
    slug: 'minimal',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    is_premium: false,
    is_active: true,
    schema: {
      default_colors: {
        primary: '#0f172a',
        secondary: '#475569',
        background: '#f8fafc',
        card_bg: '#ffffff',
        text: '#0f172a'
      }
    }
  },
  {
    id: 'temp-6',
    name: 'تاریک و طلایی لاکچری (Luxury Dark)',
    slug: 'luxury-dark',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    is_premium: true,
    is_active: true,
    schema: {
      default_colors: {
        primary: '#f59e0b',
        secondary: '#d97706',
        background: '#0c0a09',
        card_bg: '#1c1917',
        text: '#fef3c7'
      }
    }
  }
];

const SEED_PLANS: Plan[] = [
  {
    id: 'p-1',
    title: 'پلن برنزی (رایگان آزمایشی)',
    price: 0,
    duration_days: 14,
    features: ['ساخت ۱ کارت ویزیت', 'انتخاب تم کلاسیک', 'آمار بازدید ساده', 'پشتیبانی تیکتی'],
    is_active: true,
    tenant_id: 't-1',
    max_cards: 1,
    allowed_templates: ['temp-1'],
    custom_domain: false,
    remove_branding: false
  },
  {
    id: 'p-2',
    title: 'پلن نقره‌ای تجاری',
    price: 150000,
    duration_days: 90,
    features: ['ساخت ۳ کارت ویزیت فعال', 'دسترسی به تمامی تم‌ها', 'ویرایشگر پیشرفته', 'آمار بازدید نموداری', 'دکمه‌های اختصاصی نامحدود'],
    is_active: true,
    tenant_id: 't-1',
    max_cards: 3,
    allowed_templates: ['temp-1', 'temp-2', 'temp-3'],
    custom_domain: false,
    remove_branding: true
  },
  {
    id: 'p-3',
    title: 'پلن طلایی حرفه‌ای',
    price: 490000,
    duration_days: 365,
    features: ['کارت ویزیت نامحدود', 'تمامی تم‌ها + بارگذاری کاور اختصاصی', 'کد نویسی CSS اختصاصی', 'آمار پیشرفته دستگاه و ارجاع‌دهنده', 'اتصال به دامنه اختصاصی کاربر', 'پشتیبانی تلفنی ۲۴ ساعته'],
    is_active: true,
    tenant_id: 't-1',
    max_cards: -1, // -1 means unlimited
    allowed_templates: ['temp-1', 'temp-2', 'temp-3', 'temp-4', 'temp-5'],
    custom_domain: true,
    remove_branding: true
  },
  {
    id: 'p-4',
    title: 'پلن ویژه تک‌کارت شیراز',
    price: 290000,
    duration_days: 180,
    features: ['ساخت ۲ کارت ویزیت', 'تمامی تم‌ها فعال', 'پشتیبانی محلی در شیراز', 'آموزش حضوری ساخت کارت'],
    is_active: true,
    tenant_id: 't-2',
    max_cards: 2,
    allowed_templates: ['temp-1', 'temp-2', 'temp-3', 'temp-4'],
    custom_domain: false,
    remove_branding: true
  }
];

export const SEED_PRODUCTS: ProductService[] = [
  {
    id: 'prod-1',
    tenant_id: 't-1',
    name: 'کارت NFC چوبی با حک لیزری اختصاصی',
    description: 'کارت فیزیکی هوشمند NFC با بدنه چوب بامبو مقاوم، شامل تراشه NFC NTAG216 و حک لیزری لوگو و کد QR شما.',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    type: 'product'
  },
  {
    id: 'prod-2',
    tenant_id: 't-1',
    name: 'کارت NFC فلزی طلایی VIP',
    description: 'کارت فیزیکی لوکس فلزی مشکی-طلایی با کیفیت فوق‌العاده، تراشه NFC تقویت شده و ضمانت ۲ ساله.',
    price: 790000,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    type: 'product'
  },
  {
    id: 'prod-3',
    tenant_id: 't-1',
    name: 'خدمات عکاسی پرتره و برندینگ شخصی',
    description: 'یک جلسه عکاسی حرفه‌ای در آتلیه اختصاصی جهت تهیه عکس پرتره و کاور کارت ویزیت دیجیتال.',
    price: 1200000,
    image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    type: 'service'
  },
  {
    id: 'prod-4',
    tenant_id: 't-1',
    name: 'طراحی اختصاصی قالب و ست اداری',
    description: 'طراحی سفارشی قالب کارت ویزیت دیجیتال طبق هویت بصری برند شما توسط گرافیست ارشد.',
    price: 1800000,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    type: 'service'
  }
];

export const DEFAULT_DEMO_CARD: Card = {
  id: '9b645595-de36-42cd-98a3-60c3cd3e50bf',
  user_id: 'u-1',
  tenant_id: 't-1',
  template_id: 'temp-1',
  slug: 'demo',
  status: 'published',
  profile_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=80',
  cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  first_name: 'سارا',
  last_name: 'راد',
  job_title: 'مدیر ارشد محصول (CPO)',
  company: 'شرکت دانش‌بنیان مپنا',
  bio: 'توسعه‌دهنده محصولات نرم‌افزاری مقیاس‌پذیر و برنده جوایز بین‌المللی طراحی رابط‌های دیجیتال. علاقه‌مند به هوش مصنوعی و طراحی تجربه کاربری.',
  neshan: 'https://neshan.org/maps',
  balad: 'https://balad.ir',
  waze: 'https://waze.com',
  googlemap: 'https://maps.google.com',
  bank_card: '۶۰۳۷۹۹۱۸۱۲۳۴۵۶۷۸',
  bank_account: '۰۲۱۵۴۸۷۶۳۲۰۰۱',
  bank_shaba: 'IR120120000000021548763201',
  address: 'تهران، میدان ونک، خیابان ملاصدرا، پلاک ۴۵، طبقه ۳',
  social_links: {
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
    mobile: '۰۹۱۲۳۴۵۶۷۸۹',
    extra_phones: ['۰۲۱۲۲۳۳۴۴۵۵'],
    whatsapp: '۰۹۱۲۳۴۵۶۷۸۹',
    telegram: 'sara_rad_demo',
    instagram: 'sara_rad_cpo',
    linkedin: 'sara-rad-cpo',
    website: 'mapna.com',
    email: 'sara.rad@mapna.com'
  },
  custom_buttons: [
    { id: 'b-demo-1', label: 'دریافت رزومه کاری و پورتفولیو', url: 'https://example.com/resume.pdf', color: '#2563eb' },
    { id: 'b-demo-2', label: 'رزرو جلسه مشاوره اختصاصی', url: 'https://calendly.com', color: '#10b981' }
  ],
  custom_colors: {
    primary: '#2563eb',
    secondary: '#1e40af',
    background: '#f8fafc',
    text: '#1e293b',
    card_bg: '#ffffff'
  },
  views_count: 850,
  expiry_date: '2028-01-01',
  created_at: '2026-01-01T00:00:00Z'
};

const SEED_CARDS: Card[] = [
  DEFAULT_DEMO_CARD,
  {
    id: 'c-1',
    user_id: 'u-1',
    tenant_id: 't-1',
    template_id: 'temp-1',
    slug: 'ali-alavi',
    status: 'published',
    profile_image: 'https://picsum.photos/150/150?random=20',
    cover_image: 'https://picsum.photos/600/300?random=30',
    first_name: 'علی',
    last_name: 'علوی',
    job_title: 'مدیر ارشد فناوری (CTO)',
    company: 'هلدینگ فناوری برند یار',
    bio: 'بیش از ۱۰ سال سابقه در توسعه نرم‌افزار و معماری سیستم‌های توزیع‌شده مایکرو سرویس. علاقه‌مند به هوش مصنوعی و بلاکچین.',
    neshan: 'https://neshan.org/maps/places/ali-alavi-hq',
    balad: 'https://balad.ir/location?latitude=35.7&longitude=51.4',
    waze: 'https://waze.com/ul?ll=35.7,51.4',
    googlemap: 'https://maps.google.com/?q=35.7,51.4',
    bank_card: '۶۰۳۷۹۹۱۸۱۲۳۴۵۶۷۸',
    bank_account: '۰۲۱۵۴۸۷۶۳۲۰۰۱',
    bank_shaba: 'IR120120000000021548763201',
    address: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، برج فناوری شماره ۱، طبقه ۴',
    social_links: {
      phone: '۰۹۱۲۳۴۵۶۷۸۹',
      mobile: '۰۹۱۲۳۴۵۶۷۸۹',
      extra_phones: ['۰۹۱۲۹۹۹۸۸۷۷', '۰۲۱۲۲۳۳۴۴۵۵'],
      whatsapp: '۰۹۱۲۳۴۵۶۷۸۹',
      telegram: 'alialavi_dev',
      instagram: 'ali_alavi',
      linkedin: 'ali-alavi-cto',
      website: 'brandyar.com',
      email: 'ali@brandyar.com'
    },
    custom_buttons: [
      { id: 'b-1', label: 'دانلود رزومه تخصصی PDF', url: 'https://example.com/resume.pdf', color: '#3b82f6' },
      { id: 'b-2', label: 'دریافت وقت مشاوره فنی', url: 'https://calendly.com', color: '#10b981' }
    ],
    custom_colors: {
      primary: '#2563eb',
      secondary: '#1e40af',
      background: '#f8fafc',
      text: '#1e293b',
      card_bg: '#ffffff'
    },
    views_count: 1420,
    expiry_date: '2027-01-01',
    created_at: '2026-01-10T12:00:00Z'
  },
  {
    id: 'c-2',
    user_id: 'u-2',
    tenant_id: 't-1',
    template_id: 'temp-2',
    slug: 'sara-designer',
    status: 'published',
    profile_image: 'https://picsum.photos/150/150?random=21',
    cover_image: 'https://picsum.photos/600/300?random=31',
    first_name: 'سارا',
    last_name: 'رضایی',
    job_title: 'طراح ارشد تجربه کاربری (UI/UX)',
    company: 'استودیو خلاق تک دیزاین',
    bio: 'طراح و پژوهشگر تعامل انسان و کامپیوتر. خلق تجربه‌های دیجیتالی ساده، کاربردی و در عین حال جسورانه و زیبا شعار من است.',
    neshan: 'https://neshan.org/maps/places/sara-design-studio',
    balad: 'https://balad.ir/location?latitude=35.72&longitude=51.42',
    waze: 'https://waze.com/ul?ll=35.72,51.42',
    googlemap: 'https://maps.google.com/?q=35.72,51.42',
    bank_card: '۵۰۲۲۲۹۱۰۱۲۳۴۵۶۷۸',
    bank_account: '۱۰۰۲۰۰۳۰۰۴۰۰',
    bank_shaba: 'IR980170000000100200300400',
    address: 'شیراز، خیابان معالی آباد، مجتمع تجاری آفتاب، واحد ۲۰۴',
    social_links: {
      phone: '۰۹۹۸۷۶۵۴۳۲۱',
      mobile: '۰۹۹۸۷۶۵۴۳۲۱',
      extra_phones: ['۰۹۱۷۱۱۱۲۲۳۳'],
      telegram: 'sara_ux',
      instagram: 'sara_designs',
      linkedin: 'sara-rezaei-ux',
      website: 'behance.net',
      email: 'sara@example.com'
    },
    custom_buttons: [
      { id: 'b-3', label: 'مشاهده پورتفولیو بهنس', url: 'https://behance.net', color: '#ec4899' }
    ],
    custom_colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      background: '#0f172a',
      text: '#f8fafc',
      card_bg: '#1e293b'
    },
    views_count: 3256,
    expiry_date: '2026-12-15',
    created_at: '2026-02-14T09:30:00Z'
  }
];

const SEED_ANALYTICS: CardAnalytics[] = [
  // Analytics for c-1
  { id: 'a-1', card_id: 'c-1', device: 'موبایل (آیفون)', referrer: 'تلگرام', country: 'ایران', created_at: '2026-07-14T10:00:00Z' },
  { id: 'a-2', card_id: 'c-1', device: 'موبایل (اندروید)', referrer: 'مستقیم', country: 'ایران', created_at: '2026-07-14T11:30:00Z' },
  { id: 'a-3', card_id: 'c-1', device: 'دسکتاپ (ویندوز)', referrer: 'گوگل', country: 'ایران', created_at: '2026-07-13T15:20:00Z' },
  { id: 'a-4', card_id: 'c-1', device: 'موبایل (اندروید)', referrer: 'اینستاگرام', country: 'ایران', created_at: '2026-07-12T08:15:00Z' },
  // Analytics for c-2
  { id: 'a-5', card_id: 'c-2', device: 'موبایل (آیفون)', referrer: 'اینستاگرام', country: 'ایران', created_at: '2026-07-14T14:00:00Z' },
  { id: 'a-6', card_id: 'c-2', device: 'دسکتاپ (مک)', referrer: 'لینکدین', country: 'کانادا', created_at: '2026-07-14T18:45:00Z' },
  { id: 'a-7', card_id: 'c-2', device: 'موبایل (اندروید)', referrer: 'تلگرام', country: 'ایران', created_at: '2026-07-13T22:10:00Z' }
];

const SEED_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-1', user_id: 'u-1', plan_id: 'p-2', status: 'active', start_date: '2026-06-01', end_date: '2026-09-01' },
  { id: 'sub-2', user_id: 'u-2', plan_id: 'p-3', status: 'active', start_date: '2026-01-15', end_date: '2027-01-15' }
];

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    user_id: 'u-1',
    tenant_id: 't-1',
    amount: 150000,
    gateway: 'زرین‌پال',
    authority: 'A0000000000000000000000000012345',
    ref_id: '98471203',
    status: 'success',
    created_at: '2026-06-01T10:14:00Z'
  },
  {
    id: 'tx-2',
    user_id: 'u-2',
    tenant_id: 't-1',
    amount: 490000,
    gateway: 'زیبال',
    authority: 'Z0000000000000000000000000098765',
    ref_id: '12450983',
    status: 'success',
    created_at: '2026-01-15T16:45:00Z'
  }
];

const SEED_USERS: AppUser[] = [
  { id: 'u-1', email: 'demo@brandyar.com', name: 'علی علوی (مشتری)', role: 'customer', tenant_id: 't-1' },
  { id: 'u-2', email: 'sara@example.com', name: 'سارا رضایی', role: 'customer', tenant_id: 't-1' },
  { id: 'u-tenant', email: 'tenant@brandyar.com', name: 'مدیر نمایندگی تک‌کارت', role: 'tenant', tenant_id: 't-2' },
  { id: 'u-admin', email: 'admin@brandyar.com', name: 'مدیر کل سیستم (ادمین)', role: 'admin' }
];

// LocalStorage Helper functions
// LocalStorage Helper functions
const getStored = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const data = localStorage.getItem(`digital_card_${key}`);
  return data ? JSON.parse(data) : fallback;
};

const setStored = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`digital_card_${key}`, JSON.stringify(value));
};

// Helper to transform any string ID to a stable standard UUID format for Directus compatibility
export function toUUID(id: string | null | undefined): string {
  if (!id) return '';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  
  // Stable mappings for seeds
  const mapping: { [key: string]: string } = {
    't-1': '9a1e2b5c-4d3e-4f5a-6b7c-8d9e0a1b2c3d',
    't-2': '8a1e2b5c-4d3e-4f5a-6b7c-8d9e0a1b2c3d',
    'temp-1': '11111111-1111-1111-1111-111111111111',
    'temp-2': '22222222-2222-2222-2222-222222222222',
    'temp-3': '33333333-3333-3333-3333-333333333333',
    'temp-4': '44444444-4444-4444-4444-444444444444',
    'p-1': 'a1111111-a111-a111-a111-a11111111111',
    'p-2': 'a2222222-a222-a222-a222-a22222222222',
    'p-3': 'a3333333-a333-a333-a333-a33333333333',
    'p-4': 'a4444444-a444-a444-a444-a44444444444',
    'c-1': 'b1111111-b111-b111-b111-b11111111111',
    'c-2': 'b2222222-b222-b222-b222-b22222222222',
    'c-3': 'b3333333-b333-b333-b333-b33333333333',
    'u-1': 'c1111111-c111-c111-c111-c11111111111',
    'u-2': 'c2222222-c222-c222-c222-c22222222222',
    'u-tenant': 'c3333333-c333-c333-c333-c33333333333',
    'u-admin': 'c4444444-c444-c444-c444-c44444444444'
  };

  if (mapping[id]) return mapping[id];
  
  // Custom deterministic stable UUID generator
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const parts = [
    Math.abs(hash).toString(16).padEnd(8, '0').slice(0, 8),
    Math.abs(hash * 31).toString(16).padEnd(4, '0').slice(0, 4),
    '4' + Math.abs(hash * 17).toString(16).padEnd(3, '0').slice(0, 3),
    'a' + Math.abs(hash * 13).toString(16).padEnd(3, '0').slice(0, 3),
    Math.abs(hash * 43).toString(16).padEnd(12, 'f').slice(0, 12)
  ];
  return parts.join('-');
}

// Convert any Gregorian date string or Date object to Solar Hijri (Jalali) date string
export function toJalaliDate(dateInput: string | Date | null | undefined, options?: { latinDigits?: boolean }): string {
  if (!dateInput) return '-';
  try {
    const dateStr = typeof dateInput === 'string' ? dateInput.trim() : dateInput;
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateInput);
    
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    let formatted = formatter.format(d);
    if (options?.latinDigits) {
      formatted = formatted.replace(/[۰-۹]/g, (w) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(w)));
    }
    return formatted;
  } catch {
    return String(dateInput);
  }
}

// Cleans objects and translates standard keys to valid UUID format for Directus compatibility
export function cleanDataForDirectus(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(cleanDataForDirectus);
  }
  
  const cleaned: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (['id', 'user_id', 'tenant_id', 'template_id', 'card_id', 'plan_id'].includes(key) && typeof val === 'string') {
      cleaned[key] = toUUID(val);
    } else if (['profile_image', 'cover_image', 'receipt_Image'].includes(key)) {
      if (typeof val === 'string') {
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = val.match(uuidRegex);
        cleaned[key] = match ? match[0] : null;
      } else {
        cleaned[key] = val || null;
      }
    } else if (typeof val === 'object' && val !== null) {
      cleaned[key] = cleanDataForDirectus(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export function parseCardFields(card: any): Card {
  if (!card) return card;
  const parsed = { ...card };
  
  if (typeof parsed.social_links === 'string') {
    try {
      parsed.social_links = JSON.parse(parsed.social_links);
    } catch (e) {
      console.warn("Failed to parse social_links", e);
    }
  }
  
  if (typeof parsed.custom_buttons === 'string') {
    try {
      parsed.custom_buttons = JSON.parse(parsed.custom_buttons);
    } catch (e) {
      console.warn("Failed to parse custom_buttons", e);
    }
  }

  if (typeof parsed.custom_colors === 'string') {
    try {
      parsed.custom_colors = JSON.parse(parsed.custom_colors);
    } catch (e) {
      console.warn("Failed to parse custom_colors", e);
    }
  }

  if (typeof parsed.section_orders === 'string') {
    try {
      parsed.section_orders = JSON.parse(parsed.section_orders);
    } catch (e) {
      console.warn("Failed to parse section_orders", e);
    }
  }

  // Convert numeric card fields to Persian digits
  if (parsed.bank_card) parsed.bank_card = toPersianDigits(parsed.bank_card);
  if (parsed.bank_account) parsed.bank_account = toPersianDigits(parsed.bank_account);
  if (parsed.bank_shaba) parsed.bank_shaba = toPersianDigits(parsed.bank_shaba);
  if (parsed.social_links) {
    if (parsed.social_links.phone) parsed.social_links.phone = toPersianDigits(parsed.social_links.phone);
    if (parsed.social_links.mobile) parsed.social_links.mobile = toPersianDigits(parsed.social_links.mobile);
    if (Array.isArray(parsed.social_links.extra_phones)) {
      parsed.social_links.extra_phones = parsed.social_links.extra_phones.map((p: string) => toPersianDigits(p));
    }
  }

  return parsed;
}

export const DEFAULT_SECTION_ORDERS = [
  'save_contact',
  'bio',
  'primary_actions',
  'social_links',
  'custom_buttons',
  'location',
  'bank_info'
];

export const SECTION_DEFINITIONS = [
  { id: 'save_contact', title: 'دکمه ذخیره مخاطب (vCard)', description: 'دکمه ذخیره مستقیم اطلاعات تماس در دفترچه تلفن گوشی', icon: 'Download' },
  { id: 'bio', title: 'بیوگرافی و درباره من', description: 'خلاصه سوابق کاری، متن معرفی و شرح خدمات شما', icon: 'AlignRight' },
  { id: 'primary_actions', title: 'دکمه‌های سریع ارتباطی', description: 'کلیدهای میانبر تلفن ثابت، همراه، ایمیل و وب‌سایت', icon: 'Phone' },
  { id: 'social_links', title: 'شبکه‌های اجتماعی', description: 'آیکون‌های اینستاگرام، تلگرام، واتساپ، لینکدین و توییتر', icon: 'Share2' },
  { id: 'custom_buttons', title: 'دکمه‌های لینک سفارشی', description: 'کلیدها و لینک‌های اختصاصی تعریف‌شده توسط شما', icon: 'ExternalLink' },
  { id: 'location', title: 'آدرس و مسیریاب‌ها', description: 'آدرس دفتر و دکمه‌های مسیریابی (گوگل مپ، نشان، بلد، ویز)', icon: 'MapPin' },
  { id: 'bank_info', title: 'اطلاعات حساب و کارت بانکی', description: 'شماره کارت، شماره حساب و شماره شبا جهت دریافت وجه', icon: 'CreditCard' }
];

export function getSectionOrders(card?: Partial<Card> | null): string[] {
  if (!card || !card.section_orders) return DEFAULT_SECTION_ORDERS;

  let orders: string[] = [];
  if (Array.isArray(card.section_orders)) {
    orders = card.section_orders;
  } else if (typeof card.section_orders === 'string') {
    try {
      orders = JSON.parse(card.section_orders);
    } catch {
      orders = DEFAULT_SECTION_ORDERS;
    }
  }

  if (!Array.isArray(orders) || orders.length === 0) return DEFAULT_SECTION_ORDERS;

  const result = [...orders];
  DEFAULT_SECTION_ORDERS.forEach(sec => {
    if (!result.includes(sec)) {
      result.push(sec);
    }
  });

  return result;
}

// Ensure the tenant_id in the payload is valid in Directus DB, otherwise set it to null to avoid foreign key violations
export async function ensureValidTenantId(payload: any): Promise<void> {
  if (payload && payload.tenant_id) {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/tenants/${payload.tenant_id}`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 404) {
        payload.tenant_id = null;
      }
    } catch {
      // Keep existing tenant_id on network or auth failure
    }
  }
}

// Ensure user_id in payload is valid in directus_users
export async function ensureValidUserId(payload: any): Promise<void> {
  if (payload && payload.user_id) {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/users/${payload.user_id}`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 404) {
        payload.user_id = null;
      }
    } catch {
      // Keep existing user_id on network or auth failure
    }
  }
}

// Ensure receipt_Image in payload exists in directus_files
export async function ensureValidReceiptImage(payload: any): Promise<void> {
  const receiptId = payload.receipt_Image || payload.receipt_image;
  if (receiptId) {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/files/${receiptId}`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 404) {
        payload.receipt_Image = null;
        if (payload.receipt_image) payload.receipt_image = null;
      }
    } catch {
      // Keep existing receipt_Image on network failure
    }
  }
}

// Automatically populates empty Directus collections with beautiful, standard seed items
export async function seedDirectusIfEmpty() {
  if (typeof window === 'undefined') return;
  
  // Skip if we already checked in this browser session
  if (sessionStorage.getItem('digital_card_seed_checked')) return;
  sessionStorage.setItem('digital_card_seed_checked', 'true');

  const collectionsToSeed: { [key: string]: any[] } = {
    'tenants': SEED_TENANTS,
    'templates': SEED_TEMPLATES,
    'plans': SEED_PLANS,
    'cards': SEED_CARDS,
    'subscriptions': SEED_SUBSCRIPTIONS,
    'transactions': SEED_TRANSACTIONS,
    'users': SEED_USERS
  };

  for (const [col, seedItems] of Object.entries(collectionsToSeed)) {
    const endpoint = col === 'analytics' ? 'items/card_analytics' : col === 'users' ? 'users' : `items/${col}`;
    try {
      if (col === 'users') {
        continue; // Users seeding is handled server-side or during setup to avoid browser 400 errors
      }

      const res = await fetch(`${DIRECTUS_BASE_URL}/${endpoint}?limit=1`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (Array.isArray(data) && data.length === 0) {
          for (const item of seedItems) {
            const cleanItem = cleanDataForDirectus(item);
            await fetch(`${DIRECTUS_BASE_URL}/${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },
              body: JSON.stringify(cleanItem),
            }).catch(() => {});
          }
        }
      }
    } catch {
      // Silently ignore seeding errors
    }
  }
}

// Initialize Database and trigger auto seeding if Directus is empty
export function initializeDB() {
  if (typeof window === 'undefined') return;
  // Trigger Directus auto seeding in the background if tables are empty
  setTimeout(() => {
    seedDirectusIfEmpty().catch(err => console.error('Error during Directus seeding:', err));
  }, 100);
}

// Background Sync is no longer needed since we are online-only, but kept as a no-op to prevent import breaks
export async function syncWithDirectus() {
  await seedDirectusIfEmpty();
}

// TOKEN EXPIRATION LISTENER & NOTIFIER
type TokenExpiredCallback = (msg: string) => void;
let tokenExpiredHandler: TokenExpiredCallback | null = null;

export function onTokenExpired(callback: TokenExpiredCallback | null) {
  tokenExpiredHandler = callback;
}

export function notifyTokenExpired(message?: string) {
  if (typeof window === 'undefined') return;
  authService.logout();
  const msg = message || 'نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد حساب کاربری خود شوید.';
  if (tokenExpiredHandler) {
    tokenExpiredHandler(msg);
  }
}

// HELPER TO CHECK FOR AUTH 401/403 RESPONSES
export function checkAuthResponse(res: Response) {
  if (res.status === 401) {
    notifyTokenExpired('توکن شما منقضی شده است. لطفاً مجدداً وارد حساب کاربری شوید.');
    throw new Error('نشست شما منقضی شده است.');
  }
}

// HELPER TO GET DIRECTUS AUTHORIZATION HEADERS FOR CURRENT USER
export function getAuthHeaders(): { [key: string]: string } {
  if (typeof window === 'undefined') return {};
  try {
    const sessionStr = localStorage.getItem('digital_card_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.access_token) {
        return { 'Authorization': `Bearer ${session.access_token}` };
      }
    }
  } catch (err) {
    console.error('Error reading auth session:', err);
  }
  return {};
}

// DATABASE SERVICE
export const dbService = {
  // ---- TENANTS ----
  getTenants: async (): Promise<Tenant[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/tenants`, {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Failed to fetch from Directus');
      const json = await res.json();
      const data = json?.data || [];
      return data.length > 0 ? data : SEED_TENANTS;
    } catch {
      console.warn('Directus tenants fetch failed, using SEED_TENANTS');
      return SEED_TENANTS;
    }
  },
  saveTenant: async (tenant: Tenant): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(tenant);
    const cleanId = toUUID(tenant.id);
    
    // Check if exists
    const check = await fetch(`${DIRECTUS_BASE_URL}/items/tenants/${cleanId}`, {
      headers: { ...getAuthHeaders() }
    });
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/tenants/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/tenants`;

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) throw new Error('خطا در ذخیره‌سازی اطلاعات نماینده در پایگاه داده');
  },

  // ---- TEMPLATES ----
  getTemplates: async (): Promise<Template[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/templates`, {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Failed to fetch templates from database');
      const json = await res.json();
      const data = json?.data || [];
      if (data.length === 0) return SEED_TEMPLATES;
      return data.map((temp: any) => {
        let parsedSchema = temp.schema;
        if (typeof parsedSchema === 'string') {
          try {
            parsedSchema = JSON.parse(parsedSchema);
          } catch {
            parsedSchema = null;
          }
        }
        return {
          ...temp,
          schema: parsedSchema
        };
      });
    } catch {
      console.warn('Directus templates fetch failed, using SEED_TEMPLATES');
      return SEED_TEMPLATES;
    }
  },
  saveTemplate: async (template: Template): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(template);
    const cleanId = toUUID(template.id);
    
    const check = await fetch(`${DIRECTUS_BASE_URL}/items/templates/${cleanId}`, {
        headers: { ...getAuthHeaders() }
    });
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/templates/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/templates`;

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) throw new Error('خطا در ذخیره‌سازی قالب در پایگاه داده');
  },

  // ---- PLANS ----
  getPlans: async (tenantId?: string | null): Promise<Plan[]> => {
    try {
      let url = `${DIRECTUS_BASE_URL}/items/plans?fields=*,allowed_templates.*`;
      if (tenantId) {
        url += `&filter[tenant_id][_eq]=${toUUID(tenantId)}`;
      }
      const res = await fetch(url, {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Failed to fetch plans from database');
      const json = await res.json();
      const data = json?.data || [];
      if (data.length === 0) {
        const tenantPlans = SEED_PLANS.filter(p => !tenantId || p.tenant_id === tenantId);
        return tenantPlans.length > 0 ? tenantPlans : SEED_PLANS;
      }
      return data.map((plan: any) => {
        let parsedPrice = 0;
        if (plan.price !== undefined && plan.price !== null && plan.price !== '') {
          const num = Number(plan.price);
          if (!isNaN(num)) parsedPrice = num;
        } else {
          const seedMatch = SEED_PLANS.find(sp => toUUID(sp.id) === toUUID(plan.id) || sp.title === plan.title);
          if (seedMatch) parsedPrice = seedMatch.price;
        }

        let parsedFeatures: string[] = [];
        if (Array.isArray(plan.features)) {
          parsedFeatures = plan.features;
        } else if (typeof plan.features === 'string' && plan.features.trim()) {
          try {
            const parsed = JSON.parse(plan.features);
            if (Array.isArray(parsed)) parsedFeatures = parsed;
            else if (typeof parsed === 'string') parsedFeatures = [parsed];
          } catch {
            if (plan.features.includes('\n')) {
              parsedFeatures = plan.features.split('\n').map((s: string) => s.trim()).filter(Boolean);
            } else if (plan.features.includes(',')) {
              parsedFeatures = plan.features.split(',').map((s: string) => s.trim()).filter(Boolean);
            } else {
              parsedFeatures = [plan.features.trim()];
            }
          }
        }

        // Fallback to SEED_PLANS features if empty
        if (parsedFeatures.length === 0) {
          const seedMatch = SEED_PLANS.find(sp => toUUID(sp.id) === toUUID(plan.id) || sp.title === plan.title);
          if (seedMatch && Array.isArray(seedMatch.features) && seedMatch.features.length > 0) {
            parsedFeatures = seedMatch.features;
          }
        }

        let parsedTemplates: string[] = [];
        if (Array.isArray(plan.allowed_templates)) {
          parsedTemplates = plan.allowed_templates.map((t: any) => {
            if (typeof t === 'string') return t;
            if (t?.templates_id) return typeof t.templates_id === 'object' ? t.templates_id.id : t.templates_id;
            if (t?.id) return t.id;
            return String(t);
          }).filter(Boolean);
        }

        return {
          ...plan,
          price: parsedPrice,
          features: parsedFeatures,
          allowed_templates: parsedTemplates,
          duration_days: plan.duration_days !== undefined && plan.duration_days !== null ? Number(plan.duration_days) : 30,
          max_cards: plan.max_cards !== undefined && plan.max_cards !== null ? Number(plan.max_cards) : -1,
          custom_domain: Boolean(plan.custom_domain),
          remove_branding: Boolean(plan.remove_branding)
        };
      });
    } catch {
      console.warn('Directus plans fetch failed, using SEED_PLANS');
      const tenantPlans = SEED_PLANS.filter(p => !tenantId || p.tenant_id === tenantId);
      return tenantPlans.length > 0 ? tenantPlans : SEED_PLANS;
    }
  },
  savePlan: async (plan: Plan): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(plan);
    await ensureValidTenantId(cleanPayload);
    const cleanId = toUUID(plan.id);

    // Format allowed_templates as array of clean UUID strings
    if (Array.isArray(cleanPayload.allowed_templates)) {
      cleanPayload.allowed_templates = cleanPayload.allowed_templates.map((t: any) =>
        typeof t === 'object' ? toUUID(t.id || t.templates_id) : toUUID(t)
      ).filter(Boolean);
    }

    const check = await fetch(`${DIRECTUS_BASE_URL}/items/plans/${cleanId}`, {
      headers: { ...getAuthHeaders() }
    });
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/plans/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/plans`;

    let res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(cleanPayload)
    });

    if (!res.ok) {
      // Retry without allowed_templates in case Directus collection doesn't have allowed_templates field or requires junction format
      const fallbackPayload = { ...cleanPayload };
      delete fallbackPayload.allowed_templates;
      res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(fallbackPayload)
      });
    }

    if (!res.ok) {
      let errorDetail = '';
      try {
        const errJson = await res.json();
        errorDetail = errJson?.errors?.[0]?.message || JSON.stringify(errJson);
      } catch {
        try { errorDetail = await res.text(); } catch {}
      }
      throw new Error(`خطا در ذخیره‌سازی پلن در پایگاه داده: ${errorDetail || res.statusText}`);
    }
  },
  deletePlan: async (planId: string): Promise<void> => {
    const cleanId = toUUID(planId);
    const res = await fetch(`${DIRECTUS_BASE_URL}/items/plans/${cleanId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('خطا در حذف پلن از پایگاه داده');
  },

  // ---- FILE UPLOAD ----
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = getAuthHeaders();
    const res = await fetch(`${DIRECTUS_BASE_URL}/files`, {
      method: 'POST',
      headers: { ...headers },
      body: formData
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.errors?.[0]?.message || 'خطا در آپلود تصویر در پایگاه داده');
    }
    const json = await res.json();
    return json?.data?.id;
  },

  // ---- PRODUCTS & SERVICES ----
  getProducts: async (): Promise<ProductService[]> => {
    let remoteProds: ProductService[] = [];
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/products`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        remoteProds = json?.data || [];
      }
    } catch (e) {
      console.warn('Failed to fetch remote products from Directus:', e);
    }

    let localProds: ProductService[] = [];
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('local_products');
        if (stored) {
          localProds = JSON.parse(stored);
        }
      }
    } catch {}

    const prodMap = new Map<string, ProductService>();
    for (const p of remoteProds) {
      if (p && p.id) prodMap.set(p.id, p);
    }
    for (const p of localProds) {
      if (p && p.id) prodMap.set(p.id, p);
    }

    return Array.from(prodMap.values());
  },
  saveProduct: async (prod: ProductService): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(prod);
    await ensureValidTenantId(cleanPayload);
    const cleanId = toUUID(prod.id);

    try {
      const check = await fetch(`${DIRECTUS_BASE_URL}/items/products/${cleanId}`, {
        headers: { ...getAuthHeaders() }
      });
      const method = check.ok ? 'PATCH' : 'POST';
      const url = check.ok 
        ? `${DIRECTUS_BASE_URL}/items/products/${cleanId}`
        : `${DIRECTUS_BASE_URL}/items/products`;

      await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(cleanPayload)
      });
    } catch (e) {
      console.warn('Could not sync product with Directus remote, caching locally:', e);
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('local_products');
        const list: ProductService[] = stored ? JSON.parse(stored) : [];
        const existingIdx = list.findIndex(item => item.id === prod.id);
        if (existingIdx >= 0) {
          list[existingIdx] = prod;
        } else {
          list.push(prod);
        }
        localStorage.setItem('local_products', JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to update local products cache:', e);
    }
  },
  deleteProduct: async (id: string): Promise<void> => {
    const cleanId = toUUID(id);
    try {
      await fetch(`${DIRECTUS_BASE_URL}/items/products/${cleanId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
    } catch (e) {
      console.warn('Failed to delete product from Directus:', e);
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('local_products');
        const list: ProductService[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter(item => item.id !== id && item.id !== cleanId);
        localStorage.setItem('local_products', JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Failed to update local products cache on delete:', e);
    }
  },

  // ---- CARDS ----
  getCards: async (userId?: string): Promise<Card[]> => {
    let url = `${DIRECTUS_BASE_URL}/items/cards`;
    if (userId) {
      url += `?filter[user_id][_eq]=${toUUID(userId)}`;
    }
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('خطا در دریافت اطلاعات کارت‌ها از پایگاه داده');
    const json = await res.json();
    const data = json?.data || [];
    return data.map(parseCardFields);
  },
  getCardBySlug: async (slug: string): Promise<Card | null> => {
    if (!slug || !slug.trim()) return null;
    const cleanSlug = slug.trim().toLowerCase();
    try {
      // 1. PUBLIC search without auth headers (so user role scope won't restrict results to current user only)
      let url = `${DIRECTUS_BASE_URL}/items/cards?filter[slug][_eq]=${encodeURIComponent(cleanSlug)}&limit=1`;
      let res = await fetch(url);
      let json = res.ok ? await res.json() : null;
      let cardData = json?.data?.[0];

      // 2. Case-insensitive _ieq query without auth headers
      if (!cardData) {
        url = `${DIRECTUS_BASE_URL}/items/cards?filter[slug][_ieq]=${encodeURIComponent(cleanSlug)}&limit=1`;
        res = await fetch(url);
        if (res.ok) {
          json = await res.json();
          cardData = json?.data?.[0];
        }
      }

      // 3. System-wide cards scan as fail-safe across all public cards
      if (!cardData) {
        url = `${DIRECTUS_BASE_URL}/items/cards?limit=-1`;
        res = await fetch(url);
        if (res.ok) {
          json = await res.json();
          const allCards = json?.data || [];
          cardData = allCards.find((c: any) => (c.slug || '').trim().toLowerCase() === cleanSlug);
        }
      }

      // 4. Fallback query WITH auth headers if public endpoint failed
      if (!cardData) {
        url = `${DIRECTUS_BASE_URL}/items/cards?filter[slug][_eq]=${encodeURIComponent(cleanSlug)}&limit=1`;
        res = await fetch(url, { headers: { ...getAuthHeaders() } });
        if (res.ok) {
          json = await res.json();
          cardData = json?.data?.[0];
        }
      }

      return cardData ? parseCardFields(cardData) : null;
    } catch (e) {
      console.warn("getCardBySlug query error:", e);
      return null;
    }
  },
  getCardById: async (id: string): Promise<Card | null> => {
    const url = `${DIRECTUS_BASE_URL}/items/cards/${toUUID(id)}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ? parseCardFields(json.data) : null;
  },
  saveCard: async (card: Card): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(card);
    await ensureValidTenantId(cleanPayload);
    const cleanId = toUUID(card.id);

    const check = await fetch(`${DIRECTUS_BASE_URL}/items/cards/${cleanId}`, {
      headers: { ...getAuthHeaders() }
    });
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/cards/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/cards`;

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) {
      let errMsg = 'خطا در ذخیره‌سازی کارت در پایگاه داده';
      try {
        const errJson = await res.json();
        if (errJson?.errors?.[0]?.message) {
          errMsg += `: ${errJson.errors[0].message}`;
        } else {
          errMsg += `: ${JSON.stringify(errJson)}`;
        }
      } catch {
        try {
          const txt = await res.text();
          errMsg += `: ${txt}`;
        } catch {}
      }
      throw new Error(sanitizeDbError(errMsg));
    }
  },
  deleteCard: async (id: string): Promise<void> => {
    const cardId = toUUID(id);
    const authHeaders = getAuthHeaders();

    // 1. Fetch and delete any associated card_analytics to prevent foreign key constraint violations
    try {
      const idsToCheck = Array.from(new Set([cardId, id].filter(Boolean)));
      for (const targetId of idsToCheck) {
        const analyticsRes = await fetch(`${DIRECTUS_BASE_URL}/items/card_analytics?filter[card_id][_eq]=${encodeURIComponent(targetId)}`, {
          headers: { ...authHeaders }
        });
        if (analyticsRes.ok) {
          const analyticsJson = await analyticsRes.json();
          const analyticsList = analyticsJson?.data || [];
          for (const record of analyticsList) {
            if (record.id) {
              await fetch(`${DIRECTUS_BASE_URL}/items/card_analytics/${record.id}`, {
                method: 'DELETE',
                headers: { ...authHeaders }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to delete associated card_analytics:", e);
    }

    // 2. Fetch and delete any associated card_subscribers to prevent foreign key constraint violations
    try {
      const idsToCheck = Array.from(new Set([cardId, id].filter(Boolean)));
      for (const targetId of idsToCheck) {
        const subRes = await fetch(`${DIRECTUS_BASE_URL}/items/card_subscribers?filter[card_id][_eq]=${encodeURIComponent(targetId)}`, {
          headers: { ...authHeaders }
        });
        if (subRes.ok) {
          const subJson = await subRes.json();
          const subList = subJson?.data || [];
          for (const record of subList) {
            if (record.id) {
              await fetch(`${DIRECTUS_BASE_URL}/items/card_subscribers/${record.id}`, {
                method: 'DELETE',
                headers: { ...authHeaders }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to delete associated card_subscribers:", e);
    }

    // 3. Delete the card itself
    let res = await fetch(`${DIRECTUS_BASE_URL}/items/cards/${cardId}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });

    if (!res.ok && id && id !== cardId) {
      res = await fetch(`${DIRECTUS_BASE_URL}/items/cards/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...authHeaders }
      });
    }

    if (!res.ok) {
      if (res.status === 404) {
        // If the record is already gone or 404, treat as successfully removed
        return;
      }
      let errorDetail = '';
      try {
        const errJson = await res.json();
        if (errJson?.errors?.[0]?.message) {
          errorDetail = errJson.errors[0].message;
        } else {
          errorDetail = JSON.stringify(errJson);
        }
      } catch {
        try {
          errorDetail = await res.text();
        } catch {}
      }
      throw new Error(`خطا در حذف کارت از پایگاه داده: ${errorDetail || res.statusText}`);
    }
  },

  // ---- SUBSCRIPTIONS ----
  getSubscriptions: async (userId?: string): Promise<Subscription[]> => {
    let url = `${DIRECTUS_BASE_URL}/items/subscriptions`;
    if (userId) {
      url += `?filter[user_id][_eq]=${toUUID(userId)}`;
    }
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('خطا در دریافت اشتراک‌ها از پایگاه داده');
    const json = await res.json();
    return json?.data || [];
  },
  saveSubscription: async (sub: Subscription): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(sub);
    await ensureValidTenantId(cleanPayload);
    const cleanId = toUUID(sub.id);

    const check = await fetch(`${DIRECTUS_BASE_URL}/items/subscriptions/${cleanId}`, {
      headers: { ...getAuthHeaders() }
    });
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/subscriptions/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/subscriptions`;

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) throw new Error('خطا در ذخیره‌سازی اشتراک در پایگاه داده');
  },

  // ---- TRANSACTIONS ----
  getTransactions: async (userId?: string): Promise<Transaction[]> => {
    let remoteTxs: Transaction[] = [];
    try {
      let url = `${DIRECTUS_BASE_URL}/items/transactions`;
      if (userId) {
        url += `?filter[user_id][_eq]=${toUUID(userId)}`;
      }
      const res = await fetch(url, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        remoteTxs = json?.data || [];
      }
    } catch (e) {
      console.warn('Failed to fetch remote transactions from Directus:', e);
    }

    let localTxs: Transaction[] = [];
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('local_transactions');
        if (stored) {
          localTxs = JSON.parse(stored);
        }
      }
    } catch {}

    const txMap = new Map<string, Transaction>();
    for (const tx of remoteTxs) {
      if (tx && tx.id) txMap.set(tx.id, tx);
    }
    for (const tx of localTxs) {
      if (tx && tx.id) txMap.set(tx.id, tx);
    }

    const all = Array.from(txMap.values());
    if (userId) {
      return all.filter(t => !t.user_id || toUUID(t.user_id) === toUUID(userId));
    }
    return all;
  },
  saveTransaction: async (tx: Transaction): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(tx);
    await ensureValidTenantId(cleanPayload);
    await ensureValidUserId(cleanPayload);
    await ensureValidReceiptImage(cleanPayload);
    const cleanId = toUUID(tx.id);

    const receiptValue = cleanPayload.receipt_Image || cleanPayload.receipt_image || null;

    const check = await fetch(`${DIRECTUS_BASE_URL}/items/transactions/${cleanId}`, {
      headers: { ...getAuthHeaders() }
    });
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/transactions/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/transactions`;

    const payloadToSend: any = {
      id: cleanId,
      user_id: cleanPayload.user_id || null,
      tenant_id: cleanPayload.tenant_id || null,
      amount: Number(cleanPayload.amount) || 0,
      gateway: cleanPayload.gateway || 'کارت به کارت (آفلاین)',
      authority: cleanPayload.authority || '',
      ref_id: cleanPayload.ref_id || '',
      status: cleanPayload.status || 'pending',
      payload: cleanPayload.payload || null,
      receipt_Image: receiptValue
    };

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payloadToSend)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Directus saveTransaction error:', errText);
      throw new Error(sanitizeDbError(errText) || `کد خطا: ${res.status}`);
    }

    // Save to local storage cache only after successful sync with Directus
    try {
      if (typeof window !== 'undefined') {
        const storedLocal = localStorage.getItem('local_transactions');
        const list: Transaction[] = storedLocal ? JSON.parse(storedLocal) : [];
        const existingIdx = list.findIndex(item => item.id === tx.id);
        if (existingIdx >= 0) {
          list[existingIdx] = tx;
        } else {
          list.push(tx);
        }
        localStorage.setItem('local_transactions', JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to update local transactions cache:', e);
    }
  },
  getSiteSettings: async (): Promise<{ bank_card?: string; bank_name?: string; zarinpal_merchant?: string } | null> => {
    try {
      let res = await fetch(`${DIRECTUS_BASE_URL}/items/settings`, {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) {
        res = await fetch(`${DIRECTUS_BASE_URL}/items/site_settings`, {
          headers: { ...getAuthHeaders() }
        });
      }
      if (!res.ok) throw new Error('Failed to fetch site settings');
      const json = await res.json();
      const data = json?.data;
      let record: any = null;
      if (Array.isArray(data)) {
        record = data[0];
      } else if (data && typeof data === 'object') {
        record = data;
      }
      if (record) {
        return {
          bank_card: record.bank_card || record.card_number || '۵۰۲۲-۲۹۱۰-۱۲۳۴-۵۶۷۸',
          bank_name: record.bank_name || record.account_name || 'مگاکارت دیجیتال سیستم',
          zarinpal_merchant: record.zarinpal_merchant || ''
        };
      }
      return { bank_card: '۵۰۲۲-۲۹۱۰-۱۲۳۴-۵۶۷۸', bank_name: 'مگاکارت دیجیتال سیستم', zarinpal_merchant: '' };
    } catch {
      console.warn('Directus site settings fetch failed, using defaults');
      return { bank_card: '۵۰۲۲-۲۹۱۰-۱۲۳۴-۵۶۷۸', bank_name: 'مگاکارت دیجیتال سیستم', zarinpal_merchant: '' };
    }
  },
  saveSiteSettings: async (settings: { bank_card?: string; bank_name?: string; zarinpal_merchant?: string }): Promise<void> => {
    try {
      let res = await fetch(`${DIRECTUS_BASE_URL}/items/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) return;

      res = await fetch(`${DIRECTUS_BASE_URL}/items/site_settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) return;

      res = await fetch(`${DIRECTUS_BASE_URL}/items/settings/1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) return;

      res = await fetch(`${DIRECTUS_BASE_URL}/items/site_settings/1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) return;

      res = await fetch(`${DIRECTUS_BASE_URL}/items/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id: 1, ...settings })
      });
      if (res.ok) return;

      res = await fetch(`${DIRECTUS_BASE_URL}/items/site_settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id: 1, ...settings })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed to save site settings in Directus:', errText);
        throw new Error('خطا در پاسخ‌دهی پایگاه داده هنگام ذخیره تنظیمات');
      }
    } catch (err: any) {
      throw new Error('خطا در ذخیره تنظیمات حساب بانکی: ' + err.message);
    }
  },

  // ---- WALLETS & WALLET TRANSACTIONS ----
  getWallet: async (userId: string, tenantId?: string | null): Promise<Wallet> => {
    const cleanUserId = toUUID(userId);
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/wallets?filter[user_id][_eq]=${cleanUserId}`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        const walletsList = json?.data || [];
        if (walletsList.length > 0) {
          const w = walletsList[0];
          return {
            id: w.id,
            user_id: typeof w.user_id === 'object' ? w.user_id?.id || cleanUserId : w.user_id,
            tenant_id: w.tenant_id ? (typeof w.tenant_id === 'object' ? w.tenant_id?.id : w.tenant_id) : null,
            balance: Number(w.balance || 0),
            status: w.status || 'active',
            created_at: w.created_at,
            updated_at: w.updated_at
          };
        }
      }

      // Wallet doesn't exist yet: Auto-create a new active wallet for this user
      const newWalletPayload = {
        user_id: cleanUserId,
        tenant_id: tenantId ? toUUID(tenantId) : null,
        balance: 0,
        status: 'active'
      };

      const createRes = await fetch(`${DIRECTUS_BASE_URL}/items/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newWalletPayload)
      });

      if (createRes.ok) {
        const createJson = await createRes.json();
        const created = createJson?.data;
        return {
          id: created?.id || Date.now(),
          user_id: cleanUserId,
          tenant_id: tenantId ? toUUID(tenantId) : null,
          balance: 0,
          status: 'active',
          created_at: created?.created_at,
          updated_at: created?.updated_at
        };
      }
    } catch (e) {
      console.warn("Directus getWallet error:", e);
    }

    // Fallback default active wallet
    return {
      id: 1,
      user_id: cleanUserId,
      tenant_id: tenantId ? toUUID(tenantId) : null,
      balance: 0,
      status: 'active'
    };
  },

  getAllWallets: async (): Promise<Wallet[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/wallets?fields=*,user_id.first_name,user_id.last_name,user_id.email,user_id.location`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        const rawWallets = json?.data || [];
        return rawWallets.map((w: any) => {
          const userObj = typeof w.user_id === 'object' ? w.user_id : null;
          const uName = userObj ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() : '';
          return {
            id: w.id,
            user_id: userObj ? userObj.id : (w.user_id || ''),
            tenant_id: w.tenant_id ? (typeof w.tenant_id === 'object' ? w.tenant_id?.id : w.tenant_id) : null,
            balance: Number(w.balance || 0),
            status: w.status || 'active',
            created_at: w.created_at,
            updated_at: w.updated_at,
            user_name: uName || 'کاربر سیستم',
            user_email: userObj?.email || '',
            user_phone: userObj?.location || ''
          };
        });
      }
    } catch (e) {
      console.warn("Directus getAllWallets error:", e);
    }
    return [];
  },

  getWalletTransactions: async (walletId: number | string): Promise<WalletTransaction[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/wallet_transactions?filter[wallet_id][_eq]=${walletId}&sort=-date_created`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        const txs = json?.data || [];
        return txs.map((t: any) => ({
          id: t.id,
          user_created: t.user_created,
          date_created: t.date_created,
          wallet_id: typeof t.wallet_id === 'object' ? t.wallet_id?.id : t.wallet_id,
          type: t.type || 'credit',
          amount: Number(t.amount || 0),
          balance_after: Number(t.balance_after || 0),
          reference_id: t.reference_id || null,
          status: t.status || 'completed'
        }));
      }
    } catch (e) {
      console.warn("Directus getWalletTransactions error:", e);
    }
    return [];
  },

  getAllWalletTransactions: async (): Promise<WalletTransaction[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/wallet_transactions?fields=*,wallet_id.id,wallet_id.user_id.first_name,wallet_id.user_id.last_name,wallet_id.user_id.email&sort=-date_created`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        const txs = json?.data || [];
        return txs.map((t: any) => {
          const wObj = typeof t.wallet_id === 'object' ? t.wallet_id : null;
          const uObj = wObj && typeof wObj.user_id === 'object' ? wObj.user_id : null;
          const uName = uObj ? `${uObj.first_name || ''} ${uObj.last_name || ''}`.trim() : '';
          return {
            id: t.id,
            user_created: t.user_created,
            date_created: t.date_created,
            wallet_id: wObj ? wObj.id : t.wallet_id,
            type: t.type || 'credit',
            amount: Number(t.amount || 0),
            balance_after: Number(t.balance_after || 0),
            reference_id: t.reference_id || null,
            status: t.status || 'completed',
            user_name: uName || '',
            user_email: uObj?.email || ''
          };
        });
      }
    } catch (e) {
      console.warn("Directus getAllWalletTransactions error:", e);
    }
    return [];
  },

  createWalletTransaction: async (data: {
    wallet_id: number | string;
    type: 'credit' | 'debit';
    amount: number;
    reference_id?: string;
    status?: 'pending' | 'completed' | 'failed' | 'rejected';
  }): Promise<WalletTransaction> => {
    // 1. Fetch current wallet balance
    const walletRes = await fetch(`${DIRECTUS_BASE_URL}/items/wallets/${data.wallet_id}`, {
      headers: { ...getAuthHeaders() }
    });
    let currentBalance = 0;
    if (walletRes.ok) {
      const wJson = await walletRes.json();
      currentBalance = Number(wJson?.data?.balance || 0);
    }

    const txStatus = data.status || 'completed';
    const amountNum = Number(data.amount);

    if (data.type === 'debit' && currentBalance < amountNum && txStatus === 'completed') {
      throw new Error('موجودی کیف پول شما برای انجام این تراکنش کافی نیست.');
    }

    const balanceAfter = txStatus === 'completed'
      ? (data.type === 'credit' ? currentBalance + amountNum : currentBalance - amountNum)
      : currentBalance;

    // 2. Post transaction record
    const txPayload = {
      wallet_id: data.wallet_id,
      type: data.type,
      amount: amountNum,
      balance_after: balanceAfter,
      reference_id: data.reference_id || `WTX-${Date.now()}`,
      status: txStatus
    };

    const txRes = await fetch(`${DIRECTUS_BASE_URL}/items/wallet_transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(txPayload)
    });

    if (!txRes.ok) {
      const errText = await txRes.text().catch(() => '');
      throw new Error('خطا در ثبت تراکنش کیف پول: ' + errText);
    }

    const createdTxData = await txRes.json();

    // 3. If transaction status is completed, update wallet balance
    if (txStatus === 'completed') {
      await fetch(`${DIRECTUS_BASE_URL}/items/wallets/${data.wallet_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          balance: balanceAfter,
          updated_at: new Date().toISOString()
        })
      });
    }

    return createdTxData?.data;
  },

  adminAdjustWallet: async (
    walletId: number | string,
    type: 'credit' | 'debit',
    amount: number,
    referenceId?: string
  ): Promise<void> => {
    await dbService.createWalletTransaction({
      wallet_id: walletId,
      type,
      amount,
      reference_id: referenceId || `ADMIN-ADJUST-${Date.now()}`,
      status: 'completed'
    });
  },

  adminUpdateWalletStatus: async (
    walletId: number | string,
    status: 'active' | 'frozen' | 'blocked'
  ): Promise<void> => {
    const res = await fetch(`${DIRECTUS_BASE_URL}/items/wallets/${walletId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });

    if (!res.ok) {
      throw new Error('خطا در تغییر وضعیت کیف پول');
    }
  },

  updateWalletTransactionStatus: async (
    txId: number | string,
    walletId: number | string,
    newStatus: 'completed' | 'rejected' | 'failed'
  ): Promise<void> => {
    // 1. Fetch the transaction details
    const txRes = await fetch(`${DIRECTUS_BASE_URL}/items/wallet_transactions/${txId}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!txRes.ok) throw new Error('تراکنش یافت نشد.');
    const txJson = await txRes.json();
    const txData = txJson?.data;

    if (!txData) throw new Error('اطلاعات تراکنش در پایگاه داده وجود ندارد.');
    if (txData.status === newStatus) return; // Already updated

    // If approving a pending credit transaction, update wallet balance!
    if (newStatus === 'completed' && txData.status !== 'completed') {
      const walletRes = await fetch(`${DIRECTUS_BASE_URL}/items/wallets/${walletId}`, {
        headers: { ...getAuthHeaders() }
      });
      if (walletRes.ok) {
        const wJson = await walletRes.json();
        const currentBalance = Number(wJson?.data?.balance || 0);
        const amountNum = Number(txData.amount || 0);
        const newBalance = txData.type === 'credit' ? currentBalance + amountNum : Math.max(0, currentBalance - amountNum);

        // Update transaction balance_after & status
        await fetch(`${DIRECTUS_BASE_URL}/items/wallet_transactions/${txId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            status: newStatus,
            balance_after: newBalance
          })
        });

        // Update wallet balance
        await fetch(`${DIRECTUS_BASE_URL}/items/wallets/${walletId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
        });
        return;
      }
    }

    // Otherwise just update transaction status
    await fetch(`${DIRECTUS_BASE_URL}/items/wallet_transactions/${txId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status: newStatus })
    });
  },

  getZarinpalMerchant: async (): Promise<string> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/settings`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data[0] : json?.data;
        if (data?.zarinpal_merchant) {
          return data.zarinpal_merchant;
        }
      }
    } catch (e) {
      console.warn("Directus getZarinpalMerchant error:", e);
    }
    return '';
  },

  saveZarinpalMerchant: async (merchantId: string): Promise<void> => {
    try {
      // Try PATCH to /items/settings or POST
      let res = await fetch(`${DIRECTUS_BASE_URL}/items/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ zarinpal_merchant: merchantId })
      });
      if (res.ok) return;

      res = await fetch(`${DIRECTUS_BASE_URL}/items/settings/1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ zarinpal_merchant: merchantId })
      });
      if (res.ok) return;

      res = await fetch(`${DIRECTUS_BASE_URL}/items/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id: 1, zarinpal_merchant: merchantId })
      });
    } catch (err: any) {
      throw new Error('خطا در ذخیره‌سازی مرچنت زرین‌پال: ' + err.message);
    }
  },

  // ---- ANALYTICS ----
  getAnalyticsByCard: async (cardId: string): Promise<CardAnalytics[]> => {
    const res = await fetch(`${DIRECTUS_BASE_URL}/items/card_analytics?filter[card_id][_eq]=${toUUID(cardId)}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('خطا در دریافت آمار از پایگاه داده');
    const json = await res.json();
    return json?.data || [];
  },
  getAllAnalytics: async (): Promise<CardAnalytics[]> => {
    const res = await fetch(`${DIRECTUS_BASE_URL}/items/card_analytics`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('خطا در دریافت آمار کلی از پایگاه داده');
    const json = await res.json();
    return json?.data || [];
  },
  getAllUsers: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/users`, {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) {
        return SEED_USERS;
      }
      const json = await res.json();
      return json?.data || SEED_USERS;
    } catch (err) {
      console.warn('Error fetching users from Directus, using seeds:', err);
      return SEED_USERS;
    }
  },
  updateUser: async (userId: string, data: Partial<any>): Promise<void> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        console.warn('Failed to update user in Directus directly');
      }
    } catch (err) {
      console.warn('Error updating user:', err);
    }
  },
  logVisit: async (cardId: string, device: string, referrer: string, country: string): Promise<void> => {
    const cleanCardId = toUUID(cardId);
    const newRecord = {
      id: toUUID('a-' + Math.random().toString(36).substr(2, 9)),
      card_id: cleanCardId,
      device,
      referrer: referrer || 'مستقیم',
      country: country || 'ایران',
      created_at: new Date().toISOString()
    };

    // Post analytics directly to Directus
    const res = await fetch(`${DIRECTUS_BASE_URL}/items/card_analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
    if (!res.ok) {
      console.warn('Failed to post visitor analytics directly to Directus');
    }

    // Also update views_count on the card
    try {
      const cardRes = await fetch(`${DIRECTUS_BASE_URL}/items/cards/${cleanCardId}`);
      if (cardRes.ok) {
        const cardData = (await cardRes.json())?.data;
        if (cardData) {
          const updatedViews = (cardData.views_count || 0) + 1;
          await fetch(`${DIRECTUS_BASE_URL}/items/cards/${cleanCardId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ views_count: updatedViews })
          });
        }
      }
    } catch (err) {
      console.warn('Could not increment card views count directly:', err);
    }
  }
};

// USER SESSION MANAGEMENT (ONLINE DIRECTUS AUTH)
export const authService = {
  getCurrentUser: (): UserSession | null => {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem('digital_card_session');
    return session ? JSON.parse(session) : null;
  },
  
  login: async (loginId: string, password?: string): Promise<UserSession | null> => {
    const isEmail = loginId.includes('@');
    
    // Quick login / demo accounts bypass for visual evaluation flow
    const isDemo = ['demo@brandyar.com', 'tenant@brandyar.com', 'admin@brandyar.com', 'admin@megacard.ir'].includes(loginId.toLowerCase());
    if (isDemo && !password) {
      let role: 'customer' | 'tenant' | 'admin' = 'customer';
      let name = 'کاربر دمو';
      if (loginId.toLowerCase() === 'tenant@brandyar.com') {
        role = 'tenant';
        name = 'نماینده سیستم (تک‌کارت)';
      } else if (loginId.toLowerCase() === 'admin@brandyar.com' || loginId.toLowerCase() === 'admin@megacard.ir') {
        role = 'admin';
        name = 'مدیر ارشد سیستم';
      }
      let targetId = '';
      const lowerLogin = loginId.toLowerCase();
      if (lowerLogin === 'demo@brandyar.com') {
        targetId = toUUID('u-1');
      } else if (lowerLogin === 'tenant@brandyar.com') {
        targetId = toUUID('u-tenant');
      } else if (lowerLogin === 'admin@brandyar.com') {
        targetId = toUUID('u-admin');
      } else if (lowerLogin === 'admin@megacard.ir') {
        targetId = '8c2678b2-fab5-4c94-b6d6-89c3ca209431';
      } else {
        targetId = toUUID('u-' + loginId.split('@')[0]);
      }

      const session: UserSession = {
        id: targetId,
        email: loginId.toLowerCase(),
        name: name,
        role: role
      };
      localStorage.setItem('digital_card_session', JSON.stringify(session));
      return session;
    }

    if (!password) {
      throw new Error('وارد کردن رمز عبور الزامی است.');
    }

    let resolvedEmail = loginId;

    if (!isEmail) {
      // Find the user's email based on their mobile number (which is stored in the public-readable 'location' field)
      const lookupUrl = `${DIRECTUS_BASE_URL}/users?filter[location][_eq]=${encodeURIComponent(loginId)}`;
      const lookupRes = await fetch(lookupUrl);
      if (!lookupRes.ok) {
        throw new Error('خطا در ارتباط با سرور پایگاه داده هنگام بررسی شماره موبایل.');
      }
      const lookupJson = await lookupRes.ok ? await lookupRes.json() : null;
      const apiUser = lookupJson?.data?.[0];
      if (!apiUser) {
        throw new Error('کاربری با این شماره موبایل یافت نشد.');
      }
      resolvedEmail = apiUser.email;
    }

    // Call Directus built-in password login endpoint
    const loginRes = await fetch(`${DIRECTUS_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: resolvedEmail,
        password: password
      })
    });

    if (!loginRes.ok) {
      throw new Error('رمز عبور وارد شده نادرست است یا حساب کاربری فعال نیست.');
    }

    const loginData = await loginRes.json();
    const accessToken = loginData?.data?.access_token;
    if (!accessToken) {
      throw new Error('خطا در دریافت توکن احراز هویت از پایگاه داده.');
    }

    // Fetch full profile info from /users/me using the bearer token
    const profileRes = await fetch(`${DIRECTUS_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!profileRes.ok) {
      throw new Error('خطا در دریافت اطلاعات کاربری از پایگاه داده.');
    }

    const profileJson = await profileRes.json();
    const profile = profileJson?.data;
    if (!profile) {
      throw new Error('اطلاعات پروفایل کاربر خالی است.');
    }

    // Resolve Role
    const rawRole = profile.role || '';
    const resolvedRole: 'customer' | 'tenant' | 'admin' = 
      (profile.email?.toLowerCase() === 'admin@megacard.ir' || 
       profile.email?.toLowerCase() === 'admin@brandyar.com' || 
       rawRole === '327ff892-52b4-47fb-939d-8c15473f0f27' || 
       rawRole === '745c670e-f21a-43de-8a14-0dccf10cb900' || 
       rawRole === 'admin') ? 'admin' :
      (profile.email?.toLowerCase() === 'tenant@brandyar.com' || rawRole === 'tenant') ? 'tenant' : 'customer';

    const session: UserSession = {
      id: profile.id,
      email: profile.email,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'کاربر مگاکارت',
      role: resolvedRole,
      tenant_id: profile.tenant_id ? toUUID(profile.tenant_id) : null,
      access_token: accessToken
    };

    localStorage.setItem('digital_card_session', JSON.stringify(session));
    return session;
  },

  register: async (firstName: string, lastName: string, email: string, mobile: string, password: string): Promise<UserSession> => {
    // Check if email already exists in Directus /users collection
    const checkEmailRes = await fetch(`${DIRECTUS_BASE_URL}/users?filter[email][_eq]=${encodeURIComponent(email)}`);
    if (!checkEmailRes.ok) {
      throw new Error('خطا در ارتباط با پایگاه داده هنگام بررسی ایمیل تکراری.');
    }
    const emailJson = await checkEmailRes.json();
    if (emailJson?.data?.length > 0) {
      throw new Error('حساب کاربری با این آدرس ایمیل قبلاً ثبت شده است.');
    }

    // Check if mobile number already exists in 'location' field of /users
    const checkPhoneRes = await fetch(`${DIRECTUS_BASE_URL}/users?filter[location][_eq]=${encodeURIComponent(mobile)}`);
    if (!checkPhoneRes.ok) {
      throw new Error('خطا در ارتباط با پایگاه داده هنگام بررسی شماره موبایل تکراری.');
    }
    const phoneJson = await checkPhoneRes.json();
    if (phoneJson?.data?.length > 0) {
      throw new Error('حساب کاربری با این شماره موبایل قبلاً ثبت شده است.');
    }

    // Create user in Directus users system collection
    const newUser = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
      user_phone: mobile, // Requirement: store in user_phone
      location: mobile,   // Store in location for public query availability during login
      role: '05826f60-e759-4348-b4c2-6f085cd5e425', // customer role
      status: 'active'
    };

    const res = await fetch(`${DIRECTUS_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const errorMsg = errorData?.errors?.[0]?.message || 'خطا در ثبت مشخصات در پایگاه داده.';
      throw new Error(errorMsg);
    }

    const createdUserData = await res.json();
    const createdUser = createdUserData?.data;
    if (!createdUser) {
      throw new Error('پاسخ خالی از پایگاه داده پس از ثبت نام.');
    }

    try {
      // Automatically login to retrieve the Directus JWT access_token and full session details
      const resolvedSession = await authService.login(email, password);
      if (resolvedSession) {
        return resolvedSession;
      }
    } catch (loginErr) {
      console.warn('Auto login after registration failed:', loginErr);
    }

    const session: UserSession = {
      id: createdUser.id,
      email: createdUser.email,
      name: `${createdUser.first_name || ''} ${createdUser.last_name || ''}`.trim() || 'کاربر جدید',
      role: 'customer',
      tenant_id: null
    };

    localStorage.setItem('digital_card_session', JSON.stringify(session));
    return session;
  },

  logout: (): void => {
    localStorage.removeItem('digital_card_session');
  },

  verifySession: async (): Promise<boolean> => {
    if (typeof window === 'undefined') return true;
    const sessionStr = localStorage.getItem('digital_card_session');
    if (!sessionStr) return false;
    try {
      const session = JSON.parse(sessionStr);
      if (!session || !session.access_token) return true; // Demo or local session
      
      const res = await fetch(`${DIRECTUS_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (res.status === 401 || res.status === 403) {
        notifyTokenExpired('توکن کاربری شما منقضی شده است. لطفاً مجدداً وارد حساب کاربری شوید.');
        return false;
      }
      return res.ok;
    } catch (e) {
      console.warn("Session token verification check failed:", e);
      return true;
    }
  }
};
