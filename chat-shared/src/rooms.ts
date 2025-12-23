export const CHAT_ROOMS = [
  "global",
  "general",
  "random",
  "support",
  "announcements",
  "feedback",
  "team",
  "dev",
  "music",
  "gaming"
] as const;

export type ChatRoomId = (typeof CHAT_ROOMS)[number];

export const DEFAULT_ROOM: ChatRoomId = "global";