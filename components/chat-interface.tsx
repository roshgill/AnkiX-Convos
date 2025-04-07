"use client";

import { useState, useRef, useEffect } from "react";
import { Markdown } from "@/components/ui/markdown"
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
      return <Markdown className="prose prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-xs">{content}</Markdown>;
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
    // 1) Make the container take the full height of the viewport (or parent)
    <div className="flex flex-col h-screen w-full bg-white">
      
      {/* Top header area (if you want) */}
      <div className="flex justify-end p-4">
        <h1 
          className="text-2xl font-medium text-gray-800"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px' }}
        >
          AI Learning Conversations v0.0.5
        </h1>
      </div>

      {/* 2) Main content area: flex-1 to fill available space */}
      <div 
        className="flex flex-col flex-1 items-center"
        onMouseUp={handleTextSelection}
      >
        {/* 3) Scrollable message area: also use flex-1 */}
        <ScrollArea 
          className="flex-1 w-full max-w-[700px] px-6 overflow-y-auto pr-4" 
          ref={scrollAreaRef}
          style={{ paddingTop: '24px', paddingBottom: '24px' }}
        >
          <div className="flex flex-col gap-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
                style={{ paddingTop: '24px', paddingBottom: '24px' }}
              >
                <div
                  className={`${
                    message.role === "user"
                      ? "text-gray-800 font-normal"
                      : "prose prose-sm font-normal text-gray-700 max-w-none"
                  } max-w-[85%]`}
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
                >
                  {renderMessageContent(message.content, message.role)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* 4) Form at the bottom (no longer pushed up) */}
        <div className="w-full max-w-[700px] px-6 pb-4">
          <form 
            onSubmit={handleSubmit} 
            className="flex gap-3 items-center"
            style={{ 
              padding: '10px 20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              borderRadius: '24px',
              backgroundColor: 'white'
            }}
          >
            <Textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[42px] flex-1 resize-none p-2 pl-4 rounded-md focus:outline-none 
                         focus:ring-1 focus:ring-gray-300 focus:border-transparent text-med shadow-sm font-normal"
              style={{ 
                fontFamily: 'Inter, sans-serif', 
                fontSize: '15px', 
                borderRadius: '24px', 
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)' 
              }}
            />
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              style={{ borderRadius: '24px' }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Context menu & quick definition dialog */}
      {showContextMenu && (
        <div 
          className="fixed z-50 bg-white text-gray-800 shadow-sm rounded-md py-1 divide-y divide-gray-100 context-menu"
          style={{ 
            left: `${contextMenuPosition.x}px`, 
            top: `${contextMenuPosition.y}px`,
          }}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div 
            className="px-4 py-1 cursor-pointer hover:bg-gray-50 font-normal"
            onClick={handleQuickDefinition}
          >
            Quick Definition
          </div>
          <div 
            className="px-4 py-1 cursor-pointer hover:bg-gray-50 font-normal"
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
  );
}