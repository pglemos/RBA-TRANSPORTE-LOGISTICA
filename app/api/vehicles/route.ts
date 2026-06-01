import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const vehicles = await RBADatabase.getVehicles();
    
    // Mask owner document if sensitive based on roles
    const processed = vehicles.map(v => ({
      ...v,
      owner_document: RBAAuth.maskCPF(v.owner_document, role),
      renavam: role === 'Administrador' || role === 'Operacional' || role === 'Financeiro' ? v.renavam : '***' + v.renavam.slice(-3)
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
    const newVehicle = await RBADatabase.createVehicle(body, session.user.id, session.user.name);
    return NextResponse.json({ success: true, vehicle: newVehicle });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
