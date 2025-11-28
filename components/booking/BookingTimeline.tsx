"use client";

import { useMemo, useRef } from "react";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;
const MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

const PX_PER_MINUTE = 1;

type BookingTimelineProps = {
  onCreateBooking: (data: {
    roomId: string;
    start: Date;
    end: Date;
  }) => void;
};

export function BookingTimeline({ onCreateBooking }: BookingTimelineProps) {
  const { filteredRooms, filteredBookings, selectedDate } = useBookingContext();
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const hours = useMemo(
    () =>
      Array.from(
        { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
        (_, i) => DAY_START_HOUR + i
      ),
    []
  );

  if (!selectedDate) {
    return (
      <div className="text-center py-10 text-main text-lg">
        Vælg en dato for at se tidsplanen.
      </div>
    );
  }

  const today = dayjs();
  const selected = dayjs(selectedDate);

  // 📌 Hvis valgt dato er før i dag → timeline er erstattet
  if (selected.isBefore(today, "day")) {
    return (
      <div className="text-center py-14 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-main text-lg font-semibold">
          Du kan ikke booke lokaler for tidligere datoer
        </p>
      </div>
    );
  }

  // 📌 Hvis valgt dato er i dag og klokken er efter lukketid
  if (
    selected.isSame(today, "day") &&
    today.hour() >= DAY_END_HOUR
  ) {
    return (
      <div className="text-center py-14 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-main text-lg font-semibold">
          Du kan ikke booke lokaler for i dag længere
        </p>
        <p className="text-main/70 text-sm mt-1">
          Prøv at vælge en kommende dag.
        </p>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-lg font-semibold text-main">
          Ingen rum matcher dine filtre
        </p>
        <p className="text-sm text-main/70 mt-1">
          Prøv at ændre dine filtervalg øverst.
        </p>
      </div>
    );
  }

  function minutesToPx(min: number) {
    return min * PX_PER_MINUTE;
  }

  function dateToMinuteOffset(date: Date) {
    return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
  }

  // 📌 OPDATERET: Klik blokerer fortid
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!timelineRef.current) return;

    const now = dayjs();

    // Hvis valgt dag er før nu → ingen klik
    if (selected.isBefore(now, "day")) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const timeColWidth = 70;
    if (x < timeColWidth) return;

    const colWidth = (rect.width - timeColWidth) / filteredRooms.length;
    const roomIndex = Math.floor((x - timeColWidth) / colWidth);
    const room = filteredRooms[roomIndex];
    if (!room) return;

    const minuteOffset = Math.max(0, Math.min(MINUTES, y / PX_PER_MINUTE));
    const startHour = DAY_START_HOUR + Math.floor(minuteOffset / 60);
    const startMin = Math.floor(minuteOffset % 60);

    const start = selected
      .hour(startHour)
      .minute(startMin)
      .second(0);

    // Hvis valgt dato er i dag og klik før nu → bloker klik
    if (selected.isSame(now, "day") && start.isBefore(now)) {
      return;
    }

    const end = start.add(1, "hour").toDate();

    onCreateBooking({
      roomId: room.id,
      start: start.toDate(),
      end,
    });
  }

  // Nu-linje
  const now = dayjs();
  const showNow = selected.isSame(now, "day");
  const nowOffset =
    (now.hour() - DAY_START_HOUR) * 60 + now.minute();

  const nowTop =
    nowOffset >= 0 && nowOffset <= MINUTES
      ? minutesToPx(nowOffset)
      : null;

  return (
    <div>
      <div
        className="grid border border-gray-300 rounded-t-lg overflow-hidden bg-gray-100"
        style={{
          gridTemplateColumns: `70px repeat(${filteredRooms.length}, 1fr)`,
        }}
      >
        <div></div>
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="text-center py-2 font-semibold text-gray-800 border-l border-gray-300"
          >
            {room.room_name}
          </div>
        ))}
      </div>

      <div
        ref={timelineRef}
        className="grid border border-t-0 border-gray-300 bg-[#d4dcf4] cursor-pointer rounded-b-lg relative"
        style={{
          gridTemplateColumns: `70px repeat(${filteredRooms.length}, 1fr)`,
          height: `${MINUTES * PX_PER_MINUTE}px`,
        }}
        onClick={handleClick}
      >
        <div className="relative bg-white">
          {hours.map((hour) => {
            const top = minutesToPx((hour - DAY_START_HOUR) * 60);
            return (
              <div
                key={hour}
                className="absolute left-2 text-xs text-gray-700"
                style={{
                  top: `${top}px`,
                  transform: "translateY(-50%)",
                }}
              >
                {hour}:00
              </div>
            );
          })}
        </div>

        {filteredRooms.map((room) => {
          const roomBookings = filteredBookings.filter(
            (b) => b.room_id === room.id
          );

          return (
            <div
              key={room.id}
              className="relative border-l border-gray-300 bg-transparent"
            >
              {hours.map((hour) => {
                const top = minutesToPx((hour - DAY_START_HOUR) * 60);
                return (
                  <div
                    key={hour}
                    className="absolute left-0 w-full border-t border-black/10"
                    style={{ top: `${top}px` }}
                  ></div>
                );
              })}

              {roomBookings.map((b) => {
                const s = new Date(b.start_time);
                const e = new Date(b.end_time);
                const sMin = dateToMinuteOffset(s);
                const eMin = dateToMinuteOffset(e);

                return (
                  <div
                    key={b.id}
                    className="absolute left-[10%] right-[10%] bg-status-booked text-invert text-xs rounded-md px-2 py-1 shadow-md overflow-hidden"
                    style={{
                      top: `${minutesToPx(sMin)}px`,
                      height: `${minutesToPx(eMin - sMin)}px`,
                    }}
                  >
                    {b.title || "Booking"}
                  </div>
                );
              })}
            </div>
          );
        })}

        {showNow && nowTop !== null && (
          <div
            className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none"
            style={{ top: `${nowTop}px`, zIndex: 50 }}
          ></div>
        )}
      </div>
    </div>
  );
}
