import { AsyncLocalStorage } from 'async_hooks';
import type { SupabaseClient } from '@supabase/supabase-js';

const rbaDataClientStore = new AsyncLocalStorage<SupabaseClient>();

export function enterRBADataClient(client: SupabaseClient) {
  rbaDataClientStore.enterWith(client);
}

export function getRBADataClient(fallback: SupabaseClient) {
  return rbaDataClientStore.getStore() ?? fallback;
}
