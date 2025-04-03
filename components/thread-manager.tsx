"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInterface } from "@/components/chat-interface";
import { ThreadDialog } from "@/components/thread-dialog";
import { getConversationCount, getAndIncrementConversationCount } from "@/app/actions/database";
import { set } from "date-fns";

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
}

export function ThreadManager() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("main");
  const [isNewThreadDialogOpen, setIsNewThreadDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadPrompt, setNewThreadPrompt] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [conversationCount, setConversationCount] = useState<number | null>(null);
  const [hasIncrementedCount, setHasIncrementedCount] = useState(false);

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
        },
      ]);
    }
  }, []);

  useEffect(() => {
    getConversationCount().then(count => {
      if (count) setConversationCount(count);
    });
  }, []);

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

    // Create new thread object
    const newThread: Thread = {
      id: newThreadId,
      parentId: activeThreadId,
      sourceText: selectedText,
      initialPrompt: newThreadPrompt,
      title: newThreadTitle || (selectedText.length > 30 ? `${selectedText.substring(0, 30)}...` : selectedText) || 'New Thread',
      messages: [],
      createdAt: new Date().toISOString(),
    };

    // Add thread to list managing threads
    setThreads((prev) => [...prev, newThread]);

    // Set the new thread as active
    setActiveThreadId(newThreadId);

    // Close dialog and reset the prompt
    setIsNewThreadDialogOpen(false);
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

  return (
    <div className="flex h-[calc(100vh-2rem)] w-full">
      {/* Thread Sidebar */}
      <div className="w-64 border-r border-border bg-muted/40 p-2 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-semibold">Conversations</h3>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={() => setIsNewThreadDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => switchToThread(thread.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex items-start gap-2 ${
                  activeThreadId === thread.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="overflow-hidden">
                  <div className="font-medium truncate">{thread.title}</div>
                  <div className="text-xs text-muted-foreground">{formatTimestamp(thread.createdAt)}</div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="space-y-4 w-full flex-1 overflow-hidden">
        {threads.map((thread) => (
          <div 
            key={thread.id} 
            style={{ display: activeThreadId === thread.id ? 'block' : 'none' }}
            className="h-full"
          >
            <ChatInterface
              threadId={thread.id}
              initialPrompt={thread.initialPrompt}
              conversationCount={conversationCount}
              onCreateNewThread={handleCreateNewThread}
              onIncrementConversationCount={incrementConversationCount}
            />
          </div>
        ))}
      </div>

      {/* Replace the Dialog with ThreadDialog */}
      <ThreadDialog
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
