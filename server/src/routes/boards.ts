import { Router } from "express";
import { prisma } from "../db";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { emitBoardUpdate } from "../socket";

const router = Router();
router.use(requireAuth);

// All my boards
router.get("/", async (req: AuthRequest, res) => {
  const boards = await prisma.board.findMany({
    where: { ownerId: req.userId as number },
    orderBy: { createdAt: "desc" },
  });
  res.json({ boards });
});

// Create board (with 3 default lists)
router.post("/", async (req: AuthRequest, res) => {
  const { title } = req.body ?? {};
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const board = await prisma.board.create({
    data: {
      title,
      ownerId: req.userId as number,
      lists: {
        create: [
          { title: "To Do", position: 0 },
          { title: "In Progress", position: 1 },
          { title: "Done", position: 2 },
        ],
      },
    },
    include: { lists: true },
  });
  res.status(201).json({ board });
});

// One board with lists and cards
router.get("/:id", async (req: AuthRequest, res) => {
  const board = await prisma.board.findFirst({
    where: { id: Number(req.params.id), ownerId: req.userId as number },
    include: {
      lists: {
        orderBy: { position: "asc" },
        include: { cards: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  res.json({ board });
});

// Delete board
router.delete("/:id", async (req: AuthRequest, res) => {
  const result = await prisma.board.deleteMany({
    where: { id: Number(req.params.id), ownerId: req.userId as number },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  res.json({ ok: true });
});

// Add a list to a board
router.post("/:id/lists", async (req: AuthRequest, res) => {
  const { title } = req.body ?? {};
  const boardId = Number(req.params.id);
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: req.userId as number },
  });
  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  const count = await prisma.list.count({ where: { boardId } });
  const list = await prisma.list.create({
    data: { title, position: count, boardId },
  });
  emitBoardUpdate(boardId);
  res.status(201).json({ list });
});

export default router;