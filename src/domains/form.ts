import { Output, object, string } from "valibot";

export const ChatMessageSchema = object({
  id: string(),
  content: string(),
})

export type ChatMessageType = Output<typeof ChatMessageSchema>;