import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Message } from "ai";
import { set } from 'date-fns';

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
  const [defintionWithConversationalContext, setDefinitionWithConversationalContext] = useState({ text: '' });
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

          const definitionText= data.Definitions?.[0]?.definition || 'None';
          setDefinition({ text: definitionText });

          const definitionWithConversationalContextText = data.Definitions?.[0]?.defintionWithConversationalContext || 'None';
          setDefinitionWithConversationalContext({ text: definitionWithConversationalContextText });

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
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-4 text-sm text-gray-800">
            <p>{definition.text}</p>

            <div className="flex items-start space-x-2 pt-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-gray-400"></span>
              <div className="space-y-1">
                <p className="font-medium text-gray-900">In this conversation</p>
                <p className="text-gray-700">
                  {defintionWithConversationalContext.text}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    ) : null
  );
}
