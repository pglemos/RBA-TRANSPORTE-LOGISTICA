import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { ClientSchema, normalizeDocument, onlyDigits } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req);
    if (guard.response) return guard.response;

    const role = guard.session.user!.role;
    const clients = await RBADatabase.getClients();
    const processed = clients.map((client) => ({
      ...client,
      document: RBAAuth.maskDocument(client.document, role),
    }));

    return NextResponse.json(processed);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador', 'Operacional']);
    if (guard.response) return guard.response;

    const body = await req.json();
    const payload = {
      ...body,
      name: String(body.name || '').trim(),
      document: normalizeDocument(body.document || ''),
      email: String(body.email || '').trim(),
      phone: body.phone ? onlyDigits(body.phone) : '',
    };

    const parsed = ClientSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados do cliente inválidos.' },
        { status: 400 },
      );
    }

    const session = guard.session.user!;
    const newClient = await RBADatabase.createClient(
      {
        ...parsed.data,
        phone: parsed.data.phone || '',
        email: parsed.data.email || '',
        address: parsed.data.address || '',
        notes: parsed.data.notes || '',
      },
      session.id,
      session.name,
    );

    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
