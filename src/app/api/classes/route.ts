import { NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';

export async function GET() {
  try {
    const service = await getTimetableService();
    return NextResponse.json(service.classes);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
