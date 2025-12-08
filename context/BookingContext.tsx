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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --------------------------------------------------
// Types
// --------------------------------------------------

export type RoomFilterKey = "whiteboard" | "screen" | "board";

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

export type Booking = {
  id: string;
  room_id: string;
  user_id: string | null;
  start_time: string;
  end_time: string;
  title: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
};

// --------------------------------------------------
// Context Value Type
// --------------------------------------------------

type BookingContextValue = {
  rooms: Room[];
  bookings: Booking[];
  profiles: Profile[];

  filteredRooms: Room[];
  filteredBookings: Booking[];

  selectedDate: string | null;
  setSelectedDate: (v: string | null) => void;

  reloadRooms: () => Promise<void>;
  reloadBookings: () => Promise<void>;

  roomFilters: {
    whiteboard: boolean;
    screen: boolean;
    board: boolean;
    capacity: number | null;
    floor: number | null;
    roomType: string | null;
  };

  toggleRoomFilter: (key: RoomFilterKey) => void;
  setCapacityFilter: (v: number | null) => void;
  setFloorFilter: (v: number | null) => void;
  setRoomTypeFilter: (v: string | null) => void;
  resetRoomFilters: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

// --------------------------------------------------
// Provider
// --------------------------------------------------

export function BookingProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dayjs().format("YYYY-MM-DD")
  );

  const [roomFilters, setRoomFilters] = useState({
    whiteboard: false,
    screen: false,
    board: false,
    capacity: null as number | null,
    floor: null as number | null, // ⭐ Students/Teachers -> alle etager
    roomType: null as string | null,
  });

  // --------------------------------------------------
  // Normaliser lokaletype
  // --------------------------------------------------
  function normalizeRoomType(type: string | null): string | null {
    if (!type) return null;
    const t = type.trim().toLowerCase();
    return t === "møderum" ? "studierum" : t;
  }

  // --------------------------------------------------
  // Filter indstillere
  // --------------------------------------------------

  function toggleRoomFilter(key: RoomFilterKey) {
    setRoomFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setCapacityFilter(value: number | null) {
    setRoomFilters((prev) => ({ ...prev, capacity: value }));
  }

  function setFloorFilter(value: number | null) {
    setRoomFilters((prev) => ({ ...prev, floor: value }));
  }

  function setRoomTypeFilter(value: string | null) {
    setRoomFilters((prev) => ({ ...prev, roomType: value }));
  }

  function resetRoomFilters() {
    setRoomFilters({
      whiteboard: false,
      screen: false,
      board: false,
      capacity: null,
      floor: role === "admin" ? 1 : null, // ⭐ Reset afhænger af rolle
      roomType: null,
    });
  }

  // --------------------------------------------------
  // Dataindlæsere
  // --------------------------------------------------

  async function reloadRooms() {
    const { data } = await supabase.from("rooms").select("*");
    setRooms(
      (data || []).map((r) => ({
        ...r,
        room_type: normalizeRoomType(r.room_type),
        is_closed: r.is_closed ?? false, // ⭐ vigtigt fallback
      }))
    );
  }

  async function reloadBookings() {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true });

    setBookings(data || []);
  }

  async function loadProfiles() {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data || []);
  }

  // Load all initial data
  useEffect(() => {
    Promise.all([reloadRooms(), reloadBookings(), loadProfiles()]);
  }, []);

  // --------------------------------------------------
  // ROLE → FLOOR HANDLING
  // --------------------------------------------------

  useEffect(() => {
    if (!role) return;

    if (role === "admin") {
      // Admin: skal kun se én etage ad gangen
      setRoomFilters((prev) => ({
        ...prev,
        floor: prev.floor ?? 1, // default til 1 hvis floor var null
      }));
    } else {
      // Students & Teachers: se alt
      setRoomFilters((prev) => ({
        ...prev,
        floor: null,
      }));
    }
  }, [role]);

  // --------------------------------------------------
  // ROLE → ROOM ACCESS
  // --------------------------------------------------

  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  // --------------------------------------------------
  // FILTRER RUM
  // --------------------------------------------------

  const filteredRooms = rooms.filter((room) => {
    if (!role) return false; // vent på auth før filtrering

    const type = normalizeRoomType(room.room_type);

    // Rollebegrænsning
    if (type && !allowedTypesForRole[role].includes(type)) return false;

    // Facilities
    if (roomFilters.whiteboard && !room.has_whiteboard) return false;
    if (roomFilters.screen && !room.has_screen) return false;
    if (roomFilters.board && !room.has_board) return false;

    // Capacity
    if (
      roomFilters.capacity !== null &&
      (room.capacity === null || room.capacity < roomFilters.capacity)
    ) {
      return false;
    }

    // Floor (kun admin)
    if (roomFilters.floor !== null && room.floor !== roomFilters.floor)
      return false;

    // Rumtype filter
    if (roomFilters.roomType && roomFilters.roomType !== type) return false;

    return true;
  });

  // --------------------------------------------------
  // FILTRER BOOKINGER EFTER DATO
  // --------------------------------------------------

  const filteredBookings = bookings.filter((b) =>
    selectedDate ? dayjs(b.start_time).isSame(selectedDate, "day") : true
  );

  // --------------------------------------------------
  // VALUE
  // --------------------------------------------------

  const value: BookingContextValue = {
    rooms,
    bookings,
    profiles,

    filteredRooms,
    filteredBookings,

    selectedDate,
    setSelectedDate,

    reloadRooms,
    reloadBookings,

    roomFilters,
    toggleRoomFilter,
    setCapacityFilter,
    setFloorFilter,
    setRoomTypeFilter,
    resetRoomFilters,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBookingContext() {
  const ctx = useContext(BookingContext);
  if (!ctx)
    throw new Error("useBookingContext must be used inside BookingProvider");
  return ctx;
}
