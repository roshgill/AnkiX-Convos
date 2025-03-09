"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Edit2, Check, X, Brain } from "lucide-react";

interface FlashcardPanelProps {
  message: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  reason: string;
}

export function FlashcardPanel({ message }: FlashcardPanelProps) {
  const [suggestedCards, setSuggestedCards] = useState<Flashcard[]>([]);
  const [acceptedCards, setAcceptedCards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!message) return;

    setIsGenerating(true);

    // Placeholder for AI flashcard generation
    setTimeout(() => {
      const newCard: Flashcard = {
        id: Date.now().toString(),
        front: "Sample Question",
        back: "Sample Answer",
        reason: "This concept appears to be a key point in the discussion",
      };
      setSuggestedCards((prev) => [...prev, newCard]);
      setIsGenerating(false);
    }, 1000);
  }, [message]);

  const handleAccept = (card: Flashcard) => {
    setAcceptedCards((prev) => [...prev, card]);
    setSuggestedCards((prev) => prev.filter((c) => c.id !== card.id));
  };

  const handleDiscard = (cardId: string) => {
    setSuggestedCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleExport = () => {
    const content = acceptedCards
      .map((card) => `${card.front}\t${card.back}`)
      .join("\n");
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="flex h-[80vh] flex-col p-4">
      <Tabs defaultValue="suggested" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <h2 className="font-semibold">Flashcards</h2>
          </div>
          <TabsList>
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
            <TabsTrigger value="final">Final Deck</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="suggested" className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            {isGenerating && (
              <div className="space-y-4">
                <div className="h-24 bg-muted rounded animate-pulse"></div>
                <div className="h-24 bg-muted rounded animate-pulse"></div>
              </div>
            )}
            
            {suggestedCards.map((card) => (
              <div key={card.id} className="mb-4 p-4 border rounded-lg">
                <div className="mb-2">
                  <h3 className="font-medium">Front</h3>
                  <p className="text-sm">{card.front}</p>
                </div>
                <div className="mb-2">
                  <h3 className="font-medium">Back</h3>
                  <p className="text-sm">{card.back}</p>
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
                    onClick={() => {/* Add edit functionality */}}
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
          <ScrollArea className="flex-1">
            {acceptedCards.map((card) => (
              <div key={card.id} className="mb-4 p-4 border rounded-lg">
                <div className="mb-2">
                  <h3 className="font-medium">Front</h3>
                  <p className="text-sm">{card.front}</p>
                </div>
                <div className="mb-2">
                  <h3 className="font-medium">Back</h3>
                  <p className="text-sm">{card.back}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {/* Add edit functionality */}}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            ))}
          </ScrollArea>
          <Button
            onClick={handleExport}
            className="mt-4"
            disabled={acceptedCards.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Anki
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}