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
  return (
    <div
      id={`room-${room.name.toLowerCase().replace(/\s+/g, '-')}`}
      className="room-row-card"
    >
      {/* Left column: Room name & building */}
      <div className="room-col-main">
        <div className="room-name-row">
          <span className="room-name">{room.name}</span>
        </div>
        <span className="room-building-tag">{room.building}</span>
      </div>

      {/* Middle column: Occupied lesson details if occupied, or availability confirmation */}
      {room.isOccupied && room.occupant ? (
        <div className="room-col-occupied-info">
          <span className="occupied-subject">{room.occupant.subject}</span>
          <span className="occupied-meta">
            Section: {room.occupant.class} · Faculty: {room.occupant.teacher}
            {room.occupant.duration && room.occupant.duration > 1 ? ` (${room.occupant.duration} periods)` : ''}
          </span>
        </div>
      ) : (
        <div className="room-col-occupied-info">
          <span className="room-consecutive-tag">Unoccupied & open for study</span>
        </div>
      )}

      {/* Right column: Status Badge */}
      <div className="room-col-status">
        {room.isOccupied ? (
          <span className="status-badge occupied">In Session</span>
        ) : (
          <span className="status-badge available">Available</span>
        )}
      </div>
    </div>
  );
}
