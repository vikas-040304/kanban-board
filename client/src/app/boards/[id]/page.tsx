"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { API_URL, api, getToken } from "@/lib/api";
import { useBoardStore } from "@/lib/store";
import type { Card, List } from "@/lib/store";

function CardItem({ card, onDelete }: { card: Card; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-start justify-between gap-2 rounded-lg bg-slate-700 p-3 text-sm shadow"
    >
      <span>{card.title}</span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(card.id)}
        className="text-slate-400 hover:text-red-400"
        title="Delete card"
      >
        ✕
      </button>
    </div>
  );
}

function Column({
  list,
  onAddCard,
  onDeleteCard,
  onDeleteList,
}: {
  list: List;
  onAddCard: (listId: number, title: string) => void;
  onDeleteCard: (id: number) => void;
  onDeleteList: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `list-${list.id}` });
  const [title, setTitle] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAddCard(list.id, title);
    setTitle("");
  }

  return (
    <div className="w-72 shrink-0 rounded-xl bg-slate-800 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">
          {list.title} <span className="text-sm text-slate-400">({list.cards.length})</span>
        </h2>
        <button onClick={() => onDeleteList(list.id)} className="text-slate-500 hover:text-red-400" title="Delete list">
          ✕
        </button>
      </div>

      <div ref={setNodeRef} className={`min-h-12 space-y-2 rounded-lg ${isOver ? "bg-slate-700/50" : ""}`}>
        <SortableContext items={list.cards.map((c) => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
          {list.cards.map((c) => (
            <CardItem key={c.id} card={c} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
          placeholder="Add a card"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="rounded-lg bg-blue-600 px-3 text-sm font-semibold hover:bg-blue-500">+</button>
      </form>
    </div>
  );
}

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const boardId = Number(params.id);
  const router = useRouter();
  const { board, loadBoard, moveCardLocal } = useBoardStore();
  const [newList, setNewList] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    useBoardStore.setState({ board: null });
    loadBoard(boardId).catch(() => router.replace("/boards"));

    const socket = io(API_URL);
    socket.on("connect", () => socket.emit("board:join", boardId));
    socket.on("board:updated", () => {
      loadBoard(boardId).catch(() => {});
    });
    return () => {
      socket.disconnect();
    };
  }, [boardId, router, loadBoard]);

  async function addList(e: FormEvent) {
    e.preventDefault();
    if (!newList.trim()) return;
    await api(`/boards/${boardId}/lists`, "POST", { title: newList });
    setNewList("");
    await loadBoard(boardId);
  }

  async function deleteList(id: number) {
    await api(`/lists/${id}`, "DELETE");
    await loadBoard(boardId);
  }

  async function addCard(listId: number, title: string) {
    await api(`/lists/${listId}/cards`, "POST", { title });
    await loadBoard(boardId);
  }

  async function deleteCard(id: number) {
    await api(`/cards/${id}`, "DELETE");
    await loadBoard(boardId);
  }

  function onDragEnd(e: DragEndEvent) {
    if (!board || !e.over) return;
    const activeId = String(e.active.id);
    const overId = String(e.over.id);
    if (!activeId.startsWith("card-") || activeId === overId) return;

    const cardId = Number(activeId.replace("card-", ""));
    let toListId: number;
    let pos: number;

    if (overId.startsWith("list-")) {
      toListId = Number(overId.replace("list-", ""));
      const list = board.lists.find((l) => l.id === toListId);
      if (!list) return;
      const alreadyIn = list.cards.some((c) => c.id === cardId);
      pos = alreadyIn ? list.cards.length - 1 : list.cards.length;
    } else {
      const overCardId = Number(overId.replace("card-", ""));
      const list = board.lists.find((l) => l.cards.some((c) => c.id === overCardId));
      if (!list) return;
      toListId = list.id;
      pos = list.cards.findIndex((c) => c.id === overCardId);
    }

    moveCardLocal(cardId, toListId, pos);
    api(`/cards/${cardId}/move`, "PATCH", { listId: toListId, position: pos }).catch(() => loadBoard(boardId));
  }

  if (!board) {
    return <main className="min-h-screen bg-slate-900 p-6 text-slate-300">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6 text-slate-100">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/boards" className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">
          ← Boards
        </Link>
        <h1 className="text-2xl font-bold">{board.title}</h1>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {board.lists.map((l) => (
            <Column key={l.id} list={l} onAddCard={addCard} onDeleteCard={deleteCard} onDeleteList={deleteList} />
          ))}

          <form onSubmit={addList} className="w-72 shrink-0 space-y-2 rounded-xl bg-slate-800/60 p-3">
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              placeholder="Add another list"
              value={newList}
              onChange={(e) => setNewList(e.target.value)}
            />
            <button className="w-full rounded-lg bg-slate-700 py-1.5 text-sm hover:bg-slate-600">Add list</button>
          </form>
        </div>
      </DndContext>
    </main>
  );
}