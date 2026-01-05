'use client';

import { useState } from 'react';
import AgentForm from './agent-form';
import AgentTester from './agent-tester';
import { Settings, Mic } from 'lucide-react';

export default function AgentTabs({ agent }: { agent: any }) {
    const [activeTab, setActiveTab] = useState<'config' | 'test'>('config');

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`
              group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium
              ${activeTab === 'config'
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
            `}
                    >
                        <Settings className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'config' ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('test')}
                        className={`
              group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium
              ${activeTab === 'test'
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
            `}
                    >
                        <Mic className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'test' ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        Talk to Agent
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'config' ? (
                    <AgentForm agent={agent} />
                ) : (
                    <AgentTester agentId={agent.agent_id} />
                )}
            </div>
        </div>
    );
}
