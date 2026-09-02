import {
  RawEduPageResponse,
  RawTable,
  Day,
  Period,
  Classroom,
  SchoolClass,
  Subject,
  Teacher,
  TimetableMetadata,
  OccupiedRoomDetail,
  TimetableDiagnostics,
} from './types';

export interface ParsedTimetable {
  metadata: TimetableMetadata;
  days: Day[];
  periods: Period[];
  classrooms: Classroom[];
  classroomsById: Map<string, Classroom>;
  classes: SchoolClass[];
  classesById: Map<string, SchoolClass>;
  subjectsById: Map<string, Subject>;
  teachersById: Map<string, Teacher>;
  // Map key: `${dayIndex}:${periodNumber}:${classroomId}`
  occupiedSlots: Map<string, OccupiedRoomDetail[]>;
  // Map key: `${classId}:${dayIndex}:${periodNumber}`
  classSlots: Map<string, OccupiedRoomDetail[]>;
  diagnostics: TimetableDiagnostics;
}

function getBuildingName(roomName: string): string {
  const trimmed = roomName.trim();
  if (trimmed.startsWith('EB')) return 'Engineering Block (EB)';
  if (trimmed.toLowerCase().includes('foundation')) return 'Foundation Block';
  if (trimmed.toLowerCase().includes('law')) return 'Law Block';
  if (trimmed.toLowerCase().includes('lab')) return 'Specialized Labs';
  return 'Campus / Other';
}

export function parseEduPageResponse(
  raw: RawEduPageResponse,
  isFallback = false,
  cacheTimestamp = Date.now()
): ParsedTimetable {
  const tablesMap = new Map<string, RawTable>();
  const tables = raw?.r?.dbiAccessorRes?.tables || [];
  for (const t of tables) {
    tablesMap.set(t.id, t);
  }

  // 1. Metadata
  const globalsRow = tablesMap.get('globals')?.data_rows?.[0] || {};
  const metadata: TimetableMetadata = {
    schoolName: globalsRow.settings?.m_strPrintHeaderText || 'School of Computer Science and Engineering',
    institution: globalsRow.reg_name || 'IILM University, Greater Noida',
    validity: globalsRow.settings?.m_strDateBellowTimeTable || 'Validity: 17/8/2026 - 31/1/2027',
    year: globalsRow.edupage_year || 2026,
    lastUpdated: new Date(cacheTimestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    isFallback,
  };

  // 2. Days
  const rawDays = tablesMap.get('days')?.data_rows || [];
  const days: Day[] = rawDays.map((d, index) => ({
    id: String(d.id),
    name: String(d.name),
    short: String(d.short || d.name.slice(0, 2)),
    index,
  }));

  // Fallback days if empty
  if (days.length === 0) {
    const fallbackDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    fallbackDayNames.forEach((name, i) => {
      days.push({
        id: String(i),
        name,
        short: name.slice(0, 2),
        index: i,
      });
    });
  }

  // 3. Periods
  const rawPeriods = tablesMap.get('periods')?.data_rows || [];
  const periods: Period[] = rawPeriods
    .map((p) => ({
      id: String(p.id),
      period: String(p.period || p.id),
      number: parseInt(p.period || p.id, 10) || 1,
      name: String(p.name || p.period || p.id),
      short: String(p.short || p.name || p.period),
      startTime: String(p.starttime || '00:00'),
      endTime: String(p.endtime || '00:00'),
    }))
    .sort((a, b) => a.number - b.number);

  const periodsByNumber = new Map<number, Period>();
  for (const p of periods) {
    periodsByNumber.set(p.number, p);
  }

  // 4. Classrooms
  const rawClassrooms = tablesMap.get('classrooms')?.data_rows || [];
  const classrooms: Classroom[] = rawClassrooms.map((c) => {
    const name = String(c.name || c.short || c.id);
    return {
      id: String(c.id),
      name,
      short: String(c.short || name),
      buildingId: c.buildingid ? String(c.buildingid) : undefined,
      buildingName: getBuildingName(name),
    };
  });
  // Sort classrooms logically by name
  classrooms.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const classroomsById = new Map<string, Classroom>();
  for (const c of classrooms) {
    classroomsById.set(c.id, c);
  }

  // 5. Classes
  const rawClasses = tablesMap.get('classes')?.data_rows || [];
  const classes: SchoolClass[] = rawClasses.map((c) => ({
    id: String(c.id),
    name: String(c.name || c.short || c.id),
    short: String(c.short || c.name || c.id),
    teacherId: c.teacherid ? String(c.teacherid) : undefined,
  }));
  classes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const classesById = new Map<string, SchoolClass>();
  for (const c of classes) {
    classesById.set(c.id, c);
  }

  // 6. Subjects
  const rawSubjects = tablesMap.get('subjects')?.data_rows || [];
  const subjectsById = new Map<string, Subject>();
  for (const s of rawSubjects) {
    subjectsById.set(String(s.id), {
      id: String(s.id),
      name: String(s.name || s.short || s.id),
      short: String(s.short || s.name || s.id),
      color: s.color ? String(s.color) : undefined,
    });
  }

  // 7. Teachers
  const rawTeachers = tablesMap.get('teachers')?.data_rows || [];
  const teachersById = new Map<string, Teacher>();
  for (const t of rawTeachers) {
    const fullName = [t.nameprefix, t.name, t.namesuffix].filter(Boolean).join(' ').trim() || String(t.short || t.id);
    teachersById.set(String(t.id), {
      id: String(t.id),
      name: fullName,
      short: String(t.short || fullName),
    });
  }

  // 8. Lessons
  const rawLessons = tablesMap.get('lessons')?.data_rows || [];
  const lessonsById = new Map<string, any>();
  let multiPeriodLessonsCount = 0;
  for (const l of rawLessons) {
    lessonsById.set(String(l.id), l);
    if ((l.durationperiods || 1) > 1) {
      multiPeriodLessonsCount++;
    }
  }

  // 9. Cards and Placements
  const rawCards = tablesMap.get('cards')?.data_rows || [];
  const occupiedSlots = new Map<string, OccupiedRoomDetail[]>();
  const classSlots = new Map<string, OccupiedRoomDetail[]>();

  let placedCardsCount = 0;
  let unplacedCardsCount = 0;
  let unresolvedClassroomIds = 0;
  let unresolvedSubjectIds = 0;
  let unresolvedClassIds = 0;
  let unresolvedTeacherIds = 0;
  let unresolvedPeriodIds = 0;

  for (const card of rawCards) {
    const periodStr = card.period ? String(card.period).trim() : '';
    const daysMask = card.days ? String(card.days).trim() : '';
    const roomIds: string[] = Array.isArray(card.classroomids)
      ? card.classroomids.map(String)
      : card.classroomids
      ? [String(card.classroomids)]
      : [];

    if (!periodStr || !daysMask) {
      unplacedCardsCount++;
      continue;
    }

    const startPeriodNum = parseInt(periodStr, 10);
    if (isNaN(startPeriodNum) || !periodsByNumber.has(startPeriodNum)) {
      unresolvedPeriodIds++;
      continue;
    }

    placedCardsCount++;

    const lesson = lessonsById.get(String(card.lessonid));
    const duration = lesson && typeof lesson.durationperiods === 'number' ? lesson.durationperiods : 1;

    // Resolve subject
    let subjectName = 'Free / General Activity';
    let subjectShort = 'Activity';
    if (lesson?.subjectid) {
      const subj = subjectsById.get(String(lesson.subjectid));
      if (subj) {
        subjectName = subj.name;
        subjectShort = subj.short;
      } else {
        unresolvedSubjectIds++;
        subjectName = String(lesson.subjectid);
      }
    }

    // Resolve classes
    const classNames: string[] = [];
    const classIdList: string[] = Array.isArray(lesson?.classids) ? lesson.classids.map(String) : [];
    for (const cid of classIdList) {
      const cl = classesById.get(cid);
      if (cl) {
        classNames.push(cl.name);
      } else {
        unresolvedClassIds++;
        classNames.push(cid);
      }
    }

    // Resolve teachers
    const teacherNames: string[] = [];
    const teacherIdList: string[] = Array.isArray(lesson?.teacherids) ? lesson.teacherids.map(String) : [];
    for (const tid of teacherIdList) {
      const t = teachersById.get(tid);
      if (t) {
        teacherNames.push(t.name);
      } else {
        unresolvedTeacherIds++;
        teacherNames.push(tid);
      }
    }

    // Iterate through active days from bitmask
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      if (dayIdx < daysMask.length && daysMask[dayIdx] === '1') {
        // Multi-period lesson span
        for (let pOffset = 0; pOffset < duration; pOffset++) {
          const currentPeriodNum = startPeriodNum + pOffset;

          const detail: OccupiedRoomDetail = {
            cardId: String(card.id),
            lessonId: String(card.lessonid),
            subject: subjectName,
            subjectShort,
            classes: classNames,
            teachers: teacherNames,
            startPeriod: startPeriodNum,
            duration,
          };

          // Register in occupiedSlots for each room
          for (const roomId of roomIds) {
            if (!classroomsById.has(roomId)) {
              unresolvedClassroomIds++;
            }
            const key = `${dayIdx}:${currentPeriodNum}:${roomId}`;
            if (!occupiedSlots.has(key)) {
              occupiedSlots.set(key, []);
            }
            occupiedSlots.get(key)!.push(detail);
          }

          // Register in classSlots for class timetable view
          for (const cid of classIdList) {
            const classKey = `${cid}:${dayIdx}:${currentPeriodNum}`;
            if (!classSlots.has(classKey)) {
              classSlots.set(classKey, []);
            }
            classSlots.get(classKey)!.push({
              ...detail,
              // include room names for the class timetable
              classes: roomIds.map((rid) => classroomsById.get(rid)?.name || rid),
            });
          }
        }
      }
    }
  }

  const diagnostics: TimetableDiagnostics = {
    totalTables: tables.length,
    daysCount: days.length,
    periodsCount: periods.length,
    classroomsCount: classrooms.length,
    classesCount: classes.length,
    subjectsCount: subjectsById.size,
    teachersCount: teachersById.size,
    lessonsCount: rawLessons.length,
    cardsCount: rawCards.length,
    placedCardsCount,
    unplacedCardsCount,
    multiPeriodLessonsCount,
    unresolvedClassroomIds,
    unresolvedSubjectIds,
    unresolvedClassIds,
    unresolvedTeacherIds,
    unresolvedPeriodIds,
    lastUpdated: metadata.lastUpdated,
    isFallback,
  };

  return {
    metadata,
    days,
    periods,
    classrooms,
    classroomsById,
    classes,
    classesById,
    subjectsById,
    teachersById,
    occupiedSlots,
    classSlots,
    diagnostics,
  };
}
