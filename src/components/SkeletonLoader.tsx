'use client';

import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 8 }: SkeletonLoaderProps) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="Loading classrooms">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-item">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
            <div className="skel" style={{ width: '80px', height: '16px' }} />
            <div className="skel" style={{ width: '100px', height: '12px' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skel" style={{ width: '55%', height: '14px' }} />
            <div className="skel" style={{ width: '35%', height: '12px' }} />
          </div>
          <div className="skel" style={{ width: '52px', height: '24px', borderRadius: '100px' }} />
        </div>
      ))}
    </div>
  );
}

export function TimetableSkeleton() {
  return (
    <div aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="schedule-day">
          <div className="schedule-day-label">
            <div className="skel" style={{ width: '80px', height: '12px' }} />
          </div>
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="schedule-row">
              <div className="skel" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skel" style={{ width: '60%', height: '14px' }} />
                <div className="skel" style={{ width: '40%', height: '12px' }} />
              </div>
              <div className="skel" style={{ width: '60px', height: '24px', borderRadius: '100px' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
