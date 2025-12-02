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
import { useAuth } from "@/context/AuthContext"; // ← NYT

// Env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase URL eller KEY mangler. Tjek .env.local (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY)."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// -------------------------------
// Typer
// -------------------------------
export type Room = {
  id: string;
  room_name: string;
  nr_of_seats: number | null;
  floor: number | null;
  created_at: string | null;
  has_whiteboard: boolean | null;
  has_screen: boolean | null;
  has_board: boolean | null;
  capacity: number | null;
  room_type?: string | null;
  is_closed?: boolean | null;
};

export type Booking = {
  id: string;
  room_id: string;
  user_id: string | null;
  title: string | null;
  description: string | null;
  start_time: string;
  end_time: string;
  created_at: string | null;
  booking_type: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin" | null;
};

// -------------------------------
// Context Type
// -------------------------------
type BookingContextValue = {
  rooms: Room[];
  profiles: Profile[];
  bookings: Booking[];
  filteredBookings: Booking[];
  filteredRooms: Room[];

  loading: boolean;
  errorMsg: string | null;

  selectedDate: string | null;
  selectedRoomId: string;
  bookingTypeFilter: "all" | "normal" | "exam";

  setSelectedDate: (v: string | null) => void;
  setSelectedRoomId: (v: string) => void;
  setBookingTypeFilter: (v: "all" | "normal" | "exam") => void;

  reloadBookings: () => Promise<void>;
  reloadRooms: () => Promise<void>;

  roomFilters: {
    whiteboard: boolean;
    screen: boolean;
    board: boolean;
    capacity: number | null;
    floor: number | null;
    roomType: string | null;
  };

  toggleRoomFilter: (key: "whiteboard" | "screen" | "board") => void;
  setCapacityFilter: (value: number | null) => void;
  setFloorFilter: (value: number | null) => void;
  setRoomTypeFilter: (value: string | null) => void;
  resetRoomFilters: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

// -------------------------------
// Provider
// -------------------------------
export function BookingProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(
    dayjs().format("YYYY-MM-DD")
  );
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [bookingTypeFilter, setBookingTypeFilter] = useState<
    "all" | "normal" | "exam"
  >("all");

  const { role } = useAuth(); // ← NYT

  // Hvem må SE hvilke typer lokaler
  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum", "møderum"],
    teacher: ["møderum", "klasseværelse", "auditorium"],
    admin: ["studierum", "møderum", "klasseværelse", "auditorium"],
  };

  // -------------------------------
  // Filters
  // -------------------------------
  const [roomFilters, setRoomFilters] = useState({
    whiteboard: false,
    screen: false,
    board: false,
    capacity: null as number | null,
    floor: null as number | null,
    roomType: null as string | null,
  });

  function toggleRoomFilter(key: "whiteboard" | "screen" | "board") {
    setRoomFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function setCapacityFilter(value: number | null) {
    setRoomFilters((prev) => ({
      ...prev,
      capacity: value,
    }));
  }

  function setFloorFilter(value: number | null) {
    setRoomFilters((prev) => ({
      ...prev,
      floor: value,
    }));
  }

  function setRoomTypeFilter(value: string | null) {
    setRoomFilters((prev) => ({
      ...prev,
      roomType: value,
    }));
  }

  function resetRoomFilters() {
    setRoomFilters({
      whiteboard: false,
      screen: false,
      board: false,
      capacity: null,
      floor: null,
      roomType: null,
    });
  }

  // -------------------------------
  // Loaders
  // -------------------------------
  async function loadRooms() {
    const { data, error } = await supabase.from("rooms").select("*");
    if (error) return setErrorMsg(error.message);
    setRooms((data as Room[]) || []);
  }

  async function reloadRooms() {
    await loadRooms();
  }

  async function loadProfiles() {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) return setErrorMsg(error.message);
    setProfiles((data as Profile[]) || []);
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) return setErrorMsg(error.message);
    setBookings((data as Booking[]) || []);
  }

  async function reloadBookings() {
    await loadBookings();
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadRooms(), loadProfiles(), loadBookings()]);
      setLoading(false);
    })();
  }, []);

  // -------------------------------
  // Room filtering (MED ROLLECHECK)
  // -------------------------------
  const filteredRooms = rooms.filter((room) => {
    // 1️⃣ Rollebaseret filtrering
    if (role) {
      const allowed = allowedTypesForRole[role] || [];
      if (room.room_type && !allowed.includes(room.room_type)) {
        return false;
      }
    }

    // 2️⃣ Eksisterende filtre
    if (roomFilters.whiteboard && !room.has_whiteboard) return false;
    if (roomFilters.screen && !room.has_screen) return false;
    if (roomFilters.board && !room.has_board) return false;

    if (roomFilters.capacity !== null) {
      if (!room.capacity || room.capacity < roomFilters.capacity) return false;
    }

    if (roomFilters.floor !== null) {
      if (room.floor !== roomFilters.floor) return false;
    }

    if (roomFilters.roomType !== null) {
      if (room.room_type !== roomFilters.roomType) return false;
    }

    return true;
  });

  // -------------------------------
  // Booking filtering
  // -------------------------------
  const filteredBookings = bookings.filter((b) => {
    if (selectedRoomId !== "all" && b.room_id !== selectedRoomId) return false;
    if (
      bookingTypeFilter !== "all" &&
      (b.booking_type || "normal") !== bookingTypeFilter
    )
      return false;
    if (selectedDate && !dayjs(b.start_time).isSame(selectedDate, "day"))
      return false;
    return true;
  });

  // -------------------------------
  // Value Object
  // -------------------------------
  const value: BookingContextValue = {
    rooms,
    profiles,
    bookings,
    filteredBookings,
    filteredRooms,

    loading,
    errorMsg,

    selectedDate,
    selectedRoomId,
    bookingTypeFilter,

    setSelectedDate,
    setSelectedRoomId,
    setBookingTypeFilter,

    reloadBookings,
    reloadRooms,

    roomFilters,
    toggleRoomFilter,
    setCapacityFilter,
    setFloorFilter,
    setRoomTypeFilter,
    resetRoomFilters,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

// -------------------------------
// Hook
// -------------------------------
export function useBookingContext() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBookingContext must be used inside BookingProvider");
  }
  return ctx;
}
