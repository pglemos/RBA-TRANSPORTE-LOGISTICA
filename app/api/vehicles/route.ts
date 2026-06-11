import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { VehicleSchema, normalizeDocument, normalizePlate, normalizeUf } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const vehicles = await RBADatabase.getVehicles();
    
    // Mask owner document if sensitive based on roles
    const processed = vehicles.map(v => ({
      ...v,
      owner_document: RBAAuth.maskDocument(v.owner_document, role),
      renavam: role === 'Administrador' || role === 'Financeiro' ? v.renavam : '***' + v.renavam.slice(-3)
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

    const newVehicle = await RBADatabase.createVehicle(
      {
        ...parsed.data,
        antt: parsed.data.antt || '',
        renavam: parsed.data.renavam || '',
        notes: parsed.data.notes || ''
      },
      session.user.id,
      session.user.name
    );
    return NextResponse.json({ success: true, vehicle: newVehicle });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
