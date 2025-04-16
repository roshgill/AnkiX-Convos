import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Highlight, Note } from './highlight-manager';

interface HighlightPanelProps {
  highlights: Highlight[];
  onAddNote: (highlightId: string, noteContent: string) => void;
  onDeleteHighlight: (highlightId: string) => void;
  onDeleteNote: (highlightId: string, noteId: string) => void;
  onClose?: () => void;
}

export function HighlightPanel({
  highlights,
  onAddNote,
  onDeleteHighlight,
  onDeleteNote,
  onClose
}: HighlightPanelProps) {
  const [expandedHighlights, setExpandedHighlights] = useState<Record<string, boolean>>({});
  const [activeNoteInput, setActiveNoteInput] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedHighlights(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddNote = (highlightId: string) => {
    if (newNoteContent.trim()) {
      onAddNote(highlightId, newNoteContent);
      setNewNoteContent('');
      setActiveNoteInput(null);
    }
  };

  // Helper to get the text color that contrasts with the highlight color
  const getTextColorForHighlight = (bgColorClass: string) => {
    return 'text-gray-800'; // Default dark text for all highlight colors
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Highlights Overview</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>

      {highlights.length > 0 ? (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {highlights.map(highlight => (
              <div 
                key={highlight.id}
                className="rounded-md border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow transition-shadow duration-200"
              >
                <div 
                  className="p-3 flex items-start justify-between cursor-pointer group"
                  onClick={() => toggleExpand(highlight.id)}
                >
                  <div className="flex items-start gap-2 flex-1">
                    {expandedHighlights[highlight.id] ? 
                      <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    }
                    <div className="flex-1">
                      <div className={`inline-block px-2 py-0.5 rounded-full mb-1 ${highlight.color} ${getTextColorForHighlight(highlight.color)}`}>
                        {highlight.text.length > 40 ? `${highlight.text.substring(0, 40)}...` : highlight.text}
                      </div>
                      <p className="text-xs text-gray-500">Message ID: {highlight.messageId.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHighlight(highlight.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {expandedHighlights[highlight.id] && (
                  <div className="px-3 pb-3 pt-1 bg-gray-50">
                    {highlight.notes.length > 0 ? (
                      <div className="space-y-2 mb-2">
                        {highlight.notes.map(note => (
                          <div key={note.id} className="pl-6 relative group">
                            <div className="absolute left-2 top-2 w-2 h-2 rounded-full bg-gray-400"></div>
                            <div className="p-2 bg-white rounded-md border border-gray-100 relative text-xs group">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                                onClick={() => onDeleteNote(highlight.id, note.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <p className="pr-5">{note.content}</p>
                              <p className="text-gray-400 text-[10px] mt-1">
                                {note.createdAt.toLocaleDateString()} {note.createdAt.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic pl-6 mb-2">No notes yet</p>
                    )}

                    {activeNoteInput === highlight.id ? (
                      <div className="space-y-2 pl-6">
                        <Textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Type your note..."
                          className="min-h-[60px] text-xs p-2 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => setActiveNoteInput(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                            onClick={() => handleAddNote(highlight.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs flex items-center gap-1 text-gray-600 hover:text-gray-900 ml-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNoteInput(highlight.id);
                        }}
                      >
                        <Plus className="h-3 w-3" /> Add Note
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">No highlights yet</p>
            <p className="text-xs text-gray-400 mt-1">Select text to highlight important information</p>
          </div>
        </div>
      )}
    </div>
  );
}