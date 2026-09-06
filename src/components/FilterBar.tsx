'use client';

import React from 'react';
import { Day, Period } from '@/lib/types';

interface FilterBarProps {
  days: Day[];
  periods: Period[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  selectedPeriodNum: number;
  onSelectPeriod: (num: number) => void;
  currentPeriodNum?: number;
  currentDayIndex?: number;
  isLive: boolean;
  onJumpToNow: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'free' | 'all';
  onViewModeChange: (mode: 'free' | 'all') => void;
  freeCount: number;
  totalCount: number;
  buildingFilter?: string;
  onBuildingChange?: (building: string) => void;
}

export function FilterBar({
  days,
  periods,
  selectedDayIndex,
  onSelectDay,
  selectedPeriodNum,
  onSelectPeriod,
  currentPeriodNum,
  currentDayIndex,
  isLive,
  onJumpToNow,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  freeCount,
  totalCount,
}: FilterBarProps) {
  const isViewingLive = isLive && currentDayIndex === selectedDayIndex && currentPeriodNum === selectedPeriodNum;

  return (
    <div className="filter-panel">
      {/* 1. Time Selector Bar (Day & Period) */}
      <div className="time-selector-bar">
        <div className="time-select-wrap">
          <label htmlFor="day-select" className="time-select-label">Day</label>
          <div className="select-container">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="select-prefix-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <select
              id="day-select"
              className="time-dropdown"
              value={selectedDayIndex}
              onChange={(e) => onSelectDay(Number(e.target.value))}
              aria-label="Select day"
            >
              {days.map((d) => (
                <option key={d.id} value={d.index}>
                  {d.name} {currentDayIndex === d.index ? '• Today' : ''}
                </option>
              ))}
            </select>
            <svg className="dropdown-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div className="time-select-wrap">
          <label htmlFor="period-select" className="time-select-label">Period</label>
          <div className="select-container">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="select-prefix-icon">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <select
              id="period-select"
              className="time-dropdown"
              value={selectedPeriodNum}
              onChange={(e) => onSelectPeriod(Number(e.target.value))}
              aria-label="Select period"
            >
              {periods.map((p) => {
                const isCurrent = currentDayIndex === selectedDayIndex && currentPeriodNum === p.number;
                return (
                  <option key={p.id} value={p.number}>
                    Period {p.number} ({p.startTime} – {p.endTime}) {isCurrent ? '• Live Now' : ''}
                  </option>
                );
              })}
            </select>
            <svg className="dropdown-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {!isViewingLive && isLive && (
          <button
            id="jump-now-btn"
            className="btn-jump-live"
            onClick={onJumpToNow}
            title="Return to current active period"
          >
            ⚡ Jump to Now
          </button>
        )}
      </div>

      {/* 2. Search & Toggle Bar */}
      <div className="search-row">
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="room-search"
            type="text"
            placeholder="Search room, building, subject, teacher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search rooms"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => onSearchChange('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="toggle-row">
          <button
            id="toggle-free"
            className={`toggle-chip ${viewMode === 'free' ? 'active' : ''}`}
            onClick={() => onViewModeChange('free')}
          >
            Free <span className="count">{freeCount}</span>
          </button>
          <button
            id="toggle-all"
            className={`toggle-chip ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => onViewModeChange('all')}
          >
            All <span className="count">{totalCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
