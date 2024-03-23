export type ChatType = {
  chatId: string
  role: string
  message: string
  date: string
}

export type ConversationType = {
  roomId: string
  conversations: ChatType[]
}