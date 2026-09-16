import { createFileRoute } from '@tanstack/react-router';
import { readSessionCookie, verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async (ctx) => {
        // Verify admin session from cookie
        const cookieHeader = ctx.request.headers.get('cookie');
        const token = readSessionCookie(cookieHeader);
        const payload = token ? verifyToken(token) : null;

        if (!payload?.isAdmin) {
          return new Response('Unauthorized', { status: 401 });
        }

        const contentType = ctx.request.headers.get('content-type') ?? '';
        if (!contentType.includes('multipart/form-data')) {
          return new Response('Expected multipart/form-data', { status: 400 });
        }

        let formData: FormData;
        try {
          formData = await ctx.request.formData();
        } catch {
          return new Response('Could not parse form data', { status: 400 });
        }

        const file = formData.get('file');
        if (!(file instanceof File)) {
          return new Response('No file provided', { status: 400 });
        }

        if (file.size > 8 * 1024 * 1024) {
          return new Response('File too large (max 8 MB)', { status: 413 });
        }

        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
        if (!allowed.includes(file.type)) {
          return new Response('Unsupported file type', { status: 415 });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const uploadsDir = join(process.cwd(), 'public', 'uploads');

        await mkdir(uploadsDir, { recursive: true });
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(join(uploadsDir, filename), buffer);

        return Response.json({ url: `/uploads/${filename}` });
      },
    },
  },
});
