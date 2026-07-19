"use client";

import { AdminDashboard } from "@/components/AdminDashboard";
import { LoginForm } from "@/components/LoginForm";
import { useAppSelector } from "@/store/hooks";

export default function Home() {
  const { token, hydrated } = useAppSelector((state) => state.auth);

  if (!hydrated) {
    return <div className="min-h-screen bg-slate-950" />;
  }
  return token ? <AdminDashboard /> : <LoginForm />;
}
