import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

type FormWithSubmissionCount = Prisma.FormGetPayload<{
  include: { _count: { select: { submissions: true } } };
}>;

export async function GET(req: Request) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const forms = await prisma.form.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { submissions: true } } },
  });

  const data = forms.map((f: FormWithSubmissionCount) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    structure: f.schema as any,
    isMultiStep: (f.schema as any)?.isMultiStep ?? false,
    status: f.isPublished ? 'published' : 'draft',
    is_template: f.isTemplate,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
    submission_count: f._count?.submissions ?? 0,
  }));

  return Response.json(data);
}

export async function POST(req: Request) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, structure, status } = body || {};
  if (!title || !structure) {
    return Response.json({ success: false, message: 'Missing title or structure' }, { status: 400 });
  }
  const isPublished = status === 'published';
  const created = await prisma.form.create({
    data: {
      title,
      description,
      schema: structure,
      userId: user.id,
      isPublished,
    },
  });

  return Response.json({
    id: created.id,
    title: created.title,
    description: created.description,
    structure: created.schema,
    status: created.isPublished ? 'published' : 'draft',
    created_at: created.createdAt,
    updated_at: created.updatedAt,
  });
}


