//Viser en booking i dansk format og korrekt alignment.

import dayjs from "dayjs";
import "dayjs/locale/da";
import "dayjs/locale/en";
import { createClient } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function BookingItem({ booking, reload }: any) {
  const { t, i18n } = useTranslation();
  
  // Set dayjs locale based on current language
  dayjs.locale(i18n.language);

  async function deleteBooking() {
    await supabase.from("bookings").delete().eq("id", booking.id);
    reload();
  }

  const start = dayjs(booking.start_time);
  const end = dayjs(booking.end_time);

  return (
    <div className="bg-white p-4 rounded-lg flex justify-between items-center shadow-sm border border-secondary-200">
      {/* VENSTRE INFO */}
      <div className="flex items-center gap-8">
        <div className="text-sm text-secondary font-medium w-44">
          {start.format("dddd [d.] DD/MM-YY")}
        </div>

        <div className="font-semibold w-40 text-secondary">
          {t("booking.room")} {booking.rooms?.room_name}
        </div>

        <div className="w-32 text-secondary">
          {start.format("HH.mm")}–{end.format("HH.mm")}
        </div>

        <div className="w-32 text-secondary">{t("booking.studyroom")}</div>
      </div>

      {/* SLET KNAP — FONT AWESOME */}
      <button
        onClick={deleteBooking}
        className="cursor-pointer hover:opacity-80 transition"
      >
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="text-red-500 text-2xl"
        />
      </button>
    </div>
  );
}
