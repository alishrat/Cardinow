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

    const cleanErrorDetail = (text: string): string => {
      if (!text) return 'پاسخ نامعتبر پنل';
      if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('502 Bad Gateway')) {
        return 'سرور سامانه پیامک موقتاً در دسترس نیست (خطای 502/Gateway)';
      }
      try {
        const parsed = JSON.parse(text);
        if (parsed.message) return String(parsed.message);
        if (parsed.error) return typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      } catch (e) {
        // Strip HTML tags if present
        const stripped = text.replace(/<[^>]*>?/gm, '').trim();
        if (stripped.length > 0 && stripped.length < 150) return stripped;
      }
      return 'خطا در ارتباط با سامانه پیامک';
    };

    if (ippanelApi && ippanelPattern) {
      const trimmedApi = ippanelApi.trim();
      const trimmedPattern = ippanelPattern.trim();
      
      const keyOnly = trimmedApi.replace(/^ApiKey\s+/i, '');
      const apiKeyHeader = `ApiKey ${keyOnly}`;

      // Try multiple IPPanel endpoints and Authorization header variants
      const endpoints = [
        {
          name: 'IPPanel v1 (api2 with ApiKey header)',
          url: 'https://api2.ippanel.com/api/v1/sms/pattern/normal/send',
          headers: { 'Content-Type': 'application/json', 'Authorization': apiKeyHeader },
          body: JSON.stringify({
            code: trimmedPattern,
            sender: '+983000505',
            recipient: mobile,
            variable: { code: code, verification_code: code, otp: code }
          })
        },
        {
          name: 'IPPanel v1 (api2 with direct token)',
          url: 'https://api2.ippanel.com/api/v1/sms/pattern/normal/send',
          headers: { 'Content-Type': 'application/json', 'Authorization': keyOnly },
          body: JSON.stringify({
            code: trimmedPattern,
            sender: '+983000505',
            recipient: mobile,
            variable: { code: code, verification_code: code, otp: code }
          })
        },
        {
          name: 'IPPanel v1 (api2 with apikey header)',
          url: 'https://api2.ippanel.com/api/v1/sms/pattern/normal/send',
          headers: { 'Content-Type': 'application/json', 'apikey': keyOnly },
          body: JSON.stringify({
            code: trimmedPattern,
            sender: '+983000505',
            recipient: mobile,
            variable: { code: code, verification_code: code, otp: code }
          })
        },
        {
          name: 'IPPanel Edge (with ApiKey header)',
          url: 'https://edge.ippanel.com/api/v1/sms/pattern/normal/send',
          headers: { 'Content-Type': 'application/json', 'Authorization': apiKeyHeader },
          body: JSON.stringify({
            code: trimmedPattern,
            sender: '+983000505',
            recipient: mobile,
            variable: { code: code, verification_code: code, otp: code }
          })
        },
        {
          name: 'IPPanel Rest (v1 messages patterns)',
          url: 'https://rest.ippanel.com/v1/messages/patterns/send',
          headers: { 'Content-Type': 'application/json', 'Authorization': apiKeyHeader },
          body: JSON.stringify({
            pattern_code: trimmedPattern,
            originator: '+983000505',
            recipient: mobile,
            values: { code: code, verification_code: code, otp: code }
          })
        }
      ];

      let lastErrText = '';

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep.url, {
            method: 'POST',
            headers: ep.headers as unknown as Record<string, string>,
            body: ep.body
          });

          if (res.ok) {
            smsSent = true;
            smsMessage = 'کد تایید با موفقیت از طریق پیامک ارسال شد.';
            break;
          } else {
            const rawText = await res.text();
            console.warn(`[IPPanel ${ep.name}] status ${res.status}:`, rawText);
            lastErrText = cleanErrorDetail(rawText);
          }
        } catch (fetchErr: any) {
          console.warn(`[IPPanel ${ep.name}] fetch exception:`, fetchErr.message);
          lastErrText = `خطای شبکه: ${fetchErr.message}`;
        }
      }

      if (!smsSent) {
        smsMessage = `کد تایید صادر شد (ارسال پیامک با خطا مواجه شد: ${lastErrText}).`;
      }
    } else {
      smsMessage = 'کد تایید صادر شد. (جهت ارسال پیامک واقعی، کلید IPPanel را در تنظیمات وارد کنید)';
    }

    return NextResponse.json({
      success: true,
      smsSent: smsSent,
      message: smsMessage,
      mobile: mobile,
      dev_code: (!smsSent) ? code : undefined
    });
  } catch (err: any) {
    console.error('OTP send route error:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال کد تایید: ' + err.message },
      { status: 500 }
    );
  }
}
