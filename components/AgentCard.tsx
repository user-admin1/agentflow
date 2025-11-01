
import React from 'react';
import { Agent } from '../types';

interface AgentCardProps {
    agent: Agent;
    icon: React.ReactNode;
}

const statusClasses: { [key in Agent['status']]: { bg: string; text: string; dot: string } } = {
    Idle: { bg: 'bg-slate-700/50', text: 'text-slate-400', dot: 'bg-slate-400' },
    Researching: { bg: 'bg-sky-900/50', text: 'text-sky-300', dot: 'bg-sky-400 animate-pulse' },
    'In Meeting': { bg: 'bg-amber-900/50', text: 'text-amber-300', dot: 'bg-amber-400 animate-pulse' },
    Synthesizing: { bg: 'bg-indigo-900/50', text: 'text-indigo-300', dot: 'bg-indigo-400 animate-pulse' },
};

const AgentCard: React.FC<AgentCardProps> = ({ agent, icon }) => {
    const statusStyle = statusClasses[agent.status];

    return (
        <div className={`border border-slate-700 rounded-lg p-4 transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/50 ${statusStyle.bg}`}>
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <p className="text-lg font-bold text-slate-100 truncate">{agent.name}</p>
                        <div className={`flex items-center space-x-2 text-xs font-medium px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`}></span>
                            <span>{agent.status}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-indigo-400">{agent.role}</p>
                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">{agent.model}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{agent.description}</p>
                </div>
            </div>
        </div>
    );
};

export default AgentCard;