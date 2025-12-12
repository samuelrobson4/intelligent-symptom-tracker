// Message component for chat interface
// Clean, minimal bubble design


import { cn } from "@/lib/utils";

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function Message({ role, content }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn("flex mb-2.5", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "rounded-2xl px-3 py-1.5 max-w-[80%]",
        isUser
          ? "bg-blue-400 text-white"
          : "bg-gray-100 text-gray-900"
      )}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
