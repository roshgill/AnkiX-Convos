import React, { useState, useEffect } from 'react';
import { X, PenSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Highlight {
  id: string;
  text: string;
  color: string;
  notes: Note[];
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

interface HighlightManagerProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  selectedText: string;
  onAddHighlight: (text: string, color: string) => void;
  highlights: Highlight[];
  onAddNote: (highlightId: string, noteContent: string) => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'yellow', value: 'bg-yellow-200' },
  { name: 'green', value: 'bg-green-200' },
  { name: 'blue', value: 'bg-blue-200' },
  { name: 'purple', value: 'bg-purple-200' },
  { name: 'pink', value: 'bg-pink-200' },
];

export function HighlightManager({
  isOpen,
  onClose,
  position,
  selectedText,
  onAddHighlight,
  highlights,
  onAddNote
}: HighlightManagerProps) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  
  // Find if this text is already highlighted
  const existingHighlight = highlights.find(h => h.text === selectedText);

  useEffect(() => {
    if (isOpen && existingHighlight) {
      setActiveHighlightId(existingHighlight.id);
    } else {
      setActiveHighlightId(null);
      setShowNoteInput(false);
    }
  }, [isOpen, existingHighlight]);

  const handleAddNote = () => {
    if (newNoteContent.trim() && activeHighlightId) {
      onAddNote(activeHighlightId, newNoteContent);
      setNewNoteContent('');
      setShowNoteInput(false);
    }
  };

  const handleHighlight = (color: string) => {
    onAddHighlight(selectedText, color);
    onClose();
  };

  return isOpen ? (
    <div
      className="fixed z-50 bg-white text-gray-800 shadow-md rounded-lg p-4 w-80"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, 20px)'
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm text-gray-700">
          {existingHighlight ? 'Highlighted Text' : 'Highlight Text'}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-sm mb-3 bg-gray-50 p-2 rounded-md">
        <p className="italic">{selectedText}</p>
      </div>
      
      {!existingHighlight ? (
        <>
          <p className="text-xs text-gray-500 mb-2">Choose a highlight color:</p>
          <div className="flex gap-2 mb-3">
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.name}
                className={`w-6 h-6 rounded-full ${color.value} hover:ring-2 hover:ring-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400`}
                onClick={() => handleHighlight(color.value)}
                title={`Highlight in ${color.name}`}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center">
              <h5 className="text-sm font-medium text-gray-700">Notes</h5>
              {!showNoteInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs flex items-center gap-1 text-gray-600 hover:text-gray-900"
                  onClick={() => setShowNoteInput(true)}
                >
                  <Plus className="h-3 w-3" /> Add Note
                </Button>
              )}
            </div>
            
            {existingHighlight.notes.length > 0 ? (
              <ScrollArea className="max-h-48">
                {existingHighlight.notes.map(note => (
                  <div key={note.id} className="p-2 bg-gray-50 rounded-md mb-2">
                    <p className="text-xs">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {note.createdAt.toLocaleDateString()} {note.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            ) : (
              <p className="text-xs text-gray-400 italic">No notes yet</p>
            )}
            
            {showNoteInput && (
              <div className="space-y-2">
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type your note..."
                  className="min-h-[80px] text-xs p-2 resize-none"
                />
                
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => setShowNoteInput(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                    onClick={handleAddNote}
                    disabled={newNoteContent.trim() === ''}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  ) : null;
}