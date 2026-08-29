import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return Response.json({ success: false, message: 'Missing credentials' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return Response.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }
  const ok = await compare(password, user.passwordHash);
  if (!ok) {
    return Response.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }
  const token = await new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  return Response.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
