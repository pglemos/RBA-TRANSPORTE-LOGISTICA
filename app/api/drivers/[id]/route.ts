import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { DriverSchema, normalizeDocument, onlyDigits } from '@/lib/validators';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await RBAAuth.requireAuth(req);
    if (guard.response) return guard.response;

    const { id } = await params;
    const driver = await RBADatabase.getDriverById(id);
    if (!driver) {
      return NextResponse.json({ success: false, error: 'Motorista não encontrado' }, { status: 404 });
    }

    const role = guard.session.user!.role;
    return NextResponse.json({
      ...driver,
      cpf: RBAAuth.maskCPF(driver.cpf, role),
      rg: RBAAuth.maskRG(driver.rg, role),
      bank_account: RBAAuth.maskBankDetails(driver.bank_account, role),
      pix_key: RBAAuth.maskPixKey(driver.pix_key, role),
      beneficiary_document: RBAAuth.maskDocument(driver.beneficiary_document, role),
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
      cpf: normalizeDocument(body.cpf || ''),
      rg: String(body.rg || '').trim(),
      phone: onlyDigits(body.phone || ''),
      bank_name: String(body.bank_name || '').trim(),
      bank_agency: String(body.bank_agency || '').trim(),
      bank_account: String(body.bank_account || '').trim(),
      pix_key: String(body.pix_key || '').trim(),
      beneficiary_name: String(body.beneficiary_name || body.name || '').trim(),
      beneficiary_document: normalizeDocument(body.beneficiary_document || body.cpf || ''),
    };

    const parsed = DriverSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados do motorista inválidos.' },
        { status: 400 },
      );
    }

    const session = guard.session.user!;
    const updated = await RBADatabase.updateDriver(
      id,
      {
        ...parsed.data,
        notes: parsed.data.notes || '',
        phone: parsed.data.phone || '',
        rg: parsed.data.rg || '',
        bank_name: parsed.data.bank_name || '',
        bank_agency: parsed.data.bank_agency || '',
        bank_account: parsed.data.bank_account || '',
      },
      session.id,
      session.name,
    );

    return NextResponse.json({ success: true, driver: updated });
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
    const success = await RBADatabase.deleteDriver(id, session.id, session.name);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
