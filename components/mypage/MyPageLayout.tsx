// Dansk kommentar: Layout for Min Side — opdeler venstre (bookinger) og højre (profilkort)

import ProfileCard from "./ProfileCard";
import MyBookingList from "./MyBookingList";

export default function MyPageLayout({ user }: any) {
  return (
    <div className="w-full flex gap-10 p-8 mt-4">

      {/* Venstre side — bookinger */}
      <div className="flex-1 bg-[#cddfff] p-6 rounded-xl shadow-md">
        <MyBookingList userId={user.id} />
      </div>

      {/* Højre side — profilkort */}
      <div className="w-[350px] bg-[#e5f2ff] p-6 rounded-xl shadow-md flex justify-center">
        <ProfileCard user={user} />
      </div>

    </div>
  );
}
