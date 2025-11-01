import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Agent, ResearchStep, SavedResearch, CollaborationType, GroundingSource } from './types';
import { AGENT_DEFINITIONS } from './constants';
import { runAgentTask, runCollaborationTask, runSynthesisTask, chooseNextAction } from './services/geminiService';
import AgentCard from './components/AgentCard';
import TopicInput from './components/TopicInput';
import ResearchLog from './components/ResearchLog';
import SavedResearchList from './components/SavedResearchList';
import SettingsToggle from './components/SettingsToggle';
import AskRequesterModal from './components/AskRequesterModal';
import { Dna, BotMessageSquare, BrainCircuit, SearchCheck, MessageSquareQuote, Scale, Lightbulb, History, TestTube, FileText, Group } from 'lucide-react';

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [agents, setAgents] = useState<Agent[]>(AGENT_DEFINITIONS.map((def, i) => ({
        ...def,
        id: i,
        status: 'Idle',
        output: '',
        sources: [],
    })));
    const [researchLog, setResearchLog] = useState<ResearchStep[]>([]);
    const [isResearching, setIsResearching] = useState<boolean>(false);
    const [finalReport, setFinalReport] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [savedResearches, setSavedResearches] = useState<SavedResearch[]>([]);
    const stopResearchRef = useRef<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>('main');
    const [currentCollaboration, setCurrentCollaboration] = useState<{ type: CollaborationType; transcript: string; sources: GroundingSource[] } | null>(null);
    const [isAskerEnabled, setIsAskerEnabled] = useState<boolean>(true);
    const [activeQuestion, setActiveQuestion] = useState<{ question: string; resolve: (answer: string | null) => void } | null>(null);


    useEffect(() => {
        try {
            const saved = localStorage.getItem('ai-research-swarm-saves');
            if (saved) {
                setSavedResearches(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load saved research:", e);
        }
    }, []);

    const agentIcons = useMemo(() => [
        <BotMessageSquare className="h-8 w-8 text-indigo-400" />,
        <BrainCircuit className="h-8 w-8 text-sky-400" />,
        <SearchCheck className="h-8 w-8 text-rose-400" />,
        <MessageSquareQuote className="h-8 w-8 text-amber-400" />,
        <Scale className="h-8 w-8 text-red-400" />,
        <Lightbulb className="h-8 w-8 text-yellow-400" />,
        <History className="h-8 w-8 text-orange-400" />,
        <TestTube className="h-8 w-8 text-cyan-400" />,
        <FileText className="h-8 w-8 text-lime-400" />,
        <Group className="h-8 w-8 text-teal-400" />,
        <Dna className="h-8 w-8 text-purple-400" />,
    ], []);

    const addToLog = (step: Omit<ResearchStep, 'id'>) => {
        setResearchLog(prev => [...prev, { ...step, id: prev.length }]);
    };
    
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSaveResearch = (currentTopic: string, currentLog: ResearchStep[], currentReport: string, currentAgents: Agent[]) => {
        const newSave: SavedResearch = {
            id: Date.now(),
            topic: currentTopic,
            date: new Date().toLocaleString(),
            researchLog: currentLog,
            finalReport: currentReport,
            agents: currentAgents,
        };
        setSavedResearches(prev => {
            const updatedSaves = [newSave, ...prev];
            try {
                localStorage.setItem('ai-research-swarm-saves', JSON.stringify(updatedSaves));
            } catch (e) {
                console.error("Failed to save research:", e);
                setError("Failed to save research results. The browser's local storage might be full.");
            }
            return updatedSaves;
        });
    };

    const handleLoadResearch = useCallback((id: number) => {
        const researchToLoad = savedResearches.find(r => r.id === id);
        if (researchToLoad) {
            setTopic(researchToLoad.topic);
            setResearchLog(researchToLoad.researchLog);
            setFinalReport(researchToLoad.finalReport);
            setAgents(researchToLoad.agents);
            setIsResearching(false);
            setError(null);
            setActiveTab('main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [savedResearches]);

    const handleDeleteResearch = useCallback((id: number) => {
        setSavedResearches(prev => {
            const updatedSaves = prev.filter(r => r.id !== id);
            try {
                localStorage.setItem('ai-research-swarm-saves', JSON.stringify(updatedSaves));
            } catch (e) {
                console.error("Failed to update saved research after deletion:", e);
            }
            return updatedSaves;
        });
    }, []);

    const handleStopResearch = () => {
        stopResearchRef.current = true;
        setIsResearching(false); 
    };

    const startResearch = useCallback(async (researchTopic: string, customInstruction: string) => {
        if (!researchTopic.trim()) {
            setError("Please enter a research topic.");
            return;
        }
        stopResearchRef.current = false;
        setTopic(researchTopic);
        setIsResearching(true);
        setError(null);
        setFinalReport('');
        setCurrentCollaboration(null);
        setActiveTab('main');
        const initialAgents = AGENT_DEFINITIONS.map((def, i) => ({ ...def, id: i, status: 'Idle' as const, output: '', sources: [] }));
        setAgents(initialAgents);
        setResearchLog([]);

        const currentResearchLog: ResearchStep[] = [];
        const logUpdater = (step: Omit<ResearchStep, 'id'>) => {
            const newStep = { ...step, id: currentResearchLog.length };
            currentResearchLog.push(newStep);
            setResearchLog([...currentResearchLog]);
        };
        
        try {
            if (stopResearchRef.current) throw new Error("Research stopped by user.");
            logUpdater({ type: 'Phase', log: 'Phase 1: Initial Individual Research commencing...' });
            
            let currentAgentStates: Agent[] = [];
            for (const agent of initialAgents) {
                if (stopResearchRef.current) break;
                setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'Researching' } : a));
                const { text, sources, delegatedLogs } = await runAgentTask(agent, initialAgents, researchTopic, '', customInstruction);
                const updatedAgent = { ...agent, status: 'Idle' as const, output: text, sources };
                currentAgentStates.push(updatedAgent);
                setAgents(prev => prev.map(a => a.id === agent.id ? updatedAgent : a));
                logUpdater({ type: 'Individual', agentId: agent.id, log: text, sources, delegatedLogs });
                await sleep(1500); // Increased delay to prevent hitting rate limits
            }

            if (stopResearchRef.current) throw new Error("Research stopped by user.");

            logUpdater({ type: 'Phase', log: 'Phase 2: Project Manager is analyzing findings to determine next step.' });
            let currentFindings = currentAgentStates.map(a => ({ role: a.role, output: a.output }));
            
            const projectManager = initialAgents.find(a => a.role === 'Project Manager');
            const projectManagerModel = projectManager?.model || 'gemini-2.5-flash';

            // --- First User Interaction Point ---
            let decision = await chooseNextAction(currentFindings, researchTopic, customInstruction, projectManagerModel);
            if (isAskerEnabled && decision.action === 'ASK_REQUESTER' && decision.question) {
                logUpdater({ type: 'Phase', log: `Project Manager's Decision: A question for the user is required.\nReasoning: ${decision.reasoning}` });
                logUpdater({ type: 'UserInteraction', log: `Question: ${decision.question}`, question: decision.question });

                const userAnswer = await new Promise<string | null>((resolve) => setActiveQuestion({ question: decision.question!, resolve }));
                setActiveQuestion(null);

                if (userAnswer) {
                    logUpdater({ type: 'UserInteraction', log: `User Answer: ${userAnswer}`, answer: userAnswer });
                    currentFindings.push({ role: 'User Input', output: userAnswer });
                } else {
                    logUpdater({ type: 'UserInteraction', log: 'User did not respond in time. Proceeding autonomously.' });
                }
                decision = await chooseNextAction(currentFindings, researchTopic, customInstruction, projectManagerModel);
                if (decision.action === 'ASK_REQUESTER') {
                    decision = { action: CollaborationType.MEETING, reasoning: "Defaulted to a meeting after user interaction to synthesize new input." };
                }
            }

            const firstCollaborationType = decision.action as CollaborationType;
            logUpdater({ type: 'Phase', log: `Project Manager's Decision: A ${firstCollaborationType.toUpperCase()} is required. \nReasoning: ${decision.reasoning}` });
            
            setAgents(prev => prev.map(a => ({...a, status: 'In Meeting'})));
            setCurrentCollaboration({ type: firstCollaborationType, transcript: '', sources: [] });
            setActiveTab('collaboration');

            const collaborationResult = await runCollaborationTask(currentFindings, researchTopic, firstCollaborationType, (chunk) => {
                 setCurrentCollaboration(prev => prev ? { ...prev, transcript: prev.transcript + chunk } : null);
            }, customInstruction);
            logUpdater({ type: 'Collaboration', collaborationType: firstCollaborationType, log: collaborationResult.text, sources: collaborationResult.sources });
            setCurrentCollaboration(null);

            if (stopResearchRef.current) throw new Error("Research stopped by user.");

            logUpdater({ type: 'Phase', log: 'Phase 3: Refined individual research based on collaboration outcomes.' });
            setActiveTab('main');

            let refinedAgentStates: Agent[] = [];
            for (const agent of currentAgentStates) {
                 if (stopResearchRef.current) break;
                 setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'Researching' } : a));
                 const refinedPrompt = `Based on the initial research and the following ${firstCollaborationType} summary, conduct a more focused investigation from your perspective as ${agent.role}. Summary: ${collaborationResult.text}`;
                 const { text, sources, delegatedLogs } = await runAgentTask(agent, currentAgentStates, researchTopic, refinedPrompt, customInstruction);
                 const updatedAgent = { ...agent, status: 'Idle' as const, output: `${agent.output}\n\n---\n\n${text}`, sources: [...agent.sources, ...sources] };
                 refinedAgentStates.push(updatedAgent);
                 setAgents(prev => prev.map(a => a.id === agent.id ? updatedAgent : a));
                 logUpdater({ type: 'Individual', agentId: agent.id, log: text, sources, delegatedLogs });
                 await sleep(1500); // Increased delay to prevent hitting rate limits
            }
            currentAgentStates = refinedAgentStates;
            if (stopResearchRef.current) throw new Error("Research stopped by user.");
            
            logUpdater({ type: 'Phase', log: 'Phase 4: Project Manager is analyzing refined findings for final collaboration.' });
            let finalFindings = currentAgentStates.map(a => ({ role: a.role, output: a.output }));
            
            // --- Second User Interaction Point ---
            let finalDecision = await chooseNextAction(finalFindings, researchTopic, customInstruction, projectManagerModel);
            if (isAskerEnabled && finalDecision.action === 'ASK_REQUESTER' && finalDecision.question) {
                logUpdater({ type: 'Phase', log: `Project Manager's Decision: A final question for the user is required.\nReasoning: ${finalDecision.reasoning}` });
                logUpdater({ type: 'UserInteraction', log: `Question: ${finalDecision.question}`, question: finalDecision.question });

                const userAnswer = await new Promise<string | null>((resolve) => setActiveQuestion({ question: finalDecision.question!, resolve }));
                setActiveQuestion(null);

                if (userAnswer) {
                    logUpdater({ type: 'UserInteraction', log: `User Answer: ${userAnswer}`, answer: userAnswer });
                    finalFindings.push({ role: 'User Input', output: userAnswer });
                } else {
                    logUpdater({ type: 'UserInteraction', log: 'User did not respond in time. Proceeding autonomously.' });
                }
                finalDecision = await chooseNextAction(finalFindings, researchTopic, customInstruction, projectManagerModel);
                 if (finalDecision.action === 'ASK_REQUESTER') {
                    finalDecision = { action: CollaborationType.DEBATE, reasoning: "Defaulted to a debate after user interaction to challenge all perspectives." };
                }
            }

            const secondCollaborationType = finalDecision.action as CollaborationType;
            logUpdater({ type: 'Phase', log: `Project Manager's Decision: A final ${secondCollaborationType.toUpperCase()} will consolidate perspectives. \nReasoning: ${finalDecision.reasoning}` });
            setAgents(prev => prev.map(a => ({...a, status: 'In Meeting'})));
            setCurrentCollaboration({ type: secondCollaborationType, transcript: '', sources: [] });
            setActiveTab('collaboration');

            const debateResult = await runCollaborationTask(finalFindings, researchTopic, secondCollaborationType, (chunk) => {
                setCurrentCollaboration(prev => prev ? { ...prev, transcript: prev.transcript + chunk } : null);
            }, customInstruction);
            logUpdater({ type: 'Collaboration', collaborationType: secondCollaborationType, log: debateResult.text, sources: debateResult.sources });
            setCurrentCollaboration(null);

            if (stopResearchRef.current) throw new Error("Research stopped by user.");

            const synthesizer = currentAgentStates.find(a => a.role === 'Final Report Synthesizer');
            if (synthesizer) {
                setAgents(prev => prev.map(a => ({...a, status: 'Idle'})));
                setAgents(prev => prev.map(a => a.id === synthesizer.id ? { ...a, status: 'Synthesizing' } : a));
                logUpdater({ type: 'Phase', log: `Phase 5: ${synthesizer.role} is compiling the final report.` });
                setActiveTab('main');

                const synthesisResult = await runSynthesisTask(currentResearchLog, researchTopic, customInstruction, synthesizer);
                setFinalReport(synthesisResult.text);
                setAgents(prev => prev.map(a => a.id === synthesizer.id ? { ...a, status: 'Idle' } : a));
                setActiveTab('main');

                logUpdater({ type: 'Synthesis', agentId: synthesizer.id, log: synthesisResult.text, sources: synthesisResult.sources });
                
                const finalAgentsState = currentAgentStates.map(a => ({...a, status: 'Idle' as const}));
                handleSaveResearch(researchTopic, currentResearchLog, synthesisResult.text, finalAgentsState);
            }

        } catch (err: any) {
            if (err.message === "Research stopped by user.") {
                logUpdater({ type: 'Phase', log: 'Research process manually stopped by the user.' });
                setError(null);
            } else {
                console.error("Research process failed:", err);
                const errorMessage = err.toString();
                if (errorMessage.includes('429') || errorMessage.toUpperCase().includes('RESOURCE_EXHAUSTED')) {
                     setError("The AI is experiencing high demand and has reached a rate limit. The research process has been stopped. Please wait a moment and try again, or check your API key's usage plan.");
                } else {
                    setError("An error occurred during the research process. Please check the console for details.");
                }
            }
        } finally {
            setIsResearching(false);
            setAgents(prev => prev.map(a => ({ ...a, status: 'Idle' })));
            stopResearchRef.current = false;
            setCurrentCollaboration(null);
        }
    }, [savedResearches, isAskerEnabled]);

    return (
        <div className="bg-slate-900 text-slate-200 h-screen flex flex-col">
            <div className="container mx-auto px-4 py-8 flex flex-col flex-grow min-h-0">
                <header className="text-center mb-8 flex-shrink-0">
                    <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-400 mb-2">
                        AI Agent Research Swarm
                    </h1>
                    <p className="text-slate-400 max-w-3xl mx-auto">
                        A collective of specialized AI agents collaborates on your topic, moving through stages of research, discussion, and synthesis to generate a comprehensive report.
                    </p>
                </header>
                
                <TopicInput onStartResearch={startResearch} onStopResearch={handleStopResearch} isResearching={isResearching} />
                <SettingsToggle isEnabled={isAskerEnabled} onToggle={setIsAskerEnabled} />

                {activeQuestion && (
                    <AskRequesterModal
                        question={activeQuestion.question}
                        onAnswer={(answer) => {
                            activeQuestion.resolve(answer);
                            setActiveQuestion(null);
                        }}
                    />
                )}

                {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg my-4 text-center flex-shrink-0">{error}</div>}

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4 flex-grow min-h-0">
                    <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
                         <h2 className="text-2xl font-orbitron font-bold text-slate-300 flex-shrink-0">Agent Roster</h2>
                        <div className="overflow-y-auto space-y-4 pr-2">
                             {agents.map((agent, index) => (
                               <AgentCard key={agent.id} agent={agent} icon={agentIcons[index % agentIcons.length]} />
                            ))}
                        </div>
                         <div className="pt-4 flex-shrink-0">
                            <SavedResearchList
                                researches={savedResearches}
                                onLoad={handleLoadResearch}
                                onDelete={handleDeleteResearch}
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-2 min-h-0">
                        <ResearchLog
                            agents={agents}
                            researchLog={researchLog}
                            finalReport={finalReport}
                            isResearching={isResearching}
                            topic={topic}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            currentCollaboration={currentCollaboration}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;