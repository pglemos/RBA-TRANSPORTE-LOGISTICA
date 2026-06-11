import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { DriverSchema, normalizeDocument, onlyDigits } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const drivers = await RBADatabase.getDrivers();
    
    // Process list with LGPD masking based on access privilege
    const maskedDrivers = drivers.map(d => ({
      ...d,
      cpf: RBAAuth.maskCPF(d.cpf, role),
      rg: RBAAuth.maskRG(d.rg, role),
      bank_account: RBAAuth.maskBankDetails(d.bank_account, role),
      pix_key: RBAAuth.maskPixKey(d.pix_key, role),
      beneficiary_document: RBAAuth.maskDocument(d.beneficiary_document, role)
    }));

    return NextResponse.json(maskedDrivers);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    
    if (!session.user || RBAAuth.isReadOnly(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado: Somente perfis operacionais ou administrativos de frete." }, { status: 403 });
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

    const newDriver = await RBADatabase.createDriver(
      { ...parsed.data, notes: parsed.data.notes || '' }, 
      session.user.id, 
      session.user.name
    );

    return NextResponse.json({ success: true, driver: newDriver });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
