"use client";

import { useBookingContext } from "@/context/BookingContext";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { TimelineCurrentTime } from "@/components/booking/TimelineCurrentTime";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

export function BookingTimeline({
  onCreateBooking,
}: {
  onCreateBooking: (data: { roomId: string; start: Date; end: Date }) => void;
}) {
  // ------------------- ALL HOOKS MUST BE HERE (TOP OF FUNCTION) -------------------
  const { rooms, filteredBookings, selectedDate } = useBookingContext();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const bookingsForDay = useMemo(() => {
    if (!selectedDate) return [];
    return filteredBookings.filter((b) =>
      dayjs(b.start_time).isSame(dayjs(selectedDate), "day")
    );
  }, [filteredBookings, selectedDate]);

  const hours = useMemo(
    () =>
      Array.from(
        { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
        (_, i) => DAY_START_HOUR + i
      ),
    []
  );

  // ------------------- 📌 EARLY RETURN AFTER ALL HOOKS -------------------
  if (!selectedDate) {
    return (
      <div className="text-center text-primary-600 py-10">
        Vælg en dato for at se tidsplanen.
      </div>
    );
  }

  // ------------------- RESTEN AF DIT UI -------------------

  function handleClickEmpty(e: React.MouseEvent) {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colWidth = rect.width / rooms.length;
    const roomIndex = Math.floor(x / colWidth);
    const room = rooms[roomIndex];
    if (!room) return;

    const minutes = (y / rect.height) * TOTAL_MINUTES;
    const startHour = DAY_START_HOUR + Math.floor(minutes / 60);
    const startMin = Math.floor(minutes % 60);

    const start = dayjs(selectedDate)
      .hour(startHour)
      .minute(startMin)
      .second(0)
      .toDate();

    const end = dayjs(start).add(1, "hour").toDate();

    onCreateBooking({ roomId: room.id, start, end });
  }

  const nowMinutes =
    (dayjs().hour() - DAY_START_HOUR) * 60 + dayjs().minute();
  const nowTopPercent = (nowMinutes / TOTAL_MINUTES) * 100;

  return (
    <section className="w-full">
      <div className="w-full flex select-none" ref={timelineRef}>
        
        {/* LEFT HOURS COLUMN */}
        <div className="w-[60px] relative h-[600px] border-r border-secondary-200 bg-white">
          {hours.map((hour) => {
            const top =
              ((hour - DAY_START_HOUR) * 60) / TOTAL_MINUTES * 100;
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
          {/* Backdrop colors */}
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
              const top =
                ((hour - DAY_START_HOUR) * 60) / TOTAL_MINUTES * 100;
              return (
                <div
                  key={hour}
                  className="absolute left-0 w-full border-t border-primary-600/20"
                  style={{ top: `${top}%` }}
                />
              );
            })}
          </div>

          {/* Room names */}
          <div className="absolute inset-x-0 top-0 flex z-30 bg-white/40 backdrop-blur-sm">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex-1 text-center py-1 font-semibold"
              >
                {room.room_name}
              </div>
            ))}
          </div>

          {/* Red time line */}
          {dayjs().isSame(selectedDate, "day") &&
            nowTopPercent >= 0 &&
            nowTopPercent <= 100 && (
              <TimelineCurrentTime topPercent={nowTopPercent} />
            )}

          {/* Bookings */}
          <div className="absolute inset-0 flex z-50 pointer-events-none">
            {rooms.map((room) => {
              const roomBookings = bookingsForDay.filter(
                (b) => b.room_id === room.id
              );

              return (
                <div key={room.id} className="flex-1 relative">
                  {roomBookings.map((b) => {
                    const start = new Date(b.start_time);
                    const end = new Date(b.end_time);

                    const topPercent =
                      (dayjs(start).diff(
                        dayjs(selectedDate)
                          .hour(DAY_START_HOUR)
                          .minute(0),
                        "minute"
                      ) /
                        TOTAL_MINUTES) *
                      100;

                    const heightPercent =
                      (dayjs(end).diff(dayjs(start), "minute") /
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
