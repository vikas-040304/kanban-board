"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, saveAuth } from "@/lib/api";

type AuthResponse = { token: string; user: { id: number; name: string; email: string } };

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/boards");
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = mode === "login" ? { email, password } : { name, email, password };
      const data = await api<AuthResponse>(`/auth/${mode}`, "POST", body);
      saveAuth(data.token, data.user);
      router.push("/boards");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-slate-800 p-6 shadow-xl">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <p className="text-sm text-slate-400">
          {mode === "login" ? "Login to your account" : "Create a new account"}
        </p>

        {mode === "register" && (
          <input className={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button disabled={loading} className="w-full rounded-lg bg-blue-600 py-2 font-semibold hover:bg-blue-500 disabled:opacity-50">
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full text-sm text-slate-400 hover:text-white"
        >
          {mode === "login" ? "New here? Register" : "Already have an account? Login"}
        </button>
      </form>
    </main>
  );
}