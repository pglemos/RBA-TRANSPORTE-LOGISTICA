import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

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
      beneficiary_document: RBAAuth.maskCPF(d.beneficiary_document, role)
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
    const newDriver = await RBADatabase.createDriver(
      body, 
      session.user.id, 
      session.user.name
    );

    return NextResponse.json({ success: true, driver: newDriver });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
