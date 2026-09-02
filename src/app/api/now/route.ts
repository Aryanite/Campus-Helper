import { NextRequest, NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';
import { getCurrentAvailability } from '@/lib/availability-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeParam = searchParams.get('time'); // Optional ISO or timestamp string

    const refDate = timeParam ? new Date(timeParam) : new Date();

    const timetable = await getTimetableService();
    const result = getCurrentAvailability(timetable, refDate);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
