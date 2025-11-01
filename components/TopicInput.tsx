import React, { useState } from 'react';
import { Play, Square, Settings2 } from 'lucide-react';

interface TopicInputProps {
    onStartResearch: (topic: string, customInstruction: string) => void;
    onStopResearch: () => void;
    isResearching: boolean;
}

const TopicInput: React.FC<TopicInputProps> = ({ onStartResearch, onStopResearch, isResearching }) => {
    const [topic, setTopic] = useState('');
    const [customInstruction, setCustomInstruction] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStartResearch(topic, customInstruction);
    };

    return (
        <div className="py-4 mb-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter research topic, e.g., 'The future of quantum computing'"
                        className="flex-grow bg-slate-800 border border-slate-700 rounded-md px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        disabled={isResearching}
                    />
                    {isResearching ? (
                         <button
                            type="button"
                            onClick={onStopResearch}
                            className="flex items-center justify-center gap-2 bg-red-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-red-500 transition-colors"
                        >
                            <Square className="h-5 w-5" />
                            <span>Stop Research</span>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                            disabled={isResearching || !topic.trim()}
                        >
                            <Play className="h-5 w-5" />
                            <span>Start Research</span>
                        </button>
                    )}
                </div>
                 {showInstructions && (
                    <textarea
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        placeholder="Optional: Add custom instructions, e.g., 'Focus on the economic impact' or 'Write the final report for a non-technical audience'"
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-y h-20"
                        disabled={isResearching}
                    />
                )}
            </form>
             <div className="flex justify-end mt-2">
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    aria-expanded={showInstructions}
                >
                    <Settings2 className="h-4 w-4" />
                    <span>{showInstructions ? 'Hide' : 'Add'} Custom Instruction</span>
                </button>
            </div>
        </div>
    );
};

export default TopicInput;