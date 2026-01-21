import { ChatMessage as ChatMessageType } from "../../../types/types";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";
import { Download, FileText, Image as ImageIcon, Sparkles, Shield, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const isAi = message.kind === "AI_SUGGESTION";
  const isAdmin = message.kind === "ADMIN";
  const isSystem = message.kind === "SYSTEM";

  const senderName = message.sender
    ? `${message.sender.firstName ?? ""} ${message.sender.lastName ?? ""}`.trim() ||
      message.sender.email
    : isAi
      ? "AI Assistant"
      : "System";

  const getAvatarIcon = () => {
    if (isAi) return <Sparkles className="h-4 w-4" />;
    if (isAdmin) return <Shield className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getAvatarColor = () => {
    if (isAi) return "bg-purple-100 text-purple-600";
    if (isAdmin) return "bg-blue-100 text-blue-600";
    if (isOwnMessage) return "bg-primary/10 text-primary";
    return "bg-muted text-muted-foreground";
  };

  const getBubbleStyle = () => {
    if (isAi) return "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800";
    if (isSystem) return "bg-muted text-center text-sm text-muted-foreground";
    if (isOwnMessage) return "bg-primary text-primary-foreground";
    return "bg-muted";
  };

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <Avatar className={cn("h-8 w-8 shrink-0", getAvatarColor())}>
        <AvatarFallback className={getAvatarColor()}>{getAvatarIcon()}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "flex items-center gap-2 text-xs",
            isOwnMessage ? "justify-end" : "justify-start"
          )}
        >
          <span className="font-medium text-muted-foreground">{senderName}</span>
          {isAi && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              AI Suggestion
            </Badge>
          )}
          {isAdmin && !isOwnMessage && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Agent
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 border",
            getBubbleStyle(),
            isAi && "prose prose-sm dark:prose-invert max-w-none"
          )}
        >
          {isAi ? (
            <div className="text-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}

          {message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((attachment, idx) => (
                <AttachmentPreview key={`${attachment.originalName}-${idx}`} attachment={attachment} />
              ))}
            </div>
          )}
        </div>

        <span
          className={cn(
            "text-[10px] text-muted-foreground",
            isOwnMessage ? "text-right" : "text-left"
          )}
        >
          {new Date(message.createdAt).toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

function AttachmentPreview({
  attachment,
}: {
  attachment: ChatMessageType["attachments"][0];
}) {
  const isImage = attachment.mimeType.startsWith("image/");
  const sizeKB = Math.round(attachment.size / 1024);

  const handleDownload = () => {
    if (attachment.publicUrl) {
      window.open(attachment.publicUrl, "_blank");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-auto py-2 px-3 flex items-center gap-2"
      onClick={handleDownload}
    >
      {isImage ? (
        <ImageIcon className="h-4 w-4 text-blue-500" />
      ) : (
        <FileText className="h-4 w-4 text-orange-500" />
      )}
      <div className="flex flex-col items-start text-left">
        <span className="text-xs font-medium truncate max-w-[120px]">
          {attachment.originalName}
        </span>
        <span className="text-[10px] text-muted-foreground">{sizeKB} KB</span>
      </div>
      <Download className="h-3 w-3 ml-1" />
    </Button>
  );
}
