import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('auth layer does not trust simulated role cookies or default to admin', () => {
  const authSource = read('lib/auth.ts');
  const authRouteSource = read('app/api/auth/me/route.ts');

  assert.equal(authSource.includes('currentServerSession'), false);
  assert.equal(authSource.includes('rba_role'), false);
  assert.equal(authSource.includes('role: "Administrador"'), false);
  assert.equal(authRouteSource.includes('const { userId, name, email, role } = body'), false);
  assert.equal(authRouteSource.includes("response.cookies.set('rba_role'"), false);
});

test('server data client does not fall back to public keys for privileged access', () => {
  const serverSource = read('lib/supabase/server.ts');

  assert.equal(serverSource.includes('process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC'), false);
  assert.equal(serverSource.includes('placeholder-service-key'), false);
});

test('database operations use request scoped Supabase client instead of direct service-role bypass', () => {
  const dbSource = read('lib/db.ts');
  const authSource = read('lib/auth.ts');

  assert.equal(dbSource.includes('supabaseServer.from('), false);
  assert.equal(dbSource.includes('supabaseDataClient().from('), true);
  assert.equal(authSource.includes('enterRBADataClient'), true);
});

test('attachments storage remains private and uses signed access instead of public URLs', () => {
  const attachmentsRouteSource = read('app/api/attachments/route.ts');
  const attachmentsHelperSource = read('lib/attachments.ts');

  assert.equal(attachmentsRouteSource.includes('public: true'), false);
  assert.equal(attachmentsRouteSource.includes('getPublicUrl'), false);
  assert.equal(attachmentsHelperSource.includes('createSignedUrl'), true);
});

test('production security headers are configured', () => {
  const nextConfigSource = read('next.config.ts');

  assert.equal(nextConfigSource.includes('Content-Security-Policy'), true);
  assert.equal(nextConfigSource.includes('X-Frame-Options'), true);
  assert.equal(nextConfigSource.includes('X-Content-Type-Options'), true);
  assert.equal(nextConfigSource.includes('Referrer-Policy'), true);
});
