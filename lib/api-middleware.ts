import type { z } from 'zod';
import { auth } from '@/lib/auth';

type Session = typeof auth.$Infer.Session;

export type ApiError = {
  error: string;
  details?: unknown;
};

export function json<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function errorResponse(
  error: string,
  status: number,
  details?: unknown,
): Response {
  return json<ApiError>({ error, details }, { status });
}

type AuthenticatedHandler = (
  request: Request,
  session: Session,
) => Promise<Response> | Response;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request): Promise<Response> => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    return handler(request, session);
  };
}

export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<
  { success: true; data: z.infer<T> } | { success: false; error: Response }
> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        success: false,
        error: errorResponse(
          'Invalid request body',
          400,
          parsed.error.format(),
        ),
      };
    }

    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      error: errorResponse('Invalid JSON', 400),
    };
  }
}
