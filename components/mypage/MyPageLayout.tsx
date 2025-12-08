import ProfileCard from "./ProfileCard";
import MyBookingList from "./MyBookingList";

export default function MyPageLayout({ user }: any) {
  if (!user) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-6 space-y-8">

      <h1 className="text-3xl font-bold text-main">Min side</h1>

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
