"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlashcardPanel } from "@/components/flashcard-panel";
import { StreamData, streamReader } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useChat } from '@ai-sdk/react';

import { getConversationCount, getAndIncrementConversationCount } from "@/app/actions/database";

// Message class to represent chat messages
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system" | "data";
}

interface Flashcard {
  id: string;
  front: string;
  //back: string;
  reason: string;
}

// ChatInterface component to render chat interface + functionality
export function ChatInterface() {
  const [conversationCount, setConversationCount] = useState<number | null>(null);
  const [hasIncrementedCount, setHasIncrementedCount] = useState(false);
  
  //setMessages is a function to update the messages state
  //useState is a hook to manage state in functional components
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [flashcardMessages, setFlashcardMessages] = useState<Message[]>([]);
  const [shouldGenerateCards, setShouldGenerateCards] = useState(false);
  // useRef is a hook to store mutable values that persist across renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [flashcardUpdateTriggered, setFlashcardUpdateTriggered] = useState(false); // Flag to prevent multiple updates (quick solution)

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit } = useChat();

  const [selectedText, setSelectedText] = useState("");
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [cardContent, setCardContent] = useState("");
  const [manualCreatedCard, setManualCreatedCard] = useState<Flashcard | null>(null);


  const handleSelection = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();

    // Prevent running this logic if clicking on "Create Card" button
    if ((e.target as HTMLElement).closest('.create-card-btn')) {
      return;
    }

    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString().trim());
      setSelectionPosition({ x: rect.x, y: rect.y });
    } else {
      setSelectionPosition(null);
    }
  };

  const handleCreateCard = (e: React.MouseEvent<HTMLButtonElement>) => {
    // e.stopPropagation();
    console.log(selectedText);
    setCardContent(selectedText);
    setIsCardDialogOpen(true);
    setSelectionPosition(null);
  };

  const handleConfirmCard = () => {
    if (cardContent.trim()) {
      // Create a new message with the card content
      const newCard = { 
        id: generateUniqueId(),
        front: cardContent,
        reason: "Manually crafted "// Explicitly type as "data"
      };
      
      // Update flashcard messages
      setManualCreatedCard(newCard);
      setIsCardDialogOpen(false);
      setCardContent("");
    }
  };

  const handleClozeSelection = () => {
    const textarea = document.getElementById('card-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (selectedText) {
      const newContent = 
        textarea.value.substring(0, start) +
        `{{c1::${selectedText}}}` +
        textarea.value.substring(end);
      
      setCardContent(newContent);

      // Restore focus after state update
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + 6, // length of "{{c1::"
          start + 6 + selectedText.length
        );
      }, 0);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  useEffect(() => {
    // Get initial count without incrementing
    getConversationCount().then(count => {
      if (count) setConversationCount(count);
    });
  }, []);

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleGenerateCards = () => {
    setFlashcardMessages(messages);
    setShouldGenerateCards(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!hasIncrementedCount) {
      await getAndIncrementConversationCount();
      setHasIncrementedCount(true);
    }
    originalHandleSubmit(e);
  };

  return (
    <div className="space-y-4 w-full px-4" onMouseUp={(e) => handleSelection(e)}>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          Anki-X Conversations v0.0.3
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Learn with the OpenAI GPT-4o model and pick the perfect time to generate cloze flashcards from your conversation. Edit and export to Anki for immediate studying.
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
          ), or on X (
          <a 
            href="https://twitter.com/Roshgill_" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            @Roshgill_
          </a>
          )
          {conversationCount && `. Number of Conversations Assisted: #${conversationCount}`}
        </p>
      </div>

      <div className="grid w-full gap-2 lg:grid-cols-[2.8fr,1fr]">
        <div className="bg-card text-card-foreground shadow-sm flex h-[calc(100vh-13rem)] flex-col p-3">
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
                        : "bg-muted prose prose-sm dark:prose-invert max-w-none"
                    } max-w-[80%]`}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="sticky bottom-0 mt-3 flex gap-3">
            <Textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[32px] flex-1 resize-none p-1 pl-4 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-med"
            />
            <Button type="submit" disabled={isLoading} className="px-4">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
        <div className="flex flex-col gap-3 h-[calc(100vh-13rem)]">
          <Button 
            onClick={handleGenerateCards} 
            className="w-full"
            disabled={messages.length === 0}
          >
            Generate Flashcards from Conversation
          </Button>
          <FlashcardPanel 
            messages={flashcardMessages} 
            manualCreatedCard={manualCreatedCard}
            shouldGenerate={shouldGenerateCards}
            onGenerateComplete={() => setShouldGenerateCards(false)}
          />
        </div>
      </div>

      {selectionPosition && (
        <button
        style={{
          position: 'absolute',
          left: selectionPosition.x + window.scrollX,
          top: selectionPosition.y + window.scrollY - 40
        }}
          className="create-card-btn bg-primary text-primary-foreground px-3 py-1 rounded shadow-lg cursor-pointer"
          onClick={(e) => handleCreateCard(e)}
        >
          Create Card
        </button>
      )}

      <Dialog 
        open={isCardDialogOpen} 
        onOpenChange={(open) => {
          setIsCardDialogOpen(open);
          if (!open) {
            setCardContent("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Flashcard</DialogTitle>
            <DialogDescription>
              Edit the text below to create your flashcard. Select text and click [...] to create a cloze deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="card-content">Card Content</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClozeSelection}
                  className="px-2 h-7"
                >
                  [...]
                </Button>
              </div>
              <Textarea
                id="card-content"
                value={cardContent}
                onChange={(e) => setCardContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleConfirmCard}>
              Create Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}