import { NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';

export async function GET() {
  try {
    const service = await getTimetableService();
    return NextResponse.json(service.periods, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
