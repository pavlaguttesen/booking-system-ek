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

// Typer -----------------------------------------------------

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

// Context ----------------------------------------------------

type BookingContextValue = {
  rooms: Room[];
  bookings: Booking[];
  profiles: Profile[];

  filteredRooms: Room[];
  filteredBookings: Booking[];

  selectedDate: string | null;
  setSelectedDate: (v: string | null) => void;

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

// Provider ---------------------------------------------------

export function BookingProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dayjs().format("YYYY-MM-DD")
  );

  // ⭐ DEFAULT FILTERS — admin starts on floor 1
  const [roomFilters, setRoomFilters] = useState({
    whiteboard: false,
    screen: false,
    board: false,
    capacity: null as number | null,
    floor: role === "admin" ? 1 : null,   // ⭐ FIX HERE
    roomType: null as string | null,
  });

  // If role changes (e.g. after login), update floor filter
  useEffect(() => {
    if (role === "admin") {
      setRoomFilters((prev) => ({ ...prev, floor: 1 }));
    } else {
      setRoomFilters((prev) => ({ ...prev, floor: null }));
    }
  }, [role]);

  // Normaliser "møderum"
  function normalizeType(type: string | null): string | null {
    return type === "møderum" ? "studierum" : type;
  }

  // Filter setters
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
      floor: role === "admin" ? 1 : null, // ⭐ keep default
      roomType: null,
    });
  }

  // LOADERS --------------------------------------------------------

  async function loadRooms() {
    const { data } = await supabase.from("rooms").select("*");
    setRooms((data || []).map((r) => ({ ...r, room_type: normalizeType(r.room_type) })));
  }

  async function loadBookings() {
    const { data } = await supabase.from("bookings").select("*");
    setBookings(data || []);
  }

  async function loadProfiles() {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data || []);
  }

  useEffect(() => {
    loadRooms();
    loadBookings();
    loadProfiles();
  }, []);

  // FILTERING --------------------------------------------------------

  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  const filteredRooms = rooms.filter((room) => {
    const t = normalizeType(room.room_type);

    // Rollefilter
    if (!allowedTypesForRole[role ?? "student"].includes(t || "")) return false;

    // Etagefilter — now works correctly!
    if (roomFilters.floor !== null && room.floor !== roomFilters.floor) {
      return false;
    }

    if (roomFilters.whiteboard && !room.has_whiteboard) return false;
    if (roomFilters.screen && !room.has_screen) return false;
    if (roomFilters.board && !room.has_board) return false;

    if (roomFilters.capacity && room.capacity! < roomFilters.capacity)
      return false;

    if (roomFilters.roomType && roomFilters.roomType !== t) return false;

    return true;
  });

  const filteredBookings = bookings.filter((b) => {
    if (!selectedDate) return true;
    return dayjs(b.start_time).isSame(selectedDate, "day");
  });

  const value: BookingContextValue = {
    rooms,
    bookings,
    profiles,

    filteredRooms,
    filteredBookings,

    selectedDate,
    setSelectedDate,

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
