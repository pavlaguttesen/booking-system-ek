"use client";

import MyPageLayout from "@/components/mypage/MyPageLayout";
import { useAuth } from "@/context/AuthContext";

export default function MyPage() {
  const { user } = useAuth();

  return <MyPageLayout user={user} />;
}
