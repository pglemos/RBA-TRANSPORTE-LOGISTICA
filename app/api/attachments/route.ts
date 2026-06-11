import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const operatorName = session.user?.name || 'Sistema';
    if (!session.user || RBAAuth.isReadOnly(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado para anexar documentos." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = formData.get('order_id') as string | null;
    // Categoria do documento (comprovante_pagamento | auditoria_carga | cte | manifesto | outros)
    const category = formData.get('category') as string | null;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Identificação da ordem (order_id) é obrigatória." }, { status: 400 });
    }
    const order = await RBADatabase.getFreightOrderById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: "Ficha de frete não encontrada para anexar documento." }, { status: 404 });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: "Selecione um arquivo real para anexar." }, { status: 400 });
    }
    const allowedTypes = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/xml', 'application/xml']);
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ success: false, error: "Tipo de arquivo não permitido. Use PDF, imagem ou XML." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Arquivo excede o limite de 10 MB." }, { status: 400 });
    }

    // Read file binary and write to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean file name
    const sanitizedName = file.name.replace(/[^A-Za-z0-9.-]/g, '_');
    const uniqueName = `${randomUUID()}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    // Insert into DB — guardamos a CATEGORIA do documento em file_type
    // (comprovante_pagamento, auditoria_carga, cte, manifesto...) para agrupamento.
    let newAtt;
    try {
      newAtt = await RBADatabase.createAttachment(
        orderId,
        file.name,
        fileUrl,
        category || file.type || 'application/octet-stream',
        operatorName
      );
    } catch (error) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw error;
    }

    return NextResponse.json({ success: true, attachment: newAtt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    if (!session.user || RBAAuth.isReadOnly(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado para excluir anexos." }, { status: 403 });
    }
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: "ID do anexo obrigatório." }, { status: 400 });
    }

    const success = await RBADatabase.deleteAttachment(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
