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

function cleanMerchant(str: string): string {
  if (!str) return '';
  const p2e = str
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return p2e.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[^a-zA-Z0-9-]/g, '').trim();
}

// Translate Zarinpal error codes with details
function getZarinpalErrorMessage(code: number, originalMsg?: string, details?: any): string {
  if (code === -9) {
    return 'کد مرچنت زرین‌پال (Merchant ID) معتبر نیست. کد مرچنت باید یک شناسه ۳۶ کاراکتری معتبر ثبت‌شده در زرین‌پال باشد (مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).';
  }
  if (code === -10) {
    return 'آی‌پی یا دامنه مبدا با اطلاعات ثبت‌شده در پنل زرین‌پال مطابقت ندارد.';
  }
  if (code === -11) {
    return 'مرچنت کد در زرین‌پال فعال نیست یا مدارک درگاه هنوز تایید نشده است. لطفاً با پشتیبانی زرین‌پال تماس بگیرید.';
  }
  if (code === -12) {
    return 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً دقایقی دیگر مجدداً تلاش نمایید.';
  }
  if (code === -14) {
    return 'دامنه آدرس بازگشت (Callback Domain) با دامنه ثبت‌شده برای این درگاه در پنل زرین‌پال مطابقت ندارد. لطفاً درگاه را روی دامنه اصلی خود فراخوانی کنید یا جهت تست، حالت Sandbox را در تنظیمات فعال نمایید.';
  }
  if (code === -15) {
    return 'درگاه پرداخت توسط زرین‌پال به دلیل عدم احراز یا نقض قوانین تعلیق گردیده است.';
  }
  if (code === -21) {
    return 'هیچ نوع اطلاعات مالیاتی برای این پذیرنده در سامانه مالیاتی زرین‌پال یافت نشد.';
  }
  if (code === -22) {
    return 'تراکنش ناموفق است؛ پذیرنده درگاه غیرفعال شده است.';
  }
  if (code === -33) {
    return 'مبلغ تراکنش با قوانین و سقف تراکنش درگاه زرین‌پال همخوانی ندارد.';
  }
  if (code === -34) {
    return 'مبلغ تراکنش کمتر از حداقل حد مجاز زرین‌پال (۱,۰۰۰ تومان) است.';
  }
  if (code === -35) {
    return 'مبلغ تراکنش بیش از حداکثر سقف مجاز پرداخت است.';
  }
  if (code === -40) {
    return 'پارامترهای ارسالی به درگاه پرداخت نامعتبر است.';
  }
  return originalMsg || `خطای درگاه زرین‌پال (کد خطا: ${code})`;
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

    // 1. Fetch Zarinpal Merchant ID from Directus settings / site_settings collection
    let rawMerchant = '';
    let isSandbox = false;
    try {
      let settingsRes = await fetch(`${DIRECTUS_URL}/items/settings?limit=1`, {
        headers: { ...getAuthHeaders() },
        cache: 'no-store'
      });
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        const settingsData = Array.isArray(settingsJson?.data) ? settingsJson.data[0] : settingsJson?.data;
        if (settingsData?.zarinpal_merchant) {
          rawMerchant = settingsData.zarinpal_merchant;
        }
        if (settingsData?.zarinpal_sandbox === true || settingsData?.zarinpal_sandbox === 'true' || settingsData?.zarinpal_sandbox === 1) {
          isSandbox = true;
        }
      }

      if (!rawMerchant) {
        const siteRes = await fetch(`${DIRECTUS_URL}/items/site_settings?limit=1`, {
          headers: { ...getAuthHeaders() },
          cache: 'no-store'
        });
        if (siteRes.ok) {
          const siteJson = await siteRes.json();
          const siteData = Array.isArray(siteJson?.data) ? siteJson.data[0] : siteJson?.data;
          if (siteData?.zarinpal_merchant) {
            rawMerchant = siteData.zarinpal_merchant;
          }
          if (siteData?.zarinpal_sandbox === true || siteData?.zarinpal_sandbox === 'true') {
            isSandbox = true;
          }
        }
      }
    } catch (sErr) {
      console.warn('Could not fetch settings for Zarinpal merchant:', sErr);
    }

    if (!rawMerchant) {
      rawMerchant = process.env.ZARINPAL_MERCHANT_ID || process.env.NEXT_PUBLIC_ZARINPAL_MERCHANT_ID || '';
    }

    let zarinpalMerchant = cleanMerchant(rawMerchant);

    if (zarinpalMerchant.toLowerCase().includes('sandbox') || zarinpalMerchant === '00000000-0000-0000-0000-000000000000') {
      isSandbox = true;
    }

    if (!zarinpalMerchant) {
      if (isSandbox) {
        zarinpalMerchant = '00000000-0000-0000-0000-000000000000';
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'کد مرچنت زرین‌پال در تنظیمات سیستم ثبت نشده است. لطفاً در بخش تنظیمات پنل مدیریت، کد مرچنت ۳۶ رقمی زرین‌پال خود را وارد نمایید.'
          },
          { status: 400 }
        );
      }
    }

    // Validate merchant ID length
    if (!isSandbox && zarinpalMerchant.length < 32) {
      return NextResponse.json(
        {
          success: false,
          error: `کد مرچنت زرین‌پال وارد شده (${zarinpalMerchant}) نامعتبر یا کوتاه است. کد مرچنت اختصاصی زرین‌پال باید ۳۶ کاراکتر به فرمت xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx باشد.`
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
      amount: amountNum, // Zarinpal v4 supports Tomans (IRT)
      currency: "IRT",
      description: description || `پرداخت آنلاین مگاکارت - ${payment_type === 'plan' ? 'خرید اشتراک' : 'شارژ کیف پول'}`,
      callback_url: callbackUrl,
      metadata: {
        mobile: mobile || "",
        email: email || ""
      }
    };

    const zarinpalApiEndpoint = isSandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
      : 'https://api.zarinpal.com/pg/v4/payment/request.json';

    console.log('[Zarinpal Request] Sending request to Zarinpal:', {
      endpoint: zarinpalApiEndpoint,
      isSandbox,
      merchant_id: zarinpalMerchant.slice(0, 8) + '***',
      amount_tomans: amountNum,
      callback_url: callbackUrl
    });

    let zarinpalRes;
    try {
      zarinpalRes = await fetch(zarinpalApiEndpoint, {
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
      const rawErrMsg = zarinpalJson?.errors?.message || zarinpalJson?.data?.message;
      const errMsg = getZarinpalErrorMessage(errCode, rawErrMsg, zarinpalJson?.errors);
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
      gateway: isSandbox ? 'زرین‌پال (آزمایشی)' : 'زرین‌پال',
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
        is_sandbox: isSandbox,
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

    const redirectUrl = isSandbox
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://www.zarinpal.com/pg/StartPay/${authority}`;

    return NextResponse.json({
      success: true,
      url: redirectUrl,
      authority: authority,
      transaction_id: txId,
      amount: amountNum,
      is_sandbox: isSandbox
    });

  } catch (err: any) {
    console.error('[Zarinpal Request Route Error]:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش درخواست پرداخت: ' + err.message },
      { status: 500 }
    );
  }
}
