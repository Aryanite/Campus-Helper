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
  institution = 'IILM University',
  timetableNum = '37',
  classes,
  selectedBatchId,
  onSelectBatch,
  onRefresh,
  isRefreshing,
}: CommandHeaderProps) {
  return (
    <header className="command-header">
      <div className="header-brand">
        <div className="brand-badge-row">
          <span className="brand-badge">{institution}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>/</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Timetable {timetableNum}</span>
        </div>
        <h1 className="brand-title">CampusHelper</h1>
      </div>

      <div className="header-tools">
        {/* Quick Batch Selector */}
        <div className="quick-batch-wrapper" title="Set your default student section">
          <span className="quick-batch-label">Batch:</span>
          <select
            id="quick-batch-select"
            className="quick-batch-select"
            value={selectedBatchId}
            onChange={(e) => onSelectBatch(e.target.value)}
            aria-label="Select default student batch"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sync / Refresh Button */}
        <button
          id="refresh-timetable-btn"
          className="icon-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Synchronize timetable with official EduPage server"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            }}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          {isRefreshing ? 'Syncing...' : 'Sync Live'}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </header>
  );
}
