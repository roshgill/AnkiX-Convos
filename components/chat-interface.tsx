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
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system" | "data";
}

// ChatInterface component to render chat interface + functionality
export function ChatInterface() {
  //setMessages is a function to update the messages state
  //useState is a hook to manage state in functional components
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [flashcardMessages, setFlashcardMessages] = useState<Message[]>([]);
  // useRef is a hook to store mutable values that persist across renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [flashcardUpdateTriggered, setFlashcardUpdateTriggered] = useState(false); // Flag to prevent multiple updates (quick solution)

  const { messages, input, handleInputChange, handleSubmit } = useChat();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }

  // Quick solution for now
  // Check if there are three back-and-forth exchanges (6 messages total)
  if (messages.length % 6 === 0 && messages.length > 0 && !flashcardUpdateTriggered) {
    setFlashcardMessages(messages);
    setFlashcardUpdateTriggered(true); // Prevent further updates until condition resets
  } else if (messages.length % 6 !== 0) {
    // Reset the flag when messages length is not a multiple of 6
    setFlashcardUpdateTriggered(false);
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
    <div className="space-y-4">
      <div className="max-w-[800px]">
        <h1 className="text-2xl font-bold mb-2">AnkiX-Conversations</h1>
        <h2 className="text-med font-medium text-muted-foreground mb-2">
          AI-Powered Flashcards from Your Learning Conversations
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Chat with the OpenAI GPT-4o model while flashcards are generated in real-time (every 3 back and forths). Refine and export to Anki for immediate studying.
        </p>
        <p className="text-xs text-muted-foreground">
          Have suggestions or found a bug? Reach out to{" "}
          <a href="mailto:RoshanAnkiX@gmail.com" className="underline hover:text-primary">
            RoshanAnkiX@gmail.com
          </a>
          , message me on Reddit (
          <a 
            href="https://www.reddit.com/user/__01000010" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            u/__01000010
          </a>
          ), or let's connect on X (
          <a 
            href="https://twitter.com/Roshgill_" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            @Roshgill_
          </a>
          ) — I need more internet friends 🥺
        </p>
      </div>

      <div className="grid w-full gap-3 lg:grid-cols-[2.3fr,1fr]">
        <div className="bg-card text-card-foreground shadow-sm flex h-[68vh] flex-col p-3">
          <ScrollArea className="flex-1 pr-3" ref={scrollAreaRef}>
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
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
          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="min-h-[80px] flex-1 resize-none p-3"
            />
            <Button type="submit" disabled={isLoading} className="px-4">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
        <FlashcardPanel messages={flashcardMessages} />
      </div>
    </div>
  );
}