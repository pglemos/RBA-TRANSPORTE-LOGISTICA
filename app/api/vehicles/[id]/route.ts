import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { VehicleSchema, normalizeDocument, normalizePlate, normalizeUf } from '@/lib/validators';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const vehicle = await RBADatabase.getVehicleById(id);
    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Veículo não encontrado" }, { status: 404 });
    }

    const processed = {
      ...vehicle,
      owner_document: RBAAuth.maskDocument(vehicle.owner_document, role),
      renavam: role === 'Administrador' || role === 'Financeiro' ? vehicle.renavam : '***' + vehicle.renavam.slice(-3)
    };

    return NextResponse.json(processed);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    if (!session.user || RBAAuth.isReadOnly(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    const body = await req.json();
    const payload = {
      ...body,
      model: String(body.model || '').trim(),
      year: Number(body.year),
      tractor_plate: normalizePlate(body.tractor_plate || ''),
      trailer_plate: normalizePlate(body.trailer_plate || ''),
      uf: normalizeUf(body.uf || ''),
      owner_name: String(body.owner_name || '').trim(),
      owner_document: normalizeDocument(body.owner_document || ''),
      antt: String(body.antt || '').trim(),
      renavam: String(body.renavam || '').trim()
    };
    const parsed = VehicleSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Dados do veículo inválidos.' }, { status: 400 });
    }

    const updated = await RBADatabase.updateVehicle(id, parsed.data, session.user.id, session.user.name);
    return NextResponse.json({ success: true, vehicle: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    if (!session.user || RBAAuth.isReadOnly(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    const success = await RBADatabase.deleteVehicle(id, session.user.id, session.user.name);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
