/**
 * BookingContext.tsx
 * 
 * Dette er systemets centrale kontekst for booking-funktionalitet.
 * Den håndterer al data og business logic relateret til lokaler, bookinger og filtrering.
 * 
 * HOVEDANSVARSOMRÅDER:
 * - Hente og cache alle lokaler fra databasen
 * - Hente og cache alle bookinger fra databasen
 * - Hente bruger-profiler til visning i booking-oversigt
 * - Håndtere filtrering af lokaler baseret på faciliteter, kapacitet, etage og type
 * - Implementere rolle-baseret adgangskontrol til lokaler
 * - Filtrere bookinger efter valgt dato
 * - Levere reload-funktioner til at opdatere data efter ændringer
 * 
 * ROLLE-BASERET LOGIK:
 * - Studerende: Kan kun se og booke studierum, kan se alle etager
 * - Lærere: Kan kun se og booke klasseværelser og auditorier, kan se alle etager
 * - Admin: Kan se og booke alt, men skal vælge én etage ad gangen for overblik
 * 
 * BRUGES AF:
 * - Booking-komponenter til at vise tilgængelige lokaler
 * - Timeline-komponenter til at vise bookinger
 * - Admin-paneler til at administrere lokaler og bookinger
 * - Filter-komponenter til at justere visningen
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";

// Initialisér Supabase klient med miljøvariabler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --------------------------------------------------
// Type Definitioner
// --------------------------------------------------

/**
 * Type for nøgler til room facility filters.
 * Bruges til at type-checke hvilke facility filters der kan toggles.
 */
export type RoomFilterKey = "whiteboard" | "screen" | "board";

/**
 * Type definition for et lokale/rum i systemet.
 * 
 * @property id - UUID primary key
 * @property room_name - Navnet på lokalet (f.eks. "A101", "Mødelokale 3")
 * @property nr_of_seats - Antal siddepladser (legacy felt, capacity bruges nu)
 * @property floor - Etagen lokalet ligger på (1, 2, 3, osv.)
 * @property has_whiteboard - Om lokalet har whiteboard
 * @property has_screen - Om lokalet har projektor/skærm
 * @property has_board - Om lokalet har tavle
 * @property capacity - Maksimal kapacitet (antal personer)
 * @property room_type - Type af lokale ("studierum", "klasseværelse", "auditorium")
 * @property is_closed - Om lokalet er lukket og ikke kan bookes
 */
export type Room = {
  id: string;
  room_name: string;
  nr_of_seats: number | null;
  floor: number | null;
  has_whiteboard: boolean | null;
  has_screen: boolean | null;
  has_board: boolean | null;
  capacity: number | null;
  room_type: string | null;
  is_closed: boolean | null;
};

/**
 * Type definition for en booking i systemet.
 * 
 * @property id - UUID primary key
 * @property room_id - Foreign key til lokalet der er booket
 * @property user_id - Foreign key til brugeren der lavede bookingen
 * @property start_time - Start tidspunkt (ISO 8601 string)
 * @property end_time - Slut tidspunkt (ISO 8601 string)
 * @property title - Optional titel/beskrivelse af bookingen
 * @property is_repeating - Om denne booking er del af en gentagen serie
 * @property parent_repeating_id - Foreign key til parent repeating booking hvis relevant
 */
export type Booking = {
  id: string;
  room_id: string;
  user_id: string | null;
  start_time: string;
  end_time: string;
  title: string | null;
  is_repeating?: boolean;
  parent_repeating_id?: string | null;
};

/**
 * Type definition for en gentagen booking template.
 * 
 * Denne type repræsenterer en skabelon for gentagne bookinger (f.eks. ugentlige møder).
 * Systemet genererer individuelle Booking entries baseret på denne template.
 * 
 * @property id - UUID primary key
 * @property room_id - Foreign key til lokalet
 * @property title - Titel for alle bookinger i serien
 * @property start_time - Start tid (kun tidspunkt, ikke dato)
 * @property end_time - Slut tid (kun tidspunkt, ikke dato)
 * @property recurrence_type - Type af gentagelse ("daily", "weekly", "biweekly", "monthly")
 * @property recurrence_end_date - Sidste dato hvor bookingen skal gentages
 * @property is_active - Om serien stadig er aktiv (kan deaktiveres uden at slette)
 * @property created_by - User ID på personen der lavede serien
 * @property created_at - Tidspunkt for oprettelse
 * @property updated_at - Tidspunkt for sidste opdatering
 */
export type RepeatingBooking = {
  id: string;
  room_id: string;
  title: string | null;
  start_time: string;
  end_time: string;
  recurrence_type: "daily" | "weekly" | "biweekly" | "monthly";
  recurrence_end_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/**
 * Forenklet profil type til booking context.
 * 
 * Bruges til at vise information om hvem der har lavet en booking.
 * Dette er en simplificeret version af den fulde Profile type fra AuthContext.
 */
export type Profile = {
  id: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
};

// --------------------------------------------------
// Context Value Type
// --------------------------------------------------

/**
 * Type definition for alle værdier tilgængelige gennem BookingContext.
 * Dette er den contract som komponenter kan forlade sig på.
 */
type BookingContextValue = {
  // Raw data fra databasen
  rooms: Room[];              // Alle lokaler
  bookings: Booking[];        // Alle bookinger
  profiles: Profile[];        // Alle bruger-profiler
  
  // Filtrerede data baseret på filters og rolle
  filteredRooms: Room[];      // Lokaler efter filtrering
  filteredBookings: Booking[]; // Bookinger for valgt dato
  
  // Dato-valg state
  selectedDate: string | null; // Valgt dato i YYYY-MM-DD format
  setSelectedDate: (v: string | null) => void;
  
  // Data reload funktioner
  reloadRooms: () => Promise<void>;
  reloadBookings: () => Promise<void>;
  
  // Filter state
  roomFilters: {
    whiteboard: boolean;      // Skal have whiteboard?
    screen: boolean;          // Skal have skærm?
    board: boolean;           // Skal have tavle?
    capacity: number | null;  // Minimum kapacitet
    floor: number | null;     // Specifik etage (null = alle)
    roomType: string | null;  // Specifik rum-type (null = alle)
  };
  
  // Filter manipulation funktioner
  toggleRoomFilter: (key: RoomFilterKey) => void;
  setCapacityFilter: (v: number | null) => void;
  setFloorFilter: (v: number | null) => void;
  setRoomTypeFilter: (v: string | null) => void;
  resetRoomFilters: () => void;
};

/**
 * Opretter React Context med null som default.
 * Komponenter skal bruge useBookingContext hook som tvinger Provider-wrapping.
 */
const BookingContext = createContext<BookingContextValue | null>(null);

// --------------------------------------------------
// Provider Komponent
// --------------------------------------------------

/**
 * BookingProvider leverer booking context til hele applikationen.
 * 
 * INITIALISERING:
 * - Henter initial data (rooms, bookings, profiles) ved mount
 * - Sætter default dato til i dag
 * - Initialiserer filters baseret på brugerrolle
 * 
 * ROLLE-BASERET LOGIK:
 * - Admin: Default floor filter sat til 1 (skal vælge etage)
 * - Student/Teacher: Ingen floor filter (ser alle etager)
 * 
 * @param children - Child komponenter der skal have adgang til booking context
 */
export function BookingProvider({ children }: { children: ReactNode }) {
  // Hent brugerrolle fra AuthContext for rolle-baseret filtrering
  const { role } = useAuth();

  // STATE: Raw data fra databasen
  // rooms: Alle lokaler i systemet
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // bookings: Alle bookinger i systemet (alle datoer, alle lokaler)
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // profiles: Alle bruger-profiler for at vise hvem der har booket
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // selectedDate: Den dato brugeren har valgt at se bookinger for
  // Standard: i dag i YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dayjs().format("YYYY-MM-DD")
  );

  // STATE: Filter indstillinger for lokaler
  // Disse filters bestemmer hvilke lokaler der vises i UI
  const [roomFilters, setRoomFilters] = useState({
    whiteboard: false,              // Hvis true, vis kun lokaler med whiteboard
    screen: false,                  // Hvis true, vis kun lokaler med skærm
    board: false,                   // Hvis true, vis kun lokaler med tavle
    capacity: null as number | null, // Minimum kapacitet, null = ingen filter
    floor: null as number | null,   // Specifik etage, null = alle etager (standard for studerende/lærere)
    roomType: null as string | null, // Specifik rum-type, null = alle typer
  });

  // --------------------------------------------------
  // Hjælpe-funktioner
  // --------------------------------------------------
  
  /**
   * Normaliserer lokaletype for konsistens på tværs af systemet.
   * 
   * FORMÅL:
   * Databasen kan indeholde inkonsistente værdier (f.eks. "Møderum" vs "møderum").
   * Denne funktion sikrer at vi altid arbejder med lowercase og konsistente værdier.
   * 
   * @param roomType - Den rå room_type værdi fra databasen
   * @returns Normaliseret room_type string eller null
   */
  function normalizeRoomType(roomType: string | null): string | null {
    if (!roomType) return null;
    return roomType.toLowerCase().trim();
  }

  /**
   * Map der definerer hvilke lokaltyper hver rolle må se og booke.
   * 
   * FORRETNINGS-REGLER:
   * - Studerende: Kun studierum (små rum til gruppearbejde)
   * - Lærere: Kun klasseværelser og auditorier (undervisningslokaler)
   * - Admin: Alt (fuld adgang til alle lokaltyper)
   */
  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  // --------------------------------------------------
  // Filter Manipulation Funktioner
  // --------------------------------------------------

  /**
   * Toggler en facility filter on/off.
   * 
   * Bruges til at toggle whiteboard, screen eller board filters.
   * Hvis filteret er false, sæt til true. Hvis true, sæt til false.
   * 
   * @param key - Nøglen for den facility der skal toggles
   * 
   * @example
   * toggleRoomFilter("whiteboard") // Slår whiteboard filter til/fra
   */
  function toggleRoomFilter(key: RoomFilterKey) {
    setRoomFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /**
   * Sætter minimum kapacitets-filter.
   * 
   * Når sat, vises kun lokaler med kapacitet >= denne værdi.
   * Null fjerner filteret.
   * 
   * @param value - Minimum kapacitet eller null for at fjerne filter
   */
  function setCapacityFilter(value: number | null) {
    setRoomFilters((prev) => ({ ...prev, capacity: value }));
  }

  /**
   * Sætter etage-filter.
   * 
   * Når sat, vises kun lokaler på denne etage.
   * Null viser alle etager (standard for studerende/lærere).
   * 
   * ROLLE-LOGIK:
   * - Admin: Skal bruge dette filter for at vælge etage
   * - Student/Teacher: Kan bruge det optionelt, default er null (alle)
   * 
   * @param value - Etage nummer eller null for alle etager
   */
  function setFloorFilter(value: number | null) {
    setRoomFilters((prev) => ({ ...prev, floor: value }));
  }

  /**
   * Sætter rum-type filter.
   * 
   * Når sat, vises kun lokaler af denne type.
   * Null viser alle tilladte typer for brugerens rolle.
   * 
   * @param value - Rum-type string eller null for alle typer
   */
  function setRoomTypeFilter(value: string | null) {
    setRoomFilters((prev) => ({ ...prev, roomType: value }));
  }

  /**
   * Nulstiller alle rum-filters til deres default værdier.
   * 
   * VIGTIGT: Floor filter afhænger af brugerrolle:
   * - Admin: Reset til etage 1 (skal vælge én etage)
   * - Andre: Reset til null (ser alle etager)
   */
  function resetRoomFilters() {
    setRoomFilters({
      whiteboard: false,
      screen: false,
      board: false,
      capacity: null,
      floor: role === "admin" ? 1 : null,
      roomType: null,
    });
  }

  // --------------------------------------------------
  // Data Indlæsnings-funktioner
  // --------------------------------------------------

  /**
   * Henter alle lokaler fra databasen og opdaterer state.
   * 
   * PROCES:
   * 1. Query "rooms" tabellen for alle rækker
   * 2. Normaliser room_type for konsistens
   * 3. Sæt is_closed til false hvis null (sikkerhed mod database inkonsistens)
   * 4. Opdater rooms state
   * 
   * Denne funktion kaldes:
   * - Ved initial mount
   * - Efter et lokale er oprettet/redigeret/slettet
   * - Når admin ønsker at opdatere visningen
   * 
   * @returns Promise der resolver når rooms er hentet og state er opdateret
   */
  async function reloadRooms() {
    // Hent alle lokaler fra databasen
    const { data } = await supabase.from("rooms").select("*");
    
    // Map data og normaliser værdier
    setRooms(
      (data || []).map((r) => ({
        ...r,
        // Normaliser room_type for konsistent håndtering
        room_type: normalizeRoomType(r.room_type),
        // Sikr at is_closed altid har en værdi (false hvis null)
        // Dette forhindrer undefined checks i hele applikationen
        is_closed: r.is_closed ?? false,
      }))
    );
  }

  /**
   * Henter alle bookinger fra databasen og opdaterer state.
   * 
   * PROCES:
   * 1. Query "bookings" tabellen for alle rækker
   * 2. Sorter efter start_time (ascending) for kronologisk visning
   * 3. Opdater bookings state
   * 
   * Denne funktion kaldes:
   * - Ved initial mount
   * - Efter en booking er oprettet/redigeret/slettet
   * - Efter en gentagen booking er genereret
   * - Når brugeren ønsker at opdatere visningen
   * 
   * @returns Promise der resolver når bookings er hentet og state er opdateret
   */
  async function reloadBookings() {
    // Hent alle bookinger sorteret efter start tidspunkt
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true }); // Ældste først

    // Opdater state (brug tom array hvis data er null)
    setBookings(data || []);
  }

  /**
   * Henter alle bruger-profiler fra databasen og opdaterer state.
   * 
   * Profiler bruges til at vise information om hvem der har lavet bookinger.
   * Dette gør det muligt at vise brugernavne i booking-oversigten uden
   * at lave en join query hver gang.
   * 
   * Denne funktion kaldes kun ved initial mount da profiler sjældent ændres.
   * 
   * @returns Promise der resolver når profiles er hentet og state er opdateret
   */
  async function loadProfiles() {
    // Hent alle profiler (vi cacher dem lokalt)
    const { data } = await supabase.from("profiles").select("*");
    
    // Opdater state
    setProfiles(data || []);
  }

  /**LE-BASERET FLOOR FILTER LOGIK
  // --------------------------------------------------

  /**
   * Effect der indlæser initial data ved komponent mount.
   * 
   * PROCES:
   * Kører alle data-indlæsnings funktioner i parallel for hurtigere initial load.
   * - reloadRooms(): Henter alle lokaler
   * - reloadBookings(): Henter alle bookinger
   * - loadProfiles(): Henter alle bruger-profiler
   * 
   * TRIGGER: Kun ved mount (tom dependency array)
   */
  useEffect(() => {
    Promise.all([reloadRooms(), reloadBookings(), loadProfiles()]);
  }, []);

  // --------------------------------------------------
  // ROLLE-BASERET FLOOR FILTER LOGIK
  // --------------------------------------------------

  /**
   * Effect der justerer floor filter baseret på brugerrolle.
   * 
   * FORRETNINGS-REGEL:
   * - Admin: Skal vælge én etage ad gangen for bedre overblik
   *   (default til etage 1 hvis ingen etage er valgt)
   * - Studerende/Lærere: Kan se alle etager på én gang
   *   (floor filter sættes til null)
   * 
   * Dette effect kører når brugerens rolle ændres (typisk ved login).
   * 
   * TRIGGER: Når role ændres (fra AuthContext)
   */
  useEffect(() => {
    // Vent til rolle er loaded fra AuthContext
    if (!role) return;

    if (role === "admin") {
      // Admin: Skal kun se én etage ad gangen for bedre UI
      setRoomFilters((prev) => ({
        ...prev,
        // Hvis floor allerede er sat, behold værdien
        // Ellers standard til etage 1
        floor: prev.floor ?? 1,
      }));
    } else {
      // Studerende & Lærere: Se alle etager på én gang
      setRoomFilters((prev) => ({
        ...prev,
        floor: null, // null = ingen etage filter = vis alt
      }));
    }
  }, [role]); // Kør når role ændres

  // --------------------------------------------------
  // LOKALE FILTRERING
  // --------------------------------------------------

  /**
   * Filtreret liste af lokaler baseret på rolle og aktive filters.
   * 
   * FILTERINGS-LOGIK (i denne rækkefølge):
   * 1. Rolle-baseret adgangskontrol (student/teacher/admin typer)
   * 2. Facility filters (whiteboard, screen, board)
   * 3. Kapacitets-filter (minimum antal pladser)
   * 4. Etage-filter (specifik etage, primært for admin)
   * 5. Rum-type filter (specifik type, hvis valgt)
   * 
   * Denne computed value genberegnes automatisk når:
   * - rooms ændres (nye data fra database)
   * - role ændres (bruger logger ind/ud)
   * - roomFilters ændres (bruger justerer filters)
   * 
   * @returns Array af Room objekter der matcher alle aktive filters
   */
  const filteredRooms = rooms.filter((room) => {
    // SIKKERHEDSTJEK: Vent på at rolle er loaded før filtrering
    // Dette forhindrer at vi viser forkert data før auth er klar
    if (!role) return false;

    // Normaliser room type for konsistent sammenligning
    const type = normalizeRoomType(room.room_type);

    // FILTER 1: Rolle-baseret adgangskontrol
    // Tjek om dette lokaltype er tilladt for brugerens rolle
    if (type && !allowedTypesForRole[role].includes(type)) return false;

    // FILTER 2: Facility filters (whiteboard, screen, board)
    // Hvis et facility filter er aktivt, skal lokalet have den facility
    if (roomFilters.whiteboard && !room.has_whiteboard) return false;
    if (roomFilters.screen && !room.has_screen) return false;
    if (roomFilters.board && !room.has_board) return false;

    // FILTER 3: Kapacitets-filter
    // Hvis sat, vis kun lokaler med kapacitet >= filterværdien
    if (
      roomFilters.capacity !== null &&
      (room.capacity === null || room.capacity < roomFilters.capacity)
    ) {
      return false;
    }

    // FILTER 4: Etage-filter
    // Hvis sat (typisk for admin), vis kun lokaler på denne etage
    if (roomFilters.floor !== null && room.floor !== roomFilters.floor)
      return false;

    // FILTER 5: Rum-type filter
    // Hvis sat, vis kun lokaler af denne specifikke type
    if (roomFilters.roomType && roomFilters.roomType !== type) return false;

    // Alle filters er passed - vis dette lokale
    return true;
  });

  // --------------------------------------------------
  // BOOKING FILTRERING EFTER DATO
  // --------------------------------------------------

  /**
   * Filtreret liste af bookinger for den valgte dato.
   * 
   * FILTRERINGS-LOGIK:
   * - Hvis en dato er valgt: Vis kun bookinger der starter på denne dato
   * - Hvis ingen dato er valgt: Vis alle bookinger
   * 
   * Bruger dayjs til dato-sammenligning for at sikre korrekt håndtering
   * af forskellige tidszone og format problemer.
   */
  const filteredBookings = bookings.filter((b) =>
    selectedDate ? dayjs(b.start_time).isSame(selectedDate, "day") : true
  );

  // --------------------------------------------------
  // CONTEXT VALUE SAMMENSÆTNING
  // --------------------------------------------------

  /**
   * Samler alle værdier der skal være tilgængelige gennem context.
   * 
   * STRUKTUR:
   * - Raw data arrays (rooms, bookings, profiles)
   * - Computed/filtrerede data (filteredRooms, filteredBookings)
   * - State og setters (selectedDate, setSelectedDate)
   * - Reload funktioner (reloadRooms, reloadBookings)
   * - Filter state og manipulation funktioner
   * 
   * Dette objekt er den fulde API som komponenter kan tilgå via useBookingContext.
   */
  const value: BookingContextValue = {
    // Raw data fra databasen
    rooms,                  // Alle lokaler
    bookings,               // Alle bookinger
    profiles,               // Alle bruger-profiler
    
    // Computed/filtrerede data
    filteredRooms,          // Lokaler efter rolle og filter
    filteredBookings,       // Bookinger for valgt dato
    
    // Dato-valg
    selectedDate,           // Valgt dato (YYYY-MM-DD)
    setSelectedDate,        // Funktion til at ændre valgt dato
    
    // Data reload funktioner
    reloadRooms,            // Genindlæs lokaler fra database
    reloadBookings,         // Genindlæs bookinger fra database
    
    // Filter state og manipulation
    roomFilters,            // Nuværende filter state
    toggleRoomFilter,       // Toggle facility filter
    setCapacityFilter,      // Sæt kapacitets-filter
    setFloorFilter,         // Sæt etage-filter
    setRoomTypeFilter,      // Sæt rum-type filter
    resetRoomFilters,       // Nulstil alle filters
  };

  // Render Provider med samlet værdi
  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

/**
 * Custom hook til at tilgå booking context i komponenter.
 * 
 * BRUG:
 * ```tsx
 * const { filteredRooms, filteredBookings, selectedDate } = useBookingContext();
 * ```
 * 
 * SIKKERHED:
 * Kaster en fejl hvis brugt uden for BookingProvider.
 * Dette fanger udviklingsfejl tidligt og giver en klar fejlbesked.
 * 
 * @returns BookingContextValue objekt med alle booking-relaterede værdier og funktioner
 * @throws Error hvis ikke brugt inden for en BookingProvider
 */
export function useBookingContext() {
  const ctx = useContext(BookingContext);
  
  // Sikkerhedstjek: Context må ikke være null
  if (!ctx)
    throw new Error("useBookingContext must be used inside BookingProvider");
  
  return ctx;
}
