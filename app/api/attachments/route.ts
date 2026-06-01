import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const operatorName = session.user?.name || 'Sistema';

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = formData.get('order_id') as string | null;
    const customType = formData.get('file_type') as string | null;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Identificação da ordem (order_id) é obrigatória." }, { status: 400 });
    }

    if (!file) {
      // Create a fallback attachment for demo ease if file slot is empty
      const demoPicNum = Math.floor(Math.random() * 100);
      const mockUrl = `https://picsum.photos/seed/doc${demoPicNum}/600/400`;
      const docName = customType === 'cte' ? 'CTE-Simulado-Digital.pdf' : 'Documento-Fiscal.png';
      
      const newAtt = await RBADatabase.createAttachment(
        orderId,
        docName,
        mockUrl,
        customType === 'cte' ? 'application/pdf' : 'image/png',
        operatorName
      );
      
      return NextResponse.json({ success: true, attachment: newAtt });
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
    const uniqueName = `${Date.now()}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    // Insert into DB
    const newAtt = await RBADatabase.createAttachment(
      orderId,
      file.name,
      fileUrl,
      file.type || 'application/octet-stream',
      operatorName
    );

    return NextResponse.json({ success: true, attachment: newAtt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
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
