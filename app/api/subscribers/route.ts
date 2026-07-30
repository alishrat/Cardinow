import { NextRequest, NextResponse } from "next/server";

let rawBaseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus-iuao17eclszuzc06zaqzodkr.89.42.199.190.sslip.io';
if (rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl)) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const DIRECTUS_URL = rawBaseUrl.replace(/\/+$/, '');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('card_id');

    if (!cardId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کارت مشخص نشده است.' },
        { status: 400 }
      );
    }

    const queryUrl = `${DIRECTUS_URL}/items/card_subscribers?filter[card_id][_eq]=${encodeURIComponent(cardId)}&sort=-id`;
    const res = await fetch(queryUrl);

    if (!res.ok) {
      return NextResponse.json({ success: true, subscribers: [] });
    }

    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];

    return NextResponse.json({
      success: true,
      subscribers: list
    });
  } catch (err: any) {
    console.error('Subscribers GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
