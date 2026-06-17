import { NextRequest, NextResponse } from 'next/server';
import { RBAAuth } from '@/lib/auth';
import { RBADatabase } from '@/lib/db';

const SETTINGS_KEYS = [
  'company_name',
  'company_document',
  'support_phone',
  'insurance_policy_number',
  'block_on_risk_alert',
];

export async function GET(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador', 'Consulta/Auditoria']);
    if (guard.response) return guard.response;

    const settings = await RBADatabase.getSettings();
    return NextResponse.json(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador']);
    if (guard.response) return guard.response;

    const body = await req.json();
    const settings = Object.fromEntries(
      SETTINGS_KEYS.map((key) => [key, String(body[key] ?? '')]),
    );

    if (settings.company_name.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Razão social inválida.' }, { status: 400 });
    }

    const session = guard.session.user!;
    const saved = await RBADatabase.updateSettings(settings, session.id, session.name);
    return NextResponse.json({ success: true, settings: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
