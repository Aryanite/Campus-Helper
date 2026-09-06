'use client';

import React, { useState, useEffect } from 'react';
import { CurrentStatusResult, Period, ClassScheduleItem } from '@/lib/types';

interface LivePulseStripProps {
  currentStatus: CurrentStatusResult | null;
  selectedDayName: string;
  selectedPeriod?: Period;
  batchName: string;
  batchClass?: ClassScheduleItem | null;
  isViewingLive: boolean;
  onJumpToNow: () => void;
  freeCount?: number;
}

export function LivePulseStrip({
  currentStatus,
  selectedDayName,
  selectedPeriod,
  batchName,
  batchClass,
  isViewingLive,
  onJumpToNow,
  freeCount,
}: LivePulseStripProps) {
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

  const hasLivePeriod = Boolean(currentStatus?.hasActivePeriod && currentStatus.currentPeriod);

  return (
    <div className="live-hero-card">
      {/* Top row: Status header */}
      <div className="hero-status-row">
        <div className="hero-status-left">
          {isViewingLive ? (
            <span className="hero-badge badge-live">
              <span className="live-dot" /> LIVE NOW
            </span>
          ) : hasLivePeriod ? (
            <span className="hero-badge badge-future">
              📅 SCHEDULED
            </span>
          ) : (
            <span className="hero-badge badge-closed">
              🌙 CAMPUS CLOSED
            </span>
          )}

          <span className="hero-time-text">
            <strong>{selectedDayName}</strong> · Period {selectedPeriod?.number ?? 1}{' '}
            ({selectedPeriod?.startTime ?? '09:00'}–{selectedPeriod?.endTime ?? '09:55'})
          </span>

          {isViewingLive && minutesRemaining !== null && (
            <span className="hero-countdown-chip">
              {minutesRemaining}m left
            </span>
          )}
        </div>

        <div className="hero-status-right">
          {freeCount !== undefined && (
            <span className="hero-free-count">
              <strong>{freeCount}</strong> rooms free
            </span>
          )}

          {!isViewingLive && hasLivePeriod && (
            <button
              id="jump-to-now-hero-btn"
              className="btn-jump-pill"
              onClick={onJumpToNow}
              title="Return to currently active class period"
            >
              ⚡ Live Now
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Batch's class status at this period */}
      <div className="hero-batch-row">
        <div className="hero-batch-badge">
          🎓 {batchName || 'Your Batch'}
        </div>

        <div className="hero-batch-content">
          {batchClass ? (
            <div className="batch-class-info">
              <span className="batch-subject">{batchClass.subject}</span>
              <span className="batch-room-tag">
                {batchClass.classrooms.join(', ') || 'Room Assigned'}
              </span>
              {batchClass.teachers.length > 0 && (
                <span className="batch-teacher">
                  · {batchClass.teachers.join(', ')}
                </span>
              )}
            </div>
          ) : (
            <div className="batch-free-info">
              <span className="free-sparkle">✨</span>
              <span className="free-text">
                <strong>Free Period</strong> for {batchName || 'this batch'} — no classes scheduled!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
