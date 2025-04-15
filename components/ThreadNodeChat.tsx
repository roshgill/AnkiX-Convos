"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Maximize2, MessageSquare } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { QuickDefinitionDialog } from "@/components/quick-definition-dialog";
import { HighlightManager, Highlight, Note } from "@/components/highlight-manager";
import { HighlightPanel } from "@/components/highlight-panel";

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
  
  // Selected text info for highlighting
  const [selectedTextInfo, setSelectedTextInfo] = useState<{
    text: string;
    messageId: string;
    offset: number;
  }>({ text: '', messageId: '', offset: 0 });
  
  // Highlight related states
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showHighlightManager, setShowHighlightManager] = useState(false);
  const [showHighlightPanel, setShowHighlightPanel] = useState(false);
  
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

  const renderMessageContent = (content: string, role: string, messageId: string) => {
    // Apply highlights to the text before rendering
    const highlightedContent = applyHighlightsToText(content, messageId);
    
    if (role === "assistant") {
      return (
        <div 
          className="prose prose-sm"
          data-message-id={messageId}
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
      );
    }
    
    return (
      <p 
        className="whitespace-pre-wrap" 
        data-message-id={messageId}
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
    );
  };
  
  // Helper function to apply highlights to text
  const applyHighlightsToText = (text: string, messageId: string) => {
    // Filter highlights for this specific message
    const messageHighlights = highlights.filter(h => h.messageId === messageId);
    
    if (messageHighlights.length === 0) {
      return text; // No highlights for this message
    }
    
    // Sort by position (ascending order) to process from start to end
    const sortedHighlights = [...messageHighlights].sort((a, b) => a.position - b.position);
    
    // Create parts array to build the highlighted text
    let parts = [];
    let currentIndex = 0;
    
    // Apply each highlight
    for (const highlight of sortedHighlights) {
      // Check if the position is valid and text matches
      if (highlight.position >= currentIndex && 
          highlight.position + highlight.text.length <= text.length &&
          text.substring(highlight.position, highlight.position + highlight.text.length) === highlight.text) {
        
        // Add text before this highlight
        if (highlight.position > currentIndex) {
          parts.push(text.substring(currentIndex, highlight.position));
        }
        
        // Generate the highlighted span HTML
        const highlightSpan = `<span 
          class="highlighted-text" 
          data-highlight-id="${highlight.id}" 
          style="background-color: ${getHighlightColor(highlight.color)}; 
                border-radius: 0.25rem; 
                padding: 0 0.25rem;
                cursor: pointer;
                transition: filter 0.2s ease;
                position: relative;"
        >${highlight.text}</span>`;
        
        parts.push(highlightSpan);
        
        // Update current index to after this highlight
        currentIndex = highlight.position + highlight.text.length;
      } else if (text.includes(highlight.text)) {
        // If position is invalid but text exists in message, try to find it
        const textIndex = text.indexOf(highlight.text, currentIndex);
        if (textIndex !== -1) {
          // Add text before this highlight
          if (textIndex > currentIndex) {
            parts.push(text.substring(currentIndex, textIndex));
          }
          
          // Generate the highlighted span HTML
          const highlightSpan = `<span 
            class="highlighted-text" 
            data-highlight-id="${highlight.id}" 
            style="background-color: ${getHighlightColor(highlight.color)}; 
                  border-radius: 0.25rem; 
                  padding: 0 0.25rem;
                  cursor: pointer;
                  transition: filter 0.2s ease;
                  position: relative;"
          >${highlight.text}</span>`;
          
          parts.push(highlightSpan);
          
          // Update current index to after this highlight
          currentIndex = textIndex + highlight.text.length;
        }
      }
    }
    
    // Add any remaining text after the last highlight
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    // Join all parts to get the final result
    return parts.join('');
  };
  
  // Helper to convert Tailwind class names to actual CSS colors
  const getHighlightColor = (colorClass: string) => {
    switch(colorClass) {
      case 'bg-yellow-200': return '#fef08a';
      case 'bg-green-200': return '#bbf7d0';
      case 'bg-blue-200': return '#bfdbfe';
      case 'bg-purple-200': return '#e9d5ff';
      case 'bg-pink-200': return '#fbcfe8';
      default: return '#fef08a'; // Default to yellow
    }
  };

  // Toggle expanded state
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handle text selection and context menu
  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      setSelectedText(text);
      
      // Get the range to find position information
      const range = selection.getRangeAt(0);
      
      // Find the message element containing this selection
      const messageElement = findClosestMessageElement(range.startContainer);
      
      if (messageElement) {
        const messageId = messageElement.getAttribute('data-message-id') || '';
        
        // Compute the text offset
        const offset = getTextOffset(messageElement, range.startContainer, range.startOffset);
        
        // Save the info about selected text
        setSelectedTextInfo({
          text,
          messageId,
          offset
        });
      }
      
      // Position the context menu
      setContextMenuPosition({
        x: e.clientX,
        y: e.clientY
      });
      setShowContextMenu(true);
    }
  };

  // Helper to find the closest message element
  const findClosestMessageElement = (node: Node): HTMLElement | null => {
    let current = node;
    while (current && current !== document.body) {
      if (current instanceof HTMLElement && current.hasAttribute('data-message-id')) {
        return current;
      }
      if (current.parentNode) {
        current = current.parentNode;
      } else {
        break;
      }
    }
    return null;
  };

  // Helper function to compute text offset
  function getTextOffset(container: HTMLElement, targetNode: Node, nodeOffset: number): number {
    let offset = 0;
    let found = false;

    // Use a recursive function to traverse text nodes in order
    function traverse(node: Node): void {
      // If we've reached the target node, add the nodeOffset and stop.
      if (node === targetNode) {
        offset += nodeOffset;
        found = true;
        return;
      }

      // If it's a text node, add its length.
      if (node.nodeType === Node.TEXT_NODE) {
        offset += node.textContent?.length || 0;
      }

      // Iterate over child nodes if not reached the target.
      for (const child of Array.from(node.childNodes)) {
        if (found) break; // Stop traversal once target is found
        traverse(child);
      }
    }

    traverse(container);
    return offset;
  }

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

  // Handle highlight text selection
  const handleHighlightText = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Save position before closing context menu
    const highlightPos = {
      x: contextMenuPosition.x,
      y: contextMenuPosition.y
    };
    
    setShowContextMenu(false);
    setDialogPosition(highlightPos);
    setShowHighlightManager(true);
  };
  
  // Add a new highlight
  const handleAddHighlight = (text: string, color: string, noteContent?: string) => {
    // Create new highlight
    const newHighlight: Highlight = {
      id: `highlight-${Date.now()}`,
      text,
      color,
      notes: [],
      position: selectedTextInfo.offset, // Add text position
      messageId: selectedTextInfo.messageId // Add message ID
    };
    
    setHighlights(prev => [...prev, newHighlight]);
    
    // If there was a note provided, add it
    if (noteContent) {
      setTimeout(() => {
        handleAddNote(newHighlight.id, noteContent);
      }, 0);
    }
    
    return newHighlight.id; // Return the ID for immediate use
  };
  
  // Add a note to a highlight
  const handleAddNote = (highlightId: string, noteContent: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: noteContent,
      createdAt: new Date()
    };
    
    setHighlights(prev => 
      prev.map(highlight => 
        highlight.id === highlightId
          ? { ...highlight, notes: [...highlight.notes, newNote] }
          : highlight
      )
    );
  };
  
  // Delete a highlight
  const handleDeleteHighlight = (highlightId: string) => {
    setHighlights(prev => prev.filter(highlight => highlight.id !== highlightId));
  };
  
  // Delete a note
  const handleDeleteNote = (highlightId: string, noteId: string) => {
    setHighlights(prev => 
      prev.map(highlight => 
        highlight.id === highlightId
          ? { ...highlight, notes: highlight.notes.filter(note => note.id !== noteId) }
          : highlight
      )
    );
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
      className={`absolute p-2 rounded-2xl shadow-md transition-all duration-200 ${nodeSize} ${
        isActive
          ? "bg-white-100 text-gray-800 shadow-lg border border-gray-200"
          : "bg-white-100 text-gray-800 hover:shadow-lg border border-gray-200"
      }`}
      style={{
        transform: 'translate(-50%, -50%)',
        zIndex: isActive ? 10 : 1,
        cursor: 'default',
      }}
      onClick={onThreadClick}
    >
      <div 
        className="flex items-start justify-between mb-1 cursor-move"
        onMouseDown={onDragStart}
      >
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-700" />
          <div className="overflow-hidden">
            <div className="font-medium truncate text-gray-800">{title}</div>
            <div className="text-xs text-gray-500">{formatTimestamp(createdAt)}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-gray-700"
            onClick={toggleExpanded}
          >
            {isExpanded ? "-" : "+"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-gray-700"
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
      <div className="cursor-text bg-white p-4 rounded-xl">
        {!isExpanded ? (
          <div className="text-xs truncate text-gray-500">
          
          </div>
        ) : (
          <>
            <ScrollArea 
              className="h-[35rem] mb-2 pr-1" 
              onMouseUp={handleTextSelection}
            >
              <div className="flex flex-col gap-2">
                {messages.length === 0 && (
                  <div className="text-xs text-gray-400 italic">No messages yet</div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`text-sm ${
                        message.role === "user"
                          ? "text-gray-800 font-normal"
                          : "prose prose-sm dark:prose-invert max-w-none text-gray-700 font-normal"
                      } max-w-[90%]`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {renderMessageContent(message.content, message.role, message.id)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="flex gap-3 items-center mt-2">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[42px] flex-1 resize-none p-2 pl-4 rounded-full text-sm text-gray-800 shadow-sm"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                }}
              />
              <Button 
                type="submit" 
                size="sm"
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>

      {/* Context menu for text selection */}
      {showContextMenu && (
        <div 
          className="fixed z-50 bg-white text-gray-800 shadow-sm rounded-md py-1 divide-y divide-gray-100 node-context-menu"
          style={{ 
            left: `${contextMenuPosition.x}px`, 
            top: `${contextMenuPosition.y}px`,
          }}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div 
            className="px-4 py-1 cursor-pointer hover:bg-gray-50 font-normal text-xs"
            onClick={handleQuickDefinition}
          >
            Quick Definition
          </div>
          <div 
            className="px-4 py-1 cursor-pointer hover:bg-gray-50 font-normal text-xs"
            onClick={handleCreateThread}
          >
            Create Thread
          </div>
          <div 
            className="px-4 py-1 cursor-pointer hover:bg-gray-50 font-normal text-xs"
            onClick={handleHighlightText}
          >
            Highlight
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
      
      {/* Highlight Manager */}
      <HighlightManager
        isOpen={showHighlightManager}
        onClose={() => setShowHighlightManager(false)}
        position={dialogPosition}
        selectedText={selectedText}
        onAddHighlight={handleAddHighlight}
        highlights={highlights}
        onAddNote={handleAddNote}
        onUpdateHighlightColor={(highlightId, color) => {
          setHighlights(prev =>
            prev.map(highlight =>
              highlight.id === highlightId
                ? { ...highlight, color }
                : highlight
            )
          );
        }}
        onDeleteNote={handleDeleteNote}
      />

      {/* Button to toggle the highlight panel */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowHighlightPanel(!showHighlightPanel);
        }}
        className="absolute bottom-4 right-4 bg-white text-gray-800 shadow-md rounded-full p-1.5 z-40 hover:bg-gray-50"
        title="Toggle highlights"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path>
        </svg>
      </button>

      {/* Highlight Panel - slide in from the right inside the node */}
      {showHighlightPanel && (
        <div className="absolute right-0 top-0 h-full w-64 z-40 transform transition-transform duration-300 ease-in-out rounded-r-xl overflow-hidden">
          <HighlightPanel
            highlights={highlights}
            onAddNote={handleAddNote}
            onDeleteHighlight={handleDeleteHighlight}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      )}
    </div>
  );
}

