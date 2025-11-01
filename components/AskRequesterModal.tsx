import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Send, Timer } from 'lucide-react';

interface AskRequesterModalProps {
    question: string;
    onAnswer: (answer: string | null) => void;
}

const TIMEOUT_SECONDS = 300; // 5 minutes

const AskRequesterModal: React.FC<AskRequesterModalProps> = ({ question, onAnswer }) => {
    const [answer, setAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();

        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    onAnswer(null); // Timeout
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onAnswer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAnswer(answer.trim() || null);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-indigo-500/50 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all p-8 animate-fade-in-up">
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <HelpCircle className="h-7 w-7 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-orbitron font-bold text-slate-100">A Question from the Agent Swarm</h2>
                        <p className="text-slate-400 mt-1">The agents need your input to proceed effectively.</p>
                    </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 my-6 border border-slate-700">
                    <p className="text-slate-200 text-lg leading-relaxed">{question}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full h-28 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none"
                    />
                    <div className="mt-6 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-amber-400 bg-amber-900/50 px-3 py-1.5 rounded-full text-sm font-medium">
                            <Timer className="h-5 w-5" />
                            <span>Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="flex gap-2">
                             <button
                                type="button"
                                onClick={() => onAnswer(null)}
                                className="bg-slate-700 text-slate-300 font-semibold px-6 py-3 rounded-md hover:bg-slate-600 transition-colors"
                            >
                                Skip & Continue
                            </button>
                            <button
                                type="submit"
                                className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                                disabled={!answer.trim()}
                            >
                                <Send className="h-5 w-5" />
                                <span>Send Response</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AskRequesterModal;