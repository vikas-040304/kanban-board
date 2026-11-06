import { Router } from "express";
import { prisma } from "../db";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { emitBoardUpdate } from "../socket";

const router = Router();
router.use(requireAuth);

// Delete a list
router.delete("/:id", async (req: AuthRequest, res) => {
  const list = await prisma.list.findFirst({
    where: { id: Number(req.params.id), board: { ownerId: req.userId as number } },
  });
  if (!list) {
    res.status(404).json({ error: "List not found" });
    return;
  }
  await prisma.list.delete({ where: { id: list.id } });
  emitBoardUpdate(list.boardId);
  res.json({ ok: true });
});

// Add a card to a list
router.post("/:id/cards", async (req: AuthRequest, res) => {
  const { title, description } = req.body ?? {};
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const list = await prisma.list.findFirst({
    where: { id: Number(req.params.id), board: { ownerId: req.userId as number } },
  });
  if (!list) {
    res.status(404).json({ error: "List not found" });
    return;
  }
  const count = await prisma.card.count({ where: { listId: list.id } });
  const card = await prisma.card.create({
    data: { title, description, position: count, listId: list.id },
  });
  emitBoardUpdate(list.boardId);
  res.status(201).json({ card });
});

export default router;