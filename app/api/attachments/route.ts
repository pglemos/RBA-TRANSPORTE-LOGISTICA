import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { RBAAuth } from '@/lib/auth';
import { RBADatabase } from '@/lib/db';
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabase/server';
import {
  ATTACHMENTS_BUCKET,
  createAttachmentSignedUrl,
  removeAttachmentObject,
  signAttachmentRecord,
} from '@/lib/attachments';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/xml',
  'application/xml',
]);

type StoredFile = {
  fileUrl: string;
  localPath?: string;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 140) || 'anexo';
}

function validateFile(file: File) {
  if (file.size <= 0) return 'Selecione um arquivo real para anexar.';
  if (file.size > MAX_FILE_SIZE_BYTES) return 'Arquivo maior que 4 MB. Reduza o arquivo e tente novamente.';
  if (!ALLOWED_TYPES.has(file.type)) return 'Tipo de arquivo não permitido. Envie PDF, imagem PNG/JPG/WEBP ou XML.';
  return null;
}

async function ensureAttachmentsBucket() {
  const { error: getError } = await supabaseServer.storage.getBucket(ATTACHMENTS_BUCKET);
  if (!getError) return;

  const { error: createError } = await supabaseServer.storage.createBucket(ATTACHMENTS_BUCKET, {
    public: false,
    fileSizeLimit: `${Math.ceil(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB`,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  });

  if (createError) {
    throw new Error(`Erro ao preparar bucket de anexos: ${createError.message}`);
  }
}

async function storeFile(file: File, orderId: string): Promise<StoredFile> {
  const sanitizedName = sanitizeFileName(file.name);
  const uniqueName = `${randomUUID()}_${sanitizedName}`;

  if (isSupabaseServerConfigured) {
    await ensureAttachmentsBucket();
    const storagePath = `freight-orders/${orderId}/${uniqueName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseServer.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao enviar arquivo para o Supabase Storage: ${uploadError.message}`);
    }

    return { fileUrl: storagePath };
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const localPath = path.join(uploadsDir, uniqueName);
  fs.writeFileSync(localPath, Buffer.from(await file.arrayBuffer()));
  return { fileUrl: `/uploads/${uniqueName}`, localPath };
}

function localUploadPath(fileUrl?: string | null) {
  if (!fileUrl?.startsWith('/uploads/')) return null;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const uploadPath = path.join(process.cwd(), 'public', fileUrl);
  return uploadPath.startsWith(uploadsDir) ? uploadPath : null;
}

async function removeStoredFile(file: StoredFile | string | null | undefined) {
  const fileUrl = typeof file === 'string' ? file : file?.fileUrl;
  if (await removeAttachmentObject(fileUrl)) return;

  const localPath = typeof file === 'string' ? localUploadPath(file) : file?.localPath;
  if (localPath && fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
    return;
  }

  const fallbackPath = localUploadPath(fileUrl);
  if (fallbackPath && fs.existsSync(fallbackPath)) {
    fs.unlinkSync(fallbackPath);
  }
}

async function findAttachmentUrl(id: string) {
  if (!isSupabaseServerConfigured) return null;

  const { data, error } = await supabaseServer
    .from('freight_order_attachments')
    .select('file_url')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar anexo: ${error.message}`);
  }

  return data?.file_url || null;
}

export async function POST(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador', 'Operacional', 'Financeiro']);
    if (guard.response) return guard.response;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = formData.get('order_id') as string | null;
    const category = formData.get('category') as string | null;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Identificação da ordem (order_id) é obrigatória.' },
        { status: 400 },
      );
    }

    const order = await RBADatabase.getFreightOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Ficha de frete não encontrada para anexar documento.' },
        { status: 404 },
      );
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'Selecione um arquivo real para anexar.' }, { status: 400 });
    }

    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const storedFile = await storeFile(file, orderId);
    try {
      const attachment = await RBADatabase.createAttachment(
        orderId,
        file.name,
        storedFile.fileUrl,
        category || file.type || 'application/octet-stream',
        guard.session.user!.name,
      );
      const signedAttachment = isSupabaseServerConfigured
        ? await signAttachmentRecord(attachment)
        : { ...attachment, file_url: await createAttachmentSignedUrl(attachment.file_url) };
      return NextResponse.json({ success: true, attachment: signedAttachment });
    } catch (error) {
      await removeStoredFile(storedFile);
      throw error;
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador', 'Operacional', 'Financeiro']);
    if (guard.response) return guard.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do anexo obrigatório.' }, { status: 400 });
    }

    const attachmentUrl = await findAttachmentUrl(id);
    const success = await RBADatabase.deleteAttachment(id);
    if (success) {
      await removeStoredFile(attachmentUrl);
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
