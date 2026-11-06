import { create } from "zustand";
import { api } from "./api";

export type Card = {
  id: number;
  title: string;
  description: string | null;
  position: number;
  listId: number;
};
export type List = { id: number; title: string; position: number; boardId: number; cards: Card[] };
export type Board = { id: number; title: string; lists: List[] };
export type BoardSummary = { id: number; title: string };

type BoardState = {
  boards: BoardSummary[];
  board: Board | null;
  loadBoards: () => Promise<void>;
  loadBoard: (id: number) => Promise<void>;
  moveCardLocal: (cardId: number, toListId: number, pos: number) => void;
};

export const useBoardStore = create<BoardState>()((set) => ({
  boards: [],
  board: null,

  loadBoards: async () => {
    const data = await api<{ boards: BoardSummary[] }>("/boards");
    set({ boards: data.boards });
  },

  loadBoard: async (id) => {
    const data = await api<{ board: Board }>(`/boards/${id}`);
    set({ board: data.board });
  },

  moveCardLocal: (cardId, toListId, pos) =>
    set((state) => {
      if (!state.board) return state;
      const card = state.board.lists.flatMap((l) => l.cards).find((c) => c.id === cardId);
      if (!card) return state;

      const lists = state.board.lists.map((l) => ({
        ...l,
        cards: l.cards.filter((c) => c.id !== cardId),
      }));
      const result = lists.map((l) => {
        if (l.id !== toListId) return l;
        const cards = [...l.cards];
        cards.splice(Math.min(pos, cards.length), 0, { ...card, listId: toListId });
        return { ...l, cards };
      });
      return { board: { ...state.board, lists: result } };
    }),
}));