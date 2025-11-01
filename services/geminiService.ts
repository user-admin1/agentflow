import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration, Content } from "@google/genai";
import { Agent, ResearchStep, CollaborationType, GroundingSource, DelegationStep } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models;

const AGENT_TOOLS: FunctionDeclaration[] = [
    {
        name: 'factCheck',
        description: 'Verify a specific claim for accuracy using reliable sources.',
        parameters: { type: Type.OBJECT, properties: { claim: { type: Type.STRING, description: 'The specific claim to be verified.' } }, required: ['claim'] }
    },
    {
        name: 'findData',
        description: 'Find quantitative data, statistics, or specific numbers related to a query.',
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: 'The specific data or statistic being requested.' } }, required: ['query'] }
    },
    {
        name: 'getHistoricalContext',
        description: 'Provide historical background or context for a particular event, person, or topic.',
        parameters: { type: Type.OBJECT, properties: { topic: { type: Type.STRING, description: 'The topic needing historical context.' } }, required: ['topic'] }
    },
    {
        name: 'challengeAssumption',
        description: "Challenge an assumption or argument to test its validity. Identify potential flaws.",
        parameters: { type: Type.OBJECT, properties: { assumption: { type: Type.STRING, description: 'The assumption or argument to be challenged.' } }, required: ['assumption'] }
    }
];

const TOOL_TO_ROLE_MAP: { [key: string]: string } = {
    factCheck: "Fact-Checker",
    findData: "Data Analyst",
    getHistoricalContext: "Historical Context Analyst",
    challengeAssumption: "Critic & Devil's Advocate",
};

const MAX_RETRIES = 5;

const callGeminiWithRetry = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    let lastError: any = null;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            lastError = error;
            const isRateLimitError = error.toString().includes('429') || error.toString().includes('RESOURCE_EXHAUSTED');
            
            if (isRateLimitError && i < MAX_RETRIES - 1) {
                const delay = (2 ** i) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                console.warn(`Rate limit exceeded. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${i + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw lastError;
            }
        }
    }
    throw lastError;
};

const parseSources = (response: GenerateContentResponse): GroundingSource[] => {
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (!groundingMetadata?.groundingChunks) {
        return [];
    }
    return groundingMetadata.groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
        }));
};

const callGemini = async (prompt: string, modelName: string, useSearch: boolean = true): Promise<{ text: string; sources: GroundingSource[] }> => {
    const config = useSearch ? { tools: [{ googleSearch: {} }] } : {};
    const response = await callGeminiWithRetry(() => model.generateContent({
        model: modelName,
        contents: prompt,
        config,
    }));
    const text = response.text;
    const sources = parseSources(response);
    return { text, sources };
}

export const chooseNextAction = async (findings: { role: string; output: string }[], topic: string, customInstruction: string, projectManagerModel: string): Promise<{ action: CollaborationType | 'ASK_REQUESTER'; reasoning: string; question?: string; }> => {
    const findingsText = findings.map(f => `--- [${f.role}] ---\n${f.output}\n`).join('\n');

    const prompt = `
        You are Orion, the Project Manager for a team of AI agents researching: "${topic}".
        ${customInstruction ? `\nThere is an important instruction from the user you must follow: "${customInstruction}"\n` : ''}
        Review the following findings from your team:
        ${findingsText}

        Based on these findings, decide the most effective type of collaboration for the next step.
        Your options are:
        - "${CollaborationType.MEETING}": For general synchronization and synthesis of ideas.
        - "${CollaborationType.DISCUSSION}": For exploring a topic in-depth and brainstorming new angles.
        - "${CollaborationType.DEBATE}": To resolve conflicting information or challenge weak arguments.
        - "${CollaborationType.QNA}": To clarify specific points or have experts answer questions from the team.
        - "ASK_REQUESTER": Use this sparingly. Only when there is a critical ambiguity, a need for a subjective choice, or a fundamental pivot in research direction that requires the user's input.

        If you choose "ASK_REQUESTER", you MUST formulate a clear, concise question for the user.
        Otherwise, just choose one of the collaboration actions.

        Choose one action and provide a brief reasoning for your choice.
    `;

    try {
        const response = await callGeminiWithRetry(() => model.generateContent({
            model: projectManagerModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        action: {
                            type: Type.STRING,
                            description: "The chosen action type, e.g., 'Meeting' or 'ASK_REQUESTER'."
                        },
                        reasoning: {
                            type: Type.STRING,
                            description: "A brief justification for the chosen action."
                        },
                        question: {
                            type: Type.STRING,
                            description: "The question to ask the user, ONLY if the action is 'ASK_REQUESTER'."
                        }
                    },
                    required: ['action', 'reasoning']
                },
            },
        }));

        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);
        const validActions = [...Object.values(CollaborationType), 'ASK_REQUESTER'];

        if (validActions.includes(parsed.action)) {
             return {
                action: parsed.action,
                reasoning: parsed.reasoning,
                question: parsed.question,
            };
        } else {
            console.warn("Model returned invalid action type, defaulting to MEETING.", parsed.action);
            return { action: CollaborationType.MEETING, reasoning: "Defaulted due to invalid model response." };
        }

    } catch (error) {
        console.error("Error in chooseNextAction after retries:", error);
        // Re-throw the error to be handled by the main research loop
        throw error;
    }
}

export const runAgentTask = async (
    agent: Agent,
    allAgents: Agent[],
    topic: string,
    context: string = '',
    customInstruction: string
): Promise<{ text: string; sources: GroundingSource[]; delegatedLogs: DelegationStep[] }> => {
    const delegatedLogs: DelegationStep[] = [];
    const prompt = `
        You are an AI agent named ${agent.name}.
        Your role is: ${agent.role}.
        Your goal is: ${agent.description}.
        The main research topic is: "${topic}".
        ${customInstruction ? `There is an important overarching instruction from the user that you must follow: "${customInstruction}"\n` : ''}
        ${context ? `Additional context for this task: ${context}` : ''}
        
        Perform your task diligently. 
        You have access to a team of specialist agents you can delegate tasks to if needed. Use the available tools to call upon them. For example, if you encounter a claim you cannot verify, use 'factCheck'. If you need specific data, use 'findData'.
        After any delegations, synthesize their responses with your own findings to produce a comprehensive answer for your primary role.
        Provide a concise summary of your findings, analysis, or questions based on your specific role.
        Keep your response focused on your designated role.
    `;
    
    const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];

    const firstResponse = await callGeminiWithRetry(() => model.generateContent({
        model: agent.model,
        contents,
        config: {
            tools: [{ functionDeclarations: AGENT_TOOLS }],
        },
    }));

    const functionCalls = firstResponse.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
        return { text: firstResponse.text, sources: parseSources(firstResponse), delegatedLogs };
    }
    
    contents.push(firstResponse.candidates[0].content);

    const functionResponseParts = [];
    for (const fc of functionCalls) {
        const targetRole = TOOL_TO_ROLE_MAP[fc.name];
        const targetAgent = allAgents.find(a => a.role === targetRole);

        if (!targetAgent) continue;

        delegatedLogs.push({
            type: 'Request',
            sourceAgentId: agent.id,
            targetAgentId: targetAgent.id,
            log: `Tasked to perform: ${fc.name}(${JSON.stringify(fc.args).slice(1, -1)})`,
        });

        const delegatedTaskPrompt = `
            You are ${targetAgent.name}, the ${targetAgent.role}.
            Your colleague, ${agent.name} (${agent.role}), has delegated a task to you.
            The main research topic is "${topic}".
            ${customInstruction ? `The user has provided a global instruction for all agents: "${customInstruction}"\n` : ''}
            Your assigned task is: ${fc.name}.
            The details are: ${JSON.stringify(fc.args)}
            Perform this specific task and provide a direct, concise answer.
        `;
        
        const delegatedResult = await callGemini(delegatedTaskPrompt, targetAgent.model, true);
        
        delegatedLogs.push({
            type: 'Response',
            sourceAgentId: targetAgent.id,
            targetAgentId: agent.id,
            log: delegatedResult.text,
            sources: delegatedResult.sources,
        });

        functionResponseParts.push({
            functionResponse: {
                name: fc.name,
                response: { result: delegatedResult.text },
            },
        });
        
        // Add a delay between delegated calls to further spread out API requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    contents.push({ role: 'tool', parts: functionResponseParts });

    const secondResponse = await callGeminiWithRetry(() => model.generateContent({
        model: agent.model,
        contents,
        config: {
            tools: [{ googleSearch: {} }],
        },
    }));

    return {
        text: secondResponse.text,
        sources: parseSources(secondResponse),
        delegatedLogs
    };
};

export const runCollaborationTask = async (
    findings: { role: string; output: string }[],
    topic: string,
    type: CollaborationType,
    onChunk: (chunk: string) => void,
    customInstruction: string
): Promise<{ text: string; sources: GroundingSource[] }> => {
    const collaborationInstruction = {
        [CollaborationType.MEETING]: "facilitate a collaborative meeting.",
        [CollaborationType.DEBATE]: "moderate a structured debate.",
        [CollaborationType.DISCUSSION]: "guide a round-table discussion.",
        [CollaborationType.QNA]: "conduct a question-and-answer session.",
    }[type];

    const findingsText = findings.map(f => `--- [${f.role}] ---\n${f.output}\n`).join('\n');

    const prompt = `
        You are an AI meeting facilitator. Your task is to ${collaborationInstruction}
        The participants are a team of AI agents researching the topic: "${topic}".
        ${customInstruction ? `\nThe user has provided an important instruction that should guide this entire collaboration: "${customInstruction}"\n` : ''}
        
        Here are their latest findings, which may include direct input from the user:
        ${findingsText}
        
        Based on these inputs, generate a transcript of the ${type.toLowerCase()}.
        The conversation should be dynamic, with agents interacting, challenging each other (especially in a debate), and building upon each other's ideas.
        Ensure the conversation flows logically and makes progress on the research topic.
        Use your search capabilities to inject new, relevant information into the conversation if needed to resolve disputes or fill knowledge gaps.
        The output should be a formatted transcript. For example:
        Lyra (Lead Researcher): "Based on my findings..."
        Eris (Critic): "I'd like to challenge that assumption..."
    `;
    
    let fullText = "";
    let finalResponse: GenerateContentResponse | null = null;
    try {
        const responseStream = await callGeminiWithRetry(() => model.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        }));

        for await (const chunk of responseStream) {
            const textChunk = chunk.text;
            if (textChunk) {
                fullText += textChunk;
                onChunk(textChunk);
            }
            finalResponse = chunk;
        }
    } catch (error) {
         console.error("Error during collaboration stream after retries:", error);
         const errorMessage = "\n\n--- An error occurred during the live collaboration. This may be due to API rate limits. ---";
         onChunk(errorMessage);
         throw error;
    }

    const sources = finalResponse ? parseSources(finalResponse) : [];
    return { text: fullText, sources };
};

export const runSynthesisTask = async (log: ResearchStep[], topic: string, customInstruction: string, synthesizer: Agent): Promise<{ text: string; sources: GroundingSource[] }> => {
    const fullLog = log.map(step => {
        if (step.type === 'Individual' && step.agentId !== undefined) {
            let entry = `[Individual Work - Agent ${step.agentId}]:\n${step.log}`;
            if (step.delegatedLogs && step.delegatedLogs.length > 0) {
                entry += "\n\n  [Begin Internal Communications Log]\n";
                entry += step.delegatedLogs.map(dl => `    - ${dl.type} from Agent ${dl.sourceAgentId} to Agent ${dl.targetAgentId}: ${dl.log}`).join('\n');
                entry += "\n  [End Internal Communications Log]\n";
            }
            return entry;
        }
        if (step.type === 'Collaboration') {
            return `[${step.collaborationType} Transcript]:\n${step.log}`;
        }
         if (step.type === 'UserInteraction') {
            let entry = `[User Interaction]`;
            if (step.question) entry += `\nQuestion: ${step.question}`;
            if (step.answer) entry += `\nAnswer: ${step.answer}`;
            return entry;
        }
        return `[Phase Update]: ${step.log}`;
    }).join('\n\n');

    const prompt = `
        You are the 'Final Report Synthesizer' AI agent.
        Your task is to create a comprehensive, well-structured final report on the topic: "${topic}".
        ${customInstruction ? `\nCRITICAL INSTRUCTION FROM THE USER: You must adhere to the following instruction when writing the report: "${customInstruction}"\n` : ''}
        You have been provided with the complete log of the research process, including individual findings from multiple specialized agents, transcripts of their collaborative meetings, and logs of their internal task delegations.

        Here is the full research log:
        ${fullLog}

        Synthesize all this information into a single, coherent report.
        The report should be well-organized, insightful, and cover the topic from multiple perspectives as explored by the agent team.
        Start with an executive summary, followed by detailed sections.
        Use Markdown for formatting (e.g., # for headings, * for bullet points).
        Use your search capabilities to verify final points and ensure the report is up-to-date.
    `;
    return callGemini(prompt, synthesizer.model);
};