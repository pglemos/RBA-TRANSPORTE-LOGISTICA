import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { ClientSchema, normalizeDocument, onlyDigits } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const clients = await RBADatabase.getClients();
    
    // Process list, masking CPF/CNPJ document if not authorized
    const processed = clients.map(c => ({
      ...c,
      document: RBAAuth.maskDocument(c.document, role)
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
    const payload = {
      ...body,
      name: String(body.name || '').trim(),
      document: normalizeDocument(body.document || ''),
      email: String(body.email || '').trim(),
      phone: body.phone ? onlyDigits(body.phone) : ''
    };
    const parsed = ClientSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Dados do cliente inválidos.' }, { status: 400 });
    }

    const newClient = await RBADatabase.createClient(
      {
        ...parsed.data,
        phone: parsed.data.phone || '',
        email: parsed.data.email || '',
        address: parsed.data.address || '',
        notes: parsed.data.notes || ''
      },
      session.user.id,
      session.user.name
    );
    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
