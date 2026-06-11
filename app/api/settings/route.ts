import { NextRequest, NextResponse } from 'next/server';
import { RBAAuth } from '@/lib/auth';
import { RBADatabase } from '@/lib/db';

const SETTINGS_KEYS = [
  'company_name',
  'company_document',
  'support_phone',
  'insurance_policy_number',
  'block_on_risk_alert'
];

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    if (!session.user || (session.user.role !== 'Administrador' && session.user.role !== 'Consulta/Auditoria')) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }

    const settings = await RBADatabase.getSettings();
    return NextResponse.json(Object.fromEntries(settings.map(setting => [setting.key, setting.value])));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    if (!session.user || session.user.role !== 'Administrador') {
      return NextResponse.json({ success: false, error: 'Acesso negado: somente administradores podem alterar configurações.' }, { status: 403 });
    }

    const body = await req.json();
    const settings = Object.fromEntries(
      SETTINGS_KEYS.map(key => [key, String(body[key] ?? '')])
    );

    if (settings.company_name.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Razão social inválida.' }, { status: 400 });
    }

    const saved = await RBADatabase.updateSettings(settings, session.user.id, session.user.name);
    return NextResponse.json({ success: true, settings: Object.fromEntries(saved.map(setting => [setting.key, setting.value])) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
