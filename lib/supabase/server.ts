import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabasePublicKey);
export const isSupabaseServerConfigured = !!(supabaseUrl && supabaseServiceRoleKey);

export function createSupabaseRouteClient(req: NextRequest, res?: NextResponse) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado para autenticação.');
  }

  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        if (!res) return;
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });
}

export function createSupabaseAdminClient() {
  if (!isSupabaseServerConfigured) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabaseServer = isSupabaseServerConfigured
  ? createSupabaseAdminClient()
  : (null as unknown as SupabaseClient);
