'use client';

import React, { useState, useEffect } from 'react';
import { CurrentStatusResult, Period, Day } from '@/lib/types';

interface LivePulseStripProps {
  currentStatus: CurrentStatusResult | null;
  onJumpToNow: () => void;
  freeCountNow?: number;
}

export function LivePulseStrip({ currentStatus, onJumpToNow, freeCountNow }: LivePulseStripProps) {
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);

  useEffect(() => {
    function calculateMinutesLeft() {
      if (!currentStatus?.hasActivePeriod || !currentStatus.currentPeriod?.endTime) {
        setMinutesRemaining(null);
        return;
      }

      const now = new Date();
      const [endH, endM] = currentStatus.currentPeriod.endTime.split(':').map(Number);
      const endTotal = endH * 60 + endM;
      const currentTotal = now.getHours() * 60 + now.getMinutes();
      const diff = endTotal - currentTotal;
      setMinutesRemaining(diff > 0 ? diff : 0);
    }

    calculateMinutesLeft();
    const interval = setInterval(calculateMinutesLeft, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [currentStatus]);

  const isActive = currentStatus?.hasActivePeriod && currentStatus.currentPeriod;

  return (
    <div className="live-pulse-strip">
      <div className="live-pulse-left">
        <span className={`pulse-indicator ${isActive ? '' : 'idle'}`} aria-hidden="true" />
        <div className="pulse-info">
          <div className="pulse-title">
            {isActive ? (
              <>
                <span>
                  {currentStatus.currentDay?.name} · Period {currentStatus.currentPeriod?.number}
                </span>
                {minutesRemaining !== null && (
                  <span className="pulse-countdown-badge">
                    {minutesRemaining}m remaining
                  </span>
                )}
              </>
            ) : (
              <span>Outside Academic Timetable Hours</span>
            )}
          </div>
          <div className="pulse-sub">
            {isActive ? (
              <>
                Active window: {currentStatus.currentPeriod?.startTime} - {currentStatus.currentPeriod?.endTime}
                {freeCountNow !== undefined ? ` · ${freeCountNow} classrooms free` : ''}
              </>
            ) : (
              <span>Academic schedule runs Monday - Saturday, 09:00 - 17:15</span>
            )}
          </div>
        </div>
      </div>

      {isActive && (
        <button
          id="jump-to-now-btn"
          className="btn-jump-now"
          onClick={onJumpToNow}
          title="Jump to current day and period"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Jump to Now
        </button>
      )}
    </div>
  );
}
