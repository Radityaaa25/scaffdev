"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await loginAction(formData);
    if (res?.error) {
      return { error: res.error };
    }
    return prevState;
  }, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131316] px-4">
      <div className="max-w-md w-full bg-[#1C1C21] border border-[#26262B] p-8 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Scaffdev</h1>
          <p className="text-zinc-400 text-sm">Masukkan password untuk melanjutkan</p>
        </div>
        
        <form action={formAction} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full bg-[#131316] border border-[#26262B] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          
          {state.error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {state.error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}