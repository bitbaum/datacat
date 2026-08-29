import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return Response.json({ success: false, message: 'Missing credentials' }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return Response.json({ success: false, message: 'User exists' }, { status: 409 });
  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  return Response.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
