import React from 'react';
import { Agent, ResearchStep, DelegationStep } from '../../types';
import { ArrowRight } from 'lucide-react';

interface AgentInteractionViewProps {
    researchLog: ResearchStep[];
    agents: Agent[];
}

const AgentInteractionView: React.FC<AgentInteractionViewProps> = ({ researchLog, agents }) => {
    const interactions: DelegationStep[] = researchLog
        .filter(step => step.type === 'Individual' && step.delegatedLogs)
        .flatMap(step => step.delegatedLogs!);

    const getAgentName = (id: number) => agents.find(a => a.id === id)?.name || `Agent ${id}`;

    if (interactions.length === 0) {
        return <div className="text-center text-slate-400 py-8">No agent delegations occurred during this research.</div>;
    }

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Delegation Log</h3>
            <p className="text-sm text-slate-400">This view shows direct task delegations between agents.</p>
            <div className="space-y-3">
                {interactions.map((interaction, index) => (
                    <div key={index} className="bg-slate-900/70 p-3 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between text-sm font-semibold mb-2">
                            <span className="text-sky-300">{getAgentName(interaction.sourceAgentId)}</span>
                            <ArrowRight className="h-4 w-4 text-slate-500" />
                            <span className="text-amber-300">{getAgentName(interaction.targetAgentId)}</span>
                        </div>
                        <p className={`text-xs pl-4 border-l-2 ${interaction.type === 'Request' ? 'border-sky-500 text-slate-300' : 'border-amber-500 text-slate-400'}`}>
                            <span className="font-bold">{interaction.type}: </span>{interaction.log}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgentInteractionView;