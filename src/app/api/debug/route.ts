import { NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';

export async function GET() {
  try {
    const timetable = await getTimetableService();
    return NextResponse.json({
      metadata: timetable.metadata,
      diagnostics: timetable.diagnostics,
      sampleClassrooms: timetable.classrooms.slice(0, 10),
      samplePeriods: timetable.periods,
      sampleDays: timetable.days,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
