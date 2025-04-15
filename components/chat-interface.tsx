"use client";

// useState: React hook for managing state variables of a component
// useRef: Hook that creates mutable object persisting across renders and remains for the full lifetime of the component
// useEffect: React hook that runs side effects after render, with optional dependecy array to control when effects re-execute
import { useState, useRef, useEffect, use } from "react";

// Markdown: A component to render Markdown content (e.g. for displaying chat messages with specific formatting)
// Send: An icon from the lucide-react library
// Button, Textarea, ScrollArea: UI components for buttons, text areas, and scrollable areas
import { Markdown } from "@/components/ui/markdown"
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// useChat hook via aisdk by Vercel:
// Used to manage chat messages and input
// Don't have to re-create simple handler functions (e.g. resetting input to null after user presses submit, etc.)
import { useChat } from '@ai-sdk/react';

// Components from other files
import { QuickDefinitionDialog } from "@/components/quick-definition-dialog";
import { HighlightManager, Highlight, Note } from "@/components/highlight-manager";
import { HighlightPanel } from "@/components/highlight-panel";

// Message class to represent chat messages. It's a data structure
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system" | "data";
}

// Chat interface props. Data structure to represent the chat interface
// Props means the properties that the component can accept when it's rendered
interface ChatInterfaceProps {
  threadId?: string;
  initialPrompt?: string; // For thread creation
  // conversationCount?: number | null; // Required so that it can be used to update the conversation count in the database
  // onCreateNewThread?: (text: string, prompt: string) => void; // Prop drilling technique where a function is passed from a parent component to a child, to allow the child to trigger actions in the parent's scope
  // onIncrementConversationCount?: () => void; // Can be used to update the conversation count in the database; and doesn't need to be defined here
}

// ChatInterface component to render chat interface + associated functionality
export function ChatInterface({ 
  threadId, 
  // initialPrompt = "",
  // conversationCount,
  // onCreateNewThread,
  // onIncrementConversationCount
}: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // useChat hook from aisdk to manage chat messages and input
  // threadId: used to identify the specific chat thread; separates different threads and state variables/functions 
  const { messages, input, handleInputChange, handleSubmit: chatHandleSubmit, setInput } = useChat({ id: threadId });

  const [selectedText, setSelectedText] = useState("");
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [isQuickDefOpen, setIsQuickDefOpen] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [hasInitializedPrompt, setHasInitializedPrompt] = useState(false);
  
  // Highlight related states
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showHighlightManager, setShowHighlightManager] = useState(false);
  const [currentHighlightId, setCurrentHighlightId] = useState<string | null>(null);

  // Testing purposes for highlighting based on position and not text
  const [selectedTextInfo, setSelectedTextInfo] = useState<{
    text: string;
    messageId: string;
    offset: number;
  }>({ text: '', messageId: '', offset: 0 });


  // Scroll to the bottom of the chat area when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Set initial prompt if available and not yet initialized
  // useEffect(() => {
    // if (initialPrompt && !hasInitializedPrompt && messages.length === 0) {
    //   setInput(initialPrompt);
    //   setHasInitializedPrompt(true);
    // }
  // }, [initialPrompt, hasInitializedPrompt, messages.length, setInput]);

  // Calls chatHandleSubmit, a hook provided by aisdk, which takes in the form event data and resets the input field, and appends the messages array
  const handleSubmit = async (e: React.FormEvent) => {
    // onIncrementConversationCount();
    chatHandleSubmit(e);
  };

  // Separate effect for auto-submission (for creating threads and initial prompts)
  // useEffect(() => {
  //   if (initialPrompt && hasInitializedPrompt && input === initialPrompt) {
  //     // Use setTimeout to ensure this runs after the state update cycle
  //     setTimeout(() => {
  //       // What does this do ? Especially the syntax meaning
  //       const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
  //       handleSubmit(fakeEvent);
  //     }, 100);
  //   }
  // }, [hasInitializedPrompt, initialPrompt, input, handleSubmit]);

  // Handle keydown events in the text area
  // To allow users to create a new line with Shift + Enter
  // and submit the form with Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Stops the browser's default form submission behavior (which would refresh the page)
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Helper function to compute the text offset within a container element given a text node and an offset within that node.
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

  // Handle text selection and context menu display
  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowContextMenu(false);
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
        console.log("Selected message ID:", messageId);
  
        // Compute the overall offset using our helper function:
        const offset = getTextOffset(messageElement, range.startContainer, range.startOffset);
        console.log("Calculated offset:", offset, "for text:", text);
  
        setSelectedTextInfo({
          text,
          messageId,
          offset
        });
      } else {
        console.log("Could not find message element for selection");
      }
    }
  
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    setShowContextMenu(true);
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

  // Handle context menu actions
  const handleQuickDefinition = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling and firing up handleTextSelection again
    console.log("Selected text for quick definition:", selectedText);

    // Save current position before closing context menu
    const dialogPos = {
      x: contextMenuPosition.x,
      y: contextMenuPosition.y
    };

    // Close context menu and open quick definition dialog
    setShowContextMenu(false);
    setDialogPosition(dialogPos);
    setIsQuickDefOpen(true);
  };

  // Handle creating a new thread
  // const handleCreateThread = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   setShowContextMenu(false);
  //   onCreateNewThread(selectedText, `Explain this in more detail: "${selectedText}"`);
  // };

  // Handle highlight-text feature (When user presses "Highlight" in menu)
  const handleHighlightText = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Save position before closing context menu
    const highlightPos = {
      x: contextMenuPosition.x,
      y: contextMenuPosition.y
    };
    
    setShowContextMenu(false);
    setDialogPosition(highlightPos);
    // setCurrentHighlightId(null); // Reset current highlight ID
    setShowHighlightManager(true);
  };
  
  // Add a new highlight
  // Mostly used to create a new highlight and adding it to the highlights array to oversee
  // Notes are handled in the HighlightManager component
  const handleAddHighlight = (text: string, color: string, noteContent?: string) => {
    // Create new highlight object from the text, and notes if any
    const newHighlight: Highlight = {
      id: `highlight-${Date.now()}`,
      text,
      color,
      notes: [],
      position: selectedTextInfo.offset, // Use the offset from the selected text,
      messageId: selectedTextInfo.messageId // Use the message ID from the selected text
    };
    
    setHighlights(prev => [...prev, newHighlight]); // Update highlights state with the new highlight
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
  
  // Update a highlight's color
  const handleUpdateHighlightColor = (highlightId: string, color: string) => {
    setHighlights(prev =>
      prev.map(highlight =>
        highlight.id === highlightId
          ? { ...highlight, color }
          : highlight
      )
    );
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

  // Delete a highlight
  const handleDeleteHighlight = (highlightId: string) => {
    setHighlights(prev => prev.filter(highlight => highlight.id !== highlightId));
  };
  

  // Render message content based on role
  const renderMessageContent = (content: string, role: string, messageId: string) => {
    if (role === "assistant") {
      // For assistant messages with Markdown
      // Apply highlights before passing to Markdown component
      const highlightedContent = applyHighlightsToText(content, messageId);
      return (
        <div 
          className="prose prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-xs"
          data-message-id={messageId}
        >
          <Markdown>{highlightedContent}</Markdown>
        </div>
      );
    }
    
    // For user messages, use dangerouslySetInnerHTML to render the HTML
    return <p 
      className="whitespace-pre-wrap" 
      data-message-id={messageId}
      dangerouslySetInnerHTML={{ __html: applyHighlightsToText(content, messageId) }}
    />;
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

  // Handle clicks outside the context menu to close it
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

  // Handle clicks on highlighted text
  useEffect(() => {
    const handleHighlightClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the clicked element is a highlighted text span
      if (target.classList.contains('highlighted-text')) {
        const highlightId = target.getAttribute('data-highlight-id');
        if (highlightId) {
          // Find the highlight in our state
          const clickedHighlight = highlights.find(h => h.id === highlightId);
          if (clickedHighlight) {
            // Set the selected text and position for the highlight manager
            setSelectedText(clickedHighlight.text);
            setCurrentHighlightId(highlightId);
            setDialogPosition({
              x: e.clientX,
              y: e.clientY
            });
            // Show the highlight manager
            setShowHighlightManager(true);
          }
        }
      }
    };
    
    // Add event listener for highlight clicks
    document.addEventListener('click', handleHighlightClick);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleHighlightClick);
    };
  }, [highlights]);
  
  // Add hover effect for highlighted text
  useEffect(() => {
    const addHoverEffects = () => {
      const highlightedElements = document.querySelectorAll('.highlighted-text');
      
      highlightedElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
          (element as HTMLElement).style.filter = 'brightness(0.95)';
          (element as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
        });
        
        element.addEventListener('mouseleave', () => {
          (element as HTMLElement).style.filter = 'brightness(1)';
          (element as HTMLElement).style.boxShadow = 'none';
        });
      });
    };
    
    // Small timeout to ensure DOM is updated with new highlights
    const timeoutId = setTimeout(addHoverEffects, 100);
    
    // Cleanup
    return () => clearTimeout(timeoutId);
  }, [messages, highlights]);
  
  // The HTML/CSS structure code for the chat interface. Works in tandem with the TypeScript code above
  return (
    // 1) Make the container take the full height of the viewport (or parent)
    <div className="flex flex-col h-screen w-full bg-white">
      
      {/* Top header area (if you want) */}
      <div className="flex justify-end p-4">
        <h1 
          className="text-2xl font-medium text-gray-800"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px' }}
        >
          AI Learning Conversations v0.0.6
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
                data-message-id={message.id} // Add ID here
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
                style={{ paddingTop: '24px', paddingBottom: '24px' }}
              >
                <div
                  data-message-id={message.id} // Add ID here as well
                  className={`${
                    message.role === "user"
                      ? "text-gray-800 font-normal"
                      : "prose prose-sm font-normal text-gray-700 max-w-none"
                  } max-w-[85%]`}
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
                >
                  {renderMessageContent(message.content, message.role, message.id)}
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
                e.preventDefault(); // Not sure what this does, maybe a delay
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
            onClick={handleHighlightText}
          >
            Highlight
          </div>
          <div 
            className="px-4 py-1 cursor-pointer hover:bg-gray-50 font-normal"
            onClick={handleQuickDefinition}
          >
            Quick Definition
          </div>
          <div 
            className="px-4 py-1 cursor-pointer hover:bg-gray-50 font-normal"
            onClick={() => {}}
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

      {/* Highlight Manager */}
      <HighlightManager
        isOpen={showHighlightManager}
        onClose={() => setShowHighlightManager(false)}
        position={dialogPosition}
        selectedText={selectedText}
        onAddHighlight={handleAddHighlight}
        highlights={highlights}
        onAddNote={handleAddNote}
        onUpdateHighlightColor={handleUpdateHighlightColor}
        onDeleteNote={handleDeleteNote}
      />

    </div>
  );
}