import { NextRequest, NextResponse } from "next/server";

let rawBaseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus-iuao17eclszuzc06zaqzodkr.89.42.199.190.sslip.io';
if (rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl)) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const DIRECTUS_URL = rawBaseUrl.replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  try {
    const { card_id, message, recipient_mobiles } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'متن پیامک نمی‌تواند خالی باشد.' },
        { status: 400 }
      );
    }

    let mobiles: string[] = [];
    if (Array.isArray(recipient_mobiles) && recipient_mobiles.length > 0) {
      mobiles = recipient_mobiles;
    } else if (card_id) {
      // Fetch active subscribers for this card from Directus
      const subRes = await fetch(`${DIRECTUS_URL}/items/card_subscribers?filter[card_id][_eq]=${encodeURIComponent(card_id)}&filter[status][_eq]=active`);
      if (subRes.ok) {
        const subJson = await subRes.json();
        if (Array.isArray(subJson?.data)) {
          mobiles = subJson.data.map((item: any) => item.mobile).filter(Boolean);
        }
      }
    }

    if (mobiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'هیچ دنبال‌کننده یا شماره مخاطبی برای ارسال پیامک یافت نشد.' },
        { status: 400 }
      );
    }

    // Read IPPanel API Key from Directus settings
    let ippanelApi = '';
    try {
      const settingsRes = await fetch(`${DIRECTUS_URL}/items/settings?limit=1`);
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        const settingsData = settingsJson?.data;
        if (Array.isArray(settingsData) && settingsData.length > 0) {
          ippanelApi = settingsData[0]?.ippanel_api || '';
        } else if (settingsData && typeof settingsData === 'object') {
          ippanelApi = settingsData.ippanel_api || '';
        }
      }
    } catch (sErr) {
      console.warn('Could not read settings:', sErr);
    }

    if (!ippanelApi) {
      return NextResponse.json({
        success: true,
        sentCount: mobiles.length,
        message: `درخواست ارسال به ${mobiles.length} مخاطب ثبت شد. (جهت ارسال واقعی پیامک، کلید ippanel_api را در تنظیمات وارد کنید)`
      });
    }

    // Call IPPanel send API with multiple endpoint fallbacks
    let successCount = 0;
    let smsError = '';

    const cleanErrorDetail = (text: string): string => {
      if (!text) return 'پاسخ نامعتبر پنل';
      if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('502 Bad Gateway')) {
        return 'سرور سامانه پیامک موقتاً در دسترس نیست (خطای Gateway 502)';
      }
      try {
        const parsed = JSON.parse(text);
        if (parsed.message) return String(parsed.message);
        if (parsed.error) return typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      } catch (e) {
        const stripped = text.replace(/<[^>]*>?/gm, '').trim();
        if (stripped.length > 0 && stripped.length < 150) return stripped;
      }
      return 'خطا در ارتباط با سامانه پیامک';
    };

    const trimmedApi = ippanelApi.trim();
    const authHeader = trimmedApi.startsWith('ApiKey ') ? trimmedApi : `ApiKey ${trimmedApi}`;

    const keyOnly = trimmedApi.replace(/^ApiKey\s+/i, '');
    const apiKeyHeader = `ApiKey ${keyOnly}`;

    const endpoints = [
      {
        url: 'https://api2.ippanel.com/api/v1/sms/send/panel/single',
        headers: { 'Content-Type': 'application/json', 'Authorization': apiKeyHeader },
        body: JSON.stringify({ sender: '+983000505', recipient: mobiles, message: message })
      },
      {
        url: 'https://api2.ippanel.com/api/v1/sms/send/panel/single',
        headers: { 'Content-Type': 'application/json', 'Authorization': keyOnly },
        body: JSON.stringify({ sender: '+983000505', recipient: mobiles, message: message })
      },
      {
        url: 'https://edge.ippanel.com/api/v1/sms/send/panel/single',
        headers: { 'Content-Type': 'application/json', 'Authorization': apiKeyHeader },
        body: JSON.stringify({ sender: '+983000505', recipient: mobiles, message: message })
      },
      {
        url: 'https://rest.ippanel.com/v1/messages',
        headers: { 'Content-Type': 'application/json', 'Authorization': apiKeyHeader },
        body: JSON.stringify({ originator: '+983000505', recipients: mobiles, message: message })
      }
    ];

    let sent = false;
    for (const ep of endpoints) {
      try {
        const ippanelRes = await fetch(ep.url, {
          method: 'POST',
          headers: ep.headers as unknown as Record<string, string>,
          body: ep.body
        });

        if (ippanelRes.ok) {
          successCount = mobiles.length;
          sent = true;
          break;
        } else {
          const rawText = await ippanelRes.text();
          console.warn(`IPPanel bulk endpoint (${ep.url}) failed status ${ippanelRes.status}:`, rawText);
          smsError = cleanErrorDetail(rawText);
        }
      } catch (apiErr: any) {
        console.warn(`IPPanel bulk endpoint (${ep.url}) exception:`, apiErr);
        smsError = `خطای شبکه: ${apiErr.message}`;
      }
    }

    if (!sent) {
      return NextResponse.json({
        success: false,
        error: `خطا در ارسال پیامک گروهی به سامانه پیامک: ${smsError}`
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      message: `پیامک گروهی با موفقیت به ${mobiles.length} اعضای خبرنامه ارسال شد.`
    });
  } catch (err: any) {
    console.error('Send bulk SMS route error:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال پیامک گروهی: ' + err.message },
      { status: 500 }
    );
  }
}
