import { NextRequest, NextResponse } from 'next/server';
import { RBAAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('rba_user_id');
  response.cookies.delete('rba_user_name');
  response.cookies.delete('rba_user_email');
  response.cookies.delete('rba_role');
  
  // Set memory back to visitor
  RBAAuth.setFallbackSession({
    id: "user_admin",
    name: "Morgan Ribeiro (Admin)",
    email: "admin@rba.com",
    role: "Administrador",
    active: true
  });
  
  return response;
}

export async function GET(req: NextRequest) {
  // Support simple GET logout too
  const response = NextResponse.redirect(new URL('/login', req.nextUrl));
  response.cookies.delete('rba_user_id');
  response.cookies.delete('rba_user_name');
  response.cookies.delete('rba_user_email');
  response.cookies.delete('rba_role');
  
  RBAAuth.setFallbackSession({
    id: "user_admin",
    name: "Morgan Ribeiro (Admin)",
    email: "admin@rba.com",
    role: "Administrador",
    active: true
  });
  
  return response;
}
