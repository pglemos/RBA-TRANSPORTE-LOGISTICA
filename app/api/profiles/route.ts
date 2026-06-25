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
    const role = body.role as Profile['role'];
    const active = body.active !== false;

    if (!id || !PROFILE_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Perfil ou tipo de acesso inválido.' },
        { status: 400 },
      );
    }

    const profile = await RBADatabase.updateProfileRole(id, role, active, session.id, session.name);
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

