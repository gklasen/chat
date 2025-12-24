// --- core ids ---
export type UserId = string;
export type ConversationId = string;
export type MessageId = string;

// --- messages ---
export interface ChatMessage {
  id: MessageId;
  conversationId: ConversationId;
  from: UserId;
  text: string;
  ts: number;
}

// --- send payload ---
export interface SendMessagePayload {
  conversationId: ConversationId;
  text: string;
  fromName?: string;      // 👈 neu (Soft Login)
}

// --- server acks ---
export interface ServerAck {
  ok: true;
}

export interface ServerError {
  ok: false;
  error: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  from: string;           // socket.id
  fromName?: string;      // 👈 neu (Soft Login)
  text: string;
  ts: number;
} 

export type Ack = ServerAck | ServerError;