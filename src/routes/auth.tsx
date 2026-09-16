import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { signIn, signUp } from '@/lib/auth.functions';
import { Logo } from '@/components/site/Logo';

export const Route = createFileRoute('/auth')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Owner Login | Prime Kicks KE' },
      { name: 'description', content: 'Private login for the Prime Kicks KE shop owner.' },
      { name: 'robots', content: 'noindex' },
      { property: 'og:title', content: 'Owner Login | Prime Kicks KE' },
      { property: 'og:description', content: 'Private login for the Prime Kicks KE shop owner.' },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const signInFn = useServerFn(signIn);
  const signUpFn = useServerFn(signUp);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInFn({ data: { email, password } });
      } else {
        await signUpFn({ data: { email, password } });
      }
      await navigate({ to: '/admin', replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  const field =
    'w-full border border-border bg-surface px-4 py-3.5 text-sm outline-none transition-colors focus:border-primary';

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="display mt-8 text-3xl">Owner access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'signin'
            ? 'Sign in to manage products and orders.'
            : 'Create the shop owner account.'}
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            placeholder="Email"
            autoComplete="email"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
            placeholder="Password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary py-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === 'signin' ? 'Need an account? Create one' : 'Have an account? Sign in'}
        </button>
      </div>
    </main>
  );
}
