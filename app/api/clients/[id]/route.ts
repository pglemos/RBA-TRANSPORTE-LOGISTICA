import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { ClientSchema, normalizeDocument, onlyDigits } from '@/lib/validators';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await RBAAuth.requireAuth(req);
    if (guard.response) return guard.response;

    const { id } = await params;
    const client = await RBADatabase.getClientById(id);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 404 });
    }

    const role = guard.session.user!.role;
    return NextResponse.json({
      ...client,
      document: RBAAuth.maskDocument(client.document, role),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador', 'Operacional']);
    if (guard.response) return guard.response;

    const { id } = await params;
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
    const updated = await RBADatabase.updateClient(
      id,
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

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador']);
    if (guard.response) return guard.response;

    const { id } = await params;
    const session = guard.session.user!;
    const success = await RBADatabase.deleteClient(id, session.id, session.name);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
