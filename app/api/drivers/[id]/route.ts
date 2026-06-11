import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { DriverSchema, normalizeDocument, onlyDigits } from '@/lib/validators';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const driver = await RBADatabase.getDriverById(id);
    if (!driver) {
      return NextResponse.json({ success: false, error: "Motorista não encontrado" }, { status: 404 });
    }

    const maskedDriver = {
      ...driver,
      cpf: RBAAuth.maskCPF(driver.cpf, role),
      rg: RBAAuth.maskRG(driver.rg, role),
      bank_account: RBAAuth.maskBankDetails(driver.bank_account, role),
      pix_key: RBAAuth.maskPixKey(driver.pix_key, role),
      beneficiary_document: RBAAuth.maskDocument(driver.beneficiary_document, role)
    };

    return NextResponse.json(maskedDriver);
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
      name: String(body.name || '').trim(),
      cpf: normalizeDocument(body.cpf || ''),
      rg: String(body.rg || '').trim(),
      phone: onlyDigits(body.phone || ''),
      bank_name: String(body.bank_name || '').trim(),
      bank_agency: String(body.bank_agency || '').trim(),
      bank_account: String(body.bank_account || '').trim(),
      pix_key: String(body.pix_key || '').trim(),
      beneficiary_name: String(body.beneficiary_name || body.name || '').trim(),
      beneficiary_document: normalizeDocument(body.beneficiary_document || body.cpf || '')
    };
    const parsed = DriverSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Dados do motorista inválidos.' }, { status: 400 });
    }

    const updated = await RBADatabase.updateDriver(id, parsed.data, session.user.id, session.user.name);
    return NextResponse.json({ success: true, driver: updated });
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

    const success = await RBADatabase.deleteDriver(id, session.user.id, session.user.name);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
