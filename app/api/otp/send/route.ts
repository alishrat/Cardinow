import { NextRequest, NextResponse } from "next/server";

let rawBaseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus-iuao17eclszuzc06zaqzodkr.89.42.199.190.sslip.io';
if (rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl)) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const DIRECTUS_URL = rawBaseUrl.replace(/\/+$/, '');

// Normalize Iranian mobile numbers to 09xxxxxxxxx format
function normalizeMobile(input: string): string {
  if (!input) return '';
  // Convert Persian/Arabic digits to Latin
  let str = input.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                 .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  // Remove non-digits
  str = str.replace(/\D/g, '');
  if (str.startsWith('98') && str.length === 12) {
    str = '0' + str.slice(2);
  } else if (str.length === 10 && str.startsWith('9')) {
    str = '0' + str;
  }
  return str;
}

export async function POST(req: NextRequest) {
  try {
    const { mobile: rawMobile, purpose = 'login' } = await req.json();
    const mobile = normalizeMobile(rawMobile);

    if (!mobile || !/^09\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل وارد شده معتبر نیست. (مثال: 09123456789)' },
        { status: 400 }
      );
    }

    // Generate 5-digit OTP
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 minutes

    // Store in Directus mobile_otps collection
    try {
      await fetch(`${DIRECTUS_URL}/items/mobile_otps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobile,
          code: code,
          expires_at: expiresAt,
          used: false
        })
      });
    } catch (dbErr) {
      console.warn('Could not save OTP to DB:', dbErr);
    }

    // Fetch IPPanel credentials from Directus settings collection
    let ippanelApi = '';
    let ippanelPattern = '';

    try {
      const settingsRes = await fetch(`${DIRECTUS_URL}/items/settings?limit=1`);
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        const settingsData = settingsJson?.data;
        if (Array.isArray(settingsData) && settingsData.length > 0) {
          ippanelApi = settingsData[0]?.ippanel_api || '';
          ippanelPattern = settingsData[0]?.ippanel_otp_pattern || '';
        } else if (settingsData && typeof settingsData === 'object') {
          ippanelApi = settingsData.ippanel_api || '';
          ippanelPattern = settingsData.ippanel_otp_pattern || '';
        }
      }
    } catch (sErr) {
      console.warn('Could not read IPPanel settings:', sErr);
    }

    let smsSent = false;
    let smsMessage = '';

    if (ippanelApi && ippanelPattern) {
      // Attempt to send pattern SMS via IPPanel REST API
      try {
        const ippanelRes = await fetch('https://api2.ippanel.com/api/v1/sms/pattern/normal/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': ippanelApi
          },
          body: JSON.stringify({
            code: ippanelPattern,
            sender: '+983000505',
            recipient: mobile,
            variable: {
              code: code
            }
          })
        });

        if (ippanelRes.ok) {
          smsSent = true;
          smsMessage = 'کد تایید با موفقیت از طریق پیامک ارسال شد.';
        } else {
          const errText = await ippanelRes.text();
          console.warn('IPPanel send error:', errText);
          smsMessage = 'کد تایید صادر شد (ارسال پیامکی با خطا مواجه شد).';
        }
      } catch (smsErr: any) {
        console.warn('IPPanel fetch failed:', smsErr);
        smsMessage = 'کد تایید صادر شد.';
      }
    } else {
      smsMessage = 'کد تایید صادر شد. (جهت ارسال پیامک واقعی، کلید IPPanel را در تنظیمات وارد کنید)';
    }

    return NextResponse.json({
      success: true,
      message: smsMessage,
      mobile: mobile,
      // For testing / dev convenience if SMS panel key not set:
      dev_code: (!ippanelApi) ? code : undefined
    });
  } catch (err: any) {
    console.error('OTP send route error:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال کد تایید: ' + err.message },
      { status: 500 }
    );
  }
}
