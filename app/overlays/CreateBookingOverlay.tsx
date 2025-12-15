/**
 * OPRET BOOKING OVERLAY (CREATEBOOKINGOVERLAY.TSX)
 * =================================================
 * 
 * FORMÅL:
 * Dette overlay håndterer oprettelse af nye bookinger i systemet.
 * Det implementerer kompleks forretningslogik inklusiv rolle-baserede regler,
 * tidsbegrænsninger, overlap-tjek og validering.
 * 
 * NÅR DET VISES:
 * - Når en bruger klikker på et ledigt tidsrum i booking-tidslinjen
 * - Når en bruger vælger "Opret booking" fra booking-siden
 * - Efter valg af lokale hvis flere er tilgængelige
 * 
 * FORRETNINGSREGLER:
 * 
 * 1. ROLLE-BASEREDE LOKALEREGLER:
 *    - Studerende: Kun adgang til studierum
 *    - Lærere: Adgang til klasseværelser og auditorier
 *    - Administratorer: Adgang til alle lokaletyper
 * 
 * 2. TIDSBEGRÆNSNINGER:
 *    - Bookinger skal ligge mellem kl. 08:00 og 16:00
 *    - Sluttidspunkt skal være efter starttidspunkt
 *    - Kan ikke booke i fortiden
 * 
 * 3. STUDERENDE-SPECIFIKKE BEGRÆNSNINGER:
 *    - Maksimalt 4 timer per booking
 *    - Maksimalt 4 fremtidige bookinger ad gangen
 *    - Disse regler valideres via BookingRules context
 * 
 * 4. OVERLAP-VALIDERING:
 *    - Tjekker om det valgte tidsrum overlapper med eksisterende bookinger
 *    - Kun i det valgte lokale (forskellige lokaler kan overlappe)
 *    - Viser specifik fejlbesked med tidspunkt for overlap
 * 
 * 5. LOKALETYPE-NORMALISERING:
 *    - "møderum" konverteres til "studierum" for konsistens
 *    - Sikrer ensartet håndtering af lokaletyper
 * 
 * FUNKTIONALITET:
 * - Validering i realtid mens bruger indtaster data
 * - Dynamisk filtrering af lokaler baseret på brugerrolle
 * - Fejlbeskeder vises øverst i formularen
 * - Submit-knap deaktiveres hvis valideringen fejler
 * - State nulstilles når overlay åbnes/lukkes
 * 
 * BRUGERINTERAKTION:
 * - Vælg lokale fra dropdown (kun tilladte lokaler vises)
 * - Indtast valgfri titel for bookingen
 * - Vælg dato via datepicker
 * - Indtast start- og sluttid via time inputs
 * - Klik "Opret booking" for at gemme
 * - Fejlbeskeder opdateres automatisk ved ændringer
 * 
 * DATABASE OPERATIONER:
 * - INSERT operation udføres i parent-komponenten via onSubmit callback
 * - Denne komponent håndterer kun validering og UI
 */

"use client";

import {
  Modal,
  TextInput,
  Button,
  Select,
  Group,
  Text,
  Stack,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type { Room } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useBookingContext } from "@/context/BookingContext";
import { validateBookingLimits } from "@/context/BookingRules";
import { useTranslation } from "react-i18next";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

/**
 * KONSTANTER: Åbningstider
 * -------------------------
 * Definerer hvornår bookinger kan oprettes (08:00 - 16:00)
 */
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;

/**
 * Props til CreateBookingOverlay komponenten
 * 
 * @property {boolean} opened - Om overlay er åben/synlig
 * @property {() => void} onClose - Callback når overlay lukkes
 * @property {string} roomId - ID på det initialt valgte lokale
 * @property {Date} start - Initial starttidspunkt for booking
 * @property {Date} end - Initial sluttidspunkt for booking
 * @property {Room[]} rooms - Array af alle tilgængelige lokaler
 * @property {Function} onSubmit - Callback når booking oprettes succesfuldt
 */
type CreateBookingOverlayProps = {
  opened: boolean;
  onClose: () => void;
  roomId: string;
  start: Date;
  end: Date;
  rooms: Room[];
  onSubmit: (data: {
    roomId: string;
    title: string;
    start: Date;
    end: Date;
  }) => void;
};

/**
 * HJÆLPEFUNKTION: normalizeType
 * ------------------------------
 * Normaliserer lokaletype-strenge for konsistent håndtering.
 * Konverterer "møderum" til "studierum" da de behandles ens.
 * 
 * @param {string | null} type - Lokaletype fra database
 * @returns {string | null} Normaliseret lokaletype eller null
 */
function normalizeType(type: string | null): string | null {
  if (!type) return null;
  // Møderum og studierum behandles identisk i systemet
  return type === "møderum" ? "studierum" : type;
}

/**
 * CreateBookingOverlay komponent
 * -------------------------------
 * Hovedkomponent der håndterer booking-oprettelse med omfattende validering.
 * 
 * @param {CreateBookingOverlayProps} props - Komponentens props
 * @returns {JSX.Element} Modal med booking-formular
 */
export function CreateBookingOverlay({
  opened,
  onClose,
  roomId: initialRoomId,
  start: initialStart,
  end: initialEnd,
  rooms,
  onSubmit,
}: CreateBookingOverlayProps) {
  // Hent brugerdata og rolle fra AuthContext
  const { user, role } = useAuth();
  
  // Hent alle bookinger og filtrerede bookinger fra BookingContext
  const { bookings, filteredBookings } = useBookingContext();
  
  // Hook til oversættelser
  const { t } = useTranslation();

  /**
   * Sørg for at vi altid har en gyldig rolle
   * Fallback til "student" hvis rolle er null/undefined
   */
  const effectiveRole: string = role ?? "student";

  /**
   * STATE: roomId
   * ID på det valgte lokale
   * Initialiseres med roomId fra props
   */
  const [roomId, setRoomId] = useState<string>(initialRoomId);
  
  /**
   * STATE: title
   * Valgfri titel/beskrivelse for bookingen
   * Tom streng som standard
   */
  const [title, setTitle] = useState<string>("");
  
  /**
   * STATE: chosenDate
   * Den valgte dato for bookingen
   * Initialiseres med start-dato fra props
   */
  const [chosenDate, setChosenDate] = useState<Date | null>(initialStart);
  
  /**
   * STATE: startTime
   * Starttidspunkt for bookingen
   * Initialiseres med start-tid fra props
   */
  const [startTime, setStartTime] = useState<Date>(initialStart);
  // String mirror for controlled typing without jitter
  const [startTimeStr, setStartTimeStr] = useState<string>(dayjs(initialStart).format("HH:mm"));
  
  /**
   * STATE: endTime
   * Sluttidspunkt for bookingen
   * Initialiseres med slut-tid fra props
   */
  const [endTime, setEndTime] = useState<Date>(initialEnd);
  // String mirror for controlled typing without jitter
  const [endTimeStr, setEndTimeStr] = useState<string>(dayjs(initialEnd).format("HH:mm"));
  
  /**
   * STATE: errorMessage
   * Aktuel fejlbesked der vises til brugeren
   * Null hvis ingen fejl
   */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * EFFECT: Reset state når overlay åbnes
   * --------------------------------------
   * Kører når overlay åbnes eller når initial props ændres.
   * Nulstiller alle felter til deres initial værdier.
   * Dette sikrer at overlay altid åbner med friske data.
   */
  useEffect(() => {
    setRoomId(initialRoomId);
    setChosenDate(initialStart);
    setStartTime(initialStart);
    setStartTimeStr(dayjs(initialStart).format("HH:mm"));
    setEndTime(initialEnd);
    setEndTimeStr(dayjs(initialEnd).format("HH:mm"));
    setTitle("");
    setErrorMessage(null);
  }, [opened, initialRoomId, initialStart, initialEnd]);

  /**
   * HJÆLPEFUNKTION: combine
   * ------------------------
   * Kombinerer en dato og et tidspunkt til en enkelt Date objekt.
   * Bruges til at merge valgt dato med valgt tid.
   * 
   * @param {Date | null} date - Den valgte dato
   * @param {Date} time - Det valgte tidspunkt
   * @returns {Date} Kombineret dato og tidspunkt
   */
  function combine(date: Date | null, time: Date): Date {
    if (!date) return new Date();
    return dayjs(date)
      .hour(dayjs(time).hour())
      .minute(dayjs(time).minute())
      .second(0)
      .toDate();
  }

  /**
   * ROLLE-BASEREDE ADGANGSREGLER
   * -----------------------------
   * Definerer hvilke lokaletyper hver rolle må booke:
   * - Studerende: Kun studierum
   * - Lærere: Klasseværelser og auditorier
   * - Administratorer: Alle lokaletyper
   */
  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  /**
   * FILTREREDE LOKALER TIL DROPDOWN
   * --------------------------------
   * Filtrerer lokaler baseret på brugerens rolle.
   * Kun lokaler som brugerens rolle har adgang til vises i dropdown.
   * Lokaletypen normaliseres før sammenligning.
   */
  const allowedRoomsForDropdown = rooms.filter((room) => {
    const t = normalizeType(room.room_type);
    return allowedTypesForRole[effectiveRole].includes(t || "");
  });

  /**
   * BOOKINGER I VALGT LOKALE
   * -------------------------
   * Filtrerer bookinger til kun at inkludere dem i det aktuelt valgte lokale.
   * Bruges til overlap-tjek senere i valideringen.
   */
  const bookingsInRoom = filteredBookings.filter((b) => b.room_id === roomId);

  /**
   * VALIDERINGSFUNKTION: validateOverlap
   * -------------------------------------
   * Tjekker om den nye booking overlapper med eksisterende bookinger i samme lokale.
   * 
   * OVERLAP LOGIK:
   * Overlap findes hvis:
   * 1. Ny booking starter inden en eksisterende slutter (start mellem eksisterende)
   * 2. Ny booking slutter efter en eksisterende starter (slut mellem eksisterende)
   * 3. Ny booking omslutter en eksisterende booking helt
   * 
   * @param {Date} finalStart - Starttidspunkt for ny booking
   * @param {Date} finalEnd - Sluttidspunkt for ny booking
   * @returns {string | null} Fejlbesked hvis overlap findes, ellers null
   */
  function validateOverlap(finalStart: Date, finalEnd: Date) {
    // Loop gennem alle bookinger i det valgte lokale
    for (const b of bookingsInRoom) {
      const bs = new Date(b.start_time); // Eksisterende booking start
      const be = new Date(b.end_time);   // Eksisterende booking slut

      // Tjek for overlap med tre betingelser
      const overlaps =
        (finalStart >= bs && finalStart < be) ||  // Ny starter inden eksisterende slutter
        (finalEnd > bs && finalEnd <= be) ||      // Ny slutter efter eksisterende starter
        (finalStart <= bs && finalEnd >= be);     // Ny omslutter eksisterende

      // Hvis overlap findes, returner specifik fejlbesked med tidspunkt
      if (overlaps) {
        return `${t("booking.overlappingbooking")} ${dayjs(
          bs
        ).format("HH:mm")}–${dayjs(be).format("HH:mm")}`;
      }
    }
    // Ingen overlap fundet
    return null;
  }

  /**
   * HOVED-VALIDERINGSFUNKTION: validate
   * ------------------------------------
   * Kører alle valideringsregler og returnerer første fejl der findes.
   * Kaldes både for at disable submit-knap og ved submit.
   * 
   * VALIDERINGS-RÆKKEFØLGE:
   * 1. Tidspunkt-logik (slut efter start)
   * 2. Åbningstider (08:00 - 16:00)
   * 3. Rolle-baseret adgang til lokaletype
   * 4. Booking-limits (studerende: 4 timer, 4 bookinger)
   * 5. Overlap med eksisterende bookinger
   * 
   * @returns {string | null} Fejlbesked hvis validering fejler, ellers null
   */
  function validate(): string | null {
    // Kombiner valgt dato med valgte tider
    const finalStart = combine(chosenDate, startTime);
    const finalEnd = combine(chosenDate, endTime);

    // VALIDERING 1: Sluttidspunkt skal være efter starttidspunkt
    if (finalEnd <= finalStart) {
      return t("booking.endtimebeforestarttime");
    }

    // VALIDERING 2: Åbningstider – skal ligge mellem 08:00 og 16:00
    // Konverter tid til decimal (f.eks. 08:30 = 8.5)
    const startHour =
      dayjs(finalStart).hour() + dayjs(finalStart).minute() / 60;
    const endHour = dayjs(finalEnd).hour() + dayjs(finalEnd).minute() / 60;

    if (startHour < DAY_START_HOUR || endHour > DAY_END_HOUR) {
      return t("booking.bookingoutsideopeninghours");
    }

    // VALIDERING 3: Rolle vs. lokaletype - har brugeren adgang til dette lokale?
    const selectedRoom = rooms.find((r) => r.id === roomId);
    if (selectedRoom) {
      const t_type = normalizeType(selectedRoom.room_type);

      if (!allowedTypesForRole[effectiveRole].includes(t_type || "")) {
        return t("booking.noaccesstoroom");
      }
    }

    // VALIDERING 4: Studerende begrænsninger (maks 4 timer + maks 4 bookinger)
    if (user) {
      const now = new Date();
      
      // Find alle fremtidige bookinger for denne bruger
      const futureBookingsForUser = bookings.filter(
        (b) =>
          b.user_id === user.id &&
          new Date(b.end_time).getTime() > now.getTime()
      );

      // Valider booking-limits via BookingRules context
      const limits = validateBookingLimits(
        effectiveRole,
        futureBookingsForUser,
        finalStart,
        finalEnd
      );

      // Hvis limits overtrådt, returner fejlbesked
      if (!limits.ok) {
        return limits.message ? t(limits.message) : t("booking.bookinglimitexceeded");
      }
    }

    // VALIDERING 5: Tjek for overlap med andre bookinger i samme lokale
    const overlapErr = validateOverlap(finalStart, finalEnd);
    if (overlapErr) return overlapErr;

    // Alle valideringer bestået
    return null;
  }

  /**
   * EVENT HANDLER: handleSubmit
   * ----------------------------
   * Kaldes når bruger klikker på "Opret booking" knappen.
   * 
   * FLOW:
   * 1. Kør validering
   * 2. Hvis fejl, vis fejlbesked og stop
   * 3. Hvis OK, kombiner dato og tider
   * 4. Kald onSubmit callback med booking-data
   * 5. Luk overlay
   * 
   * @returns {void}
   */
  function handleSubmit() {
    // Kør validering
    const err = validate();
    
    // Hvis validering fejler, vis fejl og stop
    if (err) {
      setErrorMessage(err);
      return;
    }

    // Kombiner dato og tider til finale Date objekter
    const finalStart = combine(chosenDate, startTime);
    const finalEnd = combine(chosenDate, endTime);

    // Kald parent's submit handler med booking-data
    onSubmit({
      roomId,
      title,
      start: finalStart,
      end: finalEnd,
    });

    // Luk overlay
    onClose();
  }

  /**
   * Disabled state for submit-knap
   * Knappen er disabled hvis validering returnerer en fejl
   */
  const isDisabled = !!validate();

  /**
   * RENDER: Booking formular
   * -------------------------
   * Viser modal med formular til oprettelse af booking
   */
  return (
    <Modal opened={opened} onClose={onClose} centered title={null}>
      {/* LUK KNAP - X-ikon i øverste højre hjørne */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition"
        aria-label="Luk overlay"
      >
        <FontAwesomeIcon icon={faCircleXmark} className="text-2xl" />
      </button>

      {/* OVERSKRIFT - "Opret booking" */}
      <Text fw={700} size="xl" className="mb-2">
        {t("booking.createbooking")}
      </Text>

      <Stack gap="md">
        {/* FEJLBESKED - Vises hvis validering fejler */}
        {/* Viser enten manuel fejlbesked eller resultat af validate() */}
        {(errorMessage || validate()) && (
          <Text c="red" size="sm">
            {errorMessage || validate()}
          </Text>
        )}

        {/* INPUT: Lokalevalg - Dropdown med rolle-filtrerede lokaler */}
        {/* Kun lokaler som brugerens rolle har adgang til vises */}
        <Select
          label={t("booking.room")} // "Lokale"
          data={allowedRoomsForDropdown.map((r) => ({
            value: r.id,
            label: r.room_name,
          }))}
          value={roomId}
          onChange={(val) => {
            setRoomId(val || initialRoomId); // Opdater valgt lokale
            setErrorMessage(null);           // Nulstil fejlbesked ved ændring
          }}
        />

        {/* INPUT: Booking titel (valgfri) */}
        <TextInput
          label={t("booking.title")}       // "Titel"
          placeholder={t("booking.example")} // "F.eks. Gruppearbejde"
          value={title}
          onChange={(e) => setTitle(e.target.value)} // Opdater titel ved indtastning
        />

        {/* INPUT: Dato valg */}
        <DatePickerInput
          label={t("booking.date")}  // "Dato"
          value={chosenDate}
          valueFormat="DD-MM-YYYY"   // Dansk datoformat
          onChange={(value) => {
            setChosenDate(value ? dayjs(value).toDate() : null); // Opdater valgt dato
            setErrorMessage(null);                               // Nulstil fejlbesked
          }}
        />

        {/* INPUT: Tid valg - Start og sluttidspunkt side om side */}
        <Group grow>
          {/* Starttidspunkt */}
          <TimeInput
            label={t("booking.starttime")} // "Starttid"
            value={startTimeStr}
            onChange={(event) => {
              const val = event.currentTarget.value;
              setStartTimeStr(val);
              // Accepter kun fuldt HH:mm format før opdatering af Date state
              const match = /^(\d{1,2}):(\d{2})$/.exec(val);
              if (match) {
                let h = parseInt(match[1], 10);
                let m = parseInt(match[2], 10);
                if (isNaN(h) || isNaN(m)) return;
                // Clamp
                h = Math.min(Math.max(0, h), 23);
                m = Math.min(Math.max(0, m), 59);
                const next = dayjs(startTime).hour(h).minute(m).second(0).toDate();
                setStartTime(next);
                setErrorMessage(null);
              }
            }}
            onBlur={() => {
              // Når input mister fokus: hvis tomt eller ugyldigt, sæt til gyldig tid eller åbningstid
              const match = /^(\d{1,2}):(\d{2})$/.exec(startTimeStr);
              if (!match) {
                const fallback = dayjs(startTime).isValid() ? dayjs(startTime) : dayjs().hour(DAY_START_HOUR).minute(0);
                setStartTime(fallback.toDate());
                setStartTimeStr(fallback.format("HH:mm"));
              } else {
                let h = parseInt(match[1], 10);
                let m = parseInt(match[2], 10);
                h = Math.min(Math.max(0, h), 23);
                m = Math.min(Math.max(0, m), 59);
                const normalized = dayjs(startTime).hour(h).minute(m).second(0);
                setStartTime(normalized.toDate());
                setStartTimeStr(normalized.format("HH:mm"));
              }
            }}
          />

          {/* Sluttidspunkt */}
          <TimeInput
            label={t("booking.endtime")} // "Sluttid"
            value={endTimeStr}
            onChange={(event) => {
              const val = event.currentTarget.value;
              setEndTimeStr(val);
              const match = /^(\d{1,2}):(\d{2})$/.exec(val);
              if (match) {
                let h = parseInt(match[1], 10);
                let m = parseInt(match[2], 10);
                if (isNaN(h) || isNaN(m)) return;
                h = Math.min(Math.max(0, h), 23);
                m = Math.min(Math.max(0, m), 59);
                const next = dayjs(endTime).hour(h).minute(m).second(0).toDate();
                setEndTime(next);
                setErrorMessage(null);
              }
            }}
            onBlur={() => {
              const match = /^(\d{1,2}):(\d{2})$/.exec(endTimeStr);
              if (!match) {
                // Standard: slut en time efter start indenfor åbningstiderne
                const fallbackStart = dayjs(startTime);
                let fallbackEnd = fallbackStart.add(1, "hour");
                if (fallbackEnd.hour() > DAY_END_HOUR) fallbackEnd = fallbackStart.hour(DAY_END_HOUR).minute(0);
                setEndTime(fallbackEnd.toDate());
                setEndTimeStr(fallbackEnd.format("HH:mm"));
              } else {
                let h = parseInt(match[1], 10);
                let m = parseInt(match[2], 10);
                h = Math.min(Math.max(0, h), 23);
                m = Math.min(Math.max(0, m), 59);
                const normalized = dayjs(endTime).hour(h).minute(m).second(0);
                setEndTime(normalized.toDate());
                setEndTimeStr(normalized.format("HH:mm"));
              }
            }}
          />
        </Group>

        {/* SUBMIT KNAP - Opretter bookingen */}
        {/* Disabled hvis validering fejler */}
        <Button fullWidth onClick={handleSubmit} disabled={isDisabled}>
          {t("booking.createbooking")} {/* "Opret booking" */}
        </Button>
      </Stack>
    </Modal>
  );
}
