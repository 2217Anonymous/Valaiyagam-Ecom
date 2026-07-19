"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, Store } from "lucide-react";

import { login } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function LoginForm() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("ChangeMe123!");

  function submit(event: FormEvent) {
    event.preventDefault();
    void dispatch(login({ email, password }));
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f5f8fc] px-4">
      <div className="absolute -left-20 top-1/4 size-80 rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="absolute right-0 top-0 size-96 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-emerald-200/35 blur-3xl" />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-[32px] border border-white/90 bg-white/65 p-6 shadow-[0_24px_80px_rgba(71,85,105,0.16)] backdrop-blur-2xl sm:p-9"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20">
            <Store size={24} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600">
              Valaiyagam
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Admin sign in</h1>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="form-input mb-5"
          required
        />
        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="form-input"
          required
        />
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          disabled={loading}
          className="primary-button mt-6 w-full justify-center py-3.5"
        >
          <LockKeyhole size={18} />
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
