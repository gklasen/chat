export type ChatMessage = {
  id: string;
  text: string;
  from: string;
  ts: number;
};

export type SendMessagePayload = {
  text: string;
};