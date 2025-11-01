import React, { useState } from 'react';
import { Agent, ResearchStep } from '../types';
import TimelineView from './visualizations/TimelineView';
import WorkflowView from './visualizations/WorkflowView';
import AgentInteractionView from './visualizations/AgentInteractionView';

interface VisualizationTabProps {
    researchLog: ResearchStep[];
    agents: Agent[];
}

type VizType = 'timeline' | 'workflow' | 'interactions';

const VisualizationTab: React.FC<VisualizationTabProps> = ({ researchLog, agents }) => {
    const [activeViz, setActiveViz] = useState<VizType>('workflow');

    const renderViz = () => {
        switch (activeViz) {
            case 'timeline':
                return <TimelineView researchLog={researchLog} agents={agents} />;
            case 'workflow':
                return <WorkflowView researchLog={researchLog} agents={agents} />;
            case 'interactions':
                return <AgentInteractionView researchLog={researchLog} agents={agents} />;
            default:
                return null;
        }
    };
    
    const getButtonClass = (viz: VizType) => 
        `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeViz === viz 
            ? 'bg-indigo-600 text-white' 
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`;

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-700 flex-shrink-0">
                <div className="flex justify-center space-x-2">
                    <button onClick={() => setActiveViz('workflow')} className={getButtonClass('workflow')}>
                        Workflow
                    </button>
                    <button onClick={() => setActiveViz('timeline')} className={getButtonClass('timeline')}>
                        Timeline
                    </button>
                    <button onClick={() => setActiveViz('interactions')} className={getButtonClass('interactions')}>
                        Interactions
                    </button>
                </div>
            </div>
            <div className="overflow-y-auto flex-grow">
                {renderViz()}
            </div>
        </div>
    );
};

export default VisualizationTab;