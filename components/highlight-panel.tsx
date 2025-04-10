import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Highlight, Note } from './highlight-manager';

interface HighlightPanelProps {
  highlights: Highlight[];
  onAddNote: (highlightId: string, noteContent: string) => void;
  onDeleteHighlight: (highlightId: string) => void;
  onDeleteNote: (highlightId: string, noteId: string) => void;
}

export function HighlightPanel({
  highlights,
  onAddNote,
  onDeleteHighlight,
  onDeleteNote
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-800">Highlights & Notes</h3>
      </div>

      {highlights.length > 0 ? (
        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="p-2 space-y-2">
            {highlights.map(highlight => (
              <div 
                key={highlight.id}
                className="rounded-md border border-gray-100 overflow-hidden"
              >
                <div 
                  className={`p-2 flex items-start justify-between cursor-pointer ${highlight.color}`}
                  onClick={() => toggleExpand(highlight.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedHighlights[highlight.id] ? 
                      <ChevronDown className="h-3 w-3 text-gray-600 flex-shrink-0" /> : 
                      <ChevronRight className="h-3 w-3 text-gray-600 flex-shrink-0" />
                    }
                    <p className="text-xs line-clamp-1">{highlight.text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHighlight(highlight.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {expandedHighlights[highlight.id] && (
                  <div className="p-2 bg-gray-50">
                    {highlight.notes.length > 0 ? (
                      <div className="space-y-2 mb-2">
                        {highlight.notes.map(note => (
                          <div key={note.id} className="p-2 bg-white rounded-md border border-gray-100 relative text-xs">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 text-gray-400 hover:text-red-500 absolute top-1 right-1"
                              onClick={() => onDeleteNote(highlight.id, note.id)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                            <p className="pr-5">{note.content}</p>
                            <p className="text-gray-400 text-[10px] mt-1">
                              {note.createdAt.toLocaleDateString()} {note.createdAt.toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mb-2">No notes yet</p>
                    )}

                    {activeNoteInput === highlight.id ? (
                      <div className="space-y-2">
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
                        className="text-xs flex items-center gap-1 text-gray-600 hover:text-gray-900"
                        onClick={() => setActiveNoteInput(highlight.id)}
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
        <div className="p-4 text-center">
          <p className="text-sm text-gray-400">No highlights yet</p>
          <p className="text-xs text-gray-400 mt-1">Select text to highlight important information</p>
        </div>
      )}
    </div>
  );
}