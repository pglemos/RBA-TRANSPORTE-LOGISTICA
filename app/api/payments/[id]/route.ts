import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { FreightPaymentSchema } from '@/lib/validators';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    if (!session.user || !RBAAuth.canEditFinance(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado: Somente financeiro ou administrador." }, { status: 403 });
    }

    const body = await req.json();
    const payments = await RBADatabase.getPayments();
    const current = payments.find(p => p.id === id);
    if (!current) {
      return NextResponse.json({ success: false, error: "Pagamento não encontrado." }, { status: 404 });
    }
    const allowedKeys = Object.keys(FreightPaymentSchema.shape);
    const normalizedBody = Object.fromEntries(Object.entries(body).filter(([key]) => allowedKeys.includes(key)));
    const merged = {
      ...current,
      ...normalizedBody,
      amount: Number((normalizedBody as any).amount ?? current.amount) || 0
    };
    const parsed = FreightPaymentSchema.safeParse(merged);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Dados do pagamento inválidos.' }, { status: 400 });
    }
    const updatePayload = {
      ...Object.fromEntries(Object.entries(parsed.data).filter(([key]) => key in normalizedBody)),
      ...(body.proof_url !== undefined ? { proof_url: String(body.proof_url || '') } : {})
    };
    const updated = await RBADatabase.updatePayment(id, updatePayload, session.user.id, session.user.name);
    return NextResponse.json({ success: true, payment: updated });
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

    // Operational users cannot remove financial entries
    if (!session.user || !RBAAuth.canDeleteFinancialData(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado: Somente administradores ou financeiro podem remover lançamentos." }, { status: 403 });
    }

    const success = await RBADatabase.deletePayment(id, session.user.id, session.user.name);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
