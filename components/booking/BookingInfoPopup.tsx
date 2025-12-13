/**
 * BookingInfoPopup.tsx
 * 
 * FORMÅL:
 * Lille flydende popup-vindue der viser detaljeret information om en booking.
 * Vises når bruger klikker på en booking-blok i timeline-viewet.
 * 
 * FUNKTIONALITET:
 * 1. VISNING:
 *    - Booking titel
 *    - Lokale navn
 *    - Bruger navn (booking-ejer)
 *    - Start og slut tidspunkt (formateret som HH:mm)
 * 
 * 2. POSITIONERING:
 *    - Placeres ved klik-koordinater (x, y)
 *    - Lille offset (8px) fra klik-punktet for at undgå overlap
 *    - Position er absolut relativt til timeline container
 * 
 * 3. INTERAKTION:
 *    - Luk-knap i øverste højre hjørne (× symbol)
 *    - Automatisk lukning når bruger klikker uden for popup
 *    - Event listener tilføjes ved mount og fjernes ved unmount
 * 
 * STYLING:
 * - Hvid baggrund med border og shadow for elevation
 * - Fast bredde (256px = 16rem = w-64)
 * - Afrundede hjørner og padding
 * - Høj z-index (9999) for at være over alt andet indhold
 */

"use client";

import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

/**
 * Props for BookingInfoPopup komponenten
 */
type BookingInfoPopupProps = {
  /** Booking objektet med titel, start_time, end_time etc. */
  booking: any;
  /** Fulde navn på booking-ejeren */
  ownerName: string;
  /** Navn på det lokale hvor bookingen er */
  roomName: string;
  /** X-koordinat (vandret) for popup placering i pixels */
  x: number;
  /** Y-koordinat (lodret) for popup placering i pixels */
  y: number;
  /** Callback der kaldes når popup skal lukkes */
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
  // Reference til popup DOM-element (bruges til "klik udenfor" detection)
  const ref = useRef<HTMLDivElement | null>(null);

  /**
   * Effect hook til at håndtere "klik udenfor" funktionalitet.
   * 
   * LOGIK:
   * 1. Når popup åbnes, tilføj global mousedown listener
   * 2. Ved hvert klik, tjek om klik er inden for popup
   * 3. Hvis klik er udenfor, kald onClose
   * 4. Ved unmount, fjern listener (cleanup)
   * 
   * DEPENDENCIES:
   * - onClose: Callback genskabes hvis den ændres
   */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Tjek om klik er udenfor popup elementet
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Tilføj listener til hele dokumentet
    document.addEventListener("mousedown", handleClick);
    // Cleanup: Fjern listener ved unmount
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-9999 bg-white border border-secondary-200 shadow-lg rounded-lg p-3 w-64"
      style={{
        // Positioner popup med lille offset fra klik-punkt
        // Dette forhindrer at popup overlapper med musepegeren
        top: y + 8,
        left: x + 8,
      }}
    >
      {/* 
        LUK-KNAP:
        × symbol i øverste højre hjørne.
        Hover effekt ændrer farve fra grå til sort.
      */}
      <button
        onClick={onClose}
        className="absolute top-1 right-1 text-sm text-gray-500 hover:text-black"
      >
        ×
      </button>

      {/* 
        BOOKING INFORMATION:
        Lodret layout med alle booking detaljer.
        Gap mellem elementer for god læsbarhed.
      */}
      <div className="flex flex-col gap-1 text-sm text-main">
        {/* Booking titel (fed og med margin under) */}
        <div className="font-semibold text-main mb-1">
          {booking.title || t("booking.notitle")}
        </div>

        {/* Lokale navn */}
        <div className="text-secondary-700">
          <strong>{t("booking.room")}:</strong> {roomName}
        </div>

        {/* Booking ejer (bruger navn) */}
        <div className="text-secondary-700">
          <strong>{t("admin.user")}:</strong> {ownerName}
        </div>

        {/* 
          Tidspunkt (start - slut):
          Formateret som timer:minutter (HH:mm)
          Linjeskift mellem label og tidspunkt for bedre layout
        */}
        <div className="text-secondary-700">
          <strong>{t("booking.time")}:</strong>
          <br />
          {dayjs(booking.start_time).format("HH:mm")} –{" "}
          {dayjs(booking.end_time).format("HH:mm")}
        </div>
      </div>
    </div>
  );
}
