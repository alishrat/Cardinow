import { NextRequest, NextResponse } from "next/server";

let rawBaseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus-iuao17eclszuzc06zaqzodkr.89.42.199.190.sslip.io';
if (rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl)) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const DIRECTUS_URL = rawBaseUrl.replace(/\/+$/, '');

function getAuthHeaders(): Record<string, string> {
  const token = process.env.DIRECTUS_STATIC_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN;
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

// Translate Zarinpal error codes
function getZarinpalErrorMessage(code: number): string {
  switch (code) {
    case -9:
      return 'خطای خطای صادرشده از درگاه: خطای خطای کد مرچنت زرین‌پال (Merchant ID معتبر نیست یا کوتاه است).';
    case -10:
      return 'آی‌پی یا دامنه مبدا با اطلاعات ثبت‌شده در زرین‌پال مطابقت ندارد.';
    case -11:
      return 'مرچنت کد فعال نیست. لطفاً با پشتیبانی زرین‌پال تماس بگیرید.';
    case -12:
      return 'تعداد تلاش‌های ناموفق بیش از حد مجاز است.';
    case -15:
      return 'درگاه پرداخت به دلیل تخلف یا عدم تکمیل مدارک تعلیق شده است.';
    case -21:
      return 'هیچ نوع مالیاتی برای این پذیرنده یافت نشد.';
    case -22:
      return 'تراکنش ناموفق (پذیرنده غیرفعال است).';
    case -33:
      return 'مبلغ تراکنش با قوانین درگاه مطابقت ندارد.';
    case -34:
      return 'مبلغ تراکنش کمتر از حداقل حد مجاز (۱,۰۰۰ تومان) است.';
    case -35:
      return 'مبلغ تراکنش بیش از حداکثر حد مجاز است.';
    case -40:
      return 'پارامترهای ارسالی نامعتبر است.';
    default:
      return `خطای کد ${code} در اتصال به درگاه زرین‌پال.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      description,
      user_id,
      tenant_id,
      payment_type, // 'plan' | 'wallet'
      plan_id,
      plan_title,
      plan_duration,
      wallet_id,
      email,
      mobile,
      callback_url: customCallbackUrl
    } = body;

    const amountNum = Number(amount);
    if (!amountNum || isNaN(amountNum) || amountNum < 1000) {
      return NextResponse.json(
        { success: false, error: 'مبلغ تراکنش معتبر نیست (حداقل ۱,۰۰۰ تومان).' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر ارسال نشده است.' },
        { status: 400 }
      );
    }

    // 1. Fetch Zarinpal Merchant ID from Directus settings collection
    let zarinpalMerchant = '';
    try {
      const settingsRes = await fetch(`${DIRECTUS_URL}/items/settings?limit=1`, {
        headers: { ...getAuthHeaders() },
        cache: 'no-store'
      });
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        const settingsData = Array.isArray(settingsJson?.data) ? settingsJson.data[0] : settingsJson?.data;
        if (settingsData?.zarinpal_merchant) {
          zarinpalMerchant = settingsData.zarinpal_merchant.trim();
        }
      }
    } catch (sErr) {
      console.warn('Could not fetch settings for Zarinpal merchant:', sErr);
    }

    if (!zarinpalMerchant) {
      return NextResponse.json(
        {
          success: false,
          error: 'کد مرچنت زرین‌پال (zarinpal_merchant) در تنظیمات سیستم تعریف نشده است. لطفاً ابتدا در بخش تنظیمات یا مدیریت کیف‌پول‌ها کد مرچنت زرین‌پال را ذخیره نمایید.'
        },
        { status: 400 }
      );
    }

    // 2. Build origin callback URL
    let callbackUrl = customCallbackUrl;
    if (!callbackUrl) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      callbackUrl = `${protocol}://${host}/payment/callback`;
    }

    // 3. Call Zarinpal REST API v4 Payment Request Endpoint
    const zarinpalPayload = {
      merchant_id: zarinpalMerchant,
      amount: amountNum * 10, // Convert Tomans to Rials for Zarinpal IRR API
      currency: "IRR",
      description: description || `پرداخت آنلاین مگاکارت - ${payment_type === 'plan' ? 'خرید اشتراک' : 'شارژ کیف پول'}`,
      callback_url: callbackUrl,
      metadata: {
        mobile: mobile || "",
        email: email || ""
      }
    };

    console.log('[Zarinpal Request] Sending request to Zarinpal:', {
      merchant_id: zarinpalMerchant.slice(0, 8) + '***',
      amount_tomans: amountNum,
      callback_url: callbackUrl
    });

    let zarinpalRes;
    try {
      zarinpalRes = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(zarinpalPayload)
      });
    } catch (netErr: any) {
      console.error('[Zarinpal Request] Network error connecting to Zarinpal:', netErr);
      return NextResponse.json(
        { success: false, error: 'خطا در برقراری ارتباط شبکه با درگاه زرین‌پال: ' + netErr.message },
        { status: 500 }
      );
    }

    const zarinpalJson = await zarinpalRes.json().catch(() => null);

    if (!zarinpalRes.ok || !zarinpalJson?.data || zarinpalJson?.data?.code !== 100) {
      const errCode = zarinpalJson?.data?.code || zarinpalJson?.errors?.code || -1;
      const errMsg = getZarinpalErrorMessage(errCode);
      console.error('[Zarinpal Request] Failed:', zarinpalJson);
      return NextResponse.json(
        {
          success: false,
          error: errMsg,
          details: zarinpalJson?.errors || zarinpalJson
        },
        { status: 400 }
      );
    }

    const authority = zarinpalJson.data.authority;
    if (!authority) {
      return NextResponse.json(
        { success: false, error: 'شناسه اتوریتی (Authority) از درگاه زرین‌پال دریافت نشد.' },
        { status: 500 }
      );
    }

    // 4. Create pending Transaction in Directus
    const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const txRecord = {
      id: txId,
      user_id: user_id,
      tenant_id: tenant_id || null,
      amount: amountNum,
      gateway: 'زرین‌پال',
      authority: authority,
      ref_id: 'در انتظار پرداخت',
      status: 'pending',
      payload: JSON.stringify({
        payment_type: payment_type || 'wallet',
        plan_id: plan_id || null,
        plan_title: plan_title || null,
        plan_duration: plan_duration || null,
        wallet_id: wallet_id || null,
        user_id: user_id,
        tenant_id: tenant_id || null,
        created_at: new Date().toISOString()
      })
    };

    try {
      await fetch(`${DIRECTUS_URL}/items/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(txRecord)
      });
    } catch (txDbErr) {
      console.warn('Could not save pending transaction to Directus:', txDbErr);
    }

    const redirectUrl = `https://www.zarinpal.com/pg/StartPay/${authority}`;

    return NextResponse.json({
      success: true,
      url: redirectUrl,
      authority: authority,
      transaction_id: txId,
      amount: amountNum
    });

  } catch (err: any) {
    console.error('[Zarinpal Request Route Error]:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش درخواست پرداخت: ' + err.message },
      { status: 500 }
    );
  }
}
