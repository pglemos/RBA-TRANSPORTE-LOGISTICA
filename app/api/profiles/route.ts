import { NextRequest, NextResponse } from 'next/server';
import { RBAAuth } from '@/lib/auth';
import { RBADatabase, type Profile } from '@/lib/db';
import { ProfileSchema } from '@/lib/validators';

const PROFILE_ROLES: Profile['role'][] = ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'];

export async function GET(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador']);
    if (guard.response) return guard.response;

    const profiles = await RBADatabase.getProfiles();
    return NextResponse.json(
      [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador']);
    if (guard.response) return guard.response;
    const session = guard.session.user!;

    const body = await req.json();
    const parsed = ProfileSchema.safeParse({
      name: body.name,
      email: String(body.email || '').toLowerCase().trim(),
      role: body.role,
      active: body.active !== false,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados do perfil inválidos.' },
        { status: 400 },
      );
    }

    const profile = await RBADatabase.createProfile(
      { ...parsed.data, password: body.password },
      session.id,
      session.name,
    );

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador']);
    if (guard.response) return guard.response;
    const session = guard.session.user!;

    const body = await req.json();
    const id = String(body.id || '');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do perfil não informado.' },
        { status: 400 },
      );
    }

    const updates: any = {};
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length < 3) {
        return NextResponse.json({ success: false, error: 'Nome do usuário deve ter pelo menos 3 caracteres.' }, { status: 400 });
      }
      updates.name = body.name.trim();
    }
    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !body.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        return NextResponse.json({ success: false, error: 'Formato de email inválido.' }, { status: 400 });
      }
      updates.email = body.email.toLowerCase().trim();
    }
    if (body.password !== undefined && body.password !== '') {
      if (typeof body.password !== 'string' || body.password.length < 6) {
        return NextResponse.json({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
      }
      updates.password = body.password;
    }
    if (body.role !== undefined) {
      if (!PROFILE_ROLES.includes(body.role)) {
        return NextResponse.json({ success: false, error: 'Perfil de acesso inválido.' }, { status: 400 });
      }
      updates.role = body.role;
    }
    if (body.active !== undefined) {
      updates.active = body.active === true;
    }

    const profile = await RBADatabase.updateProfile(id, updates, session.id, session.name);
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

