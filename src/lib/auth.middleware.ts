import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { verifyToken, readSessionCookie } from './auth';

export type AuthContext = {
  userId: string;
  isAdmin: boolean;
};

// Reads the pk_session httpOnly cookie, verifies the JWT, and injects
// { userId, isAdmin } into the server function context.
// Throws a 401-style error if the token is missing or invalid.
export const requireAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();
    const cookieHeader = request?.headers?.get('cookie') ?? null;
    const token = readSessionCookie(cookieHeader);

    if (!token) {
      throw new Error('Unauthorized: No session cookie');
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new Error('Unauthorized: Invalid or expired session');
    }

    return next({
      context: {
        userId: payload.sub,
        isAdmin: payload.isAdmin,
      } satisfies AuthContext,
    });
  },
);

// Same as requireAuth but also asserts the user is an admin.
export const requireAdmin = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();
    const cookieHeader = request?.headers?.get('cookie') ?? null;
    const token = readSessionCookie(cookieHeader);

    if (!token) {
      throw new Error('Unauthorized: No session cookie');
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new Error('Unauthorized: Invalid or expired session');
    }

    if (!payload.isAdmin) {
      throw new Error('Forbidden: Admin access required');
    }

    return next({
      context: {
        userId: payload.sub,
        isAdmin: true,
      } satisfies AuthContext,
    });
  },
);
