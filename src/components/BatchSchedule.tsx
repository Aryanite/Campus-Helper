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
        No timetable for <strong>{batchName}</strong>.
      </div>
    );
  }

  return (
    <div>
      {days.map((day) => {
        const items = timetable.scheduleByDay[day.index] || [];
        return (
          <div key={day.id} className="schedule-day">
            <div className="schedule-day-label">{day.name}</div>

            {items.length === 0 ? (
              <div className="schedule-empty-day">No classes</div>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="schedule-row">
                  <div className="schedule-period-num">{item.periodNumber}</div>
                  <div className="schedule-info">
                    <div className="schedule-subject">{item.subject}</div>
                    <div className="schedule-teacher">
                      {item.periodTime} · {item.teachers.join(', ') || '—'}
                    </div>
                  </div>
                  <span className="schedule-room-chip">
                    {item.classrooms.join(', ') || 'TBD'}
                  </span>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
