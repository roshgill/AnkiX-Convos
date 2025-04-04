"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  newThreadTitle: string;
  newThreadPrompt: string;
  setNewThreadTitle: (title: string) => void;
  setNewThreadPrompt: (prompt: string) => void;
  onCreateThread: () => void;
  position: { x: number; y: number };
}

export function ThreadDialog({
  open,
  onOpenChange,
  selectedText,
  newThreadTitle,
  newThreadPrompt,
  setNewThreadTitle,
  setNewThreadPrompt,
  onCreateThread,
  position
}: ThreadDialogProps) {
  const [dialogStyles, setDialogStyles] = useState({});

  // Calculate position for dialog when it opens
  useEffect(() => {
    if (open && position.x !== 0 && position.y !== 0) {
      // Calculate position to ensure dialog stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Assume dialog dimensions (you may need to adjust these)
      const dialogWidth = 300;
      const dialogHeight = 350;
      
      // Calculate position, ensuring dialog stays within viewport
      let x = position.x;
      let y = position.y + 10; // Small offset from selection
      
      // Adjust if dialog would go off-screen
      if (x + dialogWidth > viewportWidth) {
        x = viewportWidth - dialogWidth - 10;
      }
      
      if (y + dialogHeight > viewportHeight) {
        y = position.y - dialogHeight - 10; // Position above selection instead
      }
      
      setDialogStyles({
        position: 'fixed',
        top: `${y}px`,
        left: `${x}px`,
        transform: 'none', // Override default centering
        maxWidth: '90vw',
        width: 'auto',
        zIndex: 1000
      });
    }
  }, [open, position]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={dialogStyles} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {selectedText && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Selected Text</p>
              <div className="bg-muted p-2 rounded text-sm">{selectedText}</div>
            </div>
          )}
          <div>
            <label htmlFor="title" className="text-sm text-muted-foreground mb-1 block">
              Thread Title
            </label>
            <Input
              id="title"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Title for new thread"
            />
          </div>
          <div>
            <label htmlFor="prompt" className="text-sm text-muted-foreground mb-1 block">
              Initial Prompt
            </label>
            <Textarea
              id="prompt"
              value={newThreadPrompt}
              onChange={(e) => setNewThreadPrompt(e.target.value)}
              placeholder="What would you like to discuss about this text?"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreateThread}>
            Create Thread
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
