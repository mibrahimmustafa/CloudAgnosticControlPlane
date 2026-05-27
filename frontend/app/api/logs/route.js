import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`http://api:8000/logs/1`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 } // Disable caching
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Logs fetch error:", error);
    return NextResponse.json({ error: 'Backend API unreachable' }, { status: 500 });
  }
}
