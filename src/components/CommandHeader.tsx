'use client';

import React from 'react';
import { SchoolClass } from '@/lib/types';

interface CommandHeaderProps {
  institution?: string;
  timetableNum?: string;
  classes: SchoolClass[];
  selectedBatchId: string;
  onSelectBatch: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function CommandHeader({
  classes,
  selectedBatchId,
  onSelectBatch,
  onRefresh,
  isRefreshing,
}: CommandHeaderProps) {
  return (
    <header className="top-bar">
      <span className="top-bar-title">CampusHelper</span>

      <div className="top-bar-actions">
        {/* Batch selector */}
        <div className="batch-chip">
          <select
            id="batch-select"
            value={selectedBatchId}
            onChange={(e) => onSelectBatch(e.target.value)}
            aria-label="Select your batch"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Sync */}
        <button
          id="sync-btn"
          className={`icon-btn ${isRefreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Sync timetable"
          title="Sync timetable"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>
      </div>
    </header>
  );
}
