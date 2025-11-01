
import { AgentDefinition } from './types';

export const AGENT_DEFINITIONS: AgentDefinition[] = [
    {
        name: "Orion",
        role: "Project Manager",
        description: "Oversees the entire research process, assigns tasks, and ensures the team stays on track.",
        model: "gemini-2.5-pro"
    },
    {
        name: "Lyra",
        role: "Lead Researcher",
        description: "Conducts deep, foundational research and identifies primary sources and avenues of investigation.",
        model: "gemini-2.5-flash"
    },
    {
        name: "Vela",
        role: "Data Analyst",
        description: "Specializes in finding, interpreting, and visualizing quantitative data and statistics.",
        model: "gemini-2.5-flash"
    },
    {
        name: "Caelus",
        role: "Fact-Checker",
        description: "Meticulously verifies all claims, data points, and sources for accuracy and reliability.",
        model: "gemini-2.5-flash"
    },
    {
        name: "Eris",
        role: "Critic & Devil's Advocate",
        description: "Challenges assumptions, questions conclusions, and identifies potential flaws in arguments.",
        model: "gemini-2.5-pro"
    },
    {
        name: "Cygnus",
        role: "Creative Thinker",
        description: "Explores unconventional angles, brainstorms innovative ideas, and connects disparate concepts.",
        model: "gemini-2.5-flash"
    },
    {
        name: "Clio",
        role: "Historical Context Analyst",
        description: "Provides historical background and context to understand the evolution of the topic.",
        model: "gemini-2.5-flash"
    },
    {
        name: "Techne",
        role: "Technological Feasibility Expert",
        description: "Assesses the technical aspects, feasibility, and implications of technologies related to the topic.",
        model: "gemini-2.5-pro"
    },
    {
        name: "Astra",
        role: "Ethical & Societal Impact Analyst",
        description: "Examines the ethical considerations and broader societal impact of the research findings.",
        model: "gemini-2.5-pro"
    },
    {
        name: "Nexus",
        role: "Final Report Synthesizer",
        description: "Weaves all the verified findings and diverse perspectives into a coherent, comprehensive final report.",
        model: "gemini-2.5-pro"
    },
     {
        name: "Draco",
        role: "Web Intelligence Analyst",
        description: "Scours the web for public sentiment, trends, and discussions related to the topic.",
        model: "gemini-2.5-flash"
    },
];