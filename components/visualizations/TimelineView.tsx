import React from 'react';
import { Agent, ResearchStep } from '../../types';
import { Bot, Users, FileText, ChevronRight, HelpCircle, FlaskConical, Milestone } from 'lucide-react';

interface TimelineViewProps {
    researchLog: ResearchStep[];
    agents: Agent[];
}

const getIcon = (type: ResearchStep['type']) => {
    switch (type) {
        case 'Individual': return <Bot className="h-5 w-5" />;
        case 'Collaboration': return <Users className="h-5 w-5" />;
        case 'Synthesis': return <FileText className="h-5 w-5" />;
        case 'Phase': return <Milestone className="h-5 w-5" />;
        case 'UserInteraction': return <HelpCircle className="h-5 w-5" />;
        default: return <ChevronRight className="h-5 w-5" />;
    }
};

const TimelineView: React.FC<TimelineViewProps> = ({ researchLog, agents }) => {

    const getAgentName = (id: number) => agents.find(a => a.id === id)?.name || `Agent ${id}`;

    return (
        <div className="p-4">
            <ol className="relative border-l border-slate-700">
                {researchLog.map((step) => (
                    <li key={step.id} className="mb-10 ml-6">
                        <span className="absolute flex items-center justify-center w-8 h-8 bg-slate-800 rounded-full -left-4 ring-4 ring-slate-800 border border-slate-700 text-indigo-400">
                            {getIcon(step.type)}
                        </span>
                        <div className="p-4 bg-slate-900/70 rounded-lg border border-slate-700">
                            <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-200">
                                {step.type === 'Individual' && step.agentId !== undefined ? `Agent: ${getAgentName(step.agentId)}` : step.type}
                                {step.type === 'Collaboration' && ` - ${step.collaborationType}`}
                            </h3>
                            <time className="block mb-2 text-sm font-normal leading-none text-slate-500">Step {step.id + 1}</time>
                            <p className="mb-4 text-base font-normal text-slate-400 line-clamp-3">{step.log}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default TimelineView;