// Dansk kommentar: Profilkort med navn, email og rolle på dansk.

export default function ProfileCard({ user }: any) {
  return (
    <div className="flex flex-col items-center w-full">

      {/* Profilbillede */}
      <img
        src={user.avatar_url || "/default-avatar.png"}
        alt="Profilbillede"
        className="w-40 h-40 rounded-full object-cover mb-4"
      />

      {/* Navn */}
      <div className="w-full bg-[#e5f2ff] text-center py-2 rounded-md font-medium">
        {user.full_name}
      </div>

      {/* Email */}
      <div className="w-full bg-[#e5f2ff] text-center py-2 rounded-md text-sm mt-3">
        {user.email}
      </div>

      {/* Rolle - på dansk */}
      <div className="w-full bg-[#e5f2ff] text-center py-2 rounded-md text-sm mt-3">
        {user.role === "student" && "Studerende"}
        {user.role === "teacher" && "Underviser"}
        {user.role === "admin" && "Administrator"}
      </div>

      {/* Log ud knap */}
      <button className="mt-6 bg-[#2e74ff] hover:bg-[#1865ff] text-white px-6 py-2 rounded-md">
        Log ud
      </button>
    </div>
  );
}
