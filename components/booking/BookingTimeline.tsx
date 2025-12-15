/**
 * BookingTimeline.tsx
 * 
 * FORMÅL:
 * Hovedkomponent for den visuelle tidslinje-visning af bookinger.
 * Viser alle lokaler i kolonner med bookinger tegnet som farvede blokke på et tidsgitter.
 * 
 * FUNKTIONALITET:
 * 1. VISNING:
 *    - Vandret tidsaksel (8:00 - 16:00) til venstre
 *    - Lodret kolonne for hvert lokale
 *    - Bookinger vises som blokke med titel, bruger og tidspunkt
 *    - Nuværende tidspunkt markeres med rød linje (kun i dag)
 *    - Fortiden vises mørkere (kun i dag)
 * 
 * 2. INTERAKTION:
 *    - Klik på timeline opretter ny booking (hvis tilladt)
 *    - Klik på booking viser info-popup med detaljer
 *    - Slet-knap på egne bookinger (og admin kan slette alle)
 * 
 * 3. ROLLE-BASEREDE BEGRÆNSNINGER:
 *    - Studerende: Kan kun booke studierum
 *    - Undervisere: Kan kun booke klasseværelser og auditorier
 *    - Admin: Kan booke alle typer lokaler
 *    - Blokerede lokaler vises med grå baggrund
 * 
 * 4. TIDSBEREGNINGER:
 *    - Bookinger rundes til nærmeste 15 minutter
 *    - Default booking varighed: 60 minutter
 *    - Bookinger kan ikke overlappe eksisterende bookinger
 *    - Bookinger kan ikke strække sig uden for 8-16 tidsrammen
 *    - Kan ikke oprette bookinger i fortiden
 * 
 * GRID-SYSTEM:
 * - Hver time repræsenteres af 60 pixels (1 pixel = 1 minut)
 * - Top margin: 16px (plads til øverste gitterlinje)
 * - Bottom margin: 16px (plads til nederste gitterlinje)
 * - Tid kolonne bredde: 55px
 * - Lokale kolonner deler resten af bredden ligeligt
 */

"use client";

import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

import BookingInfoPopup from "./BookingInfoPopup";
import "./BookingTimeline.css";

// TIDSKONFIGURATION: Timeline viser 8:00 til 16:00 (8 timer = 480 minutter)
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;
const MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

// SKALERING: Hvor mange pixels per minut (bruges til at beregne højder og positioner)
const PX_PER_MINUTE = 1;

// MARGEN: Plads over og under tidsgitteret (til skraveringer)
const TOP_MARGIN = 16;
const BOTTOM_MARGIN = 16;

// LAYOUT: Bredde af tidskolonnen til venstre
const TIME_COL_WIDTH = 55;

/**
 * Props for BookingTimeline komponenten
 */
type BookingTimelineProps = {
  /** Callback når bruger klikker for at oprette ny booking */
  onCreateBooking: (data: { roomId: string; start: Date; end: Date }) => void;
  /** Callback når bruger sletter en booking (valgfri) */
  onDeleteBooking?: (booking: any) => void;
};

/**
 * Normaliserer lokale typer til standard navne.
 * Konverterer "møderum" til "studierum" for konsistens.
 * 
 * @param type - Den originale lokale type
 * @returns Normaliseret lokale type eller null
 */


// normalizeType var for at ændre møderum til studierum, da ux'erne mente at møderum var studierum og er for studerende.
// Hvis vi får møderum fra database, så vil den behandle den som studierum.
function normalizeType(type: string | null): string | null {
  if (!type) return null;
  // Historisk konvertering: møderum blev omdøbt til studierum
  if (type === "møderum") return "studierum";
  return type;
}

export function BookingTimeline({
  onCreateBooking,
  onDeleteBooking,
}: BookingTimelineProps) {
  const { t } = useTranslation();
  
  // Hent filtrerede lokaler, bookinger, bruger-profiler og valgt dato fra context
  const { filteredRooms, filteredBookings, profiles, selectedDate } =
    useBookingContext();
  
  // Hent aktuel bruger og rolle fra auth context
  const { user, role } = useAuth();

  /**
   * ROLLE-BASEREDE BOOKING-REGLER:
   * Definerer hvilke lokale-typer hver rolle må booke.
   * - Studerende: Kun studierum
   * - Undervisere: Klasseværelser og auditorier
   * - Admin: Alle typer
   */
  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  /**
   * Tjekker om brugerens rolle tillader booking af en given lokale-type.
   * 
   * @param roomType - Typen af lokale der skal tjekkes
   * @returns true hvis rollen må booke denne type, false ellers
   */
  function roleCanBook(roomType: string | null): boolean {
    const t = normalizeType(roomType);
    return allowedTypesForRole[role ?? "student"].includes(t || "");
  }

  // Reference til timeline DOM-element (bruges til koordinat-beregninger ved klik)
  const timelineRef = useRef<HTMLDivElement | null>(null);

  /**
   * State for info-popups der vises når bruger klikker på en booking.
   * Hver popup har et unikt ID, booking-data og x,y koordinater.
   */
  const [infoPopups, setInfoPopups] = useState<
    { id: string; booking: any; x: number; y: number }[]
  >([]);

  /**
   * Array af timer der skal vises på tidsakslen.
   * Beregnes en gang ved mount (8, 9, 10, 11, 12, 13, 14, 15, 16).
   * 
   * MEMOIZED: Værdien ændres aldrig, så den caches for performance.
   */
  const hours = useMemo(
    () =>
      Array.from(
        { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
        (_, i) => DAY_START_HOUR + i
      ),
    []
  );

  /**
   * Sorterer lokaler for korrekt visning i timeline:
   * 1. Primær sortering: Efter etage nummer (laveste først)
   * 2. Sekundær sortering: Alfabetisk efter lokale-navn
   * 
   * EKSEMPEL:
   * Etage 1: A101, A102, A103
   * Etage 2: B201, B202, B203
   * 
   * MEMOIZED: Genberegnes kun når filteredRooms ændres.
   */
  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      // Hent etage nummer (brug 0 som default)
      const fa = a.floor ?? 0;
      const fb = b.floor ?? 0;

      // Sortér først efter etage
      if (fa !== fb) return fa - fb;

      // Hvis samme etage, sortér alfabetisk efter navn
      return (a.room_name || "").localeCompare(b.room_name || "");
    });
  }, [filteredRooms]);

  /**
   * VALIDERING 1: Tjek om dato er valgt
   * Timeline kan ikke vises uden en valgt dato.
   */
  if (!selectedDate) {
    return (
      <div className="text-center py-10 text-main text-lg">
        {t("booking.selectdatefortimeline")}
      </div>
    );
  }

  const today = dayjs();
  const selected = dayjs(selectedDate);

  /**
   * VALIDERING 2: Ingen booking i fortiden
   * Hvis valgt dato er før i dag, vis advarsel.
   */
  if (selected.isBefore(today, "day")) {
    return (
      <div className="text-center py-12 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-main text-lg font-semibold">
          {t("booking.earlybooking")}
        </p>
      </div>
    );
  }

  /**
   * VALIDERING 3: Dagens booking-tid er udløbet
   * Hvis det er i dag, men klokken er 16:00 eller senere, kan der ikke bookes mere.
   */
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

  /**
   * VALIDERING 4: Ingen lokaler matcher filtre
   * Hvis alle lokaler er filtreret fra, vis besked.
   */
  if (sortedRooms.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-secondary-300 rounded-xl border border-secondary-200">
        <p className="text-lg font-semibold text-main">
          {t("booking.noroomsmatchfilters")}
        </p>
      </div>
    );
  }

  //========================================
  // HJÆLPEFUNKTIONER FOR TIDS-BEREGNINGER
  //========================================

  /**
   * Konverterer minutter til pixels baseret på PX_PER_MINUTE skaleringen.
   * 
   * @param min - Antal minutter
   * @returns Antal pixels
   * 
   * EKSEMPEL: 60 minutter = 60 pixels
   */
  function minutesToPx(min: number) {
    return min * PX_PER_MINUTE;
  }

  /**
   * Beregner antal minutter fra dagens start (kl. 8:00) til en given dato.
   * Dette bruges til at placere bookinger vertikalt i timeline.
   * 
   * @param date - Dato/tidspunkt der skal konverteres
   * @returns Antal minutter fra kl. 8:00
   * 
   * EKSEMPEL: 
   * - Kl. 8:00 → 0 minutter
   * - Kl. 9:30 → 90 minutter
   * - Kl. 16:00 → 480 minutter
   */
  function dateToMinuteOffset(date: Date) {
    return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
  }

  /**
   * Runder antal minutter til nærmeste 15-minutters interval.
   * Dette sikrer at bookinger altid starter på 00, 15, 30 eller 45.
   * 
   * @param mins - Antal minutter
   * @returns Afrundet til nærmeste 15-minutters mark
   * 
   * EKSEMPEL:
   * - 7 min → 0 min
   * - 8 min → 15 min
   * - 22 min → 15 min
   * - 23 min → 30 min
   */
  function roundToQuarter(mins: number) {
    return Math.round(mins / 15) * 15;
  }

  /**
   * Finder den næste booking i et lokale efter et givet starttidspunkt.
   * Bruges til at begrænse varigheden af nye bookinger.
   * 
   * @param roomId - ID på lokalet
   * @param start - Starttidspunkt for den nye booking
   * @returns Næste booking hvis den findes, ellers undefined
   * 
   * LOGIK:
   * 1. Filtrer til bookinger i det specifikke lokale
   * 2. Konverter til dayjs objekter for nem sammenligning
   * 3. Find første booking der starter efter den givne start-tid
   */
  function getNextBooking(roomId: string, start: dayjs.Dayjs) {
    const bookings = filteredBookings
      .filter((b) => b.room_id === roomId)
      .map((b) => ({
        s: dayjs(b.start_time),
        e: dayjs(b.end_time),
      }));

    return bookings.find((b) => b.s.isAfter(start));
  }

  //==================================================
  // HÅNDTERING AF KLIK I TIMELINE → OPRET NY BOOKING
  //==================================================

  /**
   * Hovedfunktion for at håndtere bruger-klik i timeline.
   * Beregner hvor og hvornår der klikkes, og opretter en ny booking hvis tilladt.
   * 
   * TRIN:
   * 1. Beregn klik-koordinater relativt til timeline
   * 2. Find hvilket lokale der klikkes på (x-koordinat)
   * 3. Find hvilket tidspunkt der klikkes på (y-koordinat)
   * 4. Valider at booking er tilladt (rolle, tid, etc.)
   * 5. Beregn booking-varighed og juster for begrænsninger
   * 6. Kald onCreateBooking callback med booking-data
   * 
   * @param e - Mouse event fra klik
   */
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Kan ikke håndtere klik hvis timeline ref ikke er sat
    if (!timelineRef.current) return;

    // KOORDINAT-BEREGNING: Find klik position relativt til timeline
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;  // Vandret position
    const y = e.clientY - rect.top;   // Lodret position

    // VALIDERING: Klik skal være inden for det aktive tidsområde
    // Ignorer klik i top/bund margener eller i tid-kolonnen
    if (y < TOP_MARGIN || y > TOP_MARGIN + minutesToPx(MINUTES)) return;
    if (x < TIME_COL_WIDTH) return;

    // LOKALE-IDENTIFIKATION: Find hvilket lokale der klikkes på
    const colWidth = (rect.width - TIME_COL_WIDTH) / sortedRooms.length;
    const roomIndex = Math.floor((x - TIME_COL_WIDTH) / colWidth);
    const room = sortedRooms[roomIndex];
    if (!room) return;

    // Normaliser lokale-type
    const type = normalizeType(room.room_type);

    // ROLLE-VALIDERING: Tjek om brugerens rolle må booke denne type lokale
    if (!roleCanBook(type)) {
      return;
    }

    // TIDSPUNKT-BEREGNING: Konverter y-koordinat til minutter fra dagens start
    const minuteOffset = (y - TOP_MARGIN) / PX_PER_MINUTE;
    const rawStartMin =
      DAY_START_HOUR * 60 + minuteOffset - DAY_START_HOUR * 60;

    // Rund til nærmeste 15-minutters interval
    const roundedStart = roundToQuarter(rawStartMin);
    let start = selected.hour(DAY_START_HOUR).minute(roundedStart);

    // FORTIDS-VALIDERING: Kan ikke oprette booking i fortiden (hvis valgt dato er i dag)
    const todayDayjs = dayjs();
    if (selected.isSame(todayDayjs, "day") && start.isBefore(todayDayjs)) {
      return;
    }

    // Beregn hård deadline (dagens sluttidspunkt)
    const hardEnd = selected.hour(DAY_END_HOUR).minute(0);

    // SLUTTIDS-VALIDERING: Start må ikke være efter eller på sluttidspunktet
    if (start.isSame(hardEnd) || start.isAfter(hardEnd)) {
      return;
    }

    // VARIGHED-BEREGNING: Start med default varighed på 60 minutter
    let end = start.add(60, "minute");

    // BEGRÆNSNING 1: Booking må ikke gå ud over dagens sluttid
    if (end.isAfter(hardEnd)) {
      end = hardEnd;
    }

    // BEGRÆNSNING 2: Booking må ikke overlappe næste eksisterende booking
    const next = getNextBooking(room.id, start);
    if (next && end.isAfter(next.s)) {
      end = next.s;
    }

    // OPRET BOOKING: Kald callback med den beregnede booking-data
    onCreateBooking({
      roomId: room.id,
      start: start.toDate(),
      end: end.toDate(),
    });
  }

  //=======================================
  // NUVÆRENDE TIDSPUNKT MARKERING
  //=======================================

  const now = dayjs();
  // Vis kun "nu"-markering hvis valgt dato er i dag
  const showNow = selected.isSame(now, "day");
  // Beregn nuværende tidspunkt i minutter fra dagens start
  const nowOffsetMinutes = (now.hour() - DAY_START_HOUR) * 60 + now.minute();

  // Beregn pixel-position for nu-linjen (kun hvis inden for tidsrammen)
  const nowTop =
    nowOffsetMinutes >= 0 && nowOffsetMinutes <= MINUTES
      ? TOP_MARGIN + minutesToPx(nowOffsetMinutes)
      : null;

  //===========================================
  // RENDERING AF TIMELINE
  //===========================================

  return (
    <div className="relative">
      {/* 
        HEADER-RÆKKE: Viser lokale-navne øverst i hver kolonne
        GRID LAYOUT:
        - Første kolonne (TIME_COL_WIDTH px): Tom (plads til tidsakse)
        - Efterfølgende kolonner: Én per lokale (lige fordelt)
      */}
      <div
        className="grid border border-gray-300 rounded-t-lg bg-gray-100"
        style={{
          gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${sortedRooms.length}, 1fr)`,
        }}
      >
        {/* Tom celle i øverste venstre hjørne */}
        <div></div>
        
        {/* Header-celler for hvert lokale */}
        {sortedRooms.map((room) => {
          // Normaliser lokale-type og tjek om det er blokeret for brugerens rolle
          const normalizedType = normalizeType(room.room_type);
          const blocked = !roleCanBook(normalizedType);

          return (
            <div
              key={room.id}
              // Blokerede lokaler vises med grå baggrund og tekst
              className={`text-center py-2 font-semibold border-l border-gray-300 
              ${blocked ? "text-gray-400 bg-gray-200" : "text-gray-800"}`}
            >
              {room.room_name}
            </div>
          );
        })}
      </div>

      {/* 
        HOVEDTIMELINE GRID:
        Dette er den interaktive del hvor bookinger vises og oprettes.
        
        STRUKTUR:
        - Grid med samme kolonne-opsætning som header
        - Højde beregnes fra antal minutter plus margener
        - Klik-handler for at oprette nye bookinger
        - Relative positionering for absolute børne-elementer
      */}
      <div
        ref={timelineRef}
        className="booking-timeline grid border border-t-0 border-gray-300 bg-[#d4dcf4] cursor-pointer rounded-b-lg relative"
        style={{
          gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${sortedRooms.length}, 1fr)`,
          height: TOP_MARGIN + minutesToPx(MINUTES) + BOTTOM_MARGIN,
        }}
        onClick={handleClick}
      >
        {/* 
          FORTIDS-OVERLAY (kun vist i dag):
          Mørkere overlay over tiden der allerede er gået.
          Visuelt signal om at man ikke kan booke i fortiden.
        */}
        {showNow && (
          <div
            className="absolute left-0 right-0 bg-black/15 pointer-events-none"
            style={{
              top: TOP_MARGIN,
              height: minutesToPx(nowOffsetMinutes),
            }}
          />
        )}

        {/* 
          SKRAVEREDE MARGENER (top og bund):
          Diagonal mønster der viser områder uden for booking-tiderne.
          Defineret i BookingTimeline.css
        */}
        <div
          className="diagonal-hatch pointer-events-none"
          style={{ top: 0, height: TOP_MARGIN }}
        />
        <div
          className="diagonal-hatch pointer-events-none"
          style={{ bottom: 0, height: BOTTOM_MARGIN }}
        />

        {/* 
          TIDSAKSE (venstre kolonne):
          Viser klokkeslæt for hver time fra 8:00 til 16:00.
          Positioneres absolut ved den korrekte pixel-højde.
        */}
        <div className="relative bg-white">
          {hours.map((hour) => {
            // Beregn top-position: antal minutter fra start * pixels per minut
            const top = TOP_MARGIN + minutesToPx((hour - DAY_START_HOUR) * 60);
            return (
              <div
                key={hour}
                className="absolute w-full text-xs text-gray-700 flex items-center justify-center"
                // Transform centrerer teksten vertikalt på linjen
                style={{ top, transform: "translateY(-50%)" }}
              >
                {hour}:00
              </div>
            );
          })}
        </div>

        {/* 
          LOKALE-KOLONNER:
          En kolonne for hvert lokale, indeholdende:
          - Gitter-linjer for hver time
          - Booking-blokke med titel, bruger og tidspunkt
          - Interaktion (popup ved klik, slet-knap)
        */}
        {sortedRooms.map((room) => {
          // Normaliser type og tjek om lokalet er blokeret
          const normalizedType = normalizeType(room.room_type);
          const blocked = !roleCanBook(normalizedType);

          // Filtrer til kun bookinger i dette specifikke lokale
          const roomBookings = filteredBookings.filter(
            (b) => b.room_id === room.id
          );

          return (
            <div
              key={room.id}
              // Blokerede lokaler får grå baggrund og cursor-not-allowed
              className={`relative border-l border-gray-300 ${
                blocked ? "bg-gray-200 cursor-not-allowed" : "bg-transparent"
              }`}
            >
              {/* 
                GITTER-LINJER:
                Vandret linje for hver time til visuel opdeling.
                Gør det nemt at se hvilke tidspunkter der bookes.
              */}
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

              {/* 
                BOOKING-BLOKKE:
                Hver booking vises som en farvet blok med:
                - Position og højde baseret på start/slut tidspunkt
                - Titel, bruger og tidspunkt
                - Klikbar for at vise info-popup
                - Slet-knap (kun for ejer eller admin)
              */}
              {roomBookings.map((b) => {
                // Konverter booking tidspunkter til Date objekter
                const s = new Date(b.start_time);
                const e = new Date(b.end_time);

                // Beregn position i minutter fra dagens start
                const sMin = dateToMinuteOffset(s);
                const eMin = dateToMinuteOffset(e);

                // Find booking-ejer i profil-listen
                const owner = profiles.find((p) => p.id === b.user_id);
                // Tjek om aktuel bruger ejer denne booking
                const isOwner = user?.id === b.user_id;
                // Slet-knap vises kun for ejer eller admin
                const canDelete =
                  (isOwner || role === "admin") && onDeleteBooking;

                return (
                  <div
                    key={b.id}
                    // Booking-blok styling:
                    // - Absolut positioneret baseret på tidspunkt
                    // - Margin på siderne (10%) for at skabe gap mellem kolonner
                    // - Farve fra theme (bg-status-booked)
                    className="absolute inset-x-0 mx-[10%] bg-status-booked text-invert text-xs rounded-md px-2 py-1 shadow-md overflow-hidden cursor-pointer"
                    style={{
                      // Top position: antal minutter fra start
                      top: TOP_MARGIN + minutesToPx(sMin),
                      // Højde: forskel mellem slut og start i minutter
                      height: minutesToPx(eMin - sMin),
                    }}
                    onClick={(ev) => {
                      // Stop propagation for ikke at trigge timeline klik
                      ev.stopPropagation();

                      // Beregn klik-position for popup placering
                      const rect = timelineRef.current?.getBoundingClientRect();
                      const clickX = ev.clientX - (rect?.left ?? 0);
                      const clickY = ev.clientY - (rect?.top ?? 0);

                      // Tilføj ny info-popup til state
                      setInfoPopups((prev) => [
                        ...prev,
                        {
                          id: b.id + "-" + Date.now(), // Unikt ID
                          booking: b,
                          x: clickX,
                          y: clickY,
                        },
                      ]);
                    }}
                  >
                    {/* Booking titel (med ellipsis hvis for lang) */}
                    <div className="font-semibold truncate">
                      {b.title || t("booking.notitle")}
                    </div>

                    {/* Booking ejer */}
                    <div className="text-[10px] opacity-90">
                      {owner?.full_name || t("booking.unknown")}
                    </div>

                    {/* Booking tidspunkt */}
                    <div className="text-[10px] mt-1 opacity-90">
                      {dayjs(s).format("HH:mm")} – {dayjs(e).format("HH:mm")}
                    </div>

                    {/* Slet-knap (kun vist hvis brugeren har rettigheder) */}
                    {canDelete && (
                      <button
                        onClick={(ev) => {
                          // Stop propagation for ikke at åbne popup
                          ev.stopPropagation();
                          // Kald slet callback
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

        {/* 
          NUVÆRENDE TIDSPUNKT LINJE:
          Rød vandret linje der viser præcist hvor vi er i tiden lige nu.
          Vises kun når valgt dato er i dag og tiden er inden for 8-16.
        */}
        {showNow && nowTop !== null && (
          <div
            className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none"
            style={{ top: nowTop }}
          />
        )}

        {/* 
          INFO-POPUPS:
          Viser detaljeret information om en booking når bruger klikker på den.
          Popups kan lukkes ved at klikke udenfor eller på luk-knap.
        */}
        {infoPopups.map((p) => {
          // Find ejer og lokale for denne booking
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
                // Fjern denne popup fra state
                setInfoPopups((prev) => prev.filter((i) => i.id !== p.id))
              }
            />
          );
        })}
      </div>
    </div>
  );
}
