import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { FreightPaymentSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req);
    if (guard.response) return guard.response;

    const payments = await RBADatabase.getPayments();

    const orderIds = Array.from(new Set(payments.map((p) => p.freight_order_id).filter(Boolean)));
    const orders = await RBADatabase.getFreightOrdersByIds(orderIds);

    const driverIds = Array.from(new Set(orders.map((o) => o.driver_id).filter(Boolean)));
    const drivers = await RBADatabase.getDriversByIds(driverIds);

    const populated = payments.map((payment) => {
      const order = orders.find((item) => item.id === payment.freight_order_id);
      const driver = order ? drivers.find((item) => item.id === order.driver_id) : null;
      return {
        ...payment,
        order_number: order ? order.order_number : 'Não vinculado',
        cte_number: order ? (order.cte_number || 'Sem CTE') : 'Não vinculado',
        order_status: order ? (order.status || 'Contratar') : 'N/A',
        destination: order ? order.destination : 'N/A',
        driver_name: driver ? driver.name : 'Desconhecido',
      };
    });

    return NextResponse.json(populated);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador', 'Financeiro']);
    if (guard.response) return guard.response;

    const body = await req.json();
    const payload = {
      ...body,
      amount: Number(body.amount) || 0,
    };
    const parsed = FreightPaymentSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados do pagamento inválidos.' },
        { status: 400 },
      );
    }

    const session = guard.session.user!;
    const newPayment = await RBADatabase.createPayment(
      { ...parsed.data, proof_url: body.proof_url || '', notes: parsed.data.notes || '' },
      session.id,
      session.name,
    );

    return NextResponse.json({ success: true, payment: newPayment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
