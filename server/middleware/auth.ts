import type { Context, Next } from 'hono';
import { auth } from '../../lib/auth';

type AuthSession = typeof auth.$Infer.Session;

export type AuthEnv = {
  Variables: {
    session: AuthSession;
  };
};

export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('session', session);
  return next();
}
