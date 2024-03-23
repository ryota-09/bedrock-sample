import { v4 as uuid } from "uuid"

export const getNow = () => {
  const now = new Date();
  const hours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours();
  const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
  const ampm = now.getHours() >= 12 ? 'pm' : 'am';
  const timeString = `${hours}:${minutes}${ampm}`;
  return timeString;
}

export const createChatRoomId = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const date = `${year}${month < 10 ? `0${month}` : month}${day < 10 ? `0${day}` : day}`
  return `chat-${date}-${uuid()}`
}

export const createChatId = () => {
  return `chat-${uuid()}`
}