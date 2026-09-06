'use client';

import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 6 }: SkeletonLoaderProps) {
  return (
    <div className="room-grid" aria-busy="true" aria-label="Loading classrooms">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
            <div className="skeleton-block" style={{ width: '80px', height: '18px' }} />
            <div className="skeleton-block" style={{ width: '120px', height: '12px' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton-block" style={{ width: '60%', height: '14px' }} />
            <div className="skeleton-block" style={{ width: '40%', height: '12px' }} />
          </div>
          <div className="skeleton-block" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
        </div>
      ))}
    </div>
  );
}

export function TimetableSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="batch-day-card">
          <div className="batch-day-header">
            <div className="skeleton-block" style={{ width: '100px', height: '16px' }} />
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="skeleton-block" style={{ width: '80%', height: '16px' }} />
            <div className="skeleton-block" style={{ width: '60%', height: '14px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
