import { config } from '@/lib/config';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/garmin', '');
  const search = url.search;

  const response = await fetch(`${config.agent.url}/garmin${path}${search}`, {
    method: 'GET',
    headers: request.headers,
    credentials: 'include',
  });

  return response;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/garmin', '');

  const body = await request.text();

  const response = await fetch(`${config.agent.url}/garmin${path}`, {
    method: 'POST',
    headers: request.headers,
    body,
    credentials: 'include',
  });

  return response;
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/garmin', '');

  const response = await fetch(`${config.agent.url}/garmin${path}`, {
    method: 'DELETE',
    headers: request.headers,
    credentials: 'include',
  });

  return response;
}
