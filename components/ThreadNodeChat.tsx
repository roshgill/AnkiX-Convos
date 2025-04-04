"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Maximize2, MessageSquare } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { QuickDefinitionDialog } from "@/components/quick-definition-dialog";

interface ThreadNodeChatProps {
  threadId: string;
  title: string;
  createdAt: string;
  sourceText: string;
  initialPrompt?: string; // Add initialPrompt prop
  onFullscreen: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  isActive: boolean;
  onThreadClick: () => void;
  onIncrementConversationCount: () => void;
  onCreateNewThread: (text: string, prompt: string) => void;
}

export function ThreadNodeChat({
  threadId,
  title,
  createdAt,
  sourceText,
  initialPrompt = "", // Add default value
  onFullscreen,
  onDragStart,
  isActive,
  onThreadClick,
  onIncrementConversationCount,
  onCreateNewThread
}: ThreadNodeChatProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { messages, input, handleInputChange, handleSubmit: chatHandleSubmit, setInput } = useChat({ id: threadId });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add state for tracking initial prompt initialization
  const [hasInitializedPrompt, setHasInitializedPrompt] = useState(false);
  
  // Text selection and dialog states
  const [selectedText, setSelectedText] = useState("");
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [isQuickDefOpen, setIsQuickDefOpen] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // Set initial prompt if available and not yet initialized
  useEffect(() => {
    if (initialPrompt && !hasInitializedPrompt && messages.length === 0) {
      setInput(initialPrompt);
      setHasInitializedPrompt(true);
    }
  }, [initialPrompt, hasInitializedPrompt, messages.length, setInput]);

  // Auto-submit effect
  useEffect(() => {
    if (initialPrompt && hasInitializedPrompt && input === initialPrompt) {
      // Use setTimeout to ensure this runs after the state update cycle
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
      }, 100);
    }
  }, [hasInitializedPrompt, initialPrompt, input]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onIncrementConversationCount();
    chatHandleSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderMessageContent = (content: string, role: string) => {
    if (role === "assistant") {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  // Toggle expanded state
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handle text selection
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

  // Handle quick definition
  const handleQuickDefinition = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Save current position before closing context menu
    const dialogPos = {
      x: contextMenuPosition.x,
      y: contextMenuPosition.y
    };

    setShowContextMenu(false);
    setDialogPosition(dialogPos);
    setIsQuickDefOpen(true);
  };

  // Handle create thread
  const handleCreateThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    onCreateNewThread(selectedText, `Explain this in more detail: "${selectedText}"`);
  };

  // Handle clicks outside the context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only handle clicks outside the context menu
      const contextMenu = document.querySelector('.node-context-menu');
      if (showContextMenu && contextMenu && !contextMenu.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  const nodeSize = isExpanded ? "w-[36rem] h-[42rem]" : "w-[27rem] h-auto";

  return (
    <div
      className={`absolute p-2 rounded-3xl shadow-md transition-all duration-200 ${nodeSize} ${
        isActive
          ? "bg-[#3A3A3A] text-white shadow-lg border-2 border-primary"
          : "bg-[#3A3A3A] text-white hover:shadow-lg border border-border"
      }`}
      style={{
        transform: 'translate(-50%, -50%)',
        zIndex: isActive ? 10 : 1,
        cursor: 'default', // Set default cursor for the entire component
      }}
      onClick={onThreadClick}
    >
      <div 
        className="flex items-start justify-between mb-1 cursor-move" // Add cursor-move to header
        onMouseDown={onDragStart} // Only apply drag event to the header
      >
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="font-medium truncate">{title}</div>
            <div className="text-xs text-muted-foreground">{formatTimestamp(createdAt)}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={toggleExpanded}
          >
            {isExpanded ? "-" : "+"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen();
            }}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content area with default cursor for text selection */}
      <div className="cursor-text">
        {!isExpanded ? (
          <div className="text-xs truncate text-muted-foreground">
          
          </div>
        ) : (
          <>
            <ScrollArea 
              className="h-[35rem] mb-2 pr-1" 
              onMouseUp={handleTextSelection}
            >
              <div className="flex flex-col gap-2">
                {messages.length === 0 && (
                  <div className="text-xs text-muted-foreground italic">No messages yet</div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`text-xl ${
                        message.role === "user"
                          ? "text-primary"
                          : "prose prose-xs dark:prose-invert max-w-none"
                      } max-w-[90%]`}
                    >
                      {renderMessageContent(message.content, message.role)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="flex gap-1 mt-1">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type message..."
                className="min-h-[28px] h-7 flex-1 resize-none p-1 pl-2 text-xl text-black rounded-xl"
              />
              <Button 
                type="submit" 
                size="sm"
                className="h-7 w-7 p-0 rounded-xl"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </>
        )}
      </div>

      {/* Context menu for text selection */}
      {showContextMenu && (
        <div 
          className="fixed z-50 bg-popover text-popover-foreground shadow-md rounded-md py-1 divide-y divide-gray-200 node-context-menu"
          style={{ 
            left: `${contextMenuPosition.x}px`, 
            top: `${contextMenuPosition.y}px`,
          }}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div 
            className="px-3 py-1 cursor-pointer hover:bg-accent text-xs"
            onClick={handleQuickDefinition}
          >
            Quick Definition
          </div>
          <div 
            className="px-3 py-1 cursor-pointer hover:bg-accent text-xs"
            onClick={handleCreateThread}
          >
            Create Thread
          </div>
        </div>
      )}

      {/* Quick Definition Dialog */}
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

