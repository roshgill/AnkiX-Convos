"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Edit2, Check, X, Brain } from "lucide-react";
import { Message } from "ai";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// import { useChat } from '@ai-sdk/react';

// interface FlashcardPanelProps {
//   messages: Message[];
// }

interface Flashcard {
  id: string;
  front: string;
  //back: string;
  reason: string;
}

interface FlashcardPanelProps {
  messages: Message[];
  manualCreatedCard: Flashcard | null;
  shouldGenerate: boolean;
  onGenerateComplete: () => void;
}

// Overall:
// The goal for the flashcard panel is to generate flashcards based on the conversation
// and allow the user to accept, edit, or discard them. The user can then export the final
// deck of flashcards to a file for use in Anki or other flashcard applications.

// Technical details: 
// 1. Take in the message prop (or thread of messages) from the chat interface, and current cards
// created by the user, and send them to an AI model to generate new flashcards. The AI model will
// know which parts of the conversation cards are already created for the user, and will generate
// new flashcards based on the remaining content and context.
// 2. Display the suggested flashcards to the user.
// 3. Allow the user to accept, edit, or discard the suggested flashcards.
// 4. Allow the user to export the final deck of flashcards to a file for use in Anki or other flashcard applications. (I will include an import text file format for Anki)
export function FlashcardPanel({ messages, manualCreatedCard, shouldGenerate, onGenerateComplete }: FlashcardPanelProps) {
  const [suggestedCards, setSuggestedCards] = useState<Flashcard[]>([]);
  const [acceptedCards, setAcceptedCards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editedFront, setEditedFront] = useState("");
  // const [editedBack, setEditedBack] = useState("");

  // Remove the useEffect for automatic generation and replace with manual function
  const generateFlashcards = async () => {
    if (!messages || messages.length === 0) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          flashcardsList: [...suggestedCards, ...acceptedCards]
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const data = await response.json();

      const flashcardsWithIds = data.flashcards.map((card: Omit<Flashcard, 'id'>) => ({
        ...card,
        id: generateUniqueId(),
      }));

      setSuggestedCards((prev) => [...prev, ...flashcardsWithIds]);
    } catch (error) {
      console.error("Error generating flashcards:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Add new useEffect for handling manually created cards
  useEffect(() => {
    if (manualCreatedCard) {
      setAcceptedCards(prev => [...prev, manualCreatedCard]);
    }
  }, [manualCreatedCard]);

  useEffect(() => {
    if (shouldGenerate && messages.length > 0) {
      generateFlashcards();
      onGenerateComplete();
    }
  }, [shouldGenerate, messages]);

  const handleAccept = (card: Flashcard) => {
    setAcceptedCards((prev) => [...prev, card]);
    setSuggestedCards((prev) => prev.filter((c) => c.id !== card.id));
  };

  const handleDiscard = (cardId: string) => {
    setSuggestedCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleDiscardFromFinal = (cardId: string) => {
    setAcceptedCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const handleExport = () => {
    const header = "#separator:tab\n#html:true\n#notetype column:1\n\n";
    const content = acceptedCards
      .map((card) => `Cloze\t${card.front}`)
      .join("\n");
    
    const fullContent = header + content;
    const blob = new Blob([fullContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anki_import.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const handleEdit = (card: Flashcard) => {
    setEditingCard(card);
    setEditedFront(card.front);
    // setEditedBack(card.back);
  };

  const handleSaveEdit = () => {
    if (!editingCard) return;

    const updatedCard = {
      ...editingCard,
      front: editedFront,
      // back: editedBack,
    };

    if (suggestedCards.some(card => card.id === editingCard.id)) {
      setSuggestedCards(cards =>
        cards.map(card => card.id === editingCard.id ? updatedCard : card)
      );
    } else {
      setAcceptedCards(cards =>
        cards.map(card => card.id === editingCard.id ? updatedCard : card)
      );
    }
    setEditingCard(null);
  };

  const handleClozeSelection = () => {
    const textarea = document.getElementById('edit-front') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (selectedText) {
      const newContent = 
        textarea.value.substring(0, start) +
        `{{c1::${selectedText}}}` +
        textarea.value.substring(end);
      
      setEditedFront(newContent);

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

  return (
    <Card className="flex min flex-col p-3 overflow-hidden">
      <Tabs defaultValue="suggested" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Flashcards</h2>
          </div>
          <TabsList>
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
            <TabsTrigger value="final">Final Deck</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="suggested" className="flex-1">
          <ScrollArea className="h-[calc(100vh-25rem)]">
            {isGenerating && (
              <div className="space-y-4">
                <div className="h-24 bg-muted rounded animate-pulse"></div>
                <div className="h-24 bg-muted rounded animate-pulse"></div>
              </div>
            )}
            
            {[...suggestedCards].reverse().map((card) => (
              <div key={card.id} className="mb-4 p-4 border rounded-lg flex-1">
                <div className="mb-2">
                  <h3 className="font-medium">Front</h3>
                  <p className="text-sm">{card.front}</p>
                </div>
                <div className="mb-3">
                  <h3 className="font-medium text-xs text-muted-foreground">Why this card?</h3>
                  <p className="text-xs text-muted-foreground">{card.reason}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAccept(card)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(card)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDiscard(card.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Discard
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="final" className="flex-1 flex flex-col">
          <ScrollArea className="h-[calc(100vh-25rem)]">
            {[...acceptedCards].reverse().map((card) => (
              <div key={card.id} className="mb-4 p-4 border rounded-lg flex-1">
                <div className="mb-2">
                  <h3 className="font-medium">Front</h3>
                  <p className="text-sm">{card.front}</p>
                </div>
                <div className="mb-3">
                  <h3 className="font-medium text-xs text-muted-foreground">Why this card?</h3>
                  <p className="text-xs text-muted-foreground">{card.reason}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(card)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDiscardFromFinal(card.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Discard
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="pt-4 border-t mt-4">
            <Button
              onClick={handleExport}
              className="w-full"
              disabled={acceptedCards.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Anki
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={editingCard !== null} onOpenChange={() => setEditingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-front">Front</Label>
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
                id="edit-front"
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}