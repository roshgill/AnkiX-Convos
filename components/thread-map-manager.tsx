"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, ZoomIn, ZoomOut, Move, Maximize2, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInterface } from "@/components/chat-interface";
import { ThreadDialog } from "@/components/thread-dialog";
import { ThreadNodeChat } from "@/components/ThreadNodeChat";
import { getConversationCount, getAndIncrementConversationCount } from "@/app/actions/database";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system" | "data";
}

interface Thread {
  id: string;
  parentId: string | null;
  sourceText: string;
  initialPrompt: string;
  title: string;
  messages: Message[];
  createdAt: string;
  // Map coordinates
  x: number;
  y: number;
}

interface ThreadNode {
  thread: Thread;
  element: HTMLDivElement | null;
}

export function ThreadMapManager() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("main");
  const [isNewThreadDialogOpen, setIsNewThreadDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadPrompt, setNewThreadPrompt] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [conversationCount, setConversationCount] = useState<number | null>(null);
  const [hasIncrementedCount, setHasIncrementedCount] = useState(false);
  // New state for fullscreen mode
  const [isFullscreenChat, setIsFullscreenChat] = useState(false);
  
  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [threadNodes, setThreadNodes] = useState<Map<string, ThreadNode>>(new Map());

  useEffect(() => {
    if (threads.length === 0) {
      setThreads([
        {
          id: "main",
          parentId: null,
          sourceText: "",
          initialPrompt: "",
          title: "Main Conversation",
          messages: [],
          createdAt: new Date().toISOString(),
          x: 400,
          y: 300,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    getConversationCount().then(count => {
      if (count) setConversationCount(count);
    });
  }, []);

  // Draw connections between threads
  useEffect(() => {
    // Only draw connections if we have threads and nodes
    if (mapRef.current && threadNodes.size > 0) {
      // Clear existing connections
      const existingLines = mapRef.current.querySelectorAll('.thread-connection');
      existingLines.forEach(line => line.remove());

      // Draw new connections without updating state
      threads.forEach(thread => {
        if (thread.parentId) {
          const parentNode = threadNodes.get(thread.parentId);
          const childNode = threadNodes.get(thread.id);

          if (parentNode?.element && childNode?.element) {
            // Draw connection logic...
          }
        }
      });
    }
  }, [threads, threadNodes, scale, position]);

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleCreateNewThread = (text: string, prompt: string) => {
    setSelectedText(text);
    setNewThreadTitle(text.length > 30 ? `${text.substring(0, 30)}...` : text);
    setNewThreadPrompt(prompt);
    setIsNewThreadDialogOpen(true);
  };

  const createNewThread = () => {
    const newThreadId = generateUniqueId();

    // Find parent thread to position new thread relative to it
    const parentThread = threads.find(t => t.id === activeThreadId);
    const offsetX = Math.random() * 200 - 100;
    const offsetY = Math.random() * 200 - 100;
    
    // Create new thread object with position
    const newThread: Thread = {
      id: newThreadId,
      parentId: activeThreadId,
      sourceText: selectedText,
      initialPrompt: newThreadPrompt,
      title: newThreadTitle || (selectedText.length > 30 ? `${selectedText.substring(0, 30)}...` : selectedText) || 'New Thread',
      messages: [],
      createdAt: new Date().toISOString(),
      x: parentThread ? parentThread.x + offsetX : 400,
      y: parentThread ? parentThread.y + offsetY : 300,
    };

    // Add thread to list
    setThreads((prev) => [...prev, newThread]);

    // Set the new thread as active
    setActiveThreadId(newThreadId);

    // Close dialog and reset the prompt
    setIsNewThreadDialogOpen(false);
    setNewThreadTitle("");
    setNewThreadPrompt("");
  };

  const switchToThread = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const incrementConversationCount = async () => {
    if (!hasIncrementedCount) {
      await getAndIncrementConversationCount();
      setHasIncrementedCount(true);
    }
  };

  // Map interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  // Register thread node elements for drawing connections
  const registerThreadNode = useCallback((threadId: string, element: HTMLDivElement | null) => {
    if (element) {
      setThreadNodes(prev => {
        const thread = threads.find(t => t.id === threadId);
        if (thread) {
          // Only update if needed
          const existing = prev.get(threadId);
          if (existing?.element === element) return prev;
          
          const newMap = new Map(prev);
          newMap.set(threadId, { thread, element });
          return newMap;
        }
        return prev;
      });
    }
  }, [threads]);

  // Draw connections between threads
  const drawConnections = () => {
    if (!mapRef.current) return;

    // Clear existing connections
    const existingLines = mapRef.current.querySelectorAll('.thread-connection');
    existingLines.forEach(line => line.remove());

    // Draw new connections
    threads.forEach(thread => {
      if (thread.parentId) {
        const parentNode = threadNodes.get(thread.parentId);
        const childNode = threadNodes.get(thread.id);

        if (parentNode?.element && childNode?.element) {
          const parentRect = parentNode.element.getBoundingClientRect();
          const childRect = childNode.element.getBoundingClientRect();

          const mapRect = mapRef.current!.getBoundingClientRect();

          // Calculate center points
          const startX = parentRect.left + parentRect.width / 2 - mapRect.left;
          const startY = parentRect.top + parentRect.height / 2 - mapRect.top;
          const endX = childRect.left + childRect.width / 2 - mapRect.left;
          const endY = childRect.top + childRect.height / 2 - mapRect.top;

          // Create SVG line
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', startX.toString());
          line.setAttribute('y1', startY.toString());
          line.setAttribute('x2', endX.toString());
          line.setAttribute('y2', endY.toString());
          line.setAttribute('stroke', 'rgba(100, 100, 100, 0.5)');
          line.setAttribute('stroke-width', '2');
          line.classList.add('thread-connection');

          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.style.position = 'absolute';
          svg.style.top = '0';
          svg.style.left = '0';
          svg.style.width = '100%';
          svg.style.height = '100%';
          svg.style.pointerEvents = 'none';
          svg.classList.add('thread-connection');
          svg.appendChild(line);

          mapRef.current!.appendChild(svg);
        }
      }
    });
  };

  // Handle thread node drag
  const startThreadDrag = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialX = thread.x;
    const initialY = thread.y;

    const moveHandler = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = (moveEvent.clientX - initialMouseX) / scale;
      const dy = (moveEvent.clientY - initialMouseY) / scale;
      
      setThreads(prevThreads => prevThreads.map(t => {
        if (t.id === threadId) {
          return { ...t, x: initialX + dx, y: initialY + dy };
        }
        return t;
      }));
    };

    const upHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  };

  // New function to toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreenChat(prev => !prev);
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] w-full">
      {/* Control Bar - only show in map view */}
      {!isFullscreenChat && (
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur p-2 rounded-md shadow-md z-10 flex gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsNewThreadDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Thread Map - only show if not in fullscreen chat mode */}
      {!isFullscreenChat ? (
        <div 
          ref={mapRef}
          className="w-full h-full bg-muted/20 relative overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div
            className="absolute origin-center transition-transform duration-75"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              width: "100%",
              height: "100%",
            }}
          >
            {threads.map((thread) => (
              <div
                key={thread.id}
                className="absolute"
                ref={(el: HTMLDivElement | null) => registerThreadNode(thread.id, el)}
                style={{
                  left: `${thread.x}px`,
                  top: `${thread.y}px`,
                  transform: "translate(-50%, -50%)",
                  cursor: "move",
                }}
              >
                <ThreadNodeChat
                  threadId={thread.id}
                  title={thread.title}
                  createdAt={thread.createdAt}
                  sourceText={thread.sourceText}
                  initialPrompt={thread.initialPrompt} // Pass initialPrompt from thread
                  isActive={activeThreadId === thread.id}
                  onThreadClick={() => switchToThread(thread.id)}
                  onDragStart={(e) => startThreadDrag(thread.id, e)}
                  onFullscreen={() => {
                    switchToThread(thread.id);
                    toggleFullscreen();
                  }}
                  onIncrementConversationCount={incrementConversationCount}
                  onCreateNewThread={handleCreateNewThread}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Fullscreen Chat Interface */
        <div className="w-full h-full bg-background">
          <div className="absolute top-4 left-4 z-10">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Map
            </Button>
          </div>
          
          {threads.map((thread) => (
            thread.id === activeThreadId && (
              <div key={thread.id} className="h-full">
                <ChatInterface
                  threadId={thread.id}
                  initialPrompt={thread.initialPrompt}
                  conversationCount={conversationCount}
                  onCreateNewThread={handleCreateNewThread}
                  onIncrementConversationCount={incrementConversationCount}
                />
              </div>
            )
          ))}
        </div>
      )}

      {/* Thread Creation Dialog */}
      <ThreadDialog
        position={{ x: 400, y: 300 }}
        open={isNewThreadDialogOpen}
        onOpenChange={setIsNewThreadDialogOpen}
        selectedText={selectedText}
        newThreadTitle={newThreadTitle}
        newThreadPrompt={newThreadPrompt}
        setNewThreadTitle={setNewThreadTitle}
        setNewThreadPrompt={setNewThreadPrompt}
        onCreateThread={createNewThread}
      />
    </div>
  );
}
