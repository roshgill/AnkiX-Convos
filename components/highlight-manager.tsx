import React, { useState, useEffect } from 'react';
import { X, PenSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { on } from 'events';

export interface Highlight {
  id: string;
  text: string;
  color: string;
  notes: Note[];
  position: number; // Chatacter index where the highlight starts
  messageId: string; // ID of the message in the chat
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

export interface HighlightManagerProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  selectedText: string;
  onAddHighlight: (text: string, color: string, noteContent?: string) => string;
  highlights: Highlight[];
  onRemoveHighlight?: (highlightId: string) => void;
  onAddNote: (highlightId: string, noteContent: string) => void;
  onUpdateHighlightColor?: (highlightId: string, color: string) => void;
  onDeleteNote?: (highlightId: string, noteId: string) => void;
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
  onAddHighlight, // Allows calling the function to add a highlight from parent component 
  highlights,
  onAddNote,
  onUpdateHighlightColor,
  onDeleteNote,
  onRemoveHighlight
}: HighlightManagerProps) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [tempNotes, setTempNotes] = useState<Note[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  
  // Find if this text is already highlighted
  const existingHighlight = highlights.find(h => h.text === selectedText);

  useEffect(() => {
    if (isOpen) {
      // Save the initial position when the dialog first opens
      // This ensures position is only set once when opened
      setInitialPosition({
        x: position.x,
        y: position.y
      });

      if (existingHighlight) {
        setActiveHighlightId(existingHighlight.id);
        // Initialize with existing notes if any
        setTempNotes([...existingHighlight.notes]);
        setSelectedColor(existingHighlight.color);
      } else {
        // Reset for new highlight
        setActiveHighlightId(null);
        setTempNotes([]);
        setSelectedColor(HIGHLIGHT_COLORS[0].value); // Default to first color
      }
      // Reset note input in both cases
      setNewNoteContent('');
      setShowNoteInput(false);
    }
  }, [isOpen, existingHighlight, selectedText]); // Removed position from dependency array

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        content: newNoteContent,
        createdAt: new Date()
      };
      
      setTempNotes(prev => [...prev, newNote]);
      setNewNoteContent('');
      setShowNoteInput(false);
    }
  };

  // Handle saving the highlight and notes
  const handleSave = () => {
    if (selectedColor) {
      // If we already have this highlight, update the color if it changed
      if (existingHighlight) {
        // Update the highlight color if it changed and the update function exists
        if (existingHighlight.color !== selectedColor && onUpdateHighlightColor) {
          onUpdateHighlightColor(existingHighlight.id, selectedColor);
        }
        
        // Check for deleted notes by comparing original notes with temp notes
        if (onDeleteNote) {
          existingHighlight.notes.forEach(originalNote => {
            // If a note from the original list is not in the temp notes, it was deleted
            const noteExists = tempNotes.some(note => note.id === originalNote.id);
            if (!noteExists) {
              onDeleteNote(existingHighlight.id, originalNote.id);
            }
          });
        }
        
        // Add any new temp notes that aren't already in the highlight
        tempNotes.forEach(note => {
          // Check if this is a new note (not already in existing notes)
          const isNewNote = !existingHighlight.notes.some(existingNote => existingNote.id === note.id);
          if (isNewNote) {
            onAddNote(existingHighlight.id, note.content);
          }
        });
      } else {
        // Create new highlight and get the ID directly
        const newHighlightId = onAddHighlight(selectedText, selectedColor);
        
        // Then add each note using the ID we just got
        if (tempNotes.length > 0 && newHighlightId) {
          tempNotes.forEach(note => {
            onAddNote(newHighlightId, note.content);
          });
        }
      }
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDeleteTempNote = (noteId: string) => {
    setTempNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleRemoveHighlight = () => {
    if (existingHighlight && onRemoveHighlight) {
      onRemoveHighlight(existingHighlight.id);
      onClose();
    }
  };

  return isOpen ? (
    <div
      className="fixed z-50 bg-white text-gray-800 shadow-md rounded-lg w-80 flex flex-col max-h-[80vh]"
      style={{
        left: `${initialPosition.x}px`,
        top: `${initialPosition.y}px`,
        transform: 'translate(-50%, 20px)',
        position: 'fixed' // Ensure it stays fixed regardless of scrolling
      }}
    >
      <div className="flex justify-between items-start p-4 border-b border-gray-100">
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
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4 overflow-auto">
          <div className="text-sm mb-3 bg-gray-50 p-2 rounded-md">
            <p className="italic">{selectedText}</p>
          </div>
          
          <p className="text-xs text-gray-500 mb-2">Choose a highlight color:</p>
          <div className="flex gap-2 mb-3">
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.name}
                className={`w-6 h-6 rounded-full ${color.value} hover:ring-2 hover:ring-gray-300 
                  ${selectedColor === color.value ? 'ring-2 ring-gray-700' : ''} 
                  focus:outline-none focus:ring-2 focus:ring-gray-400`}
                onClick={() => handleColorSelect(color.value)}
                title={`Highlight in ${color.name}`}
              />
            ))}
          </div>

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
            
            {tempNotes.length > 0 && (
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {tempNotes.map(note => (
                  <div key={note.id} className="p-2 bg-gray-50 rounded-md mb-2 relative">
                    <button 
                      className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                      onClick={() => handleDeleteTempNote(note.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs pr-4">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {note.createdAt.toLocaleDateString()} {note.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {tempNotes.length === 0 && !showNoteInput && (
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
                    Save Note
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Add Remove Highlight button for existing highlights */}
          {existingHighlight && onRemoveHighlight && (
            <div className="mb-3">
              <Button
                variant="ghost" 
                size="sm"
                className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 w-full justify-center"
                onClick={handleRemoveHighlight}
              >
                <Trash2 className="h-3 w-3" /> Remove
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
          onClick={handleSave}
          disabled={!selectedColor}
        >
          Save Highlight
        </Button>
      </div>
    </div>
  ) : null;
}