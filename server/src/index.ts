import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { setIO } from "./socket";

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:3000" },
});
setIO(io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("board:join", (boardId: number) => {
    socket.join(`board:${boardId}`);
  });

  socket.on("board:leave", (boardId: number) => {
    socket.leave(`board:${boardId}`);
  });
});

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));