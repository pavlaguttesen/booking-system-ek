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
// Context Type
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
    floor: 1 as number | null, // 👈 DEFAULT FLOOR = 1 (fixer admin view)
    roomType: null as string | null,
  });

  // --------------------------------------------------
  // Normaliser lokaletype
  // --------------------------------------------------
  function normalizeRoomType(type: string | null): string | null {
    if (!type) return null;
    if (type === "møderum") return "studierum";
    return type;
  }

  // --------------------------------------------------
  // Filter functions
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
      floor: 1, // 👈 Reset → default til 1
      roomType: null,
    });
  }

  // --------------------------------------------------
  // LOADERS
  // --------------------------------------------------

  async function reloadRooms() {
    const { data } = await supabase.from("rooms").select("*");
    setRooms(
      (data || []).map((r) => ({
        ...r,
        room_type: normalizeRoomType(r.room_type),
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

  useEffect(() => {
    reloadRooms();
    reloadBookings();
    loadProfiles();
  }, []);

  // --------------------------------------------------
  // ROLE → ROOM ACCESS
  // --------------------------------------------------

  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  // --------------------------------------------------
  // FILTER ROOMS
  // --------------------------------------------------

  const filteredRooms = rooms.filter((room) => {
    const type = normalizeRoomType(room.room_type);

    // rollebegrænsning
    if (!allowedTypesForRole[role ?? "student"].includes(type || "")) return false;

    if (roomFilters.whiteboard && !room.has_whiteboard) return false;
    if (roomFilters.screen && !room.has_screen) return false;
    if (roomFilters.board && !room.has_board) return false;

    if (roomFilters.capacity && room.capacity! < roomFilters.capacity)
      return false;

    if (roomFilters.floor && room.floor !== roomFilters.floor) return false;

    if (roomFilters.roomType && roomFilters.roomType !== type) return false;

    return true;
  });

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
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookingContext must be used inside BookingProvider");
  return ctx;
}
