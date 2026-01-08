import { withAuth } from '@/lib/api-middleware';

const AGENT_URL = process.env.EXPO_PUBLIC_AGENT_URL || 'http://localhost:4000';

export const POST = withAuth(async (request, session) => {
  const body = await request.json();

  const response = await fetch(`${AGENT_URL}/garmin/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': session.user.id,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
});
