'use client';

import React from 'react';
import { Day, ClassTimetableResult } from '@/lib/types';
import { TimetableSkeleton } from './SkeletonLoader';

interface BatchScheduleProps {
  days: Day[];
  batchName: string;
  timetable: ClassTimetableResult | null;
  isLoading: boolean;
}

export function BatchSchedule({ days, batchName, timetable, isLoading }: BatchScheduleProps) {
  if (isLoading) {
    return <TimetableSkeleton />;
  }

  if (!timetable) {
    return (
      <div className="empty-state">
        <p>No timetable schedule available for batch <strong>{batchName}</strong>.</p>
      </div>
    );
  }

  return (
    <div className="batch-schedule-container">
      {days.map((day) => {
        const items = timetable.scheduleByDay[day.index] || [];

        return (
          <div key={day.id} className="batch-day-card">
            <div className="batch-day-header">
              <span>{day.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {items.length} {items.length === 1 ? 'class' : 'classes'}
              </span>
            </div>

            {items.length === 0 ? (
              <div style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                No scheduled academic lectures or labs.
              </div>
            ) : (
              <div>
                {items.map((item, idx) => (
                  <div key={idx} className="batch-item-row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className="batch-subject-title">{item.subject}</span>
                      <span className="batch-teacher-sub">
                        Period {item.periodNumber} ({item.periodTime}) · {item.teachers.join(', ') || 'Faculty'}
                      </span>
                    </div>

                    <span className="batch-room-pill">
                      {item.classrooms.join(', ') || 'TBD'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
