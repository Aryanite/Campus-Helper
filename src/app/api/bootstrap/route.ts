import { NextRequest, NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';
import { getCurrentAvailability, getAvailability, getClassTimetable } from '@/lib/availability-engine';
import { BootstrapData, ApiResponseFreeRooms } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedBatchId = searchParams.get('batchId') || '';

    const timetable = await getTimetableService();
    const currentStatus = getCurrentAvailability(timetable);

    // Determine initial day and period
    let initialDayIndex = 0;
    let initialPeriodNum = 1;

    if (currentStatus.hasActivePeriod && currentStatus.currentDay && currentStatus.currentPeriod) {
      initialDayIndex = currentStatus.currentDay.index;
      initialPeriodNum = currentStatus.currentPeriod.number;
    } else {
      const now = new Date();
      const jsDay = now.getDay();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${h}:${m}`;

      if (jsDay >= 1 && jsDay <= 6) {
        initialDayIndex = jsDay - 1;
        const pMatch = timetable.periods.find((p) => timeStr >= p.startTime && timeStr < p.endTime);
        if (pMatch) {
          initialPeriodNum = pMatch.number;
        } else if (timeStr >= '17:15') {
          initialDayIndex = initialDayIndex < 5 ? initialDayIndex + 1 : 0;
          initialPeriodNum = 1;
        }
      }
    }

    const availability = getAvailability(timetable, {
      dayIndex: initialDayIndex,
      periodNumber: initialPeriodNum,
    });

    const initialAvailability: ApiResponseFreeRooms = {
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
    };

    // Determine target batch
    let targetBatch = requestedBatchId ? timetable.classesById.get(requestedBatchId) : null;
    if (!targetBatch) {
      targetBatch =
        timetable.classes.find((c) => c.name === '2CSE13') ||
        timetable.classes[0] ||
        null;
    }

    const initialClassTimetable = targetBatch
      ? getClassTimetable(timetable, targetBatch.id)
      : null;

    const data: BootstrapData = {
      days: timetable.days,
      periods: timetable.periods,
      classes: timetable.classes,
      metadata: timetable.metadata,
      diagnostics: timetable.diagnostics,
      currentStatus,
      initialDayIndex,
      initialPeriodNum,
      initialAvailability,
      initialBatchId: targetBatch?.id || '',
      initialClassTimetable,
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
