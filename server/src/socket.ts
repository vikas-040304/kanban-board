import { Server } from "socket.io";

let io: Server | null = null;

export function setIO(server: Server) {
  io = server;
}

export function emitBoardUpdate(boardId: number) {
  io?.to(`board:${boardId}`).emit("board:updated", { boardId });
}