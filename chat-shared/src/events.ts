import type { ChatMessage, SendMessagePayload, Ack } from "./models";

// Client → Server
export interface ClientToServerEvents {
  "conversation:join": (conversationId: string, ack: (res: Ack) => void) => void;
  "conversation:leave": (conversationId: string, ack: (res: Ack) => void) => void;

  "message:send": (payload: SendMessagePayload, ack: (res: Ack) => void) => void;
}

// Server → Client
export interface ServerToClientEvents {
  "message:new": (message: ChatMessage) => void;
}