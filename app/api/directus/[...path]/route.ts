import { handleProxy } from "@/lib/proxy-handler";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

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
