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
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧۸۹'.indexOf(d).toString());
  return p2e.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[^a-zA-Z0-9-]/g, '').trim();
}

function getZarinpalVerifyErrorMessage(code: number): string {
  switch (code) {
    case -50:
      return 'مبلغ پرداخت شده با مبلغ تراکنش تطابق ندارد.';
    case -51:
      return 'تراکنش ناموفق است و کارت کاربر کسر نشده یا مبلغ برگشت خورده است.';
    case -52:
      return 'خطای غیرمنتظره درگاه زرین‌پال. با پشتیبانی درگاه تماس بگیرید.';
    case -53:
      return 'تراکنش متعلق به مرچنت این درگاه نیست.';
    case -54:
      return 'اتوریتی تراکنش معتبر نیست.';
    case 101:
      return 'عملیات پرداخت قبلاً با موفقیت تایید شده است.';
    default:
      return `خطا در تایید تراکنش زرین‌پال (کد: ${code}).`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authority, status } = await req.json();

    if (!authority) {
      return NextResponse.json(
        { success: false, error: 'پارامتر شناسه اتوریتی (Authority) ارسال نشده است.' },
        { status: 400 }
      );
    }

    // 1. Fetch pending transaction from Directus by authority
    let transaction: any = null;
    try {
      const txRes = await fetch(`${DIRECTUS_URL}/items/transactions?filter[authority][_eq]=${encodeURIComponent(authority)}`, {
        headers: { ...getAuthHeaders() },
        cache: 'no-store'
      });
      if (txRes.ok) {
        const txJson = await txRes.json();
        if (Array.isArray(txJson?.data) && txJson.data.length > 0) {
          transaction = txJson.data[0];
        }
      }
    } catch (e) {
      console.warn('Error fetching transaction by authority:', e);
    }

    if (!transaction) {
      // Try searching all transactions if filter fails
      try {
        const txAllRes = await fetch(`${DIRECTUS_URL}/items/transactions?limit=100`, {
          headers: { ...getAuthHeaders() },
          cache: 'no-store'
        });
        if (txAllRes.ok) {
          const allJson = await txAllRes.json();
          const found = (allJson?.data || []).find((t: any) => t.authority === authority);
          if (found) transaction = found;
        }
      } catch (e) {
        console.warn('Error fetching all transactions:', e);
      }
    }

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'تراکنش معتبری با این شناسه اتوریتی در سیستم یافت نشد.' },
        { status: 404 }
      );
    }

    // Check if transaction is already marked success
    if (transaction.status === 'success' || transaction.status === 'completed') {
      let parsedPayload = transaction.payload;
      if (typeof parsedPayload === 'string') {
        try { parsedPayload = JSON.parse(parsedPayload); } catch {}
      }
      return NextResponse.json({
        success: true,
        already_verified: true,
        ref_id: transaction.ref_id,
        amount: transaction.amount,
        payload: parsedPayload,
        transaction
      });
    }

    // Check if status from Gateway is NOT OK
    if (status !== 'OK') {
      // Update transaction status in Directus to failed
      try {
        await fetch(`${DIRECTUS_URL}/items/transactions/${transaction.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            status: 'failed',
            ref_id: 'لغو شده کاربر'
          })
        });
      } catch (e) {
        console.warn('Could not update transaction status to failed:', e);
      }

      let parsedPayload = transaction.payload;
      if (typeof parsedPayload === 'string') {
        try { parsedPayload = JSON.parse(parsedPayload); } catch {}
      }

      return NextResponse.json({
        success: false,
        error: 'پرداخت توسط کاربر لغو گردید یا تراکنش در درگاه بانکی ناموفق بود.',
        amount: transaction.amount,
        payload: parsedPayload,
        transaction
      });
    }

    // 2. Fetch Zarinpal Merchant ID
    let rawMerchant = '';
    let isSandbox = false;

    // Check transaction payload for sandbox flag or authority pattern
    let parsedPayload = transaction.payload;
    if (typeof parsedPayload === 'string') {
      try { parsedPayload = JSON.parse(parsedPayload); } catch {}
    }
    if (parsedPayload?.is_sandbox || authority?.startsWith('S0000') || String(transaction.gateway).includes('آزمایشی')) {
      isSandbox = true;
    }

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
      console.warn('Could not fetch Zarinpal merchant for verify:', sErr);
    }

    if (!rawMerchant) {
      rawMerchant = process.env.ZARINPAL_MERCHANT_ID || process.env.NEXT_PUBLIC_ZARINPAL_MERCHANT_ID || '';
    }

    let zarinpalMerchant = cleanMerchant(rawMerchant);

    if (zarinpalMerchant.toLowerCase().includes('sandbox') || zarinpalMerchant === '00000000-0000-0000-0000-000000000000') {
      isSandbox = true;
      zarinpalMerchant = '00000000-0000-0000-0000-000000000000';
    }

    if (!zarinpalMerchant) {
      zarinpalMerchant = isSandbox ? '00000000-0000-0000-0000-000000000000' : '';
    }

    // 3. Send Verification request to Zarinpal REST API v4
    const verifyPayload = {
      merchant_id: zarinpalMerchant,
      amount: Number(transaction.amount), // Tomans (IRT)
      authority: authority
    };

    const verifyEndpoint = isSandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
      : 'https://api.zarinpal.com/pg/v4/payment/verify.json';

    console.log('[Zarinpal Verify] Sending verify to Zarinpal:', {
      endpoint: verifyEndpoint,
      authority,
      amount_tomans: transaction.amount,
      isSandbox
    });

    let verifyRes;
    try {
      verifyRes = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(verifyPayload)
      });
    } catch (netErr: any) {
      console.error('[Zarinpal Verify] Network error:', netErr);
      return NextResponse.json(
        { success: false, error: 'خطا در برقراری ارتباط شبکه با درگاه زرین‌پال: ' + netErr.message },
        { status: 500 }
      );
    }

    let verifyJson = await verifyRes.json().catch(() => null);

    // If verification failed and we were not in sandbox, try sandbox as fallback if authority looks like sandbox
    if ((!verifyRes.ok || verifyJson?.data?.code !== 100 && verifyJson?.data?.code !== 101) && !isSandbox && authority.startsWith('S000')) {
      try {
        const sbRes = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/verify.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(verifyPayload)
        });
        if (sbRes.ok) {
          verifyJson = await sbRes.json().catch(() => null);
        }
      } catch {}
    }

    const code = verifyJson?.data?.code;
    const refId = verifyJson?.data?.ref_id ? String(verifyJson.data.ref_id) : `ZARIN-${Math.floor(100000 + Math.random() * 900000)}`;

    if (code === 100 || code === 101) {
      // Successful verification!
      let parsedPayload = transaction.payload;
      if (typeof parsedPayload === 'string') {
        try { parsedPayload = JSON.parse(parsedPayload); } catch {}
      }

      // Update Transaction in Directus
      try {
        await fetch(`${DIRECTUS_URL}/items/transactions/${transaction.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            status: 'success',
            ref_id: refId
          })
        });
      } catch (e) {
        console.warn('Failed to patch transaction status to success:', e);
      }

      // Fulfill Order / Subscription / Wallet Top-Up
      const paymentType = parsedPayload?.payment_type || 'wallet';

      if (paymentType === 'wallet') {
        const userId = transaction.user_id || parsedPayload?.user_id;
        let walletId = parsedPayload?.wallet_id;

        // Fetch wallet if walletId not present
        if (!walletId && userId) {
          try {
            const wRes = await fetch(`${DIRECTUS_URL}/items/wallets?filter[user_id][_eq]=${userId}`, {
              headers: { ...getAuthHeaders() },
              cache: 'no-store'
            });
            if (wRes.ok) {
              const wJson = await wRes.json();
              if (Array.isArray(wJson?.data) && wJson.data.length > 0) {
                walletId = wJson.data[0].id;
              }
            }
          } catch (e) {
            console.warn('Could not find wallet for user:', e);
          }
        }

        if (walletId) {
          try {
            // Get current wallet balance
            let currentBalance = 0;
            const walletFetch = await fetch(`${DIRECTUS_URL}/items/wallets/${walletId}`, {
              headers: { ...getAuthHeaders() }
            });
            if (walletFetch.ok) {
              const wData = await walletFetch.json();
              currentBalance = Number(wData?.data?.balance || 0);
            }

            const newBalance = currentBalance + Number(transaction.amount);

            // Create Wallet Transaction
            await fetch(`${DIRECTUS_URL}/items/wallet_transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },
              body: JSON.stringify({
                wallet_id: walletId,
                type: 'credit',
                amount: Number(transaction.amount),
                balance_after: newBalance,
                reference_id: refId,
                status: 'completed'
              })
            });

            // Update Wallet Balance
            await fetch(`${DIRECTUS_URL}/items/wallets/${walletId}`, {
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
          } catch (wErr) {
            console.error('Error executing wallet credit:', wErr);
          }
        }
      } else if (paymentType === 'plan') {
        const userId = transaction.user_id || parsedPayload?.user_id;
        const planId = parsedPayload?.plan_id;
        const durationDays = Number(parsedPayload?.plan_duration || 30);

        if (userId && planId) {
          try {
            const startDate = new Date();
            const endDate = durationDays === -1
              ? new Date('2099-12-31T23:59:59.000Z')
              : new Date(startDate.getTime() + durationDays * 86400000);

            const subId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `SUB-${Date.now()}`;

            await fetch(`${DIRECTUS_URL}/items/subscriptions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },
              body: JSON.stringify({
                id: subId,
                user_id: userId,
                plan_id: planId,
                status: 'active',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
              })
            });
          } catch (subErr) {
            console.error('Error creating subscription after Zarinpal verify:', subErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        verified: true,
        ref_id: refId,
        amount: transaction.amount,
        payload: parsedPayload,
        message: 'پرداخت با موفقیت انجام شد و اطلاعات حساب شما به‌روزرسانی گردید.'
      });

    } else {
      // Failed verification
      const errMsg = getZarinpalVerifyErrorMessage(code || -1);

      try {
        await fetch(`${DIRECTUS_URL}/items/transactions/${transaction.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            status: 'failed',
            ref_id: 'خطا در تایید درگاه'
          })
        });
      } catch (e) {
        console.warn('Could not update transaction status:', e);
      }

      let parsedPayload = transaction.payload;
      if (typeof parsedPayload === 'string') {
        try { parsedPayload = JSON.parse(parsedPayload); } catch {}
      }

      return NextResponse.json(
        {
          success: false,
          error: errMsg,
          amount: transaction.amount,
          payload: parsedPayload,
          code: code
        },
        { status: 400 }
      );
    }

  } catch (err: any) {
    console.error('[Zarinpal Verify Route Error]:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در استعلام و تایید پرداخت: ' + err.message },
      { status: 500 }
    );
  }
}
