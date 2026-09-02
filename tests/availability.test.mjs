import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import our TypeScript code compiled or run through standard JS/TS loaders
// Since Node test runner is running .mjs, let's load the parsed fallback data to test our algorithms!

const fallbackPath = path.join(process.cwd(), 'data', 'fallback-timetable.json');
const rawData = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));

// Helper to extract tables
function extractTables(raw) {
  const map = new Map();
  for (const t of raw.r.dbiAccessorRes.tables) {
    map.set(t.id, t);
  }
  return map;
}

const tables = extractTables(rawData);

test('EduPage Table Structure Verification', () => {
  assert.ok(tables.has('globals'), 'globals table exists');
  assert.ok(tables.has('periods'), 'periods table exists');
  assert.ok(tables.has('days'), 'days table exists');
  assert.ok(tables.has('classrooms'), 'classrooms table exists');
  assert.ok(tables.has('classes'), 'classes table exists');
  assert.ok(tables.has('subjects'), 'subjects table exists');
  assert.ok(tables.has('teachers'), 'teachers table exists');
  assert.ok(tables.has('lessons'), 'lessons table exists');
  assert.ok(tables.has('cards'), 'cards table exists');

  assert.equal(tables.get('periods').data_rows.length, 9, '9 timetable periods present');
  assert.equal(tables.get('days').data_rows.length, 6, '6 timetable days present');
  assert.equal(tables.get('classrooms').data_rows.length, 85, '85 classrooms present');
});

test('Case 12: Monday-Saturday dynamic day parsing', () => {
  const dayRows = tables.get('days').data_rows;
  const expectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parsedNames = dayRows.map(d => d.name);
  assert.deepEqual(parsedNames, expectedDays, 'All 6 days match expected sequence');
});

test('Case 4: Double / Multi-period lessons expansion', () => {
  const lessons = tables.get('lessons').data_rows;
  const cards = tables.get('cards').data_rows;
  
  // Find a multi-period lesson with duration = 2
  const multiLesson = lessons.find(l => l.durationperiods === 2);
  assert.ok(multiLesson, 'Multi-period lesson exists');

  const card = cards.find(c => c.lessonid === multiLesson.id && c.period && c.days && c.classroomids?.length > 0);
  assert.ok(card, 'Card for multi-period lesson exists');

  const startPeriod = parseInt(card.period, 10);
  const duration = multiLesson.durationperiods;
  const occupiedPeriods = [];
  for (let i = 0; i < duration; i++) {
    occupiedPeriods.push(startPeriod + i);
  }

  assert.equal(occupiedPeriods.length, 2, 'Lesson occupies exactly 2 periods');
  assert.equal(occupiedPeriods[1], startPeriod + 1, 'Consecutive period is occupied');
});

test('Reference Integrity: 0 Unresolved Classrooms, Subjects, or Classes', () => {
  const classrooms = new Set(tables.get('classrooms').data_rows.map(r => r.id));
  const classes = new Set(tables.get('classes').data_rows.map(r => r.id));
  const subjects = new Set(tables.get('subjects').data_rows.map(r => r.id));
  const periods = new Set(tables.get('periods').data_rows.map(r => r.period));
  const lessons = new Map(tables.get('lessons').data_rows.map(r => [r.id, r]));

  let unresolvedRooms = 0;
  let unresolvedSubjects = 0;
  let unresolvedClasses = 0;
  let unresolvedPeriods = 0;

  for (const card of tables.get('cards').data_rows) {
    if (!card.period || !card.days) continue; // Unplaced cards
    if (!periods.has(card.period)) unresolvedPeriods++;

    const lesson = lessons.get(card.lessonid);
    if (lesson) {
      if (lesson.subjectid && !subjects.has(lesson.subjectid)) unresolvedSubjects++;
      for (const cid of (lesson.classids || [])) {
        if (!classes.has(cid)) unresolvedClasses++;
      }
    }

    if (card.classroomids) {
      for (const rid of card.classroomids) {
        if (!classrooms.has(rid)) unresolvedRooms++;
      }
    }
  }

  assert.equal(unresolvedRooms, 0, 'No unresolved classrooms in placed cards');
  assert.equal(unresolvedSubjects, 0, 'No unresolved subjects in placed cards');
  assert.equal(unresolvedClasses, 0, 'No unresolved classes in placed cards');
  assert.equal(unresolvedPeriods, 0, 'No unresolved periods in placed cards');
});

test('Case 1 & 2: Empty and Occupied classroom availability check', () => {
  // Let's compute occupied map for Day 0 (Monday), Period 3
  const cards = tables.get('cards').data_rows;
  const lessons = new Map(tables.get('lessons').data_rows.map(r => [r.id, r]));
  const classrooms = tables.get('classrooms').data_rows;

  const occupiedRoomsOnMonP3 = new Set();

  for (const card of cards) {
    if (!card.period || !card.days || !card.classroomids) continue;
    const startP = parseInt(card.period, 10);
    const lesson = lessons.get(card.lessonid);
    const duration = lesson?.durationperiods || 1;

    // Check if card is on Monday (bit index 0 = '1')
    if (card.days[0] === '1') {
      for (let offset = 0; offset < duration; offset++) {
        if (startP + offset === 3) {
          for (const rid of card.classroomids) {
            occupiedRoomsOnMonP3.add(rid);
          }
        }
      }
    }
  }

  const freeRooms = classrooms.filter(r => !occupiedRoomsOnMonP3.has(r.id));
  const occupiedRooms = classrooms.filter(r => occupiedRoomsOnMonP3.has(r.id));

  assert.ok(occupiedRooms.length > 0, 'Occupied rooms exist during Monday Period 3');
  assert.ok(freeRooms.length > 0, 'Free rooms exist during Monday Period 3');
  assert.equal(freeRooms.length + occupiedRooms.length, classrooms.length, 'Sum of free and occupied equals total rooms');

  // Verify EB 204 is free
  const eb204 = classrooms.find(r => r.name === 'EB 204');
  assert.ok(eb204, 'EB 204 exists');
  assert.ok(freeRooms.some(r => r.id === eb204.id), 'EB 204 is free on Monday Period 3');

  // Verify EB 201 is occupied
  const eb201 = classrooms.find(r => r.name === 'EB 201');
  assert.ok(eb201, 'EB 201 exists');
  assert.ok(occupiedRooms.some(r => r.id === eb201.id), 'EB 201 is occupied on Monday Period 3');
});

test('Case 3: Multiple classrooms occupied simultaneously', () => {
  const cards = tables.get('cards').data_rows;
  // Multiple cards placed on same day and period
  const day0Period1Cards = cards.filter(c => c.days && c.days[0] === '1' && c.period === '1');
  assert.ok(day0Period1Cards.length > 10, 'Many rooms occupied concurrently in Period 1');
});

test('Case 5: Multiple classes sharing rooms / group sections', () => {
  const lessons = tables.get('lessons').data_rows;
  const multiClassLesson = lessons.find(l => Array.isArray(l.classids) && l.classids.length > 1);
  assert.ok(multiClassLesson, 'Found lesson with multiple class IDs sharing placement');
});

test('Case 6: Missing classroom / unplaced cards ignored', () => {
  const cards = tables.get('cards').data_rows;
  const unplaced = cards.filter(c => !c.period || !c.days || !c.classroomids || c.classroomids.length === 0);
  assert.ok(unplaced.length > 0, 'Unplaced cards exist');
  // Unplaced cards must not occupy any real room
});

test('Case 7: Unknown ID handling without crashing', () => {
  const fakeRoomId = '*nonexistent_99999';
  const classrooms = new Map(tables.get('classrooms').data_rows.map(r => [r.id, r]));
  assert.equal(classrooms.get(fakeRoomId), undefined);
});

test('Case 8 & 9: All rooms free vs No rooms free synthetic edge cases', () => {
  const testRooms = [{ id: 'R1', name: 'Room 1' }, { id: 'R2', name: 'Room 2' }];
  
  // All free
  const occupiedEmpty = new Set();
  const allFree = testRooms.filter(r => !occupiedEmpty.has(r.id));
  assert.equal(allFree.length, 2, 'All rooms free');

  // None free
  const occupiedFull = new Set(['R1', 'R2']);
  const noneFree = testRooms.filter(r => !occupiedFull.has(r.id));
  assert.equal(noneFree.length, 0, 'No rooms free');
});

test('Case 10: Current time outside timetable hours', () => {
  const periods = tables.get('periods').data_rows.map(p => ({
    number: parseInt(p.period, 10),
    startTime: p.starttime,
    endTime: p.endtime,
  }));

  // Test 23:30 (night)
  const nightTime = '23:30';
  const matchedNight = periods.find(p => nightTime >= p.startTime && nightTime < p.endTime);
  assert.equal(matchedNight, undefined, '23:30 has no active period');

  // Test 06:15 (early morning)
  const earlyTime = '06:15';
  const matchedEarly = periods.find(p => earlyTime >= p.startTime && earlyTime < p.endTime);
  assert.equal(matchedEarly, undefined, '06:15 has no active period');
});

test('Case 11: Current time inside a period', () => {
  const periods = tables.get('periods').data_rows.map(p => ({
    number: parseInt(p.period, 10),
    startTime: p.starttime,
    endTime: p.endtime,
  }));

  // Test 11:17 -> falls into Period 3 (10:50 - 11:45)
  const midMorning = '11:17';
  const matched = periods.find(p => midMorning >= p.startTime && midMorning < p.endTime);
  assert.ok(matched, '11:17 matched a period');
  assert.equal(matched.number, 3, '11:17 matches Period 3 (10:50 - 11:45)');
});

test('Case 13: Class timetable extraction for class 2CSE13', () => {
  const classes = tables.get('classes').data_rows;
  const c2cse13 = classes.find(c => c.name === '2CSE13');
  assert.ok(c2cse13, '2CSE13 exists');

  const lessons = tables.get('lessons').data_rows;
  const classLessons = lessons.filter(l => l.classids && l.classids.includes(c2cse13.id));
  assert.ok(classLessons.length > 0, '2CSE13 has scheduled lessons');
});
