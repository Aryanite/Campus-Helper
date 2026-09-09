export interface RawTable {
  id: string;
  data_columns?: string[];
  data_rows: Record<string, any>[];
}

export interface RawEduPageResponse {
  r: {
    rights?: Record<string, boolean>;
    dbiAccessorRes: {
      type: string;
      tables: RawTable[];
    };
  };
}

export interface TimetableMetadata {
  schoolName: string;
  institution: string;
  validity: string;
  year: number;
  lastUpdated: string;
  isFallback: boolean;
}

export interface Day {
  id: string;      // e.g. "0", "1"
  name: string;    // e.g. "Monday"
  short: string;   // e.g. "Mo"
  index: number;   // 0 for Monday, 5 for Saturday
}

export interface Period {
  id: string;
  period: string;       // "1", "2", ...
  number: number;       // 1, 2, ...
  name: string;
  short: string;
  startTime: string;    // "09:00"
  endTime: string;      // "09:55"
}

export interface Classroom {
  id: string;
  name: string;
  short: string;
  buildingId?: string;
  buildingName?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  short: string;
  teacherId?: string;
}

export interface Subject {
  id: string;
  name: string;
  short: string;
  color?: string;
}

export interface Teacher {
  id: string;
  name: string;
  short: string;
}

export interface OccupiedRoomDetail {
  cardId: string;
  lessonId: string;
  subject: string;
  subjectShort: string;
  classes: string[];
  teachers: string[];
  startPeriod: number;
  duration: number;
}

export interface OccupiedRoom {
  id: string;
  name: string;
  short: string;
  buildingName: string;
  details: OccupiedRoomDetail[];
}

export interface FreeRoom {
  id: string;
  name: string;
  short: string;
  buildingName: string;
}

export interface AvailabilityResult {
  day: Day;
  period: Period;
  totalClassrooms: number;
  freeCount: number;
  occupiedCount: number;
  freeRooms: FreeRoom[];
  occupiedRooms: OccupiedRoom[];
  metadata: TimetableMetadata;
}

export interface CurrentStatusResult {
  hasActivePeriod: boolean;
  message?: string;
  currentDay?: Day;
  currentPeriod?: Period;
  currentTimeString?: string;
  availability?: AvailabilityResult;
}

export interface ClassScheduleItem {
  dayIndex: number;
  dayName: string;
  periodNumber: number;
  periodTime: string;
  subject: string;
  subjectShort: string;
  classrooms: string[];
  teachers: string[];
  duration: number;
  startPeriod: number;
}

export interface ClassTimetableResult {
  classInfo: SchoolClass;
  scheduleByDay: Record<number, ClassScheduleItem[]>;
  allDays: Day[];
  allPeriods: Period[];
}

export interface TimetableDiagnostics {
  totalTables: number;
  daysCount: number;
  periodsCount: number;
  classroomsCount: number;
  classesCount: number;
  subjectsCount: number;
  teachersCount: number;
  lessonsCount: number;
  cardsCount: number;
  placedCardsCount: number;
  unplacedCardsCount: number;
  multiPeriodLessonsCount: number;
  unresolvedClassroomIds: number;
  unresolvedSubjectIds: number;
  unresolvedClassIds: number;
  unresolvedTeacherIds: number;
  unresolvedPeriodIds: number;
  lastUpdated: string;
  isFallback: boolean;
}

export interface ApiResponseFreeRooms {
  day: string;
  dayIndex: number;
  period: {
    number: number;
    name: string;
    start: string;
    end: string;
  };
  totalClassrooms: number;
  freeCount: number;
  occupiedCount: number;
  freeRooms: {
    id: string;
    name: string;
    short: string;
    building: string;
  }[];
  occupiedRooms: {
    id: string;
    name: string;
    short: string;
    building: string;
    class: string;
    subject: string;
    subjectShort: string;
    teacher: string;
    startPeriod?: number;
    duration?: number;
  }[];
  metadata: TimetableMetadata;
}

export interface BootstrapData {
  days: Day[];
  periods: Period[];
  classes: SchoolClass[];
  metadata: TimetableMetadata;
  diagnostics: TimetableDiagnostics;
  currentStatus: CurrentStatusResult;
  initialDayIndex: number;
  initialPeriodNum: number;
  initialAvailability: ApiResponseFreeRooms;
  initialBatchId: string;
  initialClassTimetable: ClassTimetableResult | null;
}

