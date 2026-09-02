import { NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';

export async function POST() {
  try {
    const timetable = await getTimetableService(true);
    return NextResponse.json({
      success: true,
      message: 'Timetable cache successfully refreshed from EduPage.',
      lastUpdated: timetable.metadata.lastUpdated,
      isFallback: timetable.metadata.isFallback,
      diagnostics: timetable.diagnostics,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
