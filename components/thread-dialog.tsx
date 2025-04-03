"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';

interface ThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  newThreadTitle: string;
  newThreadPrompt: string;
  setNewThreadTitle: (title: string) => void;
  setNewThreadPrompt: (prompt: string) => void;
  onCreateThread: () => void;
}

export function ThreadDialog({
  open,
  onOpenChange,
  selectedText,
  newThreadTitle,
  newThreadPrompt,
  setNewThreadTitle,
  setNewThreadPrompt,
  onCreateThread
}: ThreadDialogProps) {
  const uniqueId = `thread-dialog-${Date.now()}`;
  const { messages, input, handleInputChange, handleSubmit: chatHandleSubmit, setInput } = useChat({ id: uniqueId });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasInitialQuery, setHasInitialQuery] = useState(false);
  
  // When the dialog opens with selected text, query for a definition
  useEffect(() => {
    if (open && selectedText && messages.length === 0 && !hasInitialQuery) {
      setInput(`Get definition for: ${selectedText}`);
      setHasInitialQuery(true);
      
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        chatHandleSubmit(fakeEvent);
      }, 100);
    }
  }, [open, selectedText, messages.length, setInput, chatHandleSubmit, hasInitialQuery]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setHasInitialQuery(false);
    }
  }, [open]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatHandleSubmit(e as unknown as React.FormEvent);
    }
  };

  const renderMessageContent = (content: string, role: string) => {
    if (role === "assistant") {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
          <DialogDescription>
            Start a new conversation thread. You can provide an initial prompt to kick things off.
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <ScrollArea className="h-full pr-3">
            <div className="flex flex-col gap-4 my-4">
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
        </div>
        
        {/* Fixed bottom elements */}
        <div className="mt-4">
          {/* Chat Input */}
          <form onSubmit={chatHandleSubmit} className="flex gap-2 mb-4">
            <Input
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          {/* Thread settings */}
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="threadTitle" className="text-right">
                Title
              </Label>
              <Input
                id="threadTitle"
                placeholder="Thread title (optional)"
                className="col-span-3"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initialPrompt" className="text-right">
                Initial Prompt
              </Label>
              <Textarea
                id="initialPrompt"
                placeholder="Enter your initial prompt..."
                className="col-span-3"
                value={newThreadPrompt}
                onChange={(e) => setNewThreadPrompt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={onCreateThread}
            >
              Create Thread
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
