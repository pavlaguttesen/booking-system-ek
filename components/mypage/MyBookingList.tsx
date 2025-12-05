// Dansk kommentar: Henter og viser alle bookinger for den aktuelle bruger.
// Viser kun x/4 hvis brugeren er studerende. Ingen + knap.

import { useEffect, useState } from "react";
import BookingItem from "./BookingItem";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function MyBookingList({ userId }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const { role: userRole } = useAuth(); // Dansk kommentar: Hent rollen for conditional rendering

  async function load() {
    const { data } = await supabase
      .from("bookings")
      .select("*, rooms(*)")
      .eq("user_id", userId)
      .order("start_time", { ascending: true });

    setBookings(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-semibold">Mine bookinger</h2>

        {/* Dansk kommentar: Kun studerende ser x/4 */}
        {userRole === "student" && (
          <span className="text-gray-700 font-medium">{bookings.length}/4</span>
        )}
      </div>

      {/* Booking liste */}
      <div className="flex flex-col gap-4">
        {bookings.map((b) => (
          <BookingItem key={b.id} booking={b} reload={load} />
        ))}
      </div>
    </>
  );
}
