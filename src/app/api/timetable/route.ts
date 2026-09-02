import { NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';

export async function GET() {
  try {
    const service = await getTimetableService();
    return NextResponse.json({
      metadata: service.metadata,
      daysCount: service.days.length,
      periodsCount: service.periods.length,
      classroomsCount: service.classrooms.length,
      classesCount: service.classes.length,
      diagnostics: service.diagnostics,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
