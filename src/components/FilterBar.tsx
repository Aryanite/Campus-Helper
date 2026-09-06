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
  searchQuery: string;
  onSearchChange: (query: string) => void;
  buildingFilter: string;
  onBuildingChange: (b: string) => void;
  viewMode: 'free' | 'all';
  onViewModeChange: (mode: 'free' | 'all') => void;
  freeCount: number;
  totalCount: number;
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
  searchQuery,
  onSearchChange,
  buildingFilter,
  onBuildingChange,
  viewMode,
  onViewModeChange,
  freeCount,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="command-panel">
      {/* Day Selector Strip */}
      <div className="day-bar" role="tablist" aria-label="Days of week">
        {days.map((d) => (
          <button
            key={d.id}
            id={`day-btn-${d.index}`}
            className={`day-btn ${selectedDayIndex === d.index ? 'active' : ''}`}
            onClick={() => onSelectDay(d.index)}
            role="tab"
            aria-selected={selectedDayIndex === d.index}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Period Timeline Scroller */}
      <div className="period-timeline" role="tablist" aria-label="Academic Periods">
        {periods.map((p) => {
          const isCurrent = currentDayIndex === selectedDayIndex && currentPeriodNum === p.number;
          const isSelected = selectedPeriodNum === p.number;

          return (
            <button
              key={p.id}
              id={`period-btn-${p.number}`}
              className={`period-pill-btn ${isSelected ? 'active' : ''} ${isCurrent ? 'is-now' : ''}`}
              onClick={() => onSelectPeriod(p.number)}
              role="tab"
              aria-selected={isSelected}
              title={`Period ${p.number}: ${p.startTime} - ${p.endTime}`}
            >
              <span className="period-pill-name">P{p.number}</span>
              <span className="period-pill-time">{p.startTime}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Search, Building Dropdown, Available/All Segment */}
      <div className="filter-row">
        {/* Search */}
        <div className="search-input-wrapper">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="room-search-input"
            type="text"
            className="search-input"
            placeholder="Search room (EB 204, Apple Lab, etc.)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Filter classrooms"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Building Filter */}
        <select
          id="building-filter-select"
          className="filter-select"
          value={buildingFilter}
          onChange={(e) => onBuildingChange(e.target.value)}
          aria-label="Filter by building"
        >
          <option value="all">All Locations (85 Rooms)</option>
          <option value="engineering">Engineering Block (EB)</option>
          <option value="foundation">Foundation Block</option>
          <option value="labs">Specialized Labs</option>
          <option value="law">Law Block</option>
        </select>

        {/* Segmented Control: Available vs All */}
        <div className="segmented-toggle" role="group" aria-label="Room filter">
          <button
            id="view-available-btn"
            className={`segment-item-btn ${viewMode === 'free' ? 'active' : ''}`}
            onClick={() => onViewModeChange('free')}
          >
            Available ({freeCount})
          </button>
          <button
            id="view-all-btn"
            className={`segment-item-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => onViewModeChange('all')}
          >
            All Rooms ({totalCount})
          </button>
        </div>
      </div>
    </div>
  );
}
