import { isToday, isYesterday, format } from "date-fns";

export default function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const messageDate = new Date(timestamp);
  if (isNaN(messageDate.getTime())) return "";

  const now = Date.now();
  const diff = now - messageDate.getTime();

  if (diff < 0) return "Just now";
  if (diff < 60000) return "Just now";
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return mins === 1 ? "1 min ago" : `${mins} mins ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  return format(messageDate, "dd/MM/yy");
}

export function formatLastSeen(lastSeen) {
  if (!lastSeen) return "offline";
  const date = new Date(lastSeen);
  if (isNaN(date.getTime())) return "offline";

  try {
    if (isToday(date)) {
      return `Last seen today at ${format(date, "HH:mm")}`;
    } else if (isYesterday(date)) {
      return `Last seen yesterday at ${format(date, "HH:mm")}`;
    } else {
      return `Last seen ${format(date, "dd/MM/yyyy HH:mm")}`;
    }
  } catch (error) {
    return "offline";
  }
}
