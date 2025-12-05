// Dansk kommentar: Viser en booking i dansk format og korrekt alignment.

import dayjs from "dayjs";
import "dayjs/locale/da";
import { createClient } from "@supabase/supabase-js";

dayjs.locale("da");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function BookingItem({ booking, reload }: any) {
  async function deleteBooking() {
    await supabase.from("bookings").delete().eq("id", booking.id);
    reload();
  }

  const start = dayjs(booking.start_time);
  const end = dayjs(booking.end_time);

  return (
    <div className="bg-[#e5f2ff] p-4 rounded-lg flex justify-between items-center shadow-sm">

      {/* Venstre booking info */}
      <div className="flex items-center gap-8">

        {/* Dansk datoformat */}
        <div className="text-sm text-gray-600 font-medium w-44">
          {start.format("dddd [d.] DD/MM-YY")}
        </div>

        {/* Lokale */}
        <div className="font-semibold w-40">
          Lokale {booking.rooms?.room_name}
        </div>

        {/* Tidsrum */}
        <div className="w-32">
          {start.format("HH.mm")}–{end.format("HH.mm")}
        </div>

        {/* Type */}
        <div className="w-32">Studierum</div>
      </div>

      {/* Slet knap */}
      <button
        onClick={deleteBooking}
        className="bg-red-500 text-white p-3 rounded-full text-lg"
      >
        ×
      </button>
    </div>
  );
}
