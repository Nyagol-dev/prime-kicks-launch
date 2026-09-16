import { createMiddleware } from '@tanstack/react-start';
import { supabase } from './client';

// Registered as a global `functionMiddleware` in `src/start.ts`; attaches the
// current Supabase session token to all serverFn RPC calls as a Bearer header.
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
