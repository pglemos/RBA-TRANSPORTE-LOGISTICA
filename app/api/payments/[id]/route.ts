import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

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
    const updated = await RBADatabase.updatePayment(id, body, session.user.id, session.user.name);
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
