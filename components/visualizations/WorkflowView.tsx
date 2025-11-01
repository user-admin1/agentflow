import React from 'react';
import { Agent, ResearchStep } from '../../types';
import { ArrowDown, Bot, Users, FileText, Milestone, HelpCircle } from 'lucide-react';

interface WorkflowViewProps {
    researchLog: ResearchStep[];
    agents: Agent[];
}

const WorkflowView: React.FC<WorkflowViewProps> = ({ researchLog, agents }) => {
    const phases: ResearchStep[][] = [];
    let currentPhase: ResearchStep[] = [];

    researchLog.forEach(step => {
        if (step.type === 'Phase' && currentPhase.length > 0) {
            phases.push(currentPhase);
            currentPhase = [step];
        } else {
            currentPhase.push(step);
        }
    });
    if (currentPhase.length > 0) {
        phases.push(currentPhase);
    }
    
    const getAgentName = (id: number) => agents.find(a => a.id === id)?.name || `Agent ${id}`;

    const renderStep = (step: ResearchStep) => {
        switch (step.type) {
            case 'Individual':
                return <div key={step.id} className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-sky-400" /><span>{getAgentName(step.agentId!)}'s Research</span></div>;
            case 'Collaboration':
                return <div key={step.id} className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-amber-400" /><span>{step.collaborationType}</span></div>;
            case 'Synthesis':
                return <div key={step.id} className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-indigo-400" /><span>Final Report Synthesis</span></div>;
            case 'UserInteraction':
                return <div key={step.id} className="flex items-center gap-2 text-sm"><HelpCircle className="h-4 w-4 text-lime-400" /><span>User Input</span></div>;
            default:
                return null;
        }
    }

    return (
        <div className="p-4 flex flex-col items-center">
            {phases.map((phase, index) => (
                <React.Fragment key={index}>
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg p-4 my-2">
                        <h3 className="font-bold text-center text-indigo-300 flex items-center justify-center gap-2">
                            <Milestone className="h-5 w-5" />
                            {phase[0].type === 'Phase' ? phase[0].log : `Phase ${index + 1}`}
                        </h3>
                        <div className="mt-3 space-y-2">
                            {phase.slice(phase[0].type === 'Phase' ? 1 : 0).map(renderStep)}
                        </div>
                    </div>
                    {index < phases.length - 1 && <ArrowDown className="h-8 w-8 text-slate-600 my-2" />}
                </React.Fragment>
            ))}
        </div>
    );
};

export default WorkflowView;