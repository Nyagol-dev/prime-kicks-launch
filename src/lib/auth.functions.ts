import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  buildSessionCookie,
  buildClearCookie,
  readSessionCookie,
} from './auth';

function setResponseCookie(cookie: string) {
  // Append Set-Cookie header via the underlying h3 event
  // getWebRequest gives us the Request; we write to the Response via a small trick:
  // TanStack Start exposes appendResponseHeader on the event node
  const { appendResponseHeader } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__tss_event__ ?? {};
  if (typeof appendResponseHeader === 'function') {
    appendResponseHeader('Set-Cookie', cookie);
    return;
  }
  // Fallback: store in a request-scoped map picked up by the response interceptor
  const req = getWebRequest();
  if (req) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).__pendingCookies__ ??= [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).__pendingCookies__.push(cookie);
  }
}

// ─── Sign Up ─────────────────────────────────────────────────

export const signUp = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ email: z.string().email(), password: z.string().min(6).max(72) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;

    const existing = await sql`SELECT id FROM users WHERE email = ${data.email.toLowerCase()} LIMIT 1`;
    if (existing.length > 0) throw new Error('An account with that email already exists');

    const passwordHash = await hashPassword(data.password);

    // First user to register becomes admin
    const countResult = await sql`SELECT COUNT(*)::int AS count FROM users`;
    const isAdmin = (countResult[0]?.['count'] as number ?? 0) === 0;

    const insertResult = await sql`
      INSERT INTO users (email, password_hash, is_admin)
      VALUES (${data.email.toLowerCase()}, ${passwordHash}, ${isAdmin})
      RETURNING id, is_admin
    `;
    const user = insertResult[0];
    if (!user) throw new Error('Failed to create account');

    const token = signToken({ sub: String(user['id']), isAdmin: user['is_admin'] as boolean });
    setResponseCookie(buildSessionCookie(token));

    return { ok: true, isAdmin: user['is_admin'] as boolean };
  });

// ─── Sign In ─────────────────────────────────────────────────

export const signIn = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;

    const rows = await sql`
      SELECT id, password_hash, is_admin FROM users
      WHERE email = ${data.email.toLowerCase()} LIMIT 1
    `;
    const user = rows[0];
    if (!user) throw new Error('Incorrect email or password');

    const valid = await verifyPassword(data.password, user['password_hash'] as string);
    if (!valid) throw new Error('Incorrect email or password');

    const token = signToken({ sub: String(user['id']), isAdmin: user['is_admin'] as boolean });
    setResponseCookie(buildSessionCookie(token));

    return { ok: true, isAdmin: user['is_admin'] as boolean };
  });

// ─── Sign Out ────────────────────────────────────────────────

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  setResponseCookie(buildClearCookie());
  return { ok: true };
});

// ─── Get current user (for route guards) ─────────────────────

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  const cookieHeader = request?.headers?.get('cookie') ?? null;
  const token = readSessionCookie(cookieHeader);

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return { userId: payload.sub, isAdmin: payload.isAdmin };
});
