/**
 * BOOKING HOVEDSIDE - APPLIKATIONENS PRIMÆRE INTERFACE
 * 
 * Dette er hovedsiden for bookingsystemet hvor brugere kan:
 * - Se alle bookinger i en timeline-visning
 * - Oprette nye bookinger ved at klikke på timeline
 * - Søge efter ledige lokaler med avancerede filtre
 * - Slette deres egne bookinger
 * 
 * ROUTING KONTEKST:
 * - Fil: app/page.tsx (roden "/" af applikationen)
 * - Dette er en Client Component ("use client") da den bruger React hooks og state
 * - Efter login redirectes brugere hertil som standard
 * 
 * ARKITEKTUR:
 * - Opdelt i to komponenter: PageContent (indre) og Page (ydre wrapper)
 * - Page wrapper leverer BookingProvider context til hele siden
 * - PageContent indeholder al logik og UI
 * 
 * HOVEDELEMENTER:
 * 1. TopFilterBar - Dato-vælger og basis filtre
 * 2. BookingTimeline - Visuel timeline med alle bookinger for valgt dag
 * 3. BookingAdvancedFilters - Avanceret søgning efter ledige lokaler
 * 4. Overlays - Pop-ups til oprettelse, sletning og fejlbeskeder
 * 
 * BOOKING REGLER:
 * - Kun indenfor åbningstider (kl. 8-16)
 * - Ikke i weekender
 * - Max antal bookinger baseret på rolle (student/teacher/admin)
 * - Ingen overlappende bookinger i samme lokale
 */

"use client";



import { useState } from "react";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { BookingAdvancedFilters } from "@/components/booking/BookingAdvancedFilters";
import BookingList from "@/components/booking/BookingList";
import { BookingProvider, useBookingContext } from "@/context/BookingContext";

import { CreateBookingOverlay } from "@/app/overlays/CreateBookingOverlay";
import { ErrorOverlay } from "@/app/overlays/ErrorOverlay";
import { SelectRoomOverlay } from "@/app/overlays/SelectRoomOverlay";
import { DeleteBookingOverlay } from "@/app/overlays/DeleteBookingsOverlay";

import { createClient } from "@supabase/supabase-js";
import TopFilterBar from "@/components/booking/TopFilterBar";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { validateBookingLimits } from "@/context/BookingRules";
import { useTranslation } from "react-i18next";

/* ---------------------------------------------------------
   SUPABASE CLIENT KONFIGURATION
   
   Opretter forbindelse til Supabase backend database.
   Environment variabler hentes fra .env.local fil.
--------------------------------------------------------- */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/* 
  ÅBNINGSTIDER KONSTANTER
  Definerer hvornår lokaler kan bookes.
  VIGTIGT: Disse SKAL matche værdierne i BookingTimeline komponenten!
*/
const DAY_START_HOUR = 8;  // Åbner kl. 8:00
const DAY_END_HOUR = 16;   // Lukker kl. 16:00

/* ---------------------------------------------------------
   PAGE CONTENT KOMPONENT
   
   Den indre komponent der indeholder al booking-logik.
   Separeret fra Page wrapper for at kunne bruge BookingContext.
--------------------------------------------------------- */

/**
 * PAGECONTENT COMPONENT
 * 
 * Hovedkomponenten der håndterer al booking funktionalitet.
 * Bruger BookingContext til at få adgang til globale booking data.
 * 
 * CONTEXT DATA:
 * @property {Room[]} rooms - Alle lokaler fra database
 * @property {Profile[]} profiles - Alle brugerprofiler
 * @property {Booking[]} bookings - Alle bookinger
 * @property {Booking[]} filteredBookings - Bookinger filtreret efter valgt dato
 * @property {Date} selectedDate - Den dato brugeren har valgt at se
 * @property {Function} reloadBookings - Genindlæser bookinger fra database
 * 
 * STATE VARIABLER:
 * - overlayOpen: Om "opret booking" overlay er åben
 * - overlayData: Data til oprettelse (lokale, start, slut tid)
 * - error: Fejlbesked der skal vises til bruger
 * - selectRoomOpen: Om "vælg lokale" overlay er åben (ved flere ledige lokaler)
 * - availableRooms: Array af ledige lokaler fra avanceret søgning
 * - searchTimes: Start/slut tidspunkter fra avanceret søgning
 * - deleteOverlayOpen: Om sletnings-bekræftelse overlay er åben
 * - bookingToDelete: Den booking der skal slettes
 */
function PageContent() {
  // Hent brugerens rolle fra autentificering context
  const { role } = useAuth();

  // Hent booking data og funktioner fra BookingContext
  const {
    rooms,              // Alle lokaler
    profiles,           // Alle brugerprofiler (til at vise navne)
    bookings,           // Alle bookinger (rå data)
    filteredBookings,   // Bookinger for valgt dato
    selectedDate,       // Den dato der vises i timeline
    reloadBookings,     // Funktion til at genindlæse bookinger efter ændring
  } = useBookingContext();

  /* STATE MANAGEMENT */

  // State til "Opret Booking" overlay
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayData, setOverlayData] = useState<{
    roomId: string;    // ID på det lokale der skal bookes
    start: Date;       // Start tidspunkt
    end: Date;         // Slut tidspunkt
  } | null>(null);

  // State til fejlbeskeder
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null
  );

  // State til "Vælg Lokale" overlay (når avanceret søgning finder flere lokaler)
  const [selectRoomOpen, setSelectRoomOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [searchTimes, setSearchTimes] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  // State til sletning af booking
  const [deleteOverlayOpen, setDeleteOverlayOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<any>(null);

  /* ---------------------------------------------------------
     HÅNDTER OPRETTELSE AF BOOKING FRA TIMELINE
     
     Kaldes når bruger klikker på timeline for at oprette booking.
     Validerer at tidspunkt ikke er fortid, derefter åbner overlay.
  --------------------------------------------------------- */

  /**
   * Håndterer anmodning om at oprette en booking fra timeline.
   * 
   * FLOW:
   * 1. Valider at start tidspunkt ikke er i fortiden
   * 2. Gem booking data i state
   * 3. Åbn "Opret Booking" overlay
   * 
   * @param data - Booking oplysninger fra timeline
   * @param data.roomId - ID på det lokale der skal bookes
   * @param data.start - Start tidspunkt (Date object)
   * @param data.end - Slut tidspunkt (Date object)
   */
  function handleCreateBookingRequest(data: {
    roomId: string;
    start: Date;
    end: Date;
  }) {
    // Tjek om start tidspunkt er i fortiden
    if (dayjs(data.start).isBefore(dayjs())) {
      return setError({
        title: t("ErrorMsg.tooLate"),
        message: t("ErrorMsg.cantCreatePastBooking"),
      });
    }

    // Gem data og åbn overlay
    setOverlayData(data);
    setOverlayOpen(true);
  }

  /* ---------------------------------------------------------
     HÅNDTER SLETNING AF BOOKING
     
     Kaldes når bruger klikker på "slet" knap på en booking i timeline.
     Åbner bekræftelse overlay før sletning.
  --------------------------------------------------------- */

  /**
   * Håndterer anmodning om at slette en booking.
   * Gemmer booking i state og åbner bekræftelse overlay.
   * 
   * @param booking - Den booking der skal slettes (helt objekt fra database)
   */
  function handleDeleteBookingRequest(booking: any) {
    setBookingToDelete(booking);
    setDeleteOverlayOpen(true);
  }

  /* ---------------------------------------------------------
     BEKRÆFT OG UDFØR SLETNING
     
     Kaldes når bruger bekræfter sletning i overlay.
     Sletter booking fra database og genindlæser data.
  --------------------------------------------------------- */

  /**
   * Bekræfter og udfører sletning af booking.
   * 
   * FLOW:
   * 1. Tjek at der er en booking at slette
   * 2. Slet fra Supabase database
   * 3. Håndter eventuelle fejl
   * 4. Genindlæs bookinger
   * 5. Luk overlay
   */
  async function handleConfirmDelete() {
    // Guard clause - sikrer at der er en booking
    if (!bookingToDelete) return;

    // Slet booking fra database via Supabase
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingToDelete.id);

    // Håndter database fejl
    if (error) {
      return setError({
        title: t("ErrorMsg.deletionError"),
        message: t("ErrorMsg.supabaseError"),
      });
    }


    // Genindlæs bookinger fra database
    await reloadBookings();

    // Luk overlay og nulstil state
    setDeleteOverlayOpen(false);
    setBookingToDelete(null);
  }

  /* ---------------------------------------------------------
     AVANCERET SØGNING EFTER LEDIGE LOKALER
     
     Håndterer den avancerede søgefunktion hvor brugere kan:
     - Angive tidspunkt
     - Vælge faciliteter (whiteboard, screen, etc.)
     - Filtrere efter kapacitet
     - Filtrere efter etage og lokaletype
     
     Finder ledige lokaler og håndterer forskellige scenarier:
     - Ingen lokaler matcher kriterier → Fejl
     - Ingen ledige lokaler → Fejl
     - Ét ledigt lokale → Åbn direkte opret-overlay
     - Flere ledige lokaler → Åbn vælg-lokale overlay
  --------------------------------------------------------- */

  /**
   * Håndterer avanceret søgning efter ledige lokaler.
   * 
   * @param filters - Søgekriterier fra avanceret søge-formular
   * @param filters.timeFrom - Start tidspunkt (format: "HH:mm")
   * @param filters.timeTo - Slut tidspunkt (format: "HH:mm")
   * @param filters.whiteboard - Skal have whiteboard
   * @param filters.screen - Skal have skærm
   * @param filters.board - Skal have tavle
   * @param filters.fourPersons - Minimum 4 personers kapacitet
   * @param filters.sixPersons - Minimum 6 personers kapacitet
   * @param filters.eightPersons - Minimum 8 personers kapacitet
   * @param filters.capacity - Specifik kapacitet krav
   * @param filters.floor - Specifik etage
   * @param filters.roomType - Specifik lokaletype (undervisning/møde/etc.)
   * 
   * FLOW:
   * 1. Valider input (dato, tidspunkter)
   * 2. Parse tidspunkter til Date objekter
   * 3. Valider tidsinterval (slut efter start, ikke fortid, åbningstider)
   * 4. Filtrer lokaler efter faciliteter og kapacitet
   * 5. Find ledige lokaler (uden overlappende bookinger)
   * 6. Håndter resultat baseret på antal fundne lokaler
   */
  async function handleAdvancedSearch(filters: {
    timeFrom: string;
    timeTo: string;
    whiteboard: boolean;
    screen: boolean;
    board: boolean;
    fourPersons: boolean;
    sixPersons: boolean;
    eightPersons: boolean;
    capacity?: number | null;
    floor?: number | null;
    roomType?: string | null;
    filteredRooms?: any[];
  }) {
    /* TRIN 1: VALIDER AT DATO ER VALGT */
    if (!selectedDate) {
      return setError({
        title: t("ErrorMsg.selectDate"),
        message: t("ErrorMsg.mustSelectDate"),
      });
    }

    /* TRIN 2: VALIDER AT BEGGE TIDSPUNKTER ER UDFYLDT */
    if (!filters.timeFrom || !filters.timeTo) {
      return setError({
        title: t("ErrorMsg.missingTime"),
        message: t("ErrorMsg.bothTimes"),
      });
    }

    /* TRIN 3: PARSE TIDSPUNKTER FRA STRING (format "HH:mm") TIL NUMMER */
    // Split "13:30" til [13, 30] og konverter til tal
    const [fh, fm] = filters.timeFrom.split(":").map(Number);
    const [th, tm] = filters.timeTo.split(":").map(Number);

    // Tjek at parsing lykkedes (ikke NaN)
    if (isNaN(fh) || isNaN(th)) {
      return setError({
        title: t("ErrorMsg.timeFormat"),
        message: t("ErrorMsg.validTimes"),
      });
    }

    /* TRIN 4: OPRET DATE OBJEKTER MED VALGT DATO OG TIDSPUNKTER */
    // Kombinerer selectedDate med time/minute fra input
    const start = dayjs(selectedDate).hour(fh).minute(fm).toDate();
    const end = dayjs(selectedDate).hour(th).minute(tm).toDate();

    // Valider at Date objekterne er gyldige
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return setError({
        title: t("ErrorMsg.invalidTime"),
        message: t("ErrorMsg.couldNotParseTime"),
      });
    }

    /* TRIN 5: VALIDER TIDSINTERVAL */
    // Slut skal være efter start
    if (end <= start) {
      return setError({
        title: t("ErrorMsg.timeRange"),
        message: t("ErrorMsg.endAfterStart"),
      });
    }

    // Kan ikke søge i fortiden
    if (dayjs(start).isBefore(dayjs())) {
      return setError({
        title: t("ErrorMsg.tooLate"),
        message: t("ErrorMsg.cantSearchPast"),
      });
    }

    /* TRIN 6: BEREGN KRÆVET KAPACITET */
    // Vælger højeste kapacitet fra filter options, eller bruger specifik capacity
    const requiredCap = filters.capacity ?? (filters.eightPersons
      ? 8
      : filters.sixPersons
        ? 6
        : filters.fourPersons
          ? 4
          : 0);

    /* TRIN 7: FILTRER LOKALER EFTER FACILITETER OG KAPACITET */
    // Finder lokaler der matcher alle valgte kriterier
    const featureMatched = rooms.filter((r) => {
      // Tjek whiteboard krav
      if (filters.whiteboard && !r.has_whiteboard) return false;
      // Tjek skærm krav
      if (filters.screen && !r.has_screen) return false;
      // Tjek tavle krav
      if (filters.board && !r.has_board) return false;
      // Tjek kapacitet krav
      if (requiredCap && (r.capacity || 0) < requiredCap) return false;
      // Tjek etage filter hvis angivet
      if (filters.floor !== null && filters.floor !== undefined && r.floor !== filters.floor) return false;
      // Tjek lokaletype filter hvis angivet
      if (filters.roomType && r.room_type !== filters.roomType) return false;
      // Lokale matcher alle kriterier
      return true;
    });

    // Ingen lokaler matcher søgekriterierne
    if (featureMatched.length === 0) {
      return setError({
        title: t("ErrorMsg.noMatch"),
        message: t("ErrorMsg.noRoomsMatch"),
      });
    }

    /* TRIN 8: FIND BOOKINGER FOR DEN VALGTE DAG */
    // Filtrer alle bookinger til kun at inkludere valgt dag
    const dayBookings = bookings.filter((b) =>
      dayjs(b.start_time).isSame(selectedDate, "day")
    );

    /* TRIN 9: FIND LEDIGE LOKALER (UDEN OVERLAPPENDE BOOKINGER) */
    // Tjek hver lokale for overlappende bookinger i det søgte tidsrum
    const available = featureMatched.filter((r) => {
      // Lokalet er ledigt hvis der IKKE findes overlappende bookinger
      return !dayBookings.some((b) => {
        // Ignorer bookinger i andre lokaler
        if (b.room_id !== r.id) return false;

        // Konverter booking tider til millisekunder for sammenligning
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        const s = start.getTime();
        const e = end.getTime();

        // Tjek om tidsintervaller overlapper
        // Overlapper hvis: søgning starter før booking slutter OG søgning slutter efter booking starter
        return s < bEnd && e > bStart;
      });
    }).sort((a, b) => {
      // Sorter efter etage først, derefter alfabetisk efter lokalenavn
      const fa = a.floor ?? 0;
      const fb = b.floor ?? 0;
      if (fa !== fb) return fa - fb;
      return (a.room_name || "").localeCompare(b.room_name || "");
    });

    /* TRIN 10: HÅNDTER RESULTAT BASERET PÅ ANTAL LEDIGE LOKALER */

    // Ingen ledige lokaler i det søgte tidsrum
    if (available.length === 0) {
      return setError({
        title: t("ErrorMsg.noAvailableRooms"),
        message: t("ErrorMsg.noAvailableText"),
      });
    }

    // Præcis ét ledigt lokale - åbn direkte opret-overlay
    if (available.length === 1) {
      return handleCreateBookingRequest({
        roomId: available[0].id,
        start,
        end,
      });
    }

    // Flere ledige lokaler - vis vælg-lokale overlay
    setAvailableRooms(available);
    setSearchTimes({ start, end });
    setSelectRoomOpen(true);
  }

  /* ---------------------------------------------------------
     OPRET BOOKING MED ALLE VALIDERINGS REGLER
     
     Dette er hovedfunktionen der opretter en ny booking.
     Udfører omfattende validering før data gemmes i database:
     
     VALIDERINGS TRIN:
     1. Tjek bruger er logget ind
     2. Valider tidspunkter (ikke null, gyldige Date objekter)
     3. Tjek ikke i fortiden
     4. Tjek ikke i weekend (lørdag/søndag)
     5. Tjek indenfor åbningstider (8-16)
     6. Valider booking limits baseret på brugerrolle
     7. Tjek for overlappende bookinger i samme lokale
     8. Gem i database
  --------------------------------------------------------- */

  /**
   * Opretter en ny booking med omfattende validering.
   * 
   * @param formData - Booking oplysninger fra formular
   * @param formData.roomId - ID på lokale der skal bookes
   * @param formData.title - Titel/formål med booking
   * @param formData.start - Start tidspunkt (Date)
   * @param formData.end - Slut tidspunkt (Date)
   * 
   * FLOW:
   * 1. Hent bruger fra Supabase auth
   * 2. Valider alle input data
   * 3. Tjek business regler (åbningstider, weekend, limits)
   * 4. Tjek for konflikter med eksisterende bookinger
   * 5. Gem i database
   * 6. Genindlæs bookinger
   * 7. Luk overlay
   */
  async function handleSubmitBooking(formData: {
    roomId: string;
    title: string;
    start: Date;
    end: Date;
  }) {
    try {
      // Destructure form data
      const { roomId, title, start, end } = formData;

      /* TRIN 1: HENT OG VALIDER BRUGER */
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      // Bruger skal være logget ind
      if (!user) {
        return setError({
          title: t("ErrorMsg.notLoggedIn"),
          message: t("ErrorMsg.mustBeLoggedIn"),
        });
      }

      /* TRIN 2: VALIDER TIDSPUNKTER */
      // Tjek at tidspunkter er gyldige Date objekter
      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return setError({
          title: t("ErrorMsg.invalidTime"),
          message: t("ErrorMsg.timeDataError"),
        });
      }

      /* TRIN 3: TJEK IKKE I FORTIDEN */
      if (dayjs(start).isBefore(dayjs())) {
        return setError({
          title: t("ErrorMsg.tooLate"),
          message: t("ErrorMsg.cantBookPast"),
        });
      }

      /* TRIN 4: TJEK IKKE I WEEKEND */
      const weekday = start.getDay(); // 0 = søndag, 6 = lørdag
      if (weekday === 0 || weekday === 6) {
        return setError({
          title: t("ErrorMsg.closed"),
          message: t("ErrorMsg.noWeekendBooking"),
        });
      }

      /* TRIN 5: TJEK ÅBNINGSTIDER */
      // Konverter til decimal timer (13:30 = 13.5)
      const sh = start.getHours() + start.getMinutes() / 60;
      const eh = end.getHours() + end.getMinutes() / 60;

      // Skal være indenfor 8:00-16:00
      if (sh < DAY_START_HOUR || eh > DAY_END_HOUR) {
        return setError({
          title: t("ErrorMsg.outsideHours"),
          message: t("ErrorMsg.withinHours", { start: DAY_START_HOUR, end: DAY_END_HOUR }),
        });
      }

      /* TRIN 6: VALIDER BOOKING LIMITS BASERET PÅ ROLLE */

      // Find alle fremtidige bookinger for denne bruger
      const now = new Date();
      const futureBookingsForUser = bookings.filter(
        (b) =>
          b.user_id === user.id &&
          new Date(b.end_time).getTime() > now.getTime()
      );

      // Valider booking limits (defineret i BookingRules.ts)
      // Forskellige regler for students, teachers og admins
      const limits = validateBookingLimits(
        role ?? "student",
        futureBookingsForUser,
        start,
        end
      );

      // Hvis limits overskrides, vis fejl og afbryd
      if (!limits.ok) {
        return setError({
          title: t("ErrorMsg.limitExceeded"),
          message: limits.message ? t(limits.message) : t("ErrorMsg.limitError"),
        });
      }

      /* TRIN 7: TJEK FOR OVERLAPPENDE BOOKINGER */

      // Tjek om lokalet allerede er booket i det valgte tidsrum
      const hasConflict = filteredBookings.some((b) => {
        // Ignorer bookinger i andre lokaler
        if (b.room_id !== roomId) return false;

        // Konverter til millisekunder for sammenligning
        const bS = new Date(b.start_time).getTime();
        const bE = new Date(b.end_time).getTime();
        const s = start.getTime();
        const e = end.getTime();

        // Tjek om tidsintervaller overlapper
        return s < bE && e > bS;
      });

      // Hvis konflikt, vis fejl og afbryd
      if (hasConflict) {
        return setError({
          title: t("ErrorMsg.occupied"),
          message: t("ErrorMsg.roomOccupied"),
        });
      }

      /* TRIN 8: GEM I DATABASE */

      // Indsæt ny booking i Supabase database
      const { error } = await supabase.from("bookings").insert({
        room_id: roomId,
        title: title,
        start_time: start.toISOString(),  // Konverter til ISO string format
        end_time: end.toISOString(),
        user_id: user.id,
        booking_type: "normal",           // Type: normal (ikke repeating)
        description: null,
      });

      // Håndter database fejl
      if (error) {
        console.error("SUPABASE ERROR:", error);
        throw error;
      }

      /* TRIN 9: OPDATER UI */

      // Genindlæs alle bookinger fra database
      await reloadBookings();

      // Luk overlay
      setOverlayOpen(false);

    } catch (err) {
      // Fang alle uventede fejl
      console.error("RAW ERROR:", err);
      setError({
        title: t("ErrorMsg.error"),
        message: t("ErrorMsg.generalError"),
      });
    }
  }

  // Hook til oversættelser
  const { t } = useTranslation();

  /* ---------------------------------------------------------
     RENDER BOOKING INTERFACE
     
     Hovedlayout med timeline, filtre og overlays.
  --------------------------------------------------------- */

  /**
   * KOMPONENT RETURN - HOVEDLAYOUT
   * 
   * Strukturen består af:
   * 1. Top filter bar (dato valg)
   * 2. To-spaltet layout:
   *    - Venstre: BookingTimeline (visuelt overblik)
   *    - Højre: Avancerede filtre
   * 3. Overlays (vises betinget baseret på state)
   */
  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-6 space-y-8">

      {/* TOP FILTER BAR */}
      {/* Indeholder dato-vælger og basis filtre */}
      <div className="flex items-center justify-between">
        <TopFilterBar />
      </div>

      {/* HOVED LAYOUT - TO SPALTER */}
      <div className="flex gap-10">

        {/* VENSTRE SPALTE - TIMELINE */}
        <div className="flex-1 space-y-6">
          {/* 
            BOOKING TIMELINE
            - Visuelt overblik over bookinger for valgt dag
            - Klik på tom plads for at oprette booking
            - Klik på booking for at slette (hvis egen)
          */}
          <BookingTimeline
            onCreateBooking={handleCreateBookingRequest}
            onDeleteBooking={handleDeleteBookingRequest}
          />

          {/* 
            BOOKING LIST - Deaktiveret efter UX test
            Liste-visning af bookinger blev fundet unødvendig
          */}
          {/* <BookingList /> */}
        </div>

        {/* HØJRE SPALTE - AVANCEREDE FILTRE */}
        <div className="w-[340px] shrink-0 space-y-6">
          {/* 
            AVANCERET SØGNING
            - Søg efter ledige lokaler
            - Filtrer efter faciliteter (whiteboard, screen, etc.)
            - Filtrer efter kapacitet, etage, type
          */}
          <BookingAdvancedFilters
            onSearch={handleAdvancedSearch}
            onError={(title, message) => setError({ title, message })}
          />
        </div>
      </div>

      {/* ========== OVERLAYS (BETINGET RENDERING) ========== */}

      {/* 
        OPRET BOOKING OVERLAY
        Vises når bruger har valgt et tidspunkt og lokale.
        Lader bruger indtaste titel og bekræfte booking.
      */}
      {overlayData && (
        <CreateBookingOverlay
          opened={overlayOpen}
          onClose={() => setOverlayOpen(false)}
          rooms={rooms}
          roomId={overlayData.roomId}
          start={overlayData.start}
          end={overlayData.end}
          onSubmit={handleSubmitBooking}
        />
      )}

      {/* 
        FEJL OVERLAY
        Vises når der opstår fejl (validering, database, etc.)
        Viser fejltitel og beskrivelse til bruger.
      */}
      {error && (
        <ErrorOverlay
          opened={!!error}
          title={error.title}
          message={error.message}
          onClose={() => setError(null)}
        />
      )}

      {/* 
        VÆLG LOKALE OVERLAY
        Vises når avanceret søgning finder flere ledige lokaler.
        Lader bruger vælge hvilket lokale de vil booke.
      */}
      {selectRoomOpen && searchTimes && (
        <SelectRoomOverlay
          opened={selectRoomOpen}
          onClose={() => setSelectRoomOpen(false)}
          rooms={availableRooms}
          start={searchTimes.start}
          end={searchTimes.end}
          onSelect={(roomId) => {
            // Valider at tidspunkt stadig er fremtid
            if (dayjs(searchTimes.start).isBefore(dayjs())) {
              return setError({
                title: t("ErrorMsg.tooLate"),
                message: t("ErrorMsg.timeAlreadyPassed"),
              });
            }

            // Luk overlay og åbn opret-booking overlay
            setSelectRoomOpen(false);
            handleCreateBookingRequest({
              roomId,
              start: searchTimes.start,
              end: searchTimes.end,
            });
          }}
        />
      )}

      {/* 
        SLET BOOKING OVERLAY
        Bekræftelses-dialog før sletning af booking.
        Viser booking detaljer (lokale, tid, bruger).
      */}
      {deleteOverlayOpen && bookingToDelete && (
        <DeleteBookingOverlay
          opened={deleteOverlayOpen}
          onClose={() => setDeleteOverlayOpen(false)}
          booking={bookingToDelete}
          // Find lokale data for den booking der skal slettes
          room={rooms.find((r) => r.id === bookingToDelete.room_id) || null}
          // Find bruger profil for den der oprettede bookingen
          profile={
            profiles.find((p) => p.id === bookingToDelete.user_id) || null
          }
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   PAGE WRAPPER KOMPONENT MED BOOKINGPROVIDER
   
   Dette er den ydre komponent der exporteres fra filen.
   Wrapper PageContent i BookingProvider for at give
   adgang til booking context (rooms, bookings, etc.)
--------------------------------------------------------- */

/**
 * PAGE WRAPPER COMPONENT
 * 
 * Exporteret komponent der wrapper PageContent i BookingProvider.
 * Dette sikrer at PageContent har adgang til booking context data.
 * 
 * HVORFOR DENNE STRUKTUR?
 * - BookingProvider leverer context med rooms, bookings, etc.
 * - PageContent skal bruge useBookingContext hook
 * - Hook kan kun bruges inde i provider
 * - Derfor: Page wrapper (med provider) → PageContent (bruger hook)
 */
export default function Page() {
  return (
    <BookingProvider>
      <PageContent />
    </BookingProvider>
  );
}
