import { prisma } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function PUT(req: Request, ctx: any) {
  const { id } = ctx.params as { id: string };
  const user = await getAuthUserFromRequest(req);
  if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const { status } = await req.json();
  const isPublished = status === 'published';
  const found = await prisma.form.findFirst({ where: { id, userId: user.id } });
  if (!found) return Response.json({ success: false, message: 'Not found' }, { status: 404 });
  const updated = await prisma.form.update({ where: { id }, data: { isPublished } });
  return Response.json({ success: true, status: updated.isPublished ? 'published' : 'draft' });
}
