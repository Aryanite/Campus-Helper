import { NextRequest, NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';
import { getAvailability } from '@/lib/availability-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dayParam = searchParams.get('day');
    const periodParam = searchParams.get('period');
    const searchQuery = searchParams.get('search') || undefined;
    const buildingFilter = searchParams.get('building') || undefined;

    const timetable = await getTimetableService();

    // Default to day index 0 (Monday) if not provided
    let dayIndex = 0;
    if (dayParam !== null) {
      const parsedDay = parseInt(dayParam, 10);
      if (!isNaN(parsedDay)) {
        dayIndex = parsedDay;
      } else {
        const found = timetable.days.find(
          (d) => d.name.toLowerCase() === dayParam.toLowerCase() || d.short.toLowerCase() === dayParam.toLowerCase()
        );
        if (found) dayIndex = found.index;
      }
    }

    // Default to period 1 if not provided
    let periodNum = 1;
    if (periodParam !== null) {
      const parsedP = parseInt(periodParam, 10);
      if (!isNaN(parsedP)) {
        periodNum = parsedP;
      }
    }

    const availability = getAvailability(timetable, {
      dayIndex,
      periodNumber: periodNum,
      searchQuery,
      buildingFilter,
    });

    return NextResponse.json({
      day: availability.day.name,
      dayIndex: availability.day.index,
      period: {
        number: availability.period.number,
        name: availability.period.name,
        start: availability.period.startTime,
        end: availability.period.endTime,
      },
      totalClassrooms: availability.totalClassrooms,
      freeCount: availability.freeCount,
      occupiedCount: availability.occupiedCount,
      freeRooms: availability.freeRooms.map((r) => ({
        id: r.id,
        name: r.name,
        short: r.short,
        building: r.buildingName,
      })),
      occupiedRooms: availability.occupiedRooms.map((r) => ({
        id: r.id,
        name: r.name,
        short: r.short,
        building: r.buildingName,
        class: r.details.map((d) => d.classes.join(', ')).filter(Boolean).join('; ') || 'General',
        subject: r.details.map((d) => d.subject).join('; '),
        subjectShort: r.details.map((d) => d.subjectShort).join('; '),
        teacher: r.details.map((d) => d.teachers.join(', ')).filter(Boolean).join('; ') || 'N/A',
        startPeriod: r.details[0]?.startPeriod,
        duration: r.details[0]?.duration,
      })),
      metadata: availability.metadata,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
