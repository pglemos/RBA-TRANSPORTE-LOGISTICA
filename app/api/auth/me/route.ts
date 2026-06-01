import { NextRequest, NextResponse } from 'next/server';
import { RBAAuth } from '@/lib/auth';
import { RBADatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const session = RBAAuth.getSession(cookieHeader);
  return NextResponse.json(session);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, email, role } = body;

    const profiles = await RBADatabase.getProfiles();
    const matchedProfile = profiles.find(p => p.id === userId || p.email === email);
    const activeRole = role || (matchedProfile ? matchedProfile.role : 'Consulta/Auditoria');
    const activeName = name || (matchedProfile ? matchedProfile.name : 'Visitante');
    const activeEmail = email || (matchedProfile ? matchedProfile.email : 'visitor@rba.com');
    const activeId = userId || (matchedProfile ? matchedProfile.id || 'visit_1' : 'visit_1');

    const updatedUser = {
      id: activeId,
      name: activeName,
      email: activeEmail,
      role: activeRole,
      active: true
    };

    // Update memory fallback too
    RBAAuth.setFallbackSession(updatedUser);

    await RBADatabase.addAuditLog(
      activeId,
      activeName,
      "Simular Perfil",
      "Sessão",
      activeId,
      {},
      { msg: `Usuário mudou contexto para papel: ${activeRole}` }
    );

    const response = NextResponse.json({ success: true, user: updatedUser });
    
    // Set cookie headers for persistent session matching RBAAuth.getSession
    response.cookies.set('rba_user_id', activeId, { path: '/', maxAge: 60 * 60 * 24 });
    response.cookies.set('rba_user_name', activeName, { path: '/', maxAge: 60 * 60 * 24 });
    response.cookies.set('rba_user_email', activeEmail, { path: '/', maxAge: 60 * 60 * 24 });
    response.cookies.set('rba_role', activeRole, { path: '/', maxAge: 60 * 60 * 24 });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
