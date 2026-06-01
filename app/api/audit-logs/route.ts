import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    if (!session.user || session.user.role !== 'Administrador') {
      // Allow Auditor to read Audit logs as well!
      if (session.user?.role !== 'Consulta/Auditoria') {
        return NextResponse.json({ success: false, error: "Acesso negado: Somente administradores ou auditores." }, { status: 403 });
      }
    }

    const logs = await RBADatabase.getAuditLogs();
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
