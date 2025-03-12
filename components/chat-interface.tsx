"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlashcardPanel } from "@/components/flashcard-panel";
import { StreamData, streamReader } from "@/lib/utils";

import { useChat } from '@ai-sdk/react';

// Message class to represent chat messages
// interface Message {
//   id: string;
//   content: string;
//   role: "user" | "assistant";
//   timestamp: Date;
// }

// ChatInterface component to render chat interface + functionality
export function ChatInterface() {
  //setMessages is a function to update the messages state
  //useState is a hook to manage state in functional components
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  // useRef is a hook to store mutable values that persist across renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit } = useChat();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!input.trim() || isLoading) return;

  //   const userMessage: Message = {
  //     id: Date.now().toString(),
  //     content: input.trim(),
  //     role: "user",
  //     timestamp: new Date(),
  //   };

  //   setMessages((prev) => [...prev, userMessage]);
  //   setInput("");
  //   setIsLoading(true);
  //   setStreamedContent("");

  //   // Cancel any ongoing request
  //   if (abortControllerRef.current) {
  //     abortControllerRef.current.abort();
  //   }

  //   // Create new abort controller for this request
  //   abortControllerRef.current = new AbortController();

  //   try {
  //     // Placeholder for AI SDK integration
  //     // Replace with actual API call
  //     const response = await fetch("/api/chat", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ message: userMessage.content }),
  //       signal: abortControllerRef.current.signal,
  //     });

  //     if (!response.ok) throw new Error("Failed to get response");

  //     let fullContent = "";
  //     for await (const chunk of streamReader(response)) {
  //       if (chunk.content) {
  //         fullContent += chunk.content;
  //         setStreamedContent(fullContent);
  //       }
  //     }

  //     const assistantMessage: Message = {
  //       id: (Date.now() + 1).toString(),
  //       content: fullContent,
  //       role: "assistant",
  //       timestamp: new Date(),
  //     };

  //     setMessages((prev) => [...prev, assistantMessage]);
  //     setStreamedContent("");
  //   } catch (error) {
  //     if (error instanceof Error && error.name === "AbortError") {
  //       console.log("Request cancelled");
  //     } else {
  //       console.error("Error:", error);
  //     }
  //   } finally {
  //     setIsLoading(false);
  //     abortControllerRef.current = null;
  //   }
  // };

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[1fr,400px]">
      <div className="bg-card text-card-foreground shadow-sm flex h-[80vh] flex-col p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={`{message.id}-${generateUniqueId()}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  } max-w-[80%]`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none"
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      <FlashcardPanel />
    </div>
  );
}