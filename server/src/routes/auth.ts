import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router();

function signToken(userId: number) {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const { email, name, password } = req.body ?? {};
  if (!email || !name || !password || String(password).length < 6) {
    res.status(400).json({ error: "email, name and password (min 6 chars) are required" });
    return;
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const user = await prisma.user.create({
    data: { email, name, password: await bcrypt.hash(password, 10) },
  });
  res.status(201).json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || !(await bcrypt.compare(password ?? "", user.password))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true },
  });
  res.json({ user });
});

export default router;