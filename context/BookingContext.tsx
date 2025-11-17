"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

export type Room = {
  id: string;
  room_name: string;
  floor: number;
  nr_of_seats: number;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: string; // 'student' | 'teacher' | 'admin'
};

export type BookingType = "normal" | "exam" | null;

export type Booking = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  booking_type: BookingType;
  room_id: string;
  user_id: string;
};

type BookingContextValue = {
  rooms: Room[];
  profiles: Profile[];
  bookings: Booking[];
  filteredBookings: Booking[];
  loading: boolean;
  errorMsg: string | null;
  selectedDate: string; // yyyy-mm-dd eller ""
  selectedRoomId: string; // 'all' eller room.id
  bookingTypeFilter: "all" | "normal" | "exam";
  setSelectedDate: (value: string) => void;
  setSelectedRoomId: (value: string) => void;
  setBookingTypeFilter: (value: "all" | "normal" | "exam") => void;
};

const BookingContext = createContext<BookingContextValue | undefined>(
  undefined
);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [bookingTypeFilter, setBookingTypeFilter] =
    useState<"all" | "normal" | "exam">("all");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErrorMsg(null);

      // Hent rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("id, room_name, floor, nr_of_seats")
        .order("room_name", { ascending: true });

      if (roomsError) {
        setErrorMsg(roomsError.message);
        setLoading(false);
        return;
      }
      setRooms((roomsData ?? []) as Room[]);

      // Hent profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, role");

      if (profilesError) {
        setErrorMsg(profilesError.message);
        setLoading(false);
        return;
      }
      setProfiles((profilesData ?? []) as Profile[]);

      // Hent bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          "id, title, description, start_time, end_time, booking_type, room_id, user_id"
        )
        .order("start_time", { ascending: true });

      if (bookingsError) {
        setErrorMsg(bookingsError.message);
        setLoading(false);
        return;
      }
      setBookings((bookingsData ?? []) as Booking[]);

      setLoading(false);
    };

    loadData();
  }, []);

  const filteredBookings = useMemo(() => {
    const normalizeDate = (iso: string) => {
      const d = new Date(iso);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return bookings.filter((b) => {
      let ok = true;

      if (selectedDate) {
        const bookingDate = normalizeDate(b.start_time);
        if (bookingDate !== selectedDate) ok = false;
      }

      if (selectedRoomId !== "all") {
        if (b.room_id !== selectedRoomId) ok = false;
      }

      if (bookingTypeFilter !== "all") {
        const type = (b.booking_type ?? "normal") as "normal" | "exam";
        if (type !== bookingTypeFilter) ok = false;
      }

      return ok;
    });
  }, [bookings, selectedDate, selectedRoomId, bookingTypeFilter]);

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
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBookingContext must be used within a BookingProvider");
  }
  return ctx;
}
