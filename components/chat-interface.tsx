"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from '@ai-sdk/react';
import { QuickDefinitionDialog } from "@/components/quick-definition-dialog";

// Message class to represent chat messages
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system" | "data";
}

interface ChatInterfaceProps {
  threadId: string;
  initialPrompt?: string;
  conversationCount: number | null;
  onCreateNewThread: (text: string, prompt: string) => void;
  onIncrementConversationCount: () => void;
}

// ChatInterface component to render chat interface + functionality
export function ChatInterface({ 
  threadId, 
  initialPrompt = "", 
  conversationCount,
  onCreateNewThread,
  onIncrementConversationCount
}: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit: chatHandleSubmit, setInput } = useChat({ id: threadId });

  const [selectedText, setSelectedText] = useState("");
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [isQuickDefOpen, setIsQuickDefOpen] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [hasInitializedPrompt, setHasInitializedPrompt] = useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Set initial prompt if available and not yet initialized
  useEffect(() => {
    if (initialPrompt && !hasInitializedPrompt && messages.length === 0) {
      setInput(initialPrompt);
      setHasInitializedPrompt(true);
    }
  }, [initialPrompt, hasInitializedPrompt, messages.length, setInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    onIncrementConversationCount();
    chatHandleSubmit(e);
  };

  // Separate effect for auto-submission
  useEffect(() => {
    if (initialPrompt && hasInitializedPrompt && input === initialPrompt) {
      // Use setTimeout to ensure this runs after the state update cycle
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
      }, 100);
    }
  }, [hasInitializedPrompt, initialPrompt, input, handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowContextMenu(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setContextMenuPosition({
        x: e.clientX,
        y: e.clientY
      });
      setShowContextMenu(true);
    }
  };

  const handleQuickDefinition = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    console.log("Selected text for quick definition:", selectedText);

    // Save current position before closing context menu
    const dialogPos = {
      x: contextMenuPosition.x,
      y: contextMenuPosition.y
    };

    setShowContextMenu(false);
    setDialogPosition(dialogPos);
    setIsQuickDefOpen(true);
  };

  const handleCreateThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    onCreateNewThread(selectedText, `Explain this in more detail: "${selectedText}"`);
  };

  const renderMessageContent = (content: string, role: string) => {
    if (role === "assistant") {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only handle clicks outside the context menu
      const contextMenu = document.querySelector('.context-menu');
      if (showContextMenu && contextMenu && !contextMenu.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  return (
    <div className="space-y-4 w-full px-4 flex-1 overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold mb-2">
          AI Learning Conversations Webapp v0.0.4 (Highlight text to get back definitions)
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Learn with the OpenAI GPT-4o model.
        </p>
        <p className="text-xs text-muted-foreground">
          Have suggestions or found a bug? Reach out to{" "}
          <a href="mailto:RoshanAnkiX@gmail.com" className="underline hover:text-primary">
            RoshanAnkiX@gmail.com
          </a>
          , dm on Reddit (
          <a 
            href="https://www.reddit.com/user/__01000010" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            u/__01000010
          </a>
          ), or X (
          <a 
            href="https://twitter.com/Roshgill_" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            @Roshgill_
          </a>
          )
          {conversationCount && `. Conversations Assisted: #${conversationCount}`}
        </p>
      </div>

      <div className="grid w-full gap-2">
        <div 
          className="bg-card text-card-foreground shadow-sm flex h-[calc(100vh-13rem)] flex-col p-3"
          onMouseUp={handleTextSelection}
        >
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
                    {renderMessageContent(message.content, message.role)}
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
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="px-4"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          
          {showContextMenu && (
            <div 
              className="fixed z-50 bg-popover text-popover-foreground shadow-md rounded-md py-1 divide-y divide-gray-200 context-menu"
              style={{ 
                left: `${contextMenuPosition.x}px`, 
                top: `${contextMenuPosition.y}px`,
              }}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <div 
                className="px-4 py-1 cursor-pointer hover:bg-accent"
                onClick={handleQuickDefinition}
              >
                Quick Definition
              </div>
              <div 
                className="px-4 py-1 cursor-pointer hover:bg-accent"
                onClick={handleCreateThread}
              >
                Create Thread
              </div>
            </div>
          )}

          <QuickDefinitionDialog
            isOpen={isQuickDefOpen}
            onClose={() => setIsQuickDefOpen(false)}
            selectedText={selectedText}
            position={dialogPosition}
            messages={messages}
          />
        </div>
      </div>
    </div>
  );
}