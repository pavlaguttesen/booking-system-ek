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

  // NEW UI filters
  roomFilters: {
    whiteboard: boolean;
    screen: boolean;
    board: boolean;
    capacity: number | null;
  };

  toggleRoomFilter: (key: "whiteboard" | "screen" | "board") => void;
  setCapacityFilter: (value: number | null) => void;
  resetRoomFilters: () => void;   // ⬅️ NEW!
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

  // Dato + bookingtyper
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dayjs().format("YYYY-MM-DD")
  );
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [bookingTypeFilter, setBookingTypeFilter] = useState<
    "all" | "normal" | "exam"
  >("all");

  // -------------------------------
  // NEW — TopBar Filters
  // -------------------------------
  const [roomFilters, setRoomFilters] = useState({
    whiteboard: false,
    screen: false,
    board: false,
    capacity: null as number | null,
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

  function resetRoomFilters() {
    setRoomFilters({
      whiteboard: false,
      screen: false,
      board: false,
      capacity: null,
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
  // Filter bookinger efter dato/rum/bookingtype
  // -------------------------------
  const filteredBookings = bookings.filter((b) => {
    if (selectedRoomId !== "all" && b.room_id !== selectedRoomId) return false;
    if (bookingTypeFilter !== "all" && (b.booking_type || "normal") !== bookingTypeFilter)
      return false;
    if (selectedDate && !dayjs(b.start_time).isSame(dayjs(selectedDate), "day"))
      return false;
    return true;
  });

  // -------------------------------
  // Room filtering inkl. capacity
  // -------------------------------
  const filteredRooms = rooms.filter((room) => {
    if (roomFilters.whiteboard && !room.has_whiteboard) return false;
    if (roomFilters.screen && !room.has_screen) return false;
    if (roomFilters.board && !room.has_board) return false;

    if (roomFilters.capacity !== null) {
      if (!room.capacity || room.capacity < roomFilters.capacity) return false;
    }

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

    roomFilters,
    toggleRoomFilter,
    setCapacityFilter,
    resetRoomFilters, // ⬅️ nu er funktionen eksporteret
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBookingContext must be used inside BookingProvider");
  }
  return ctx;
}
