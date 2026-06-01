import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const clients = await RBADatabase.getClients();
    
    // Process list, masking CPF/CNPJ document if not authorized
    const processed = clients.map(c => ({
      ...c,
      document: RBAAuth.maskCPF(c.document, role) // Custom validation masks CNPJ/CPF appropriately
    }));

    return NextResponse.json(processed);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    
    if (!session.user || RBAAuth.isReadOnly(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    const body = await req.json();
    const newClient = await RBADatabase.createClient(body, session.user.id, session.user.name);
    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
