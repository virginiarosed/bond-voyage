import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { MessageCircle } from "lucide-react";
import { BookingChatAPI } from "../../../utils/bookingChat";
import { cn } from "../../ui/utils";

interface ChatBadgeButtonProps {
  bookingId: string;
  onClick?: () => void;
  className?: string;
}

export function ChatBadgeButton({
  bookingId,
  onClick,
  className,
}: ChatBadgeButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { unreadCount: count } = await BookingChatAPI.getUnreadCount(
          bookingId
        );
        setUnreadCount(count);
      } catch {
        // Ignore errors for badge
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    return () => clearInterval(interval);
  }, [bookingId]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("relative", className)}
    >
      <MessageCircle className="h-4 w-4 mr-1" />
      Chat
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
