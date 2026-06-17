import type { FreightOrderAttachment } from './db';
import { isSupabaseServerConfigured, supabaseServer } from './supabase/server';

export const ATTACHMENTS_BUCKET = process.env.SUPABASE_ATTACHMENTS_BUCKET || 'order-attachments';
const SIGNED_URL_TTL_SECONDS = 5 * 60;

function storagePathFromUrl(fileUrl?: string | null) {
  if (!fileUrl) return null;
  if (!/^https?:\/\//i.test(fileUrl) && !fileUrl.startsWith('/uploads/')) return fileUrl;

  try {
    const url = new URL(fileUrl);
    const marker = `/storage/v1/object/public/${ATTACHMENTS_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export async function createAttachmentSignedUrl(fileUrl: string) {
  if (!isSupabaseServerConfigured) return fileUrl;

  const storagePath = storagePathFromUrl(fileUrl);
  if (!storagePath) return fileUrl;

  const { data, error } = await supabaseServer
    .storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw new Error(`Erro ao assinar URL do anexo: ${error.message}`);
  }

  return data.signedUrl;
}

export async function signAttachmentRecord<T extends FreightOrderAttachment>(attachment: T): Promise<T> {
  return {
    ...attachment,
    file_url: await createAttachmentSignedUrl(attachment.file_url),
  };
}

export async function signAttachmentRecords<T extends FreightOrderAttachment>(attachments: T[]): Promise<T[]> {
  return Promise.all(attachments.map(signAttachmentRecord));
}

export async function removeAttachmentObject(fileUrl?: string | null) {
  if (!isSupabaseServerConfigured) return false;

  const storagePath = storagePathFromUrl(fileUrl);
  if (!storagePath) return false;

  const { error } = await supabaseServer.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
  if (error) {
    throw new Error(`Erro ao remover anexo do Storage: ${error.message}`);
  }

  return true;
}
