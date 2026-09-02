import { NextRequest, NextResponse } from 'next/server';
import { getTimetableService } from '@/lib/timetable-service';
import { getClassTimetable } from '@/lib/availability-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classIdParam = searchParams.get('classId');

    if (!classIdParam) {
      return NextResponse.json({ error: 'classId query parameter is required' }, { status: 400 });
    }

    const timetable = await getTimetableService();

    // Check if classIdParam is an ID or a class name
    let targetClass = timetable.classesById.get(classIdParam);
    if (!targetClass) {
      targetClass = timetable.classes.find(
        (c) => c.name.toLowerCase() === classIdParam.toLowerCase() || c.short.toLowerCase() === classIdParam.toLowerCase()
      );
    }

    if (!targetClass) {
      return NextResponse.json({ error: `Class not found: ${classIdParam}` }, { status: 404 });
    }

    const result = getClassTimetable(timetable, targetClass.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
