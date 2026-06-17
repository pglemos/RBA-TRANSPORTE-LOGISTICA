import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

async function signOut(req: NextRequest, response: NextResponse) {
  const supabase = createSupabaseRouteClient(req, response);
  await supabase.auth.signOut();
  return response;
}

export async function POST(req: NextRequest) {
  return signOut(req, NextResponse.json({ success: true }));
}

export async function GET(req: NextRequest) {
  return signOut(req, NextResponse.redirect(new URL('/login', req.nextUrl)));
}
