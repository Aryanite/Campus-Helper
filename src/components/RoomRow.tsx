'use client';

import React from 'react';

export interface RoomRowData {
  id: string;
  name: string;
  short: string;
  building: string;
  isOccupied: boolean;
  occupant?: {
    subject: string;
    subjectShort?: string;
    class: string;
    teacher: string;
    startPeriod?: number;
    duration?: number;
  };
}

interface RoomRowProps {
  room: RoomRowData;
}

export function RoomRow({ room }: RoomRowProps) {
  const slug = room.name.toLowerCase().replace(/\s+/g, '-');
  const statusClass = room.isOccupied ? 'occupied' : 'free';

  return (
    <div id={`room-${slug}`} className={`room-card room-item ${statusClass}`}>
      <div className="room-card-header">
        <div className="room-identity">
          <span className="room-name">{room.name}</span>
          {room.building && (
            <span className="room-building-badge">{room.building}</span>
          )}
        </div>

        <span className={`status-chip ${room.isOccupied ? 'busy' : 'free'}`}>
          <span className="status-dot" />
          {room.isOccupied ? 'In Use' : 'Free'}
        </span>
      </div>

      {room.isOccupied && room.occupant && (
        <div className="room-occupied-info">
          <div className="room-subject">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="room-subject-icon">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span className="room-subject-title">{room.occupant.subject}</span>
          </div>
          <div className="room-meta">
            <span className="room-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {room.occupant.class}
            </span>
            <span className="room-meta-dot">•</span>
            <span className="room-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M6 21v-2a6 6 0 0 1 12 0v2"/>
              </svg>
              {room.occupant.teacher}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
