import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    // Retrieve all payments with populated order numbers
    const payments = await RBADatabase.getPayments();
    const orders = await RBADatabase.getFreightOrders();
    const drivers = await RBADatabase.getDrivers();

    const populated = payments.map(pay => {
      const order = orders.find(o => o.id === pay.freight_order_id);
      const driver = order ? drivers.find(d => d.id === order.driver_id) : null;

      return {
        ...pay,
        order_number: order ? order.order_number : "Não vinculado",
        destination: order ? order.destination : "N/A",
        driver_name: driver ? driver.name : "Desconhecido"
      };
    });

    return NextResponse.json(populated);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    // Check financial role constraints
    if (!session.user || !RBAAuth.canEditFinance(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado: Somente perfis administrativos ou financeiros." }, { status: 403 });
    }

    const body = await req.json();

    if (!body.freight_order_id) {
      return NextResponse.json({ success: false, error: "Vinculação de ordem de frete obrigatória." }, { status: 400 });
    }
    if (Number(body.amount) <= 0) {
      return NextResponse.json({ success: false, error: "O valor de pagamento ou reembolso deve ser maior que zero." }, { status: 400 });
    }

    const newPay = await RBADatabase.createPayment(body, session.user.id, session.user.name);
    return NextResponse.json({ success: true, payment: newPay });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
