// Layout for min side. Viser brugerprofil og liste over brugerens bookinger.

import ProfileCard from "./ProfileCard";
import MyBookingList from "./MyBookingList";
import { useTranslation } from "react-i18next";

export default function MyPageLayout({ user }: any) {
  const { t } = useTranslation();
  
  if (!user) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-6 space-y-8">
      <h1 className="text-3xl font-bold text-main">{t("booking.mypage")}</h1>

      <div className="flex gap-10">
        {/* Venstre */}
        <div className="flex-1 bg-secondary-300 p-6 rounded-xl border border-secondary-200 shadow-sm">
          <MyBookingList userId={user.id} />
        </div>

        {/* Højre */}
        <div className="w-[340px] shrink-0 bg-secondary-300 p-6 rounded-xl border border-secondary-200 shadow-sm flex justify-center">
          <ProfileCard />
        </div>
      </div>
    </div>
  );
}
