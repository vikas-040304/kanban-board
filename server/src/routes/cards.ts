import { Router } from "express";
import { prisma } from "../db";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { emitBoardUpdate } from "../socket";

const router = Router();
router.use(requireAuth);

// Edit card title / description
router.patch("/:id", async (req: AuthRequest, res) => {
  const { title, description } = req.body ?? {};
  const card = await prisma.card.findFirst({
    where: { id: Number(req.params.id), list: { board: { ownerId: req.userId as number } } },
    include: { list: true },
  });
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  const updated = await prisma.card.update({
    where: { id: card.id },
    data: { title, description },
  });
  emitBoardUpdate(card.list.boardId);
  res.json({ card: updated });
});

// Move card to a list at a position (drag & drop)
router.patch("/:id/move", async (req: AuthRequest, res) => {
  const targetListId = Number(req.body?.listId);
  const newPos = Number(req.body?.position);
  if (!Number.isInteger(targetListId) || !Number.isInteger(newPos) || newPos < 0) {
    res.status(400).json({ error: "listId and position (0 or more) are required" });
    return;
  }

  const card = await prisma.card.findFirst({
    where: { id: Number(req.params.id), list: { board: { ownerId: req.userId as number } } },
    include: { list: true },
  });
  const target = await prisma.list.findFirst({
    where: { id: targetListId, board: { ownerId: req.userId as number } },
  });
  if (!card || !target) {
    res.status(404).json({ error: "Card or list not found" });
    return;
  }
  if (card.list.boardId !== target.boardId) {
    res.status(400).json({ error: "Cannot move card to another board" });
    return;
  }

  await prisma.$transaction(async (tx) => {
    // close the gap in the old list
    await tx.card.updateMany({
      where: { listId: card.listId, position: { gt: card.position } },
      data: { position: { decrement: 1 } },
    });
    // make room in the new list
    const count = await tx.card.count({
      where: { listId: targetListId, id: { not: card.id } },
    });
    const finalPos = Math.min(newPos, count);
    await tx.card.updateMany({
      where: { listId: targetListId, id: { not: card.id }, position: { gte: finalPos } },
      data: { position: { increment: 1 } },
    });
    await tx.card.update({
      where: { id: card.id },
      data: { listId: targetListId, position: finalPos },
    });
  });

  emitBoardUpdate(target.boardId);
  res.json({ ok: true });
});

// Delete card
router.delete("/:id", async (req: AuthRequest, res) => {
  const card = await prisma.card.findFirst({
    where: { id: Number(req.params.id), list: { board: { ownerId: req.userId as number } } },
    include: { list: true },
  });
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  await prisma.$transaction([
    prisma.card.delete({ where: { id: card.id } }),
    prisma.card.updateMany({
      where: { listId: card.listId, position: { gt: card.position } },
      data: { position: { decrement: 1 } },
    }),
  ]);
  emitBoardUpdate(card.list.boardId);
  res.json({ ok: true });
});

export default router;