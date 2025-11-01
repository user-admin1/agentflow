import React from 'react';
import { HelpCircle } from 'lucide-react';

interface SettingsToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({ isEnabled, onToggle }) => {
    return (
        <div className="flex items-center justify-end gap-3 p-2 rounded-lg bg-slate-800/50 max-w-sm ml-auto mb-2 flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-sky-400" />
            <label htmlFor="ask-requester-toggle" className="text-sm font-medium text-slate-300 cursor-pointer">
                Allow agents to ask questions
            </label>
            <button
                id="ask-requester-toggle"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => onToggle(!isEnabled)}
                className={`${
                    isEnabled ? 'bg-indigo-600' : 'bg-slate-600'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
            >
                <span
                    className={`${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
            </button>
        </div>
    );
};

export default SettingsToggle;