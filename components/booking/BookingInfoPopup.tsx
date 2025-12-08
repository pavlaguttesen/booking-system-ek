"use client";

// Lille flydende infoboks til booking-information.

import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

type BookingInfoPopupProps = {
  booking: any;
  ownerName: string;
  roomName: string;
  // pixel koordinater fra timeline
  x: number;
  y: number;
  onClose: () => void;
};

export default function BookingInfoPopup({
  booking,
  ownerName,
  roomName,
  x,
  y,
  onClose,
}: BookingInfoPopupProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement | null>(null);

  // Luk hvis man klikker udenfor
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-9999 bg-white border border-secondary-200 shadow-lg rounded-lg p-3 w-64"
      style={{
        top: y + 8,
        left: x + 8,
      }}
    >
      {/* Luk-knap */}
      <button
        onClick={onClose}
        className="absolute top-1 right-1 text-sm text-gray-500 hover:text-black"
      >
        ×
      </button>

      <div className="flex flex-col gap-1 text-sm text-main">
        <div className="font-semibold text-main mb-1">
          {booking.title || "Booking"}
        </div>

        <div className="text-secondary-700">
          <strong>{t("booking.room")}:</strong> {roomName}
        </div>

        <div className="text-secondary-700">
          <strong>{t("admin.user")}:</strong> {ownerName}
        </div>

        <div className="text-secondary-700">
          <strong>Tid:</strong>
          <br />
          {dayjs(booking.start_time).format("HH:mm")} –{" "}
          {dayjs(booking.end_time).format("HH:mm")}
        </div>
      </div>
    </div>
  );
}
