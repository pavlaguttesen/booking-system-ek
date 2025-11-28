"use client";

// BookingContext håndterer data fra Supabase (rooms, bookings, profiles)
// samt de filtre, som resten af appen bruger.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

// Læs miljøvariabler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Giver en tydelig fejl hvis env mangler
  throw new Error(
    "Supabase URL eller KEY mangler. Tjek din .env.local (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY)."
  );
}

// Supabase client (kun anon-key)
const supabase = createClient(supabaseUrl, supabaseKey);

// Typer baseret på dine tabeller
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
  start_time: string; // ISO
  end_time: string; // ISO
  created_at: string | null;
  booking_type: string | null; // fx "normal" | "exam"
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin" | null;
};

type BookingContextValue = {
  rooms: Room[];
  profiles: Profile[];
  bookings: Booking[];
  filteredBookings: Booking[];
  loading: boolean;
  errorMsg: string | null;

  // Filtre
  selectedDate: string | null; // "YYYY-MM-DD"
  selectedRoomId: string; // "all" eller room.id
  bookingTypeFilter: "all" | "normal" | "exam";

  setSelectedDate: (v: string | null) => void;
  setSelectedRoomId: (v: string) => void;
  setBookingTypeFilter: (v: "all" | "normal" | "exam") => void;

  reloadBookings: () => Promise<void>;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtre
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dayjs().format("YYYY-MM-DD")
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [bookingTypeFilter, setBookingTypeFilter] = useState<
    "all" | "normal" | "exam"
  >("all");

  // --------- LOADERS ---------

  async function loadRooms() {
    const { data, error } = await supabase.from("rooms").select("*");
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setRooms((data as Room[]) || []);
  }

  async function loadProfiles() {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setProfiles((data as Profile[]) || []);
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setBookings((data as Booking[]) || []);
  }

  async function reloadBookings() {
    await loadBookings();
  }

  // Første load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadRooms(), loadProfiles(), loadBookings()]);
      setLoading(false);
    })();
  }, []);

  // ---------- FILTERING TIL TIMELINE / LISTE ----------

  const filteredBookings: Booking[] = bookings.filter((b) => {
    if (selectedRoomId !== "all" && b.room_id !== selectedRoomId) return false;

    if (bookingTypeFilter !== "all") {
      if ((b.booking_type || "normal") !== bookingTypeFilter) return false;
    }

    if (selectedDate) {
      if (!dayjs(b.start_time).isSame(dayjs(selectedDate), "day")) return false;
    }

    return true;
  });

  const value: BookingContextValue = {
    rooms,
    profiles,
    bookings,
    filteredBookings,
    loading,
    errorMsg,

    selectedDate,
    selectedRoomId,
    bookingTypeFilter,

    setSelectedDate,
    setSelectedRoomId,
    setBookingTypeFilter,

    reloadBookings,
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
