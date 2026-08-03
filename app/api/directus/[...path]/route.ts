import { NextRequest, NextResponse } from "next/server";

let rawBaseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus-iuao17eclszuzc06zaqzodkr.89.42.199.190.sslip.io';
if (rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl)) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const TARGET_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

async function handleProxy(req: NextRequest, { params }: { params: { path?: string[] } }) {
  try {
    const pathSegments = params?.path || [];
    const pathStr = pathSegments.join("/");

    // Extract query parameters
    const urlObj = new URL(req.url);
    const search = urlObj.search;
    const tokenParam = urlObj.searchParams.get('access_token');

    // Construct the final Directus URL
    const targetUrl = `${TARGET_BASE_URL}/${pathStr}${search}`;

    // Read the request body if present (using arrayBuffer to preserve binary integrity for file uploads)
    let body: any = null;
    const method = req.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD' && req.body) {
      body = await req.arrayBuffer();
    }

    // Build headers to forward
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Avoid forwarding host or standard headers that might interfere
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

    if (tokenParam && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${tokenParam}`);
    }

    // Send the request to Directus
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });

    // Parse Response (using arrayBuffer to preserve binary integrity for files/images)
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

export async function GET(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function POST(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function PATCH(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function DELETE(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function PUT(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function OPTIONS(req: NextRequest, context: any) {
  return handleProxy(req, context);
}
