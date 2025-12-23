import type { ChatMessage, SendMessagePayload } from './chat.models';

export type ServerToClientEvents = {
  'message:new': (msg: ChatMessage) => void;
};

export type ClientToServerEvents = {
  'message:send': (payload: SendMessagePayload) => void;
};