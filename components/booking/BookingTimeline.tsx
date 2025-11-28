"use client";

// Rød tidslinje der viser nuværende tidspunkt i timeline.
// Vises kun hvis valgt dato = i dag.

import { useMemo, useRef } from "react";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";

import "./BookingTimeline.css"; // ← CSS til skrå striber

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;
const MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

const PX_PER_MINUTE = 1;

// Visuelle marginer i top og bund
const TOP_MARGIN = 16;
const BOTTOM_MARGIN = 16;

// Ny smallere tidskolonne
const TIME_COL_WIDTH = 55;

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

  // 📌 Dato før i dag → ikke tilladt
  if (selected.isBefore(today, "day")) {
    return (
      <div className="text-center py-14 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-main text-lg font-semibold">
          Du kan ikke booke lokaler for tidligere datoer
        </p>
      </div>
    );
  }

  // 📌 Hvis klokken er efter lukketid
  if (selected.isSame(today, "day") && today.hour() >= DAY_END_HOUR) {
    return (
      <div className="text-center py-14 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-main text-lg font-semibold">
          Du kan ikke booke lokaler for i dag længere
        </p>
        <p className="text-main/70 text-sm mt-1">Prøv en kommende dag.</p>
      </div>
    );
  }

  // 📌 Ingen rum matcher filtrene
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

  /* -------------------------------------------------------
     Klik på timeline
  ------------------------------------------------------- */
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!timelineRef.current) return;

    const now = dayjs();
    const rect = timelineRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Klik i hatch-zoner → ignorér
    if (y < TOP_MARGIN) return;
    if (y > TOP_MARGIN + minutesToPx(MINUTES)) return;

    // Brug ny smallere timespalte
    if (x < TIME_COL_WIDTH) return;

    const colWidth = (rect.width - TIME_COL_WIDTH) / filteredRooms.length;
    const roomIndex = Math.floor((x - TIME_COL_WIDTH) / colWidth);
    const room = filteredRooms[roomIndex];
    if (!room) return;

    const minuteOffset = (y - TOP_MARGIN) / PX_PER_MINUTE;
    const startHour = DAY_START_HOUR + Math.floor(minuteOffset / 60);
    const startMin = Math.floor(minuteOffset % 60);

    const start = selected.hour(startHour).minute(startMin).second(0);

    // Må ikke klikke i fortiden
    if (selected.isSame(now, "day") && start.isBefore(now)) return;

    const end = start.add(1, "hour").toDate();

    onCreateBooking({
      roomId: room.id,
      start: start.toDate(),
      end,
    });
  }

  /* -------------------------------------------------------
     NU-linje
  ------------------------------------------------------- */
  const now = dayjs();
  const showNow = selected.isSame(now, "day");
  const nowOffsetMinutes =
    (now.hour() - DAY_START_HOUR) * 60 + now.minute();

  const nowTop =
    nowOffsetMinutes >= 0 && nowOffsetMinutes <= MINUTES
      ? TOP_MARGIN + minutesToPx(nowOffsetMinutes)
      : null;

  /* -------------------------------------------------------
     RENDER TIMELINE
  ------------------------------------------------------- */
  return (
    <div>
      {/* Header med rum */}
      <div
        className="grid border border-gray-300 rounded-t-lg overflow-hidden bg-gray-100"
        style={{
          gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${filteredRooms.length}, 1fr)`,
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

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="booking-timeline grid border border-t-0 border-gray-300 bg-[#d4dcf4] cursor-pointer rounded-b-lg relative"
        style={{
          gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${filteredRooms.length}, 1fr)`,
          height: TOP_MARGIN + minutesToPx(MINUTES) + BOTTOM_MARGIN,
        }}
        onClick={handleClick}
      >
        {/* 🔥 Skrå hatch-zoner */}
        <div
          className="diagonal-hatch pointer-events-none"
          style={{
            top: 0,
            height: TOP_MARGIN,
          }}
        />

        <div
          className="diagonal-hatch pointer-events-none"
          style={{
            bottom: 0,
            height: BOTTOM_MARGIN,
          }}
        />

        {/* Time labels */}
        <div className="relative bg-white">
          {hours.map((hour) => {
            const top = TOP_MARGIN + minutesToPx((hour - DAY_START_HOUR) * 60);
            return (
              <div
                key={hour}
                className="absolute w-full text-xs text-gray-700 flex items-center justify-center"
                style={{
                  top,
                  transform: "translateY(-50%)",
                }}
              >
                {hour}:00
              </div>
            );
          })}
        </div>

        {/* Rumkolonner */}
        {filteredRooms.map((room) => {
          const roomBookings = filteredBookings.filter(
            (b) => b.room_id === room.id
          );

          return (
            <div
              key={room.id}
              className="relative border-l border-gray-300 bg-transparent"
            >
              {/* Gridlines */}
              {hours.map((hour) => {
                const top = TOP_MARGIN + minutesToPx((hour - DAY_START_HOUR) * 60);
                return (
                  <div
                    key={hour}
                    className="absolute left-0 w-full border-t border-black/10"
                    style={{ top }}
                  />
                );
              })}

              {/* Bookinger */}
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
                      top: TOP_MARGIN + minutesToPx(sMin),
                      height: minutesToPx(eMin - sMin),
                    }}
                  >
                    {b.title || "Booking"}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* NU-linje */}
        {showNow && nowTop !== null && (
          <div
            className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none"
            style={{ top: nowTop, zIndex: 50 }}
          />
        )}
      </div>
    </div>
  );
}
