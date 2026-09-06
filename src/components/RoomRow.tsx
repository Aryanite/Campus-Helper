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

  return (
    <div id={`room-${slug}`} className="room-item">
      {/* Room name + building */}
      <div className="room-main">
        <div className="room-name">{room.name}</div>
        <div className="room-sub">{room.building}</div>
      </div>

      {/* Occupied info — subject + who */}
      {room.isOccupied && room.occupant ? (
        <div className="room-occupied-info">
          <div className="room-subject">{room.occupant.subject}</div>
          <div className="room-meta">{room.occupant.class} · {room.occupant.teacher}</div>
        </div>
      ) : (
        <div className="room-occupied-info" />
      )}

      {/* Status chip */}
      {room.isOccupied ? (
        <span className="status-chip busy">In Use</span>
      ) : (
        <span className="status-chip free">Free</span>
      )}
    </div>
  );
}
