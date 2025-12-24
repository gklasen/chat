import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { Server } from "socket.io";

import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "chat-shared/events";
import type { ChatMessage } from "chat-shared/models";

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents
>(server, {
  cors: { origin: true, credentials: true }
});

io.on("connection", (socket) => {
  socket.on("conversation:join", async (conversationId, ack) => {
    try {
      const id = String(conversationId || "").trim();
      if (!id) return ack({ ok: false, error: "conversationId missing" });

      await socket.join(id);
      ack({ ok: true });
    } catch (e: any) {
      ack({ ok: false, error: e?.message ?? String(e) });
    }
  });

  socket.on("conversation:leave", async (conversationId, ack) => {
    try {
      const id = String(conversationId || "").trim();
      if (!id) return ack({ ok: false, error: "conversationId missing" });

      await socket.leave(id);
      ack({ ok: true });
    } catch (e: any) {
      ack({ ok: false, error: e?.message ?? String(e) });
    }
  });

  socket.on("message:send", (payload, ack) => {
    const conversationId = String(payload?.conversationId ?? "").trim();
    const text = String(payload?.text ?? "").trim();

    if (!conversationId) return ack({ ok: false, error: "conversationId missing" });
    if (!text) return ack({ ok: false, error: "empty message" });

    const msg = {
	  id: crypto.randomUUID(),
	  conversationId,
	  from: socket.id,
	  fromName: payload?.fromName?.trim() || undefined, // 👈 neu
	  text,
	  ts: Date.now(),
	};
 
	io.to(conversationId).emit("message:new", msg);
	ack({ ok: true });
  });
});

server.listen(3000, () => console.log("server on http://localhost:3000"));