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
  duration_days: number;
  features: string[]; // parsed from json or string[]
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
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
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'tenant' | 'admin';
  tenant_id?: string | null;
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
  // If it is a full URL, base64 data, or relative path that isn't a simple UUID
  if (/^https?:\/\//i.test(idOrUrl) || idOrUrl.startsWith('data:') || idOrUrl.startsWith('/') || idOrUrl.includes('?')) {
    return idOrUrl;
  }
  // Check if it is a UUID (Directus file ID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idOrUrl)) {
    // ALWAYS return the relative proxy path to ensure browser requests go through the HTTPS proxy
    // and avoid mixed content blockages or raw URL exposure.
    return `/api/directus/assets/${idOrUrl}`;
  }
  return idOrUrl;
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
    thumbnail: 'https://picsum.photos/300/200?random=100',
    is_premium: false,
    is_active: true,
    schema: {}
  },
  {
    id: 'temp-2',
    name: 'گرادینت کهکشانی (Neon Glass)',
    slug: 'neon-glass',
    thumbnail: 'https://picsum.photos/300/200?random=101',
    is_premium: true,
    is_active: true,
    schema: {}
  },
  {
    id: 'temp-3',
    name: 'مینیمال مدرن (Minimal)',
    slug: 'minimal',
    thumbnail: 'https://picsum.photos/300/200?random=102',
    is_premium: false,
    is_active: true,
    schema: {}
  },
  {
    id: 'temp-4',
    name: 'تاریک و طلایی لاکچری (Luxury Dark)',
    slug: 'luxury-dark',
    thumbnail: 'https://picsum.photos/300/200?random=103',
    is_premium: true,
    is_active: true,
    schema: {}
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
    tenant_id: 't-1'
  },
  {
    id: 'p-2',
    title: 'پلن نقره‌ای تجاری',
    price: 150000,
    duration_days: 90,
    features: ['ساخت ۳ کارت ویزیت فعال', 'دسترسی به تمامی تم‌ها', 'ویرایشگر پیشرفته', 'آمار بازدید نموداری', 'دکمه‌های اختصاصی نامحدود'],
    is_active: true,
    tenant_id: 't-1'
  },
  {
    id: 'p-3',
    title: 'پلن طلایی حرفه‌ای',
    price: 490000,
    duration_days: 365,
    features: ['کارت ویزیت نامحدود', 'تمامی تم‌ها + بارگذاری کاور اختصاصی', 'کد نویسی CSS اختصاصی', 'آمار پیشرفته دستگاه و ارجاع‌دهنده', 'اتصال به دامنه اختصاصی کاربر', 'پشتیبانی تلفنی ۲۴ ساعته'],
    is_active: true,
    tenant_id: 't-1'
  },
  {
    id: 'p-4',
    title: 'پلن ویژه تک‌کارت شیراز',
    price: 290000,
    duration_days: 180,
    features: ['ساخت ۲ کارت ویزیت', 'تمامی تم‌ها فعال', 'پشتیبانی محلی در شیراز', 'آموزش حضوری ساخت کارت'],
    is_active: true,
    tenant_id: 't-2'
  }
];

const SEED_CARDS: Card[] = [
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
    social_links: {
      phone: '۰۹۱۲۳۴۵۶۷۸۹',
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
    social_links: {
      phone: '۰۹۹۸۷۶۵۴۳۲۱',
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
    } else if (['profile_image', 'cover_image'].includes(key)) {
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

// Ensure the tenant_id in the payload is valid in Directus DB, otherwise set it to null to avoid foreign key violations
export async function ensureValidTenantId(payload: any): Promise<void> {
  if (payload && payload.tenant_id) {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/tenants`);
      if (res.ok) {
        const json = await res.json();
        const tenantsList = json?.data || [];
        const exists = tenantsList.some((t: any) => toUUID(t.id) === payload.tenant_id);
        if (!exists) {
          payload.tenant_id = null;
        }
      } else {
        payload.tenant_id = null;
      }
    } catch {
      payload.tenant_id = null;
    }
  }
}

// Automatically populates empty Directus collections with beautiful, standard seed items
export async function seedDirectusIfEmpty() {
  if (typeof window === 'undefined') return;
  console.log('Checking Directus collections to see if seeding is needed...');
  
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
        // Direct seeding for users because GET /users is protected by default and returns 403
        for (const item of seedItems) {
          const nameParts = (item.name || '').split(' ');
          const firstName = nameParts[0] || 'کاربر';
          const lastName = nameParts.slice(1).join(' ') || 'دمو';
          const resolvedRole = item.role === 'admin' 
            ? '745c670e-f21a-43de-8a14-0dccf10cb900' 
            : '05826f60-e759-4348-b4c2-6f085cd5e425'; // customer/tenant valid role

          const cleanItem = {
            id: toUUID(item.id),
            first_name: firstName,
            last_name: lastName,
            email: item.email,
            password: 'password123',
            role: resolvedRole,
            status: 'active'
          };

          try {
            await fetch(`${DIRECTUS_BASE_URL}/${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(cleanItem),
            });
          } catch (userErr) {
            // Ignore error if user already exists
          }
        }
        continue;
      }

      const res = await fetch(`${DIRECTUS_BASE_URL}/${endpoint}?limit=1`);
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (Array.isArray(data) && data.length === 0) {
          console.log(`Directus collection '${col}' is empty on server. Seeding ${seedItems.length} default items...`);
          for (const item of seedItems) {
            const cleanItem = cleanDataForDirectus(item);
            await fetch(`${DIRECTUS_BASE_URL}/${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(cleanItem),
            });
          }
        }
      }
    } catch (err) {
      console.warn(`Seeding check failed/skipped for collection '${col}':`, err);
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

// DATABASE SERVICE
export const dbService = {
  // ---- TENANTS ----
  getTenants: async (): Promise<Tenant[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/tenants`);
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
    const check = await fetch(`${DIRECTUS_BASE_URL}/items/tenants/${cleanId}`);
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/tenants/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/tenants`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) throw new Error('خطا در ذخیره‌سازی اطلاعات نماینده در پایگاه داده');
  },

  // ---- TEMPLATES ----
  getTemplates: async (): Promise<Template[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/items/templates`);
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
    
    const check = await fetch(`${DIRECTUS_BASE_URL}/items/templates/${cleanId}`);
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/templates/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/templates`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) throw new Error('خطا در ذخیره‌سازی قالب در پایگاه داده');
  },

  // ---- PLANS ----
  getPlans: async (tenantId?: string | null): Promise<Plan[]> => {
    try {
      let url = `${DIRECTUS_BASE_URL}/items/plans`;
      if (tenantId) {
        url += `?filter[tenant_id][_eq]=${toUUID(tenantId)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch plans from database');
      const json = await res.json();
      const data = json?.data || [];
      if (data.length === 0) {
        const tenantPlans = SEED_PLANS.filter(p => !tenantId || p.tenant_id === tenantId);
        return tenantPlans.length > 0 ? tenantPlans : SEED_PLANS;
      }
      return data.map((plan: any) => {
        let parsedFeatures = plan.features;
        if (typeof parsedFeatures === 'string') {
          try {
            parsedFeatures = JSON.parse(parsedFeatures);
          } catch {
            parsedFeatures = [];
          }
        }
        if (!Array.isArray(parsedFeatures)) {
          parsedFeatures = [];
        }
        return {
          ...plan,
          features: parsedFeatures
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

    const check = await fetch(`${DIRECTUS_BASE_URL}/items/plans/${cleanId}`);
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/plans/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/plans`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) throw new Error('خطا در ذخیره‌سازی پلن در پایگاه داده');
  },

  // ---- CARDS ----
  getCards: async (userId?: string): Promise<Card[]> => {
    let url = `${DIRECTUS_BASE_URL}/items/cards`;
    if (userId) {
      url += `?filter[user_id][_eq]=${toUUID(userId)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('خطا در دریافت اطلاعات کارت‌ها از پایگاه داده');
    const json = await res.json();
    return json?.data || [];
  },
  getCardBySlug: async (slug: string): Promise<Card | null> => {
    const url = `${DIRECTUS_BASE_URL}/items/cards?filter[slug][_eq]=${encodeURIComponent(slug)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('خطا در دریافت اطلاعات کارت با اسلاگ از پایگاه داده');
    const json = await res.json();
    return json?.data?.[0] || null;
  },
  getCardById: async (id: string): Promise<Card | null> => {
    const url = `${DIRECTUS_BASE_URL}/items/cards/${toUUID(id)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  },
  saveCard: async (card: Card): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(card);
    await ensureValidTenantId(cleanPayload);
    const cleanId = toUUID(card.id);

    const check = await fetch(`${DIRECTUS_BASE_URL}/items/cards/${cleanId}`);
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/cards/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/cards`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${DIRECTUS_BASE_URL}/items/cards/${toUUID(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('خطا در حذف کارت از پایگاه داده');
  },

  // ---- SUBSCRIPTIONS ----
  getSubscriptions: async (userId?: string): Promise<Subscription[]> => {
    let url = `${DIRECTUS_BASE_URL}/items/subscriptions`;
    if (userId) {
      url += `?filter[user_id][_eq]=${toUUID(userId)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('خطا در دریافت اشتراک‌ها از پایگاه داده');
    const json = await res.json();
    return json?.data || [];
  },
  saveSubscription: async (sub: Subscription): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(sub);
    await ensureValidTenantId(cleanPayload);
    const cleanId = toUUID(sub.id);

    const check = await fetch(`${DIRECTUS_BASE_URL}/items/subscriptions/${cleanId}`);
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/subscriptions/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/subscriptions`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) throw new Error('خطا در ذخیره‌سازی اشتراک در پایگاه داده');
  },

  // ---- TRANSACTIONS ----
  getTransactions: async (userId?: string): Promise<Transaction[]> => {
    let url = `${DIRECTUS_BASE_URL}/items/transactions`;
    if (userId) {
      url += `?filter[user_id][_eq]=${toUUID(userId)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('خطا در دریافت تراکنش‌ها از پایگاه داده');
    const json = await res.json();
    return json?.data || [];
  },
  saveTransaction: async (tx: Transaction): Promise<void> => {
    const cleanPayload = cleanDataForDirectus(tx);
    await ensureValidTenantId(cleanPayload);
    const cleanId = toUUID(tx.id);

    const check = await fetch(`${DIRECTUS_BASE_URL}/items/transactions/${cleanId}`);
    const method = check.ok ? 'PATCH' : 'POST';
    const url = check.ok 
      ? `${DIRECTUS_BASE_URL}/items/transactions/${cleanId}`
      : `${DIRECTUS_BASE_URL}/items/transactions`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload)
    });
    if (!res.ok) throw new Error('خطا در ذخیره‌سازی تراکنش در پایگاه داده');
  },

  // ---- ANALYTICS ----
  getAnalyticsByCard: async (cardId: string): Promise<CardAnalytics[]> => {
    const res = await fetch(`${DIRECTUS_BASE_URL}/items/card_analytics?filter[card_id][_eq]=${toUUID(cardId)}`);
    if (!res.ok) throw new Error('خطا در دریافت آمار از پایگاه داده');
    const json = await res.json();
    return json?.data || [];
  },
  getAllAnalytics: async (): Promise<CardAnalytics[]> => {
    const res = await fetch(`${DIRECTUS_BASE_URL}/items/card_analytics`);
    if (!res.ok) throw new Error('خطا در دریافت آمار کلی از پایگاه داده');
    const json = await res.json();
    return json?.data || [];
  },
  getAllUsers: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${DIRECTUS_BASE_URL}/users`);
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
    const isDemo = ['demo@brandyar.com', 'tenant@brandyar.com', 'admin@brandyar.com', 'admin@cardinow.ir'].includes(loginId.toLowerCase());
    if (isDemo && !password) {
      let role: 'customer' | 'tenant' | 'admin' = 'customer';
      let name = 'کاربر دمو';
      if (loginId.toLowerCase() === 'tenant@brandyar.com') {
        role = 'tenant';
        name = 'نماینده سیستم (تک‌کارت)';
      } else if (loginId.toLowerCase() === 'admin@brandyar.com' || loginId.toLowerCase() === 'admin@cardinow.ir') {
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
      } else if (lowerLogin === 'admin@cardinow.ir') {
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
      (profile.email?.toLowerCase() === 'admin@cardinow.ir' || 
       profile.email?.toLowerCase() === 'admin@brandyar.com' || 
       rawRole === '327ff892-52b4-47fb-939d-8c15473f0f27' || 
       rawRole === '745c670e-f21a-43de-8a14-0dccf10cb900' || 
       rawRole === 'admin') ? 'admin' :
      (profile.email?.toLowerCase() === 'tenant@brandyar.com' || rawRole === 'tenant') ? 'tenant' : 'customer';

    const session: UserSession = {
      id: profile.id,
      email: profile.email,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'کاربر کاردینو',
      role: resolvedRole,
      tenant_id: profile.tenant_id || toUUID('t-1')
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

    const session: UserSession = {
      id: createdUser.id,
      email: createdUser.email,
      name: `${createdUser.first_name || ''} ${createdUser.last_name || ''}`.trim() || 'کاربر جدید',
      role: 'customer',
      tenant_id: toUUID('t-1')
    };

    localStorage.setItem('digital_card_session', JSON.stringify(session));
    return session;
  },

  logout: (): void => {
    localStorage.removeItem('digital_card_session');
  }
};
