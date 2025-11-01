import React, { useEffect, useRef } from 'react';
import { Agent, ResearchStep, CollaborationType, GroundingSource, DelegationStep } from '../types';
import { Bot, Users, FileText, ChevronRight, Milestone, Link, ArrowRight, CornerDownRight, BrainCircuit, HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VisualizationTab from './VisualizationTab';

interface ResearchLogProps {
    agents: Agent[];
    researchLog: ResearchStep[];
    finalReport: string;
    isResearching: boolean;
    topic: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    currentCollaboration: { type: CollaborationType; transcript: string; sources: GroundingSource[] } | null;
}

const ResearchLog: React.FC<ResearchLogProps> = ({ agents, researchLog, finalReport, isResearching, topic, activeTab, setActiveTab, currentCollaboration }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [researchLog, finalReport, currentCollaboration?.transcript]);

    const getAgentName = (id: number) => agents.find(a => a.id === id)?.name || `Agent ${id}`;

    const renderSources = (sources: GroundingSource[]) => {
        if (!sources || sources.length === 0) return null;
        return (
            <div className="mt-3">
                <h4 className="text-xs font-semibold text-slate-400 mb-1">Sources:</h4>
                <ul className="list-none space-y-1">
                    {sources.map((source, index) => (
                        <li key={index} className="flex items-start">
                            <Link className="h-3 w-3 text-sky-400 mt-1 mr-2 flex-shrink-0" />
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate" title={source.uri}>
                                {source.title || source.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };
    
    const renderDelegatedLogs = (logs: DelegationStep[]) => {
        if (!logs || logs.length === 0) return null;
        return (
            <div className="mt-3 pl-4 border-l-2 border-slate-700">
                 <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Internal Communications</h4>
                 <div className="space-y-2 text-xs text-slate-400">
                    {logs.map((log, index) => (
                        <div key={index}>
                           <div className="flex items-center gap-1 font-semibold">
                                <span>{getAgentName(log.sourceAgentId)}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span>{getAgentName(log.targetAgentId)}</span>
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${log.type === 'Request' ? 'bg-sky-900 text-sky-300' : 'bg-amber-900 text-amber-300'}`}>{log.type}</span>
                           </div>
                           <p className="pl-2 mt-0.5">{log.log}</p>
                           {log.sources && renderSources(log.sources)}
                        </div>
                    ))}
                 </div>
            </div>
        );
    }
    
    const renderStep = (step: ResearchStep) => {
        const iconClasses = "h-6 w-6 mr-3 flex-shrink-0";
        switch (step.type) {
            case 'Phase':
                return <><Milestone className={iconClasses + " text-indigo-400"} /> <p className="font-semibold text-indigo-300">{step.log}</p></>;
            case 'Individual':
                return <>
                    <Bot className={iconClasses + " text-sky-400"} />
                    <div className="w-full">
                        <p className="font-semibold text-sky-300">{getAgentName(step.agentId!)}'s findings:</p>
                        <p className="text-slate-300 whitespace-pre-wrap">{step.log}</p>
                        {renderSources(step.sources || [])}
                        {renderDelegatedLogs(step.delegatedLogs || [])}
                    </div>
                </>;
            case 'Collaboration':
                return <>
                    <Users className={iconClasses + " text-amber-400"} />
                    <div className="w-full">
                        <p className="font-semibold text-amber-300">{step.collaborationType} Summary:</p>
                        <p className="text-slate-300 whitespace-pre-wrap">{step.log}</p>
                        {renderSources(step.sources || [])}
                    </div>
                </>;
            case 'Synthesis':
                 return <>
                    <FileText className={iconClasses + " text-teal-400"} />
                    <div className="w-full">
                        <p className="font-semibold text-teal-300">Final Report Synthesized:</p>
                        <p className="text-slate-300 line-clamp-4">{step.log}</p>
                        <button onClick={() => setActiveTab('report')} className="text-sm text-indigo-400 hover:underline mt-2">View Full Report</button>
                    </div>
                </>;
            case 'UserInteraction':
                 return <>
                    <HelpCircle className={iconClasses + " text-lime-400"} />
                    <div className="w-full">
                        <p className="font-semibold text-lime-300">User Interaction:</p>
                        {step.question && <p className="text-slate-300"><strong>Q:</strong> {step.question}</p>}
                        {step.answer && <p className="text-slate-300"><strong>A:</strong> {step.answer}</p>}
                    </div>
                </>;
            default:
                return <><ChevronRight className={iconClasses} /> <p>{step.log}</p></>;
        }
    };

    const tabs = [
        { id: 'main', label: 'Research Log' },
        ...(currentCollaboration ? [{ id: 'collaboration', label: 'Live Collaboration' }] : []),
        ...(finalReport ? [{ id: 'report', label: 'Final Report' }] : []),
        ...(researchLog.length > 0 ? [{ id: 'viz', label: 'Visualizations' }] : []),
    ];
    
    const getTabClass = (tabId: string) => 
        `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
            activeTab === tabId 
            ? 'border-b-2 border-indigo-400 text-slate-100' 
            : 'text-slate-400 hover:text-slate-200'
        }`;


    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg flex flex-col h-full">
            <div className="p-4 border-b border-slate-700 flex-shrink-0">
                 <h2 className="text-2xl font-orbitron font-bold text-slate-300 truncate" title={topic}>
                    {isResearching ? 'Running Research...' : 'Research Complete'}
                </h2>
                <p className="text-sm text-slate-400 truncate">{topic || "Awaiting topic..."}</p>
            </div>
            
            <div className="border-b border-slate-700 px-2 flex-shrink-0">
                <nav className="flex space-x-2">
                     {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={getTabClass(tab.id)}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div ref={logContainerRef} className="overflow-y-auto p-4 flex-grow">
                {activeTab === 'main' && (
                    <div className="space-y-6">
                        {researchLog.map(step => (
                            <div key={step.id} className="flex items-start">
                                {renderStep(step)}
                            </div>
                        ))}
                         {isResearching && researchLog.length === 0 && (
                            <div className="text-center text-slate-400 py-8">
                                <p>Initializing agent swarm...</p>
                            </div>
                        )}
                        {!isResearching && researchLog.length === 0 && !finalReport && (
                            <div className="text-center text-slate-400 py-8">
                                <p>The research log will appear here once you start a new research task.</p>
                            </div>
                        )}
                    </div>
                )}
                 {activeTab === 'collaboration' && currentCollaboration && (
                    <div>
                        <h3 className="text-xl font-bold text-amber-300 mb-2">{currentCollaboration.type} in Progress...</h3>
                        <div className="bg-slate-900/50 rounded-md p-4 whitespace-pre-wrap font-mono text-sm text-slate-300">
                            {currentCollaboration.transcript}
                            <span className="animate-pulse">_</span>
                        </div>
                    </div>
                )}
                {activeTab === 'report' && finalReport && (
                    <article className="prose prose-slate prose-invert max-w-none">
                        <Markdown remarkPlugins={[remarkGfm]}>{finalReport}</Markdown>
                    </article>
                )}
                {activeTab === 'viz' && (
                    <VisualizationTab researchLog={researchLog} agents={agents} />
                )}
            </div>
        </div>
    );
};

export default ResearchLog;