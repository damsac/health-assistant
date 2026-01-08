import { withAuth } from '@/lib/api-middleware';

const AGENT_URL = process.env.EXPO_PUBLIC_AGENT_URL || 'http://localhost:4000';

export const GET = withAuth(async (request, session) => {
  const url = new URL(request.url);
  const queryParams = url.searchParams.toString();

  const response = await fetch(
    `${AGENT_URL}/garmin/metrics/summary${queryParams ? `?${queryParams}` : ''}`,
    {
      headers: {
        'x-user-id': session.user.id,
      },
    },
  );

  const data = await response.json();
  return Response.json(data, { status: response.status });
});
