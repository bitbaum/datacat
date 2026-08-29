import { prisma } from '@/lib/db';

export async function GET(_req: Request, ctx: any) {
  const { id } = ctx.params as { id: string };
  const form = await prisma.form.findFirst({ where: { id, isPublished: true } });
  if (!form) return Response.json({ message: 'Not found' }, { status: 404 });
  return Response.json({
    id: form.id,
    title: form.title,
    description: form.description,
    structure: form.schema,
  });
}
