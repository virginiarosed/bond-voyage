import { useEffect, useRef } from "react";
import { useBookingChat } from "../../../hooks/useBookingChat";
import { useProfile } from "../../../hooks/useAuth";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { cn } from "../../ui/utils";

interface BookingChatPanelProps {
  bookingId: string;
  bookingCode?: string;
  className?: string;
}

export function BookingChatPanel({
  bookingId,
  bookingCode,
  className,
}: BookingChatPanelProps) {
  const { data: profileResponse } = useProfile();
  const currentUserId = profileResponse?.data?.user?.id;

  const {
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
    refresh,
  } = useBookingChat({ bookingId, pollingInterval: 10000 });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (unreadCount > 0) {
      markAsRead();
    }
  }, [unreadCount, markAsRead]);

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <CardHeader className="py-3 px-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              Refinement Discussion
              {bookingCode && (
                <span className="text-muted-foreground font-normal ml-2">
                  {bookingCode}
                </span>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {hasMore && (
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" onClick={loadMore}>
                  Load earlier messages
                </Button>
              </div>
            )}

            {isLoading && messages.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the AI button to get suggestions for refinements.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.senderUserId === currentUserId}
              />
            ))}

            {isGeneratingAi && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is generating suggestions...
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <ChatInput
        onSend={sendMessage}
        onAiSuggest={generateAiSuggestion}
        isSending={isSending}
        isGeneratingAi={isGeneratingAi}
      />
    </Card>
  );
}
