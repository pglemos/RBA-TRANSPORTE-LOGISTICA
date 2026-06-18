import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { VehicleSchema, normalizeDocument, normalizePlate, normalizeUf } from '@/lib/validators';

function vehiclePayload(body: any) {
  const manufactureYear = Number(body.manufacture_year || body.year);
  return {
    ...body,
    model: String(body.model || '').trim(),
    year: manufactureYear,
    manufacture_year: manufactureYear,
    model_year: Number(body.model_year || body.year || body.manufacture_year),
    vehicle_type: body.vehicle_type || 'Carreta',
    tractor_plate: normalizePlate(body.tractor_plate || ''),
    trailer_plate: normalizePlate(body.trailer_plate || ''),
    uf: normalizeUf(body.uf || ''),
    owner_name: String(body.owner_name || '').trim(),
    owner_document: normalizeDocument(body.owner_document || ''),
    antt: String(body.antt || '').trim(),
    renavam: String(body.renavam || '').trim(),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await RBAAuth.requireAuth(req);
    if (guard.response) return guard.response;

    const { id } = await params;
    const vehicle = await RBADatabase.getVehicleById(id);
    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Veículo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      ...vehicle,
      owner_document: RBAAuth.maskDocument(vehicle.owner_document),
      renavam: vehicle.renavam,
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
    const parsed = VehicleSchema.safeParse(vehiclePayload(await req.json()));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados do veículo inválidos.' },
        { status: 400 },
      );
    }

    const session = guard.session.user!;
    const updated = await RBADatabase.updateVehicle(
      id,
      {
        ...parsed.data,
        antt: parsed.data.antt || '',
        renavam: parsed.data.renavam || '',
        notes: parsed.data.notes || '',
      },
      session.id,
      session.name,
    );

    return NextResponse.json({ success: true, vehicle: updated });
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
    const success = await RBADatabase.deleteVehicle(id, session.id, session.name);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
