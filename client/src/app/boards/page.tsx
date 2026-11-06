"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearAuth, getToken } from "@/lib/api";
import { useBoardStore } from "@/lib/store";

export default function BoardsPage() {
  const router = useRouter();
  const { boards, loadBoards } = useBoardStore();
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    loadBoards().catch(() => router.replace("/"));
  }, [router, loadBoards]);

  async function createBoard(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api("/boards", "POST", { title });
    setTitle("");
    await loadBoards();
  }

  async function deleteBoard(id: number) {
    await api(`/boards/${id}`, "DELETE");
    await loadBoards();
  }

  function logout() {
    clearAuth();
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Boards</h1>
          <button onClick={logout} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">
            Logout
          </button>
        </div>

        <form onSubmit={createBoard} className="mb-6 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="New board name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500">Create</button>
        </form>

        <div className="grid gap-3 sm:grid-cols-2">
          {boards.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-800 p-4">
              <Link href={`/boards/${b.id}`} className="font-semibold hover:text-blue-400">
                {b.title}
              </Link>
              <button onClick={() => deleteBoard(b.id)} className="text-slate-500 hover:text-red-400" title="Delete board">
                ✕
              </button>
            </div>
          ))}
          {boards.length === 0 && <p className="text-slate-400">No boards yet. Create one above.</p>}
        </div>
      </div>
    </main>
  );
}