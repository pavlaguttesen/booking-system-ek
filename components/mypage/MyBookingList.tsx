// Liste over brugerens fremtidige bookinger med mulighed for at slette dem direkte.

import { useEffect, useState } from "react";
import BookingItem from "./BookingItem";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function MyBookingList({ userId }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const { role: userRole } = useAuth();
  const { t } = useTranslation();

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

  const isFull = bookings.length >= 4;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-semibold text-main">{t("booking.mybookings")}</h2>

        {userRole === "student" && (
          <span
            className={
              "font-medium text-lg " +
              (isFull ? "text-red-600" : "text-main/70")
            }
          >
            {bookings.length}/4
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {bookings.map((b) => (
          <BookingItem key={b.id} booking={b} reload={load} />
        ))}
      </div>
    </>
  );
}
