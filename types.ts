export interface AgentDefinition {
    name: string;
    role: string;
    description: string;
    model: string;
}

export interface Agent extends AgentDefinition {
    id: number;
    status: 'Idle' | 'Researching' | 'In Meeting' | 'Synthesizing';
    output: string;
    sources: GroundingSource[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export enum CollaborationType {
    MEETING = 'Meeting',
    DEBATE = 'Debate',
    DISCUSSION = 'Discussion',
    QNA = 'Q&A',
}

export interface DelegationStep {
    type: 'Request' | 'Response';
    sourceAgentId: number;
    targetAgentId: number;
    log: string;
    sources?: GroundingSource[];
}

export interface ResearchStep {
    id: number;
    type: 'Individual' | 'Collaboration' | 'Synthesis' | 'Phase' | 'UserInteraction';
    agentId?: number;
    collaborationType?: CollaborationType;
    log: string;
    sources?: GroundingSource[];
    delegatedLogs?: DelegationStep[];
    question?: string;
    answer?: string;
}

export interface SavedResearch {
    id: number;
    topic: string;
    date: string;
    researchLog: ResearchStep[];
    finalReport: string;
    agents: Agent[];
}