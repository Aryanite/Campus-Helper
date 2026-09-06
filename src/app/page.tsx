'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Day,
  Period,
  SchoolClass,
  TimetableMetadata,
  TimetableDiagnostics,
  CurrentStatusResult,
  ClassTimetableResult,
} from '@/lib/types';
import { CommandHeader } from '@/components/CommandHeader';
import { LivePulseStrip } from '@/components/LivePulseStrip';
import { FilterBar } from '@/components/FilterBar';
import { RoomRow, RoomRowData } from '@/components/RoomRow';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { BatchSchedule } from '@/components/BatchSchedule';
import { LegalModal } from '@/components/LegalModal';

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
    startPeriod?: number;
    duration?: number;
  }[];
  metadata: TimetableMetadata;
}

export default function CampusHelperPage() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'schedule'>('rooms');

  // Timetable core metadata
  const [days, setDays] = useState<Day[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [metadata, setMetadata] = useState<TimetableMetadata | null>(null);
  const [diagnostics, setDiagnostics] = useState<TimetableDiagnostics | null>(null);

  // Selected filters
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [selectedPeriodNum, setSelectedPeriodNum] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'free' | 'all'>('free');

  // Preferred Batch State (Persisted in localStorage)
  const [preferredBatchId, setPreferredBatchId] = useState<string>('');

  // Live status
  const [currentStatus, setCurrentStatus] = useState<CurrentStatusResult | null>(null);

  // Room query data
  const [availability, setAvailability] = useState<ApiResponseFreeRooms | null>(null);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);

  // Batch timetable query data
  const [classTimetable, setClassTimetable] = useState<ClassTimetableResult | null>(null);
  const [loadingBatchSchedule, setLoadingBatchSchedule] = useState<boolean>(false);

  // Sync state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Legal Modal
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  // 1. Initial Data Fetch & Auto-detection of Current Period
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

          // Restore saved batch from localStorage or fallback to 2CSE13
          const savedBatch = typeof window !== 'undefined' ? localStorage.getItem('campushelper_batch') : null;
          const matchedBatch =
            classesRes.find((c: SchoolClass) => c.id === savedBatch) ||
            classesRes.find((c: SchoolClass) => c.name === '2CSE13') ||
            classesRes[0];

          if (matchedBatch) {
            setPreferredBatchId(matchedBatch.id);
          }
        }

        if (metaRes?.metadata) setMetadata(metaRes.metadata);
        if (metaRes?.diagnostics) setDiagnostics(metaRes.diagnostics);

        if (nowRes) {
          setCurrentStatus(nowRes);
          if (nowRes.hasActivePeriod && nowRes.currentDay && nowRes.currentPeriod) {
            setSelectedDayIndex(nowRes.currentDay.index);
            setSelectedPeriodNum(nowRes.currentPeriod.number);
          } else {
            // Auto-detect based on current client date and time
            const now = new Date();
            const jsDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const timeStr = `${h}:${m}`;

            if (jsDay >= 1 && jsDay <= 6) {
              const dayIdx = jsDay - 1;
              setSelectedDayIndex(dayIdx);

              const pMatch = Array.isArray(periodsRes)
                ? periodsRes.find((p: Period) => timeStr >= p.startTime && timeStr < p.endTime)
                : null;

              if (pMatch) {
                setSelectedPeriodNum(pMatch.number);
              } else if (timeStr < '09:00') {
                setSelectedPeriodNum(1);
              } else if (timeStr >= '17:15') {
                setSelectedDayIndex(dayIdx < 5 ? dayIdx + 1 : 0);
                setSelectedPeriodNum(1);
              } else {
                setSelectedPeriodNum(1);
              }
            } else {
              // Sunday -> default to Monday Period 1
              setSelectedDayIndex(0);
              setSelectedPeriodNum(1);
            }
          }
        }
      } catch (err) {
        console.error('Failed initializing CampusHelper data:', err);
      }
    }

    init();
  }, []);

  // 2. Fetch Room Availability whenever Day or Period changes
  const fetchAvailability = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const url = `/api/free-rooms?day=${selectedDayIndex}&period=${selectedPeriodNum}`;
      const res = await fetch(url);
      const data = await res.json();
      setAvailability(data);
      if (data.metadata) setMetadata(data.metadata);
    } catch (err) {
      console.error('Failed loading room availability:', err);
    } finally {
      setLoadingRooms(false);
    }
  }, [selectedDayIndex, selectedPeriodNum]);

  useEffect(() => {
    if (days.length > 0 && periods.length > 0) {
      fetchAvailability();
    }
  }, [fetchAvailability, days.length, periods.length]);

  // 3. Fetch Batch Schedule whenever preferred batch changes
  useEffect(() => {
    if (!preferredBatchId) return;

    async function loadBatchSchedule() {
      setLoadingBatchSchedule(true);
      try {
        const res = await fetch(`/api/class-timetable?classId=${encodeURIComponent(preferredBatchId)}`);
        const data = await res.json();
        setClassTimetable(data);
      } catch (err) {
        console.error('Failed loading batch timetable:', err);
      } finally {
        setLoadingBatchSchedule(false);
      }
    }

    loadBatchSchedule();
  }, [preferredBatchId]);

  // Handle setting preferred batch with localStorage persistence
  const handleSelectBatch = (id: string) => {
    setPreferredBatchId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('campushelper_batch', id);
    }
  };

  // Jump to Current Live Period
  const handleJumpToNow = () => {
    if (currentStatus?.hasActivePeriod && currentStatus.currentDay && currentStatus.currentPeriod) {
      setSelectedDayIndex(currentStatus.currentDay.index);
      setSelectedPeriodNum(currentStatus.currentPeriod.number);
      setViewMode('free');
      setActiveTab('rooms');
    }
  };

  // Force Refresh from EduPage
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchAvailability();
        const nowRes = await fetch('/api/now').then((r) => r.json());
        if (nowRes) setCurrentStatus(nowRes);
        if (data.diagnostics) setDiagnostics(data.diagnostics);
      }
    } catch (err) {
      console.error('Failed refreshing timetable data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered Room Results (with search query matching room name, building, subject, teacher, class)
  const roomRows = useMemo<RoomRowData[]>(() => {
    if (!availability) return [];

    const query = searchQuery.trim().toLowerCase();

    const freeItems: RoomRowData[] = availability.freeRooms.map((r) => ({
      id: r.id,
      name: r.name,
      short: r.short,
      building: r.building,
      isOccupied: false,
    }));

    const occupiedItems: RoomRowData[] = availability.occupiedRooms.map((r) => ({
      id: r.id,
      name: r.name,
      short: r.short,
      building: r.building,
      isOccupied: true,
      occupant: {
        subject: r.subject,
        subjectShort: r.subjectShort,
        class: r.class,
        teacher: r.teacher,
        startPeriod: r.startPeriod,
        duration: r.duration,
      },
    }));

    let combined: RoomRowData[] = [];
    if (viewMode === 'free') {
      combined = freeItems;
    } else {
      // Sort with available first, then occupied
      combined = [...freeItems, ...occupiedItems];
    }

    if (!query) return combined;

    return combined.filter((r) => {
      const matchName = r.name.toLowerCase().includes(query);
      const matchSubject = r.occupant?.subject?.toLowerCase().includes(query) || false;
      const matchTeacher = r.occupant?.teacher?.toLowerCase().includes(query) || false;
      const matchClass = r.occupant?.class?.toLowerCase().includes(query) || false;

      return matchName || matchSubject || matchTeacher || matchClass;
    });
  }, [availability, viewMode, searchQuery]);

  const activeDay = days.find((d) => d.index === selectedDayIndex);
  const activePeriod = periods.find((p) => p.number === selectedPeriodNum);
  const activeBatch = classes.find((c) => c.id === preferredBatchId);

  // Selected batch's class at the currently selected day & period
  const selectedBatchClass = useMemo(() => {
    if (!classTimetable?.scheduleByDay) return null;
    const dayClasses = classTimetable.scheduleByDay[selectedDayIndex] || [];
    return dayClasses.find((item) => item.periodNumber === selectedPeriodNum) || null;
  }, [classTimetable, selectedDayIndex, selectedPeriodNum]);

  const isViewingLive = Boolean(
    currentStatus?.hasActivePeriod &&
    currentStatus.currentDay?.index === selectedDayIndex &&
    currentStatus.currentPeriod?.number === selectedPeriodNum
  );

  return (
    <div className="app-shell">
      {/* 1. Top Command Bar */}
      <CommandHeader
        institution={metadata?.institution || 'IILM University'}
        timetableNum="37"
        classes={classes}
        selectedBatchId={preferredBatchId}
        onSelectBatch={handleSelectBatch}
      />

      {/* 2. Navigation Tabs */}
      <nav className="tab-bar" role="tablist" aria-label="Campus views">
        <button
          id="tab-btn-rooms"
          className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
          role="tab"
          aria-selected={activeTab === 'rooms'}
        >
          Free Classrooms
        </button>
        <button
          id="tab-btn-schedule"
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
          role="tab"
          aria-selected={activeTab === 'schedule'}
        >
          Batch Schedule {activeBatch ? `(${activeBatch.name})` : ''}
        </button>
      </nav>

      {/* 3. Live Status & Current Batch Class Hero */}
      <LivePulseStrip
        currentStatus={currentStatus}
        selectedDayName={activeDay?.name || 'Today'}
        selectedPeriod={activePeriod}
        batchName={activeBatch?.name || '2CSE13'}
        batchClass={selectedBatchClass}
        isViewingLive={isViewingLive}
        onJumpToNow={handleJumpToNow}
        freeCount={availability?.freeCount}
      />

      {/* TAB 1: CLASSROOM AVAILABILITY */}
      {activeTab === 'rooms' && (
        <main>
          {/* Controls Bar: Time picker + Search */}
          <FilterBar
            days={days}
            periods={periods}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDayIndex}
            selectedPeriodNum={selectedPeriodNum}
            onSelectPeriod={setSelectedPeriodNum}
            currentPeriodNum={currentStatus?.hasActivePeriod ? currentStatus.currentPeriod?.number : undefined}
            currentDayIndex={currentStatus?.hasActivePeriod ? currentStatus.currentDay?.index : undefined}
            isLive={Boolean(currentStatus?.hasActivePeriod)}
            onJumpToNow={handleJumpToNow}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            freeCount={availability?.freeCount ?? 0}
            totalCount={availability?.totalClassrooms ?? 0}
          />

          {/* Room Listings or Skeleton */}
          {loadingRooms ? (
            <SkeletonLoader count={8} />
          ) : roomRows.length > 0 ? (
            <div className="room-list">
              {roomRows.map((room) => (
                <RoomRow key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No classrooms matched your search criteria.
              <p>Try clearing your search query or selecting "All" rooms.</p>
            </div>
          )}
        </main>
      )}

      {/* TAB 2: BATCH SCHEDULE */}
      {activeTab === 'schedule' && (
        <main>
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Weekly Academic Timetable for Section <strong>{activeBatch?.name || 'Selected Batch'}</strong>
            </span>
          </div>

          <BatchSchedule
            days={days}
            batchName={activeBatch?.name || ''}
            timetable={classTimetable}
            isLoading={loadingBatchSchedule}
          />
        </main>
      )}

      {/* Footer & Compliance Links */}
      <footer className="app-footer">
        <div>
          <span>CampusHelper · IILM University School of Computer Science & Engineering</span>
        </div>
        <div className="footer-links">
          <button
            className="footer-link-btn"
            onClick={() => setLegalModalType('terms')}
          >
            Terms of Service
          </button>
          <button
            className="footer-link-btn"
            onClick={() => setLegalModalType('privacy')}
          >
            Privacy Policy
          </button>
        </div>
      </footer>

      {/* Accessible Terms & Privacy Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
