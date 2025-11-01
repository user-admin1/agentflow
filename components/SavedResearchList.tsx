import React, { useState } from 'react';
import { SavedResearch } from '../types';
import { BookOpen, Trash2, ChevronDown, Archive } from 'lucide-react';

interface SavedResearchListProps {
    researches: SavedResearch[];
    onLoad: (id: number) => void;
    onDelete: (id: number) => void;
}

const SavedResearchList: React.FC<SavedResearchListProps> = ({ researches, onLoad, onDelete }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (researches.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
            <button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h2 className="text-xl font-orbitron font-bold text-slate-300 flex items-center gap-3">
                    <Archive className="h-6 w-6" />
                    Saved Reports
                </h2>
                <ChevronDown className={`h-6 w-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-slate-700">
                    <ul className="space-y-3 max-h-96 overflow-y-auto">
                        {researches.map(research => (
                            <li key={research.id} className="bg-slate-800 p-3 rounded-lg flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-200 truncate" title={research.topic}>{research.topic}</p>
                                    <p className="text-xs text-slate-400">{research.date}</p>
                                </div>
                                <div className="flex-shrink-0 flex gap-2">
                                    <button onClick={() => onLoad(research.id)} className="p-2 text-sky-400 hover:bg-slate-700 rounded-md" title="Load Report">
                                        <BookOpen className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onDelete(research.id)} className="p-2 text-red-400 hover:bg-slate-700 rounded-md" title="Delete Report">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SavedResearchList;
