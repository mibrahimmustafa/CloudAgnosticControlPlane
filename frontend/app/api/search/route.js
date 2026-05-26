import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { query, user_id } = body;

  try {
    const response = await fetch(`http://api:8000/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, user_id }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Backend API unreachable' }, { status: 500 });
  }
}
