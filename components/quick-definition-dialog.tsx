import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Message } from "ai";

interface QuickDefinitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  position: { x: number; y: number };
  messages: Message[];
}

export function QuickDefinitionDialog({
  isOpen,
  onClose,
  selectedText,
  position,
  messages
}: QuickDefinitionDialogProps) {
  const [definition, setDefinition] = useState({ text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDefinition() {
      if (isOpen && selectedText) {
        try {
          setLoading(true);
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: messages,
              selectedText: selectedText // Add flag to identify quick definition requests
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error("Failed to generate definition");
          }

          const data = await response.json();
        
          console.log('Definition response:', data);

          const definitionText= data.Definition?.[0]?.definition || 'None';
          setDefinition({ text: definitionText });
        } catch (error) {
          console.error('Definition error:', error);
          setDefinition({ text: 'Failed to load definition. Please try again.' });
        } finally {
          setLoading(false);
        }
      }
    }

    fetchDefinition();
  }, [isOpen, selectedText, messages]);

  return (
    isOpen ? (
      <div
        className="fixed z-50 bg-popover text-popover-foreground shadow-lg rounded-lg p-4 max-w-sm"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, 20px)'
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium">{selectedText}</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">{definition.text}</p>
          </div>
        )}
      </div>
    ) : null
  );
}
