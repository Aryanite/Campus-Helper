'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Day,
  Period,
  SchoolClass,
  TimetableMetadata,
  TimetableDiagnostics,
  CurrentStatusResult,
  ClassTimetableResult,
  ApiResponseFreeRooms,
  BootstrapData,
} from '@/lib/types';
import { CommandHeader } from '@/components/CommandHeader';
import { LivePulseStrip } from '@/components/LivePulseStrip';
import { FilterBar } from '@/components/FilterBar';
import { RoomRow, RoomRowData } from '@/components/RoomRow';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { BatchSchedule } from '@/components/BatchSchedule';
import { LegalModal } from '@/components/LegalModal';

interface CampusHelperClientProps {
  initialData: BootstrapData;
}

export function CampusHelperClient({ initialData }: CampusHelperClientProps) {
  const [activeTab, setActiveTab] = useState<'rooms' | 'schedule'>('rooms');

  // Timetable core metadata initialized synchronously from SSR initialData
  const [days, setDays] = useState<Day[]>(initialData.days);
  const [periods, setPeriods] = useState<Period[]>(initialData.periods);
  const [classes, setClasses] = useState<SchoolClass[]>(initialData.classes);
  const [metadata, setMetadata] = useState<TimetableMetadata | null>(initialData.metadata);
  const [diagnostics, setDiagnostics] = useState<TimetableDiagnostics | null>(initialData.diagnostics);

  // Selected filters initialized directly from server detection
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(initialData.initialDayIndex);
  const [selectedPeriodNum, setSelectedPeriodNum] = useState<number>(initialData.initialPeriodNum);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'free' | 'all'>('free');

  // Preferred Batch State
  const [preferredBatchId, setPreferredBatchId] = useState<string>(initialData.initialBatchId);

  // Live status
  const [currentStatus, setCurrentStatus] = useState<CurrentStatusResult | null>(initialData.currentStatus);

  // Room query data (already available on first load - zero skeleton delay)
  const [availability, setAvailability] = useState<ApiResponseFreeRooms | null>(initialData.initialAvailability);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  // Batch timetable query data
  const [classTimetable, setClassTimetable] = useState<ClassTimetableResult | null>(initialData.initialClassTimetable);
  const [loadingBatchSchedule, setLoadingBatchSchedule] = useState<boolean>(false);

  // Sync state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Legal Modal
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  // In-memory client caches for instant tab/filter switching without round-trips
  const roomCacheRef = useRef<Map<string, ApiResponseFreeRooms>>(new Map());
  const batchScheduleCacheRef = useRef<Map<string, ClassTimetableResult>>(new Map());

  // Prime client memory cache with initial server data
  useEffect(() => {
    if (initialData.initialAvailability) {
      const initialKey = `${initialData.initialDayIndex}:${initialData.initialPeriodNum}`;
      roomCacheRef.current.set(initialKey, initialData.initialAvailability);
    }
    if (initialData.initialClassTimetable && initialData.initialBatchId) {
      batchScheduleCacheRef.current.set(initialData.initialBatchId, initialData.initialClassTimetable);
    }
  }, [initialData]);

  // Restore saved batch from localStorage on client mount if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedBatch = localStorage.getItem('campushelper_batch');
      if (savedBatch && savedBatch !== preferredBatchId) {
        const match = classes.find((c) => c.id === savedBatch);
        if (match) {
          setPreferredBatchId(match.id);
        }
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, [classes]);

  // Fast Room Availability Fetch with in-memory cache
  const fetchAvailability = useCallback(async (dayIdx: number, periodNum: number) => {
    const cacheKey = `${dayIdx}:${periodNum}`;
    const cached = roomCacheRef.current.get(cacheKey);

    if (cached) {
      // Instant transition from memory
      setAvailability(cached);
      setLoadingRooms(false);
      return;
    }

    setLoadingRooms(true);
    try {
      const url = `/api/free-rooms?day=${dayIdx}&period=${periodNum}`;
      const res = await fetch(url);
      const data = await res.json();
      roomCacheRef.current.set(cacheKey, data);
      setAvailability(data);
      if (data.metadata) setMetadata(data.metadata);
    } catch (err) {
      console.error('Failed loading room availability:', err);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Fetch rooms only when filter changes away from initial cache
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchAvailability(selectedDayIndex, selectedPeriodNum);
  }, [selectedDayIndex, selectedPeriodNum, fetchAvailability]);

  // Fetch Batch Schedule with in-memory cache
  useEffect(() => {
    if (!preferredBatchId) return;

    const cached = batchScheduleCacheRef.current.get(preferredBatchId);
    if (cached) {
      setClassTimetable(cached);
      setLoadingBatchSchedule(false);
      return;
    }

    let isMounted = true;
    async function loadBatchSchedule() {
      setLoadingBatchSchedule(true);
      try {
        const res = await fetch(`/api/class-timetable?classId=${encodeURIComponent(preferredBatchId)}`);
        const data = await res.json();
        if (isMounted) {
          batchScheduleCacheRef.current.set(preferredBatchId, data);
          setClassTimetable(data);
        }
      } catch (err) {
        console.error('Failed loading batch timetable:', err);
      } finally {
        if (isMounted) setLoadingBatchSchedule(false);
      }
    }

    loadBatchSchedule();
    return () => {
      isMounted = false;
    };
  }, [preferredBatchId]);

  // Handle setting preferred batch with localStorage persistence
  const handleSelectBatch = (id: string) => {
    setPreferredBatchId(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('campushelper_batch', id);
      } catch {
        // Ignore localStorage quota errors
      }
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

  // Force Refresh (invalidates caches and synchronizes)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Clear memory cache so fresh data is loaded
        roomCacheRef.current.clear();
        batchScheduleCacheRef.current.clear();

        await fetchAvailability(selectedDayIndex, selectedPeriodNum);
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
