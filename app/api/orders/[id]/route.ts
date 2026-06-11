import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const order = await RBADatabase.getFreightOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Ordem de frete não encontrada." }, { status: 404 });
    }

    const driver = await RBADatabase.getDriverById(order.driver_id);
    const vehicle = await RBADatabase.getVehicleById(order.vehicle_id);
    const client = await RBADatabase.getClientById(order.client_id);
    const payments = await RBADatabase.getPaymentsByOrderId(id);
    const attachments = await RBADatabase.getAttachmentsByOrderId(id);

    // Apply LGPD masking conditionally
    const maskedOrder = {
      ...order,
      driver_name: driver ? driver.name : "N/A",
      driver_phone: driver ? driver.phone : "N/A",
      driver_cpf: driver ? RBAAuth.maskCPF(driver.cpf, role) : "N/A",
      driver_rg: driver ? RBAAuth.maskRG(driver.rg, role) : "N/A",
      vehicle_tractor_plate: vehicle ? vehicle.tractor_plate : "N/A",
      vehicle_trailer_plate: vehicle ? vehicle.trailer_plate : "N/A",
      vehicle_model: vehicle ? vehicle.model : "N/A",
      vehicle_year: vehicle ? vehicle.year : "N/A",
      client_name: client ? client.name : "N/A",
      client_document: client ? RBAAuth.maskDocument(client.document, role) : "N/A",
      bank_data_snapshot: {
        bank_name: order.bank_data_snapshot.bank_name,
        bank_agency: order.bank_data_snapshot.bank_agency,
        bank_account: RBAAuth.maskBankDetails(order.bank_data_snapshot.bank_account, role),
        pix_key: RBAAuth.maskPixKey(order.bank_data_snapshot.pix_key, role),
        beneficiary_name: order.bank_data_snapshot.beneficiary_name
      },
      payments,
      attachments
    };

    return NextResponse.json(maskedOrder);
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
      return NextResponse.json({ success: false, error: "Acesso negado: Perfil de visualização apenas." }, { status: 403 });
    }

    const body = await req.json();
    if (String(body.buonny_code || '').length > 20) {
      return NextResponse.json({ success: false, error: "O código da consulta Buonny deve ter no máximo 20 caracteres." }, { status: 400 });
    }

    // Check specific constraint limits based on role
    if (session.user.role === 'Operacional') {
      // Operacional profiles can create & edit but CANNOT change payment statuses or alter payment entries
      const oldOrder = await RBADatabase.getFreightOrderById(id);
      if (oldOrder && body.status === 'Pago' && oldOrder.status !== 'Pago') {
        return NextResponse.json({ success: false, error: "Operacional não pode marcar ordem como Paga ou liquidada directamente." }, { status: 403 });
      }
    }

    const updated = await RBADatabase.updateFreightOrder(id, body, session.user.id, session.user.name);
    return NextResponse.json({ success: true, order: updated });
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

    // Operational profiles cannot delete core records
    if (!session.user || session.user.role === 'Operacional' || RBAAuth.isReadOnly(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado: Exclusão proibida para o perfil operacional ou de consulta." }, { status: 403 });
    }

    const success = await RBADatabase.deleteFreightOrder(id, session.user.id, session.user.name);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
