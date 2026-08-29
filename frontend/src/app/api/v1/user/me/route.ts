import { prisma } from '@/lib/db';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('x-auth-token');
  const token = auth?.toString().startsWith('Bearer ')
    ? auth.toString().slice(7)
    : (auth || '').toString();
  if (!token) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const { payload } = await jwtVerify(token, secret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub as string } });
    if (!user) return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    return Response.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return Response.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('x-auth-token');
  const token = auth?.toString().startsWith('Bearer ')
    ? auth.toString().slice(7)
    : (auth || '').toString();
  if (!token) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const { payload } = await jwtVerify(token, secret);
    const { name } = await req.json();
    const user = await prisma.user.update({
      where: { id: payload.sub as string },
      data: { ...(name !== undefined && { name }) },
    });
    return Response.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return Response.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }
}
