"use client";

import { useMemo, useRef } from "react";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;
const MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

// Hver time = 60px i højden
const PX_PER_MINUTE = 1; // 1 minut = 1px → 60min = 60px height
type BookingTimelineProps = {
    onCreateBooking: (data: {
        roomId: string;
        start: Date;
        end: Date;
    }) => void;
};

export function BookingTimeline({ onCreateBooking }: BookingTimelineProps) {

    const { rooms, filteredBookings, selectedDate } = useBookingContext();
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
            <div className="text-center text-gray-600 py-10">
                Vælg en dato for at se tidsplanen.
            </div>
        );
    }

    // Hjælpere
    function minutesToPx(min: number) {
        return min * PX_PER_MINUTE;
    }

    function dateToMinuteOffset(date: Date) {
        return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
    }

    // Klik i grid
    function handleClick(e: React.MouseEvent<HTMLDivElement>) {
        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const timeColWidth = 70; // Tidskolonne bredde

        if (x < timeColWidth) return;

        const colWidth = (rect.width - timeColWidth) / rooms.length;
        const roomIndex = Math.floor((x - timeColWidth) / colWidth);
        const room = rooms[roomIndex];
        if (!room) return;

        const minuteOffset = Math.max(
            0,
            Math.min(MINUTES, y / PX_PER_MINUTE)
        );

        const startHour = DAY_START_HOUR + Math.floor(minuteOffset / 60);
        const startMin = Math.floor(minuteOffset % 60);

        const start = dayjs(selectedDate)
            .hour(startHour)
            .minute(startMin)
            .second(0)
            .toDate();

        const end = dayjs(start).add(1, "hour").toDate();

        onCreateBooking({ roomId: room.id, start, end });
    }

    // Aktuel tid -> rød linje
    const now = dayjs();
    const showNow = now.isSame(dayjs(selectedDate), "day");
    const nowOffset =
        (now.hour() - DAY_START_HOUR) * 60 + now.minute();

    const nowTop =
        nowOffset >= 0 && nowOffset <= MINUTES
            ? minutesToPx(nowOffset)
            : null;

    return (
        <div>
            {/* TOP HEADER MED ROOM NAVNE */}
            <div
                className="grid border border-gray-300 rounded-t-lg overflow-hidden bg-gray-100"
                style={{
                    gridTemplateColumns: `70px repeat(${rooms.length}, 1fr)`,
                }}
            >
                {/* Tom tidskolonne */}
                <div className="bg-gray-100"></div>

                {/* Rooms */}
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className="text-center py-2 font-semibold text-gray-800 border-l border-gray-300"
                    >
                        {room.room_name}
                    </div>
                ))}
            </div>

            {/* TIME GRID */}
            <div
                ref={timelineRef}
                className="grid border border-t-0 border-gray-300 bg-[#d4dcf4] cursor-pointer rounded-b-lg relative"
                style={{
                    gridTemplateColumns: `70px repeat(${rooms.length}, 1fr)`,
                    height: `${MINUTES * PX_PER_MINUTE}px`,
                }}
                onClick={handleClick}
            >
                {/* TIDSKOLONNE (VENSTRE) */}
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

                {/* BOOKING-KOLONNER */}
                {rooms.map((room) => {
                    const roomBookings = filteredBookings.filter(
                        (b) => b.room_id === room.id
                    );

                    return (
                        <div
                            key={room.id}
                            className="relative border-l border-gray-300 bg-transparent"
                        >
                            {/* HOUR LINES */}
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

                            {/* BOOKING BLOBS */}
                            {roomBookings.map((b) => {
                                const s = new Date(b.start_time);
                                const e = new Date(b.end_time);
                                const sMin = dateToMinuteOffset(s);
                                const eMin = dateToMinuteOffset(e);

                                const top = minutesToPx(sMin);
                                const height = minutesToPx(eMin - sMin);

                                return (
                                    <div
                                        key={b.id}
                                        className="absolute left-[10%] right-[10%] bg-red-400 text-white text-xs rounded-md px-2 py-1 shadow-md overflow-hidden"
                                        style={{
                                            top: `${top}px`,
                                            height: `${height}px`,
                                        }}
                                    >
                                        {b.title || "Booking"}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                {/* RØD NU-LINJE */}
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
