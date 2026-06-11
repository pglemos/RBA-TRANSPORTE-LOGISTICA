import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { FreightOrderSchema } from '@/lib/validators';
import { signFreightOrderProof } from '@/lib/proof';

const FINANCIAL_ORDER_FIELDS = new Set([
  'freight_value',
  'advance_value',
  'cash_value',
  'loading_expense',
  'unloading_expense',
  'other_expenses',
  'cte_value',
  'cte_discount_percent'
]);

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
    (maskedOrder as any).pdf_proof_token = signFreightOrderProof(order);

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

    const currentOrder = await RBADatabase.getFreightOrderById(id);
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: "Ordem de frete não encontrada." }, { status: 404 });
    }

    const body = await req.json();

    // Check specific constraint limits based on role
    if (session.user.role === 'Operacional') {
      if (body.status === 'Pago' && currentOrder.status !== 'Pago') {
        return NextResponse.json({ success: false, error: "Operacional não pode marcar ordem como Paga ou liquidada directamente." }, { status: 403 });
      }
      const attemptedFinancialEdit = Object.keys(body).some((key) =>
        FINANCIAL_ORDER_FIELDS.has(key) && Number((body as any)[key]) !== Number((currentOrder as any)[key] ?? 0)
      );
      if (attemptedFinancialEdit) {
        return NextResponse.json({ success: false, error: "Operacional não pode alterar valores financeiros da ficha." }, { status: 403 });
      }
    }

    const allowedKeys = Object.keys(FreightOrderSchema.shape);
    const normalizedBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedKeys.includes(key))
    );
    const merged = {
      ...currentOrder,
      ...normalizedBody,
      freight_value: Number((normalizedBody as any).freight_value ?? currentOrder.freight_value) || 0,
      advance_value: Number((normalizedBody as any).advance_value ?? currentOrder.advance_value) || 0,
      cash_value: Number((normalizedBody as any).cash_value ?? currentOrder.cash_value) || 0,
      loading_expense: Number((normalizedBody as any).loading_expense ?? currentOrder.loading_expense) || 0,
      unloading_expense: Number((normalizedBody as any).unloading_expense ?? currentOrder.unloading_expense) || 0,
      other_expenses: Number((normalizedBody as any).other_expenses ?? currentOrder.other_expenses) || 0,
      cte_value: Number((normalizedBody as any).cte_value ?? currentOrder.cte_value) || 0,
      cte_discount_percent: Number((normalizedBody as any).cte_discount_percent ?? currentOrder.cte_discount_percent ?? 10)
    };
    const parsed = FreightOrderSchema.safeParse(merged);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Dados da ficha inválidos.' }, { status: 400 });
    }

    const updatePayload = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => key in normalizedBody)
    );
    const updated = await RBADatabase.updateFreightOrder(id, updatePayload, session.user.id, session.user.name);
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
