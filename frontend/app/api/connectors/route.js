import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`http://api:8000/connectors/1`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 } // Disable caching
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Connectors fetch error:", error);
    return NextResponse.json({ error: 'Backend API unreachable' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch(`http://api:8000/connectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, user_id: 1 }),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Connectors save error:", error);
    return NextResponse.json({ error: 'Backend API unreachable' }, { status: 500 });
  }
}
