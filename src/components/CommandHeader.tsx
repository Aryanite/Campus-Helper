'use client';

import React from 'react';
import { SchoolClass } from '@/lib/types';

interface CommandHeaderProps {
  institution?: string;
  timetableNum?: string;
  classes: SchoolClass[];
  selectedBatchId: string;
  onSelectBatch: (id: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function CommandHeader({
  classes,
  selectedBatchId,
  onSelectBatch,
}: CommandHeaderProps) {
  return (
    <header className="top-bar">
      <span className="top-bar-title">CampusHelper</span>

      <div className="top-bar-actions">
        {/* Batch selector with single custom dropdown chevron */}
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
          <svg className="dropdown-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
}
