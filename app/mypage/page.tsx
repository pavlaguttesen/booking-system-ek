// Min side - viser brugerens profil og alle deres bookinger.

"use client";

import { useAuth } from "@/context/AuthContext";
import MyPageLayout from "@/components/mypage/MyPageLayout";
import { redirect } from "next/navigation";

export default function MyPage() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) redirect("/login");

  return <MyPageLayout user={user} />;
}
