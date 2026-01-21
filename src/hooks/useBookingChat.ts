import { useCallback, useEffect, useRef, useState } from "react";
import { BookingChatAPI } from "../utils/bookingChat";
import { ChatMessage } from "../types/types";
import { toast } from "sonner";

interface UseBookingChatOptions {
  bookingId: string;
  pollingInterval?: number;
}

export const useBookingChat = ({
  bookingId,
  pollingInterval = 10000,
}: UseBookingChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(
    async (cursor?: string, append = false) => {
      try {
        if (!append) setIsLoading(true);

        const response = await BookingChatAPI.getMessages(bookingId, cursor, 30);

        setMessages((prev) =>
          append
            ? [...prev, ...response.items]
            : response.items.slice().reverse()
        );
        setHasMore(response.hasMore);
        setNextCursor(response.nextCursor);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to load chat messages");
      } finally {
        setIsLoading(false);
      }
    },
    [bookingId]
  );

  const loadMore = useCallback(() => {
    if (nextCursor && !isLoading) {
      fetchMessages(nextCursor, true);
    }
  }, [nextCursor, isLoading, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!content.trim() && (!files || files.length === 0)) return;

      setIsSending(true);
      try {
        const newMessage = await BookingChatAPI.sendMessage(
          bookingId,
          content,
          files
        );
        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [bookingId]
  );

  const generateAiSuggestion = useCallback(async () => {
    setIsGeneratingAi(true);
    try {
      const suggestion = await BookingChatAPI.generateAiSuggestion(bookingId);
      setMessages((prev) => [...prev, suggestion]);
      return suggestion;
    } catch (error) {
      console.error("Failed to generate AI suggestion:", error);
      toast.error("Failed to generate AI suggestion");
      throw error;
    } finally {
      setIsGeneratingAi(false);
    }
  }, [bookingId]);

  const markAsRead = useCallback(async () => {
    try {
      await BookingChatAPI.markAsRead(bookingId);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  }, [bookingId]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { unreadCount: count } = await BookingChatAPI.getUnreadCount(
        bookingId
      );
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [bookingId]);

  const pollForNewMessages = useCallback(async () => {
    try {
      const response = await BookingChatAPI.getMessages(bookingId, undefined, 10);
      const latestMessages = response.items.slice().reverse();

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = latestMessages.filter((m) => !existingIds.has(m.id));

        if (newMessages.length > 0) {
          return [...prev, ...newMessages];
        }
        return prev;
      });

      await fetchUnreadCount();
    } catch (error) {
      console.error("Polling failed:", error);
    }
  }, [bookingId, fetchUnreadCount]);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [fetchMessages, fetchUnreadCount]);

  useEffect(() => {
    if (pollingInterval > 0) {
      pollingRef.current = setInterval(pollForNewMessages, pollingInterval);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [pollingInterval, pollForNewMessages]);

  return {
    messages,
    isLoading,
    isSending,
    isGeneratingAi,
    hasMore,
    unreadCount,
    sendMessage,
    generateAiSuggestion,
    loadMore,
    markAsRead,
    refresh: () => fetchMessages(),
  };
};
