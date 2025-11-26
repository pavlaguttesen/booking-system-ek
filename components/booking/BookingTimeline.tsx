"use client";

import { useMemo, useRef } from "react";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function isSameDate(dateStr: string, selectedDate: string | null) {
  if (!selectedDate || selectedDate.trim() === "") return true;
  return dayjs(dateStr).isSame(dayjs(selectedDate), "day");
}

function getMinutesSinceStart(d: Date) {
  return (d.getHours() - DAY_START_HOUR) * 60 + d.getMinutes();
}

function getDurationMinutes(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / 60000;
}

export function BookingTimeline({
  onCreateBooking,
}: {
  onCreateBooking: (data: {
    roomId: string;
    start: Date;
    end: Date;
  }) => void;
}) {
  const { rooms, filteredBookings, selectedDate } = useBookingContext();
  const timelineRef = useRef<HTMLDivElement>(null);

  const bookingsForDay = useMemo(
    () => filteredBookings.filter((b) => isSameDate(b.start_time, selectedDate)),
    [filteredBookings, selectedDate]
  );

  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
    (_, i) => DAY_START_HOUR + i
  );

  function handleClickEmpty(e: React.MouseEvent) {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Which room column?
    const colWidth = rect.width / rooms.length;
    const roomIndex = Math.floor(x / colWidth);
    const room = rooms[roomIndex];
    if (!room) return;

    // Convert Y → time
    const minutes = (y / rect.height) * TOTAL_MINUTES;
    const startHour = DAY_START_HOUR + Math.floor(minutes / 60);
    const startMin = Math.floor(minutes % 60);

    const start = dayjs(selectedDate)
      .hour(startHour)
      .minute(startMin)
      .second(0)
      .toDate();

    const end = dayjs(start).add(1, "hour").toDate();

    onCreateBooking({
      roomId: room.id,
      start,
      end,
    });
  }

  return (
    <section className="w-full">
      <div className="w-full flex select-none" ref={timelineRef}>
        {/* LEFT TIME BAR */}
        <div className="w-[60px] relative h-[600px] border-r border-secondary-200 bg-white">
          {hours.map((hour) => {
            const top = ((hour - DAY_START_HOUR) * 60) / TOTAL_MINUTES * 100;
            return (
              <div
                key={hour}
                className="absolute left-2 text-xs text-primary-600"
                style={{ top: `${top}%`, transform: "translateY(-50%)" }}
              >
                {hour}:00
              </div>
            );
          })}
        </div>

        {/* MAIN GRID */}
        <div
          className="relative flex-1 h-[600px] border border-secondary-200 rounded-lg overflow-hidden flex cursor-pointer"
          onClick={handleClickEmpty}
        >
          {/* Column backgrounds */}
          <div className="absolute inset-0 flex z-10">
            {rooms.map((_, i) => (
              <div
                key={i}
                className={`flex-1 ${
                  i % 2 === 0 ? "bg-secondary-200" : "bg-secondary-300"
                }`}
              />
            ))}
          </div>

          {/* Hour lines */}
          <div className="absolute inset-0 z-20">
            {hours.map((hour) => {
              const top = ((hour - DAY_START_HOUR) * 60) / TOTAL_MINUTES * 100;
              return (
                <div
                  key={hour}
                  className="absolute left-0 w-full border-t border-primary-600/20"
                  style={{ top: `${top}%` }}
                />
              );
            })}
          </div>

          {/* Room labels */}
          <div className="absolute inset-x-0 top-0 flex z-30">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex-1 text-center py-1 font-semibold"
              >
                {room.room_name}
              </div>
            ))}
          </div>

          {/* Bookings */}
          <div className="absolute inset-0 flex z-50 pointer-events-none">
            {rooms.map((room, roomIndex) => {
              const roomBookings = bookingsForDay.filter(
                (b) => b.room_id === room.id
              );

              return (
                <div key={room.id} className="flex-1 relative min-w-[140px]">
                  {roomBookings.map((b) => {
                    const start = new Date(b.start_time);
                    const end = new Date(b.end_time);

                    const topPercent = Math.max(
                      0,
                      (getMinutesSinceStart(start) / TOTAL_MINUTES) * 100
                    );

                    const heightPercent =
                      (Math.max(5, getDurationMinutes(start, end)) /
                        TOTAL_MINUTES) *
                      100;

                    return (
                      <div
                        key={b.id}
                        className="absolute left-[10%] right-[10%] bg-status-booked text-main px-4 py-2 rounded-md shadow-md text-sm pointer-events-none"
                        style={{
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                        }}
                      >
                        {b.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
