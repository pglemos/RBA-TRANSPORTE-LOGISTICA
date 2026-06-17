import { NextRequest, NextResponse } from 'next/server';
import { RBAAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await RBAAuth.getSession(req);
  return NextResponse.json(session, { status: session.user ? 200 : 401 });
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Autenticação por troca de perfil foi removida.' },
    { status: 405 },
  );
}
