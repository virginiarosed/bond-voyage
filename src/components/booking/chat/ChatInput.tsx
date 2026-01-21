import { KeyboardEvent, useRef, useState } from "react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  X,
} from "lucide-react";

interface ChatInputProps {
  onSend: (content: string, files?: File[]) => Promise<unknown>;
  onAiSuggest: () => Promise<unknown>;
  isSending: boolean;
  isGeneratingAi: boolean;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function ChatInput({
  onSend,
  onAiSuggest,
  isSending,
  isGeneratingAi,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFileError(null);

    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      if (files.length + validFiles.length >= MAX_FILES) {
        setFileError(`Maximum ${MAX_FILES} files allowed`);
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File "${file.name}" exceeds 5MB limit`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`File type not supported: ${file.name}`);
        continue;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSend = async () => {
    if ((!message.trim() && files.length === 0) || isSending) return;

    await onSend(message, files.length > 0 ? files : undefined);
    setMessage("");
    setFiles([]);
    setFileError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isSending || isGeneratingAi;

  return (
    <div className="border-t bg-background p-4">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, idx) => (
            <Badge
              key={`${file.name}-${idx}`}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-3 w-3" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              <span className="max-w-[100px] truncate text-xs">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={() => removeFile(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {fileError && <p className="text-xs text-destructive mb-2">{fileError}</p>}

      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled || files.length >= MAX_FILES}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={onAiSuggest}
          disabled={isDisabled}
          title="Get AI Suggestion"
        >
          {isGeneratingAi ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 text-purple-500" />
          )}
        </Button>

        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          className="min-h-[44px] max-h-[120px] resize-none"
          rows={1}
        />

        <Button
          size="icon"
          className="shrink-0"
          onClick={handleSend}
          disabled={isDisabled || (!message.trim() && files.length === 0)}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
