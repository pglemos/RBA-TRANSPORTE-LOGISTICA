import { createHmac } from 'crypto';
import { FreightOrder } from './db';

const signingSecret = () =>
  process.env.RBA_PDF_SIGNING_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'rba-local-dev-signing-key';

export function signFreightOrderProof(order: Pick<FreightOrder, 'id' | 'order_number' | 'cte_number' | 'net_value' | 'updated_at'>) {
  const payload = [
    order.id,
    order.order_number || '',
    order.cte_number || '',
    Number(order.net_value || 0).toFixed(2),
    order.updated_at || ''
  ].join('|');

  return createHmac('sha256', signingSecret()).update(payload).digest('hex');
}
