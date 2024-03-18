export const getNow = () => {
  const now = new Date();
  const hours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours();
  const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
  const ampm = now.getHours() >= 12 ? 'pm' : 'am';
  const timeString = `${hours}:${minutes}${ampm}`;
  return timeString;
}