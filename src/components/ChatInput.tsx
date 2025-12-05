/**
 * Chat input component with send button
 * Handles user input and message sending
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";
import { FormEvent, KeyboardEvent, useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  autoFocus = true
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when value is cleared (after submission)
  useEffect(() => {
    if (value === '' && !disabled && autoFocus) {
      inputRef.current?.focus();
    }
  }, [value, disabled, autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your message"
        disabled={disabled}
        autoFocus={autoFocus}
        className="flex-1 text-sm border-gray-300 focus:border-blue-400 focus:ring-blue-400 h-9"
      />
      <Button
        type="submit"
        disabled={disabled || !value.trim()}
        size="icon"
        className="bg-blue-400 hover:bg-blue-500 h-9 w-9"
      >
        <SendHorizontal className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}
