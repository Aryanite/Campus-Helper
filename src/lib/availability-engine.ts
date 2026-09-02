import { ParsedTimetable } from './edupage-parser';
import {
  AvailabilityResult,
  CurrentStatusResult,
  FreeRoom,
  OccupiedRoom,
  Period,
  Day,
  ClassTimetableResult,
  ClassScheduleItem,
} from './types';

export interface AvailabilityOptions {
  dayIndex: number;
  periodNumber: number;
  searchQuery?: string;
  buildingFilter?: string;
}

export function getAvailability(
  timetable: ParsedTimetable,
  options: AvailabilityOptions
): AvailabilityResult {
  const { dayIndex, periodNumber, searchQuery, buildingFilter } = options;

  const day = timetable.days.find((d) => d.index === dayIndex) || timetable.days[0];
  const period = timetable.periods.find((p) => p.number === periodNumber) || timetable.periods[0];

  const freeRooms: FreeRoom[] = [];
  const occupiedRooms: OccupiedRoom[] = [];

  const query = searchQuery ? searchQuery.trim().toLowerCase() : '';
  const building = buildingFilter && buildingFilter !== 'all' ? buildingFilter.toLowerCase() : null;

  for (const room of timetable.classrooms) {
    // Optional filters
    if (query && !room.name.toLowerCase().includes(query)) {
      continue;
    }
    if (building && !room.buildingName?.toLowerCase().includes(building)) {
      continue;
    }

    const key = `${day.index}:${period.number}:${room.id}`;
    const occupantDetails = timetable.occupiedSlots.get(key);

    if (occupantDetails && occupantDetails.length > 0) {
      occupiedRooms.push({
        id: room.id,
        name: room.name,
        short: room.short,
        buildingName: room.buildingName || 'General',
        details: occupantDetails,
      });
    } else {
      freeRooms.push({
        id: room.id,
        name: room.name,
        short: room.short,
        buildingName: room.buildingName || 'General',
      });
    }
  }

  return {
    day,
    period,
    totalClassrooms: freeRooms.length + occupiedRooms.length,
    freeCount: freeRooms.length,
    occupiedCount: occupiedRooms.length,
    freeRooms,
    occupiedRooms,
    metadata: timetable.metadata,
  };
}

/**
 * Maps a given Date to the corresponding day index and period.
 * EduPage days: 0 = Monday, 1 = Tuesday, ..., 5 = Saturday. (Sunday is not in timetable).
 */
export function getCurrentPeriod(
  periods: Period[],
  days: Day[],
  refDate: Date = new Date()
): { day: Day | null; period: Period | null; isOutsideSchedule: boolean; currentTimeStr: string; message?: string } {
  // Time format "HH:mm" in local timezone
  const hours = String(refDate.getHours()).padStart(2, '0');
  const minutes = String(refDate.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${hours}:${minutes}`;

  // JavaScript day: 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const jsDay = refDate.getDay();
  let dayIndex: number | null = null;
  if (jsDay === 0) {
    // Sunday
    return {
      day: null,
      period: null,
      isOutsideSchedule: true,
      currentTimeStr,
      message: 'Sunday is outside the regular timetable schedule.',
    };
  } else {
    // Monday (1) -> index 0, Saturday (6) -> index 5
    dayIndex = jsDay - 1;
  }

  const matchedDay = days.find((d) => d.index === dayIndex);
  if (!matchedDay) {
    return {
      day: null,
      period: null,
      isOutsideSchedule: true,
      currentTimeStr,
      message: 'Selected day is not part of active timetable days.',
    };
  }

  // Find if currentTimeStr falls between any period's startTime and endTime
  const matchedPeriod = periods.find((p) => {
    return currentTimeStr >= p.startTime && currentTimeStr < p.endTime;
  });

  if (!matchedPeriod) {
    return {
      day: matchedDay,
      period: null,
      isOutsideSchedule: true,
      currentTimeStr,
      message: 'No active timetable period right now.',
    };
  }

  return {
    day: matchedDay,
    period: matchedPeriod,
    isOutsideSchedule: false,
    currentTimeStr,
  };
}

export function getCurrentAvailability(
  timetable: ParsedTimetable,
  refDate: Date = new Date()
): CurrentStatusResult {
  const detection = getCurrentPeriod(timetable.periods, timetable.days, refDate);

  if (detection.isOutsideSchedule || !detection.day || !detection.period) {
    return {
      hasActivePeriod: false,
      message: detection.message || 'No active timetable period right now.',
      currentTimeString: detection.currentTimeStr,
      currentDay: detection.day || undefined,
    };
  }

  const availability = getAvailability(timetable, {
    dayIndex: detection.day.index,
    periodNumber: detection.period.number,
  });

  return {
    hasActivePeriod: true,
    currentDay: detection.day,
    currentPeriod: detection.period,
    currentTimeString: detection.currentTimeStr,
    availability,
  };
}

export function getClassTimetable(
  timetable: ParsedTimetable,
  classId: string
): ClassTimetableResult | null {
  const classInfo = timetable.classesById.get(classId);
  if (!classInfo) return null;

  const scheduleByDay: Record<number, ClassScheduleItem[]> = {};

  for (const day of timetable.days) {
    scheduleByDay[day.index] = [];

    for (const period of timetable.periods) {
      const classKey = `${classId}:${day.index}:${period.number}`;
      const slots = timetable.classSlots.get(classKey);

      if (slots && slots.length > 0) {
        for (const slot of slots) {
          scheduleByDay[day.index].push({
            dayIndex: day.index,
            dayName: day.name,
            periodNumber: period.number,
            periodTime: `${period.startTime} - ${period.endTime}`,
            subject: slot.subject,
            subjectShort: slot.subjectShort,
            classrooms: slot.classes, // In parser, classes field contains room names for classSlots
            teachers: slot.teachers,
            duration: slot.duration,
            startPeriod: slot.startPeriod,
          });
        }
      }
    }
  }

  return {
    classInfo,
    scheduleByDay,
    allDays: timetable.days,
    allPeriods: timetable.periods,
  };
}
