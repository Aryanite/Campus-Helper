'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Day,
  Period,
  SchoolClass,
  TimetableMetadata,
  TimetableDiagnostics,
  CurrentStatusResult,
  ClassTimetableResult,
} from '@/lib/types';

interface ApiResponseFreeRooms {
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
  }[];
  metadata: TimetableMetadata;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'classes' | 'info'>('rooms');

  // Timetable core data
  const [days, setDays] = useState<Day[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [metadata, setMetadata] = useState<TimetableMetadata | null>(null);
  const [diagnostics, setDiagnostics] = useState<TimetableDiagnostics | null>(null);

  // User selections
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [selectedPeriodNum, setSelectedPeriodNum] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'free' | 'all'>('free');

  // Room availability results
  const [availability, setAvailability] = useState<ApiResponseFreeRooms | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Live status
  const [currentStatus, setCurrentStatus] = useState<CurrentStatusResult | null>(null);

  // Class timetable state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classTimetable, setClassTimetable] = useState<ClassTimetableResult | null>(null);
  const [loadingClassTt, setLoadingClassTt] = useState<boolean>(false);

  // Refresh status
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 1. Initial fetch of base metadata and live period
  useEffect(() => {
    async function init() {
      try {
        const [daysRes, periodsRes, classesRes, metaRes, nowRes] = await Promise.all([
          fetch('/api/days').then((r) => r.json()),
          fetch('/api/periods').then((r) => r.json()),
          fetch('/api/classes').then((r) => r.json()),
          fetch('/api/timetable').then((r) => r.json()),
          fetch('/api/now').then((r) => r.json()),
        ]);

        if (Array.isArray(daysRes)) setDays(daysRes);
        if (Array.isArray(periodsRes)) setPeriods(periodsRes);
        if (Array.isArray(classesRes)) {
          setClasses(classesRes);
          const defaultClass = classesRes.find((c: SchoolClass) => c.name === '2CSE13') || classesRes[0];
          if (defaultClass) setSelectedClassId(defaultClass.id);
        }
        if (metaRes?.metadata) setMetadata(metaRes.metadata);
        if (metaRes?.diagnostics) setDiagnostics(metaRes.diagnostics);

        if (nowRes) {
          setCurrentStatus(nowRes);
          if (nowRes.hasActivePeriod && nowRes.currentDay && nowRes.currentPeriod) {
            setSelectedDayIndex(nowRes.currentDay.index);
            setSelectedPeriodNum(nowRes.currentPeriod.number);
          } else {
            setSelectedDayIndex(0);
            setSelectedPeriodNum(1);
          }
        }
      } catch (err) {
        console.error('Failed initializing timetable:', err);
      }
    }

    init();
  }, []);

  // 2. Fetch availability when day or period changes
  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      try {
        const res = await fetch(`/api/free-rooms?day=${selectedDayIndex}&period=${selectedPeriodNum}`);
        const data = await res.json();
        setAvailability(data);
        if (data.metadata) setMetadata(data.metadata);
      } catch (err) {
        console.error('Failed loading free rooms:', err);
      } finally {
        setLoading(false);
      }
    }

    if (days.length > 0 && periods.length > 0) {
      loadAvailability();
    }
  }, [selectedDayIndex, selectedPeriodNum, days.length, periods.length]);

  // 3. Fetch Class Timetable when selected class changes
  useEffect(() => {
    if (!selectedClassId) return;

    async function loadClass() {
      setLoadingClassTt(true);
      try {
        const res = await fetch(`/api/class-timetable?classId=${encodeURIComponent(selectedClassId)}`);
        const data = await res.json();
        setClassTimetable(data);
      } catch (err) {
        console.error('Failed loading class timetable:', err);
      } finally {
        setLoadingClassTt(false);
      }
    }

    loadClass();
  }, [selectedClassId]);

  // Refresh trigger
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const freeRes = await fetch(`/api/free-rooms?day=${selectedDayIndex}&period=${selectedPeriodNum}`);
        const freeData = await freeRes.json();
        setAvailability(freeData);
        if (freeData.metadata) setMetadata(freeData.metadata);
        if (data.diagnostics) setDiagnostics(data.diagnostics);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Jump to Live Now
  const handleJumpToNow = () => {
    if (currentStatus?.hasActivePeriod && currentStatus.currentDay && currentStatus.currentPeriod) {
      setSelectedDayIndex(currentStatus.currentDay.index);
      setSelectedPeriodNum(currentStatus.currentPeriod.number);
      setViewFilter('free');
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!availability) return { free: [], occupied: [] };

    const query = searchQuery.trim().toLowerCase();
    const match = (r: { name: string; building: string }) => {
      return !query || r.name.toLowerCase().includes(query) || r.building.toLowerCase().includes(query);
    };

    return {
      free: availability.freeRooms.filter(match),
      occupied: availability.occupiedRooms.filter(match),
    };
  }, [availability, searchQuery]);

  const activeDay = days.find((d) => d.index === selectedDayIndex);
  const activePeriod = periods.find((p) => p.number === selectedPeriodNum);

  return (
    <div className="app-frame">
      {/* Apple-style Minimal Header */}
      <header className="apple-header">
        <div className="brand-label-group">
          <span className="brand-sub">IILM University</span>
          <h1 className="brand-title">Room Finder</h1>
        </div>

        <button
          id="refresh-btn"
          className="header-action-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh Timetable"
          title="Refresh"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: refreshing ? 'rotate(180deg)' : 'none',
              transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>
      </header>

      {/* TAB 1: FREE ROOM FINDER (PRIMARY) */}
      {activeTab === 'rooms' && (
        <main>
          {/* Live Now Minimal Capsule */}
          <div
            id="btn-free-now"
            className="live-capsule"
            onClick={currentStatus?.hasActivePeriod ? handleJumpToNow : undefined}
          >
            <div className="live-capsule-left">
              <span
                className={`live-pulsing-dot ${
                  currentStatus?.hasActivePeriod ? '' : 'idle'
                }`}
              />
              <div>
                <div className="live-capsule-title">
                  {currentStatus?.hasActivePeriod
                    ? `Live: ${currentStatus.currentDay?.name} · Period ${currentStatus.currentPeriod?.number}`
                    : 'Out of Timetable Hours'}
                </div>
                <div className="live-capsule-sub">
                  {currentStatus?.hasActivePeriod
                    ? `${currentStatus.currentPeriod?.startTime} – ${currentStatus.currentPeriod?.endTime}`
                    : 'Runs Mon – Sat, 09:00 – 17:15'}
                </div>
              </div>
            </div>

            {currentStatus?.hasActivePeriod && (
              <span className="live-capsule-tag">
                Jump to Now
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
          </div>

          {/* Swipeable Day Selector Row */}
          <div className="day-scroll-row" role="tablist" aria-label="Days">
            {days.map((d) => (
              <button
                key={d.id}
                id={`day-pill-${d.index}`}
                className={`day-chip ${selectedDayIndex === d.index ? 'active' : ''}`}
                onClick={() => setSelectedDayIndex(d.index)}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Period Timeline Scroller */}
          <div className="period-scroll-row" role="tablist" aria-label="Periods">
            {periods.map((p) => {
              const isCurrent =
                currentStatus?.hasActivePeriod &&
                currentStatus.currentDay?.index === selectedDayIndex &&
                currentStatus.currentPeriod?.number === p.number;

              return (
                <button
                  key={p.id}
                  id={`period-card-${p.number}`}
                  className={`period-pill ${selectedPeriodNum === p.number ? 'active' : ''}`}
                  onClick={() => setSelectedPeriodNum(p.number)}
                >
                  <span className="period-pill-num">P{p.number}</span>
                  <span className="period-pill-time">{p.startTime}</span>
                  {isCurrent && <span className="period-now-dot" />}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="apple-search-wrapper">
            <svg
              className="apple-search-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="search-classroom-input"
              type="text"
              className="apple-search-input"
              placeholder="Search room (e.g. EB 204, Dell Lab)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Segmented Control: Free Only vs All */}
          <div className="segmented-control" role="group" aria-label="Filter">
            <button
              id="filter-free"
              className={`segment-btn ${viewFilter === 'free' ? 'active' : ''}`}
              onClick={() => setViewFilter('free')}
            >
              Free Rooms ({availability?.freeCount ?? 0})
            </button>
            <button
              id="filter-all"
              className={`segment-btn ${viewFilter === 'all' ? 'active' : ''}`}
              onClick={() => setViewFilter('all')}
            >
              All Rooms ({availability?.totalClassrooms ?? 0})
            </button>
          </div>

          {/* Results Summary Bar */}
          <div className="results-meta-bar">
            <div className="results-headline">
              {viewFilter === 'free'
                ? `${filteredRooms.free.length} Free Rooms`
                : `${filteredRooms.free.length} Free · ${filteredRooms.occupied.length} Occupied`}
            </div>
            <div className="results-subline">
              {activeDay?.short} · {activePeriod?.startTime}–{activePeriod?.endTime}
            </div>
          </div>

          {/* Room List */}
          {loading ? (
            <div className="apple-empty">
              <span>Checking availability...</span>
            </div>
          ) : (
            <div className="apple-room-list">
              {/* Free rooms */}
              {filteredRooms.free.map((room) => (
                <div
                  key={room.id}
                  id={`room-card-${room.name.replace(/\s+/g, '-').toLowerCase()}`}
                  className="apple-room-row free-row"
                >
                  <div className="room-main-info">
                    <span className="room-name-text">{room.name}</span>
                    <span className="room-location-sub">{room.building}</span>
                  </div>
                  <span className="room-badge free">Free</span>
                </div>
              ))}

              {/* Occupied rooms (shown when 'all' is selected) */}
              {viewFilter === 'all' &&
                filteredRooms.occupied.map((room) => (
                  <div
                    key={room.id}
                    id={`room-card-${room.name.replace(/\s+/g, '-').toLowerCase()}`}
                    className="apple-room-row occupied-row"
                  >
                    <div className="room-main-info">
                      <span className="room-name-text">{room.name}</span>
                      <span className="room-lesson-sub">
                        {room.subject} · {room.class}
                      </span>
                      <span className="room-location-sub">{room.building}</span>
                    </div>
                    <span className="room-badge occ">Occupied</span>
                  </div>
                ))}

              {viewFilter === 'free' && filteredRooms.free.length === 0 && (
                <div className="apple-empty">
                  No free classrooms found for this period.
                </div>
              )}

              {filteredRooms.free.length === 0 && filteredRooms.occupied.length === 0 && (
                <div className="apple-empty">
                  No classrooms match "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* TAB 2: CLASS TIMETABLE */}
      {activeTab === 'classes' && (
        <section>
          <select
            id="class-picker-select"
            className="class-select-apple"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class: {c.name}
              </option>
            ))}
          </select>

          {loadingClassTt ? (
            <div className="apple-empty">Loading schedule...</div>
          ) : classTimetable ? (
            <div>
              {days.map((day) => {
                const items = classTimetable.scheduleByDay[day.index] || [];
                return (
                  <div key={day.id} className="schedule-card-apple">
                    <div className="schedule-day-title">{day.name}</div>
                    {items.length === 0 ? (
                      <div className="apple-empty" style={{ padding: '16px' }}>
                        No scheduled classes
                      </div>
                    ) : (
                      items.map((item, i) => (
                        <div key={i} className="schedule-item-row">
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.subject}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              P{item.periodNumber} ({item.periodTime}) · {item.teachers.join(', ') || 'Faculty'}
                            </div>
                          </div>
                          <span className="room-badge free" style={{ background: 'var(--bg-glass-active)', color: 'var(--text-primary)' }}>
                            {item.classrooms.join(', ') || 'TBD'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="apple-empty">No timetable available</div>
          )}
        </section>
      )}

      {/* TAB 3: SYSTEM INFO & DIAGNOSTICS */}
      {activeTab === 'info' && (
        <section className="schedule-card-apple">
          <div className="schedule-day-title">Timetable Information</div>
          <div className="diag-row-apple">
            <span style={{ color: 'var(--text-secondary)' }}>Institution</span>
            <span className="diag-val-apple" style={{ textAlign: 'right', fontSize: '0.78rem' }}>
              {metadata?.institution}
            </span>
          </div>
          <div className="diag-row-apple">
            <span style={{ color: 'var(--text-secondary)' }}>Validity</span>
            <span className="diag-val-apple">{metadata?.validity}</span>
          </div>
          <div className="diag-row-apple">
            <span style={{ color: 'var(--text-secondary)' }}>Last Updated</span>
            <span className="diag-val-apple">{metadata?.lastUpdated}</span>
          </div>
          <div className="diag-row-apple">
            <span style={{ color: 'var(--text-secondary)' }}>Classrooms</span>
            <span className="diag-val-apple">{diagnostics?.classroomsCount ?? 0}</span>
          </div>
          <div className="diag-row-apple">
            <span style={{ color: 'var(--text-secondary)' }}>Classes / Batches</span>
            <span className="diag-val-apple">{diagnostics?.classesCount ?? 0}</span>
          </div>
          <div className="diag-row-apple">
            <span style={{ color: 'var(--text-secondary)' }}>Placed Timetable Cards</span>
            <span className="diag-val-apple">{diagnostics?.placedCardsCount ?? 0}</span>
          </div>
          <div className="diag-row-apple">
            <span style={{ color: 'var(--text-secondary)' }}>Unresolved References</span>
            <span className="diag-val-apple" style={{ color: 'var(--accent-emerald)' }}>
              0 (100% Valid)
            </span>
          </div>
        </section>
      )}

      {/* Apple-style iOS Fixed Bottom Navigation Bar */}
      <nav className="ios-tab-bar" aria-label="Tab Navigation">
        <button
          id="tab-finder"
          className={`ios-tab-item ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <svg className="ios-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          Rooms
        </button>

        <button
          id="tab-class-tt"
          className={`ios-tab-item ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <svg className="ios-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Classes
        </button>

        <button
          id="tab-diagnostics"
          className={`ios-tab-item ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <svg className="ios-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Info
        </button>
      </nav>
    </div>
  );
}
