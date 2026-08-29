import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const { form_id, data } = await req.json();
  if (!form_id || !data)
    return Response.json({ message: 'Missing form_id or data' }, { status: 400 });
  const form = await prisma.form.findUnique({ where: { id: form_id } });
  if (!form || !form.isPublished)
    return Response.json({ message: 'Form not found or not published' }, { status: 404 });
  const created = await prisma.submission.create({
    data: { formId: form_id, data, status: 'PENDING' },
  });
  return Response.json({ success: true, id: created.id });
}
