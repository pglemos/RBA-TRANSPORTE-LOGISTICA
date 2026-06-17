import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador', 'Consulta/Auditoria']);
    if (guard.response) return guard.response;

    const logs = await RBADatabase.getAuditLogs();
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
