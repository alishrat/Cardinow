import { NextRequest, NextResponse } from "next/server";

let rawBaseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus-iuao17eclszuzc06zaqzodkr.89.42.199.190.sslip.io';
if (rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl)) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const TARGET_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export async function handleProxy(req: NextRequest, { params }: { params: { path?: string[] } }) {
  try {
    const pathSegments = params?.path || [];
    const pathStr = pathSegments.join("/");

    // Extract query parameters
    const urlObj = new URL(req.url);
    const searchParams = new URLSearchParams(urlObj.searchParams);
    const tokenParam = searchParams.get('access_token');

    // Remove access_token from query string to prevent duplicate credential error in Directus
    if (tokenParam) {
      searchParams.delete('access_token');
    }

    const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const targetUrl = `${TARGET_BASE_URL}/${pathStr}${searchStr}`;

    // Read the request body if present (using arrayBuffer to preserve binary integrity for file uploads)
    let body: any = null;
    const method = req.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD' && req.body) {
      body = await req.arrayBuffer();
    }

    // Build headers to forward
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (
        k !== "host" &&
        k !== "content-length" &&
        k !== "connection" &&
        k !== "accept-encoding"
      ) {
        headers.set(key, value);
      }
    });

    const serverStaticToken = process.env.DIRECTUS_STATIC_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN;

    if (tokenParam && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${tokenParam}`);
    } else if (!headers.has('authorization') && serverStaticToken) {
      headers.set('authorization', `Bearer ${serverStaticToken}`);
    }

    // Send the request to Directus
    let response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });

    // Special Fallback for 400 / 401 / 403 on GET requests (e.g., templates, plans, cards, products, assets):
    // If request with client token returns 400/401/403 (due to expired token in browser localStorage),
    // retry with serverStaticToken or cleanly without authorization header.
    if (
      method === 'GET' &&
      (response.status === 400 || response.status === 401 || response.status === 403)
    ) {
      const fallbackHeaders = new Headers(headers);
      if (serverStaticToken) {
        fallbackHeaders.set('authorization', `Bearer ${serverStaticToken}`);
      } else {
        fallbackHeaders.delete('authorization');
      }

      const fallbackResponse = await fetch(targetUrl, {
        method: req.method,
        headers: fallbackHeaders,
        body: body,
      });

      if (fallbackResponse.ok) {
        response = fallbackResponse;
      } else if (serverStaticToken) {
        // Try once more completely clean without authorization header if serverStaticToken also failed
        const cleanHeaders = new Headers(headers);
        cleanHeaders.delete('authorization');
        const anonymousResponse = await fetch(targetUrl, {
          method: req.method,
          headers: cleanHeaders,
          body: body,
        });
        if (anonymousResponse.ok) {
          response = anonymousResponse;
        }
      }
    }

    // Parse Response
    const responseBody = await response.arrayBuffer();

    // Return the response with appropriate headers
    const resHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k !== "content-encoding" && k !== "transfer-encoding" && k !== "content-length") {
        resHeaders.set(key, value);
      }
    });

    return new NextResponse(responseBody, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error("Database proxy error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with database server: " + error.message },
      { status: 502 }
    );
  }
}
