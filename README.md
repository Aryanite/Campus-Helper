# IILM University Free Classroom Finder

A lightweight, modern, Apple-inspired web application designed for students and faculty of IILM University (School of Computer Science and Engineering, Greater Noida). It queries the official EduPage timetable system and instantly determines which physical classrooms are free or occupied for any chosen day and period, as well as in real time.

![Mobile Room Finder](file:///C:/Users/as113/.gemini/antigravity-ide/brain/5c0a9755-c1f8-498d-9a32-bce68995bd8b/mobile_ui_verification_1788379499236.png)

---

## Key Features

1. **Find Free Classrooms**:
   - One-tap selection of day (Monday through Saturday) and period (Period 1 to 9, 09:00 – 17:15).
   - Instantly calculates unoccupied physical classrooms.
   - Filter between "Free Rooms" and "All Rooms" (with occupied lesson details, faculty, and student batches).
   - Instant search by classroom name (e.g., `EB 204`, `Apple Lab`, `Dell Lab`).

2. **Live "Free Now" Detection**:
   - Automatically detects current local time and day.
   - Highlights the ongoing period and offers a 1-tap "Jump to Now" button.
   - Gracefully indicates out-of-schedule periods during breaks and night hours.

3. **Class Timetable View**:
   - Select any student class / batch (e.g., `2CSE13`, `3CSE4`, `4CSE-1`) to see their full weekly schedule with subjects, classrooms, and teachers.

4. **Apple-Inspired Mobile Aesthetics**:
   - Deep OLED black background (`#000000`), frosted glassmorphism, iOS segmented controls, swipeable timeline scrubber, and clean card rows.
   - Responsive and optimized for phone, tablet, and desktop viewports.

5. **Secure Backend Proxy & Cache**:
   - No private session cookies (`PHPSESSID`) or tokens exposed to client browsers.
   - Automatic guest session handshake with EduPage server.
   - High-performance server in-memory cache with disk fallback resilience.
   - Instant live sync via `[Refresh]` button.

---

## Discovery & Reverse-Engineering of EduPage DBI Structure

The application connects to the official EduPage endpoint:
```http
POST https://iilmgn.edupage.org/timetable/server/regulartt.js?__func=regularttGetData
```
with request payload:
```json
{
  "__args": [null, "37"],
  "__gsh": "00000000"
}
```

### Authentication & Session Handshake
Direct unauthenticated POST requests are rejected with `{"reload": true}`. However, an anonymous GET request to `https://iilmgn.edupage.org/timetable/` establishes a valid guest session and returns standard cookies. By relaying this session cookie on the server proxy, the timetable database is retrieved **without requiring any hard-coded or private user credentials**.

### Relational Database Model (`dbiAccessorRes.tables`)
The response contains an aSc Timetables relational database with 23 tables:
* `periods` (9 rows): Defines start and end times (`09:00 - 09:55` up to `16:20 - 17:15`).
* `days` (6 rows): Monday (0) through Saturday (5).
* `classrooms` (85 rows): Physical room IDs, names (`EB 201`, `EB 204`, `Apple Lab`), and buildings.
* `classes` (137 rows): Student sections (`2CSE1`–`2CSE25`, `3CSE1`–`3CSE20`, `4CSE`).
* `subjects` (155 rows): Course titles and short codes.
* `teachers` (293 rows): Faculty names.
* `lessons` (1,298 rows): Curriculum links defining `subjectid`, `teacherids`, `classids`, and **`durationperiods`** (lesson duration).
* `cards` (2,773 rows): Timetable grid placements specifying:
  - `lessonid`: Foreign key to `lessons`.
  - `period`: Start period number (e.g. `"3"`).
  - `days`: 6-character bitmask (e.g. `"100000"` = Monday, `"001000"` = Wednesday).
  - `classroomids`: Assigned physical room IDs (`["*20"]`).

### Multi-Period Lesson Expansion
Lessons spanning multiple consecutive periods (474 lessons in the university schedule) have `durationperiods > 1`.
If a card begins at `period: 6` with `durationperiods: 2`, the room is marked occupied in **both Period 6 and Period 7**.

### Reference Integrity
All placed cards reference valid entities:
* **Unresolved Classroom IDs: 0**
* **Unresolved Subject IDs: 0**
* **Unresolved Class IDs: 0**
* **Unresolved Period IDs: 0**

---

## API Documentation

### 1. `GET /api/free-rooms`
Calculates room availability for a given day and period.
* **Query Parameters**:
  - `day`: Day index (`0` for Monday, `1` for Tuesday, ..., `5` for Saturday)
  - `period`: Period number (`1` to `9`)
  - `search`: (Optional) Room name filter
  - `building`: (Optional) Building filter (`engineering`, `foundation`, `law`, `labs`)
* **Response**:
```json
{
  "day": "Monday",
  "dayIndex": 0,
  "period": { "number": 3, "name": "3", "start": "10:50", "end": "11:45" },
  "totalClassrooms": 85,
  "freeCount": 28,
  "occupiedCount": 57,
  "freeRooms": [
    { "id": "*4", "name": "EB 204", "short": "EB 204", "building": "Engineering Block (EB)" }
  ],
  "occupiedRooms": [
    {
      "id": "*1",
      "name": "EB 201",
      "class": "4CSE-1",
      "subject": "Industrial Training (JAVA)",
      "teacher": "Trainer1",
      "startPeriod": 1,
      "duration": 3
    }
  ]
}
```

### 2. `GET /api/now`
Returns real-time availability based on the current system time and day.

### 3. `GET /api/class-timetable?classId=<id or name>`
Returns the complete weekly schedule for a specified class batch (e.g., `2CSE13`).

### 4. `POST /api/refresh`
Forces an immediate cache invalidation and re-fetches live data from EduPage.

### 5. `GET /api/debug`
Returns comprehensive parser diagnostics, record counts, and data integrity metrics.

---

## Setup & Running Locally

### Prerequisites
* Node.js v18+ (tested on Node.js v20)
* npm

### Installation
```bash
# Clone or navigate to the repository directory
cd "d:/Free Period"

# Install dependencies
npm install

# Copy environment settings
cp .env.example .env.local
```

### Running Tests
To run all 13 automated test suites:
```bash
npm test
```

### Starting the Application
```bash
# Development mode
npm run dev

# Production build & start
npm run build
npm run start
```
Open `http://localhost:3000` in any browser or mobile device.
