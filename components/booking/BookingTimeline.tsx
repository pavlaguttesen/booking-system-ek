"use client";

// Dansk kommentar: Timeline med visualisering af bookinger,
// grå fortid, afrunding til kvarter og kliklogik med overlap-stop.

import { useMemo, useRef } from "react";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";

import "./BookingTimeline.css";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;
const MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

const PX_PER_MINUTE = 1;

const TOP_MARGIN = 16;
const BOTTOM_MARGIN = 16;

const TIME_COL_WIDTH = 55;

type BookingTimelineProps = {
  onCreateBooking: (data: { roomId: string; start: Date; end: Date }) => void;
  onDeleteBooking?: (booking: any) => void;
};

export function BookingTimeline({
  onCreateBooking,
  onDeleteBooking,
}: BookingTimelineProps) {
  const { filteredRooms, filteredBookings, profiles, selectedDate } =
    useBookingContext();
  const { user, role } = useAuth();

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

  // Forbud mod fortidens dato
  if (selected.isBefore(today, "day")) {
    return (
      <div className="text-center py-14 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-main text-lg font-semibold">
          Du kan ikke booke lokaler for tidligere datoer
        </p>
      </div>
    );
  }

  // For sent på dagen
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

  // Ingen rum matcher
  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-lg font-semibold text-main">
          Ingen rum matcher dine filtre
        </p>
      </div>
    );
  }

  // Omregning
  function minutesToPx(min: number) {
    return min * PX_PER_MINUTE;
  }

  function dateToMinuteOffset(date: Date) {
    return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
  }

  // Afrund til nærmeste kvarter
  function roundToQuarter(mins: number) {
    return Math.round(mins / 15) * 15;
  }

  // Hent næste booking
  function getNextBooking(roomId: string, start: dayjs.Dayjs) {
    const bookings = filteredBookings
      .filter((b) => b.room_id === roomId)
      .map((b) => ({
        s: dayjs(b.start_time),
        e: dayjs(b.end_time),
      }));

    return bookings.find((b) => b.s.isAfter(start));
  }

  // Klik logik
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y < TOP_MARGIN) return;
    if (y > TOP_MARGIN + minutesToPx(MINUTES)) return;
    if (x < TIME_COL_WIDTH) return;

    const colWidth = (rect.width - TIME_COL_WIDTH) / filteredRooms.length;
    const roomIndex = Math.floor((x - TIME_COL_WIDTH) / colWidth);
    const room = filteredRooms[roomIndex];
    if (!room) return;

    const minuteOffset = (y - TOP_MARGIN) / PX_PER_MINUTE;

    const rawStartMin =
      DAY_START_HOUR * 60 + minuteOffset - DAY_START_HOUR * 60;

    const roundedStart = roundToQuarter(rawStartMin);

    const start = selected.hour(DAY_START_HOUR).minute(roundedStart);

    if (selected.isSame(today, "day") && start.isBefore(today)) return;

    let end = start.add(60, "minute");

    const next = getNextBooking(room.id, start);
    if (next && end.isAfter(next.s)) {
      end = next.s;
    }

    onCreateBooking({
      roomId: room.id,
      start: start.toDate(),
      end: end.toDate(),
    });
  }

  const now = dayjs();
  const showNow = selected.isSame(now, "day");
  const nowOffsetMinutes = (now.hour() - DAY_START_HOUR) * 60 + now.minute();

  const nowTop =
    nowOffsetMinutes >= 0 && nowOffsetMinutes <= MINUTES
      ? TOP_MARGIN + minutesToPx(nowOffsetMinutes)
      : null;

  return (
    <div>
      {/* Header */}
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
        {/* Fortid grået ud */}
        {showNow && (
          <div
            className="absolute left-0 right-0 bg-black/15 pointer-events-none"
            style={{
              top: TOP_MARGIN,
              height: minutesToPx(nowOffsetMinutes),
            }}
          />
        )}

        {/* Hatch zones */}
        <div
          className="diagonal-hatch pointer-events-none"
          style={{ top: 0, height: TOP_MARGIN }}
        />
        <div
          className="diagonal-hatch pointer-events-none"
          style={{ bottom: 0, height: BOTTOM_MARGIN }}
        />

        {/* Time labels */}
        <div className="relative bg-white">
          {hours.map((hour) => {
            const top = TOP_MARGIN + minutesToPx((hour - DAY_START_HOUR) * 60);
            return (
              <div
                key={hour}
                className="absolute w-full text-xs text-gray-700 flex items-center justify-center"
                style={{ top, transform: "translateY(-50%)" }}
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
              {/* Grid lines */}
              {hours.map((hour) => {
                const top =
                  TOP_MARGIN + minutesToPx((hour - DAY_START_HOUR) * 60);
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

                const owner = profiles.find((p) => p.id === b.user_id);
                const isOwner = user?.id === b.user_id;
                const canDelete =
                  (isOwner || role === "admin") && onDeleteBooking;

                return (
                  <div
                    key={b.id}
                    className="absolute inset-x-0 mx-[10%] bg-status-booked text-invert text-xs rounded-md px-2 py-1 shadow-md overflow-hidden"
                    style={{
                      top: TOP_MARGIN + minutesToPx(sMin),
                      height: minutesToPx(eMin - sMin),
                    }}
                  >
                    {/* Titel */}
                    <div className="font-semibold truncate">
                      {b.title || "Booking"}
                    </div>

                    {/* Booker */}
                    <div className="text-[10px] opacity-90">
                      {owner?.full_name || "Ukendt"}
                    </div>

                    {/* Tid */}
                    <div className="text-[10px] mt-1 opacity-90">
                      {dayjs(s).format("HH:mm")} – {dayjs(e).format("HH:mm")}
                    </div>

                    {/* DELETE KNAP */}
                    {canDelete && (
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onDeleteBooking(b);
                        }}
                        className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center 
                                   rounded-full bg-white text-red-600 text-[10px] font-bold
                                   shadow-md cursor-pointer hover:bg-gray-100"
                        style={{ zIndex: 50 }}
                      >
                        ×
                      </button>
                    )}
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
