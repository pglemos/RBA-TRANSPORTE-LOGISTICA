import { NextResponse, type NextRequest } from 'next/server';
import type { Profile } from './db';
import { enterRBADataClient } from './dbContext';
import { createSupabaseRouteClient, isSupabaseConfigured } from './supabase/server';

export type AppRole = Profile['role'];

export interface Session {
  user: {
    id: string;
    auth_user_id: string;
    name: string;
    email: string;
    role: AppRole;
    active: boolean;
  } | null;
}

type GuardResult = {
  session: Session;
  response?: NextResponse;
};

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function appOrigins(req: NextRequest) {
  return [
    new URL(req.url).origin,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  ].filter(Boolean) as string[];
}

function requestOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin) return origin;

  const referer = req.headers.get('referer');
  if (!referer) return '';

  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
}

function sameOriginResponse(req: NextRequest) {
  if (!WRITE_METHODS.has(req.method)) return null;

  const origin = requestOrigin(req);
  if (origin && appOrigins(req).includes(origin)) return null;

  return NextResponse.json(
    { success: false, error: 'Origem da requisição não autorizada.' },
    { status: 403 },
  );
}

export class RBAAuth {
  public static async getSession(req: NextRequest): Promise<Session> {
    if (!isSupabaseConfigured) {
      return { user: null };
    }

    const supabase = createSupabaseRouteClient(req);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { user: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,user_id,name,email,role,active')
      .eq('user_id', authData.user.id)
      .eq('active', true)
      .maybeSingle();

    if (profileError || !profile) {
      return { user: null };
    }

    enterRBADataClient(supabase);

    return {
      user: {
        id: profile.id,
        auth_user_id: profile.user_id,
        name: profile.name,
        email: profile.email || authData.user.email || '',
        role: profile.role,
        active: profile.active,
      },
    };
  }

  public static async requireAuth(req: NextRequest, allowedRoles?: AppRole[]): Promise<GuardResult> {
    const originFailure = sameOriginResponse(req);
    if (originFailure) {
      return { session: { user: null }, response: originFailure };
    }

    const session = await this.getSession(req);
    if (!session.user) {
      return {
        session,
        response: NextResponse.json(
          { success: false, error: 'Sessão expirada. Faça login novamente.' },
          { status: 401 },
        ),
      };
    }

    if (allowedRoles?.length && !allowedRoles.includes(session.user.role)) {
      return {
        session,
        response: NextResponse.json(
          { success: false, error: 'Acesso negado para o perfil autenticado.' },
          { status: 403 },
        ),
      };
    }

    return { session };
  }

  public static canManageUsers(role: AppRole): boolean {
    return role === 'Administrador';
  }

  public static canDeleteFinancialData(role: AppRole): boolean {
    return role === 'Administrador' || role === 'Financeiro';
  }

  public static canEditFinance(role: AppRole): boolean {
    return role === 'Administrador' || role === 'Financeiro';
  }

  public static canCreateOrder(role: AppRole): boolean {
    return role === 'Administrador' || role === 'Operacional';
  }

  public static canApproveOrder(role: AppRole): boolean {
    return role === 'Administrador' || role === 'Financeiro';
  }

  public static isReadOnly(role: AppRole): boolean {
    return role === 'Consulta/Auditoria';
  }

  public static maskCPF(cpf: string, role?: AppRole): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      if (role === 'Consulta/Auditoria') {
        return `${clean.slice(0, 3)}.***.***-${clean.slice(9)}`;
      }
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  }

  public static maskDocument(document: string, role?: AppRole): string {
    if (!document) return '';
    const clean = document.replace(/\D/g, '');
    if (clean.length === 11) {
      return this.maskCPF(clean, role);
    }
    if (clean.length === 14) {
      if (role === 'Consulta/Auditoria') {
        return `${clean.slice(0, 2)}.***.***/****-${clean.slice(12)}`;
      }
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return document;
  }

  public static maskRG(rg: string, role?: AppRole): string {
    if (!rg) return '';
    if (role === 'Consulta/Auditoria') {
      const trimmed = rg.trim();
      if (trimmed.length > 4) {
        return `${trimmed.slice(0, 2)}.***.***-${trimmed.slice(-1)}`;
      }
      return '***';
    }
    return rg;
  }

  public static maskBankDetails(account: string, role?: AppRole): string {
    if (!account) return '';
    if (role === 'Consulta/Auditoria') {
      const trimmed = account.trim();
      if (trimmed.length > 4) {
        return `*****${trimmed.slice(-3)}`;
      }
      return '*****';
    }
    return account;
  }

  public static maskPixKey(key: string, role?: AppRole): string {
    if (!key) return '';
    if (role === 'Consulta/Auditoria') {
      const trimmed = key.trim();
      if (trimmed.includes('@')) {
        const parts = trimmed.split('@');
        return `${parts[0]!.slice(0, 2)}***@${parts[1]}`;
      }
      const cleanDigits = trimmed.replace(/\D/g, '');
      if (cleanDigits.length === 11) {
        return `(***) *****-${cleanDigits.slice(-4)}`;
      }
      if (trimmed.length > 8) {
        return `${trimmed.slice(0, 3)}***${trimmed.slice(-3)}`;
      }
      return '***';
    }
    return key;
  }
}
