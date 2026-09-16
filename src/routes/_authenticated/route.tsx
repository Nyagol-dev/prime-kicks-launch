import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getMe } from '@/lib/auth.functions';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const user = await getMe();
    if (!user) throw redirect({ to: '/auth' });
    return { user };
  },
  component: () => <Outlet />,
});
