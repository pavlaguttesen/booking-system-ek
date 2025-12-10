"use client";
// Timeline med rolle-baserede begrænsninger:
// Studerende kan kun klikke i studierum
// Undervisere kan IKKE klikke i studierum
// Admin kan klikke i alle rum
// "Møderum" → "studierum"

import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

import BookingInfoPopup from "./BookingInfoPopup";
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

// Normalisering: møderum → studierum
function normalizeType(type: string | null): string | null {
  if (!type) return null;
  if (type === "møderum") return "studierum";
  return type;
}

export function BookingTimeline({
  onCreateBooking,
  onDeleteBooking,
}: BookingTimelineProps) {
  const { t } = useTranslation();
  const { filteredRooms, filteredBookings, profiles, selectedDate } =
    useBookingContext();
  const { user, role } = useAuth();

  // Rolle → tilladte typer
  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  function roleCanBook(roomType: string | null): boolean {
    const t = normalizeType(roomType);
    return allowedTypesForRole[role ?? "student"].includes(t || "");
  }

  const timelineRef = useRef<HTMLDivElement | null>(null);

  const [infoPopups, setInfoPopups] = useState<
    { id: string; booking: any; x: number; y: number }[]
  >([]);

  const hours = useMemo(
    () =>
      Array.from(
        { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
        (_, i) => DAY_START_HOUR + i
      ),
    []
  );

  // Sortér rum korrekt
  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      const fa = a.floor ?? 0;
      const fb = b.floor ?? 0;

      if (fa !== fb) return fa - fb;

      const pa = a.room_name.split(".").map(Number);
      const pb = b.room_name.split(".").map(Number);

      if (pa[1] !== pb[1]) return pa[1] - pb[1];
      return pa[2] - pb[2];
    });
  }, [filteredRooms]);

  if (!selectedDate) {
    return (
      <div className="text-center py-10 text-main text-lg">
        {t("booking.selectdatefortimeline")}
      </div>
    );
  }

  const today = dayjs();
  const selected = dayjs(selectedDate);

  if (selected.isBefore(today, "day")) {
    return (
      <div className="text-center py-12 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-main text-lg font-semibold">
          {t("booking.earlybooking")}
        </p>
      </div>
    );
  }

  if (selected.isSame(today, "day") && today.hour() >= DAY_END_HOUR) {
    return (
      <div className="text-center py-14 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-main text-lg font-semibold">
          {t("booking.todaytimeexpired")}
        </p>
        <p className="text-main/70 text-sm mt-1">{t("booking.selectupcomingday")}</p>
      </div>
    );
  }

  if (sortedRooms.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-lg font-semibold text-main">
          {t("booking.noroomsmatchfilters")}
        </p>
      </div>
    );
  }

  //----------------------------------------
  // Hjælpefunktioner
  //----------------------------------------

  function minutesToPx(min: number) {
    return min * PX_PER_MINUTE;
  }

  function dateToMinuteOffset(date: Date) {
    return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
  }

  function roundToQuarter(mins: number) {
    return Math.round(mins / 15) * 15;
  }

  function getNextBooking(roomId: string, start: dayjs.Dayjs) {
    const bookings = filteredBookings
      .filter((b) => b.room_id === roomId)
      .map((b) => ({
        s: dayjs(b.start_time),
        e: dayjs(b.end_time),
      }));

    return bookings.find((b) => b.s.isAfter(start));
  }

  //----------------------------------------
  // Håndtering af klik i timeline → opret booking
  //----------------------------------------

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Klik skal ligge i selve tidsområdet
    if (y < TOP_MARGIN || y > TOP_MARGIN + minutesToPx(MINUTES)) return;
    if (x < TIME_COL_WIDTH) return;

    // Hvilket rum klikkes der på?
    const colWidth = (rect.width - TIME_COL_WIDTH) / sortedRooms.length;
    const roomIndex = Math.floor((x - TIME_COL_WIDTH) / colWidth);
    const room = sortedRooms[roomIndex];
    if (!room) return;

    const type = normalizeType(room.room_type);

    // Rolle-baseret begrænsning
    if (!roleCanBook(type)) {
      return;
    }

    const minuteOffset = (y - TOP_MARGIN) / PX_PER_MINUTE;
    const rawStartMin =
      DAY_START_HOUR * 60 + minuteOffset - DAY_START_HOUR * 60;

    const roundedStart = roundToQuarter(rawStartMin);
    let start = selected.hour(DAY_START_HOUR).minute(roundedStart);

    const todayDayjs = dayjs();
    if (selected.isSame(todayDayjs, "day") && start.isBefore(todayDayjs)) {
      return;
    }

    const hardEnd = selected.hour(DAY_END_HOUR).minute(0);

    // Hvis start er efter eller lig med slut-tid → ingen booking
    if (start.isSame(hardEnd) || start.isAfter(hardEnd)) {
      return;
    }

    // Default varighed = 60 minutter
    let end = start.add(60, "minute");

    // Må ikke gå efter dagens sluttid
    if (end.isAfter(hardEnd)) {
      end = hardEnd;
    }

    // Må ikke gå efter næste booking
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

  //----------------------------------------
  //   TEGNING
  //----------------------------------------

  return (
    <div className="relative">
      {/* Header */}
      <div
        className="grid border border-gray-300 rounded-t-lg bg-gray-100"
        style={{
          gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${sortedRooms.length}, 1fr)`,
        }}
      >
        <div></div>
        {sortedRooms.map((room) => {
          const normalizedType = normalizeType(room.room_type);
          const blocked = !roleCanBook(normalizedType);

          return (
            <div
              key={room.id}
              className={`text-center py-2 font-semibold border-l border-gray-300 
              ${blocked ? "text-gray-400 bg-gray-200" : "text-gray-800"}`}
            >
              {room.room_name}
            </div>
          );
        })}
      </div>

      {/* TIMELINE */}
      <div
        ref={timelineRef}
        className="booking-timeline grid border border-t-0 border-gray-300 bg-[#d4dcf4] cursor-pointer rounded-b-lg relative"
        style={{
          gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${sortedRooms.length}, 1fr)`,
          height: TOP_MARGIN + minutesToPx(MINUTES) + BOTTOM_MARGIN,
        }}
        onClick={handleClick}
      >
        {/* Fortid */}
        {showNow && (
          <div
            className="absolute left-0 right-0 bg-black/15 pointer-events-none"
            style={{
              top: TOP_MARGIN,
              height: minutesToPx(nowOffsetMinutes),
            }}
          />
        )}

        {/* Hatch top/bund */}
        <div
          className="diagonal-hatch pointer-events-none"
          style={{ top: 0, height: TOP_MARGIN }}
        />
        <div
          className="diagonal-hatch pointer-events-none"
          style={{ bottom: 0, height: BOTTOM_MARGIN }}
        />

        {/* Tid */}
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
        {sortedRooms.map((room) => {
          const normalizedType = normalizeType(room.room_type);
          const blocked = !roleCanBook(normalizedType);

          const roomBookings = filteredBookings.filter(
            (b) => b.room_id === room.id
          );

          return (
            <div
              key={room.id}
              className={`relative border-l border-gray-300 ${
                blocked ? "bg-gray-200 cursor-not-allowed" : "bg-transparent"
              }`}
            >
              {/* Gridlinjer */}
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
                    className="absolute inset-x-0 mx-[10%] bg-status-booked text-invert text-xs rounded-md px-2 py-1 shadow-md overflow-hidden cursor-pointer"
                    style={{
                      top: TOP_MARGIN + minutesToPx(sMin),
                      height: minutesToPx(eMin - sMin),
                    }}
                    onClick={(ev) => {
                      ev.stopPropagation();

                      const rect = timelineRef.current?.getBoundingClientRect();
                      const clickX = ev.clientX - (rect?.left ?? 0);
                      const clickY = ev.clientY - (rect?.top ?? 0);

                      setInfoPopups((prev) => [
                        ...prev,
                        {
                          id: b.id + "-" + Date.now(),
                          booking: b,
                          x: clickX,
                          y: clickY,
                        },
                      ]);
                    }}
                  >
                    <div className="font-semibold truncate">
                      {b.title || t("booking.notitle")}
                    </div>

                    <div className="text-[10px] opacity-90">
                      {owner?.full_name || t("booking.unknown")}
                    </div>

                    <div className="text-[10px] mt-1 opacity-90">
                      {dayjs(s).format("HH:mm")} – {dayjs(e).format("HH:mm")}
                    </div>

                    {canDelete && (
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onDeleteBooking?.(b);
                        }}
                        className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center 
                        rounded-full bg-white text-red-600 text-[10px] font-bold shadow-md hover:bg-gray-100"
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
            style={{ top: nowTop }}
          />
        )}

        {/* Info-popups */}
        {infoPopups.map((p) => {
          const owner = profiles.find((pr) => pr.id === p.booking.user_id);
          const room = sortedRooms.find((r) => r.id === p.booking.room_id);

          return (
            <BookingInfoPopup
              key={p.id}
              booking={p.booking}
              ownerName={owner?.full_name ?? t("booking.unknown")}
              roomName={room?.room_name ?? t("booking.unknownlocation")}
              x={p.x}
              y={p.y}
              onClose={() =>
                setInfoPopups((prev) => prev.filter((i) => i.id !== p.id))
              }
            />
          );
        })}
      </div>
    </div>
  );
}
