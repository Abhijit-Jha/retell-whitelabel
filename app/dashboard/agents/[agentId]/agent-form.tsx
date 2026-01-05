'use client';

import { useState, useEffect } from 'react';
import { updateAgent, getRetellLLM, updateRetellLLM } from '@/actions/retell';
import { Loader2, Save } from 'lucide-react';

interface AgentFormProps {
    agent: any;
}

export default function AgentForm({ agent }: AgentFormProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingLLM, setFetchingLLM] = useState(false);

    // Agent State
    const [agentName, setAgentName] = useState(agent.agent_name || '');
    const [voiceId, setVoiceId] = useState(agent.voice_id || '');

    // LLM State
    const [llmId, setLlmId] = useState<string | null>(null);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [model, setModel] = useState('');
    const [generalPrompt, setGeneralPrompt] = useState(''); // Fallback/General prompt

    useEffect(() => {
        const fetchLLM = async () => {
            if (agent.response_engine?.type === 'retell-llm' && agent.response_engine?.llm_id) {
                setLlmId(agent.response_engine.llm_id);
                setFetchingLLM(true);
                try {
                    const llm = await getRetellLLM(agent.response_engine.llm_id);
                    setSystemPrompt(llm.general_prompt || '');
                    setModel(llm.model || '');
                    setGeneralPrompt(llm.general_prompt || '');
                } catch (error) {
                    console.error('Failed to fetch LLM:', error);
                } finally {
                    setFetchingLLM(false);
                }
            }
        };

        fetchLLM();
    }, [agent]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Update Agent
            await updateAgent(agent.agent_id, {
                agent_name: agentName,
                voice_id: voiceId,
            });

            // 2. Update LLM (if applicable)
            if (llmId) {
                await updateRetellLLM(llmId, {
                    general_prompt: systemPrompt,
                    model: model,
                });
            }

            alert('Agent and LLM updated successfully!');
        } catch (error: any) {
            console.error(error);
            alert(`Failed to update: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900">Agent Configuration</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Update your agent's core settings.
                </p>

                <div className="mt-6 grid gap-6">
                    {/* Agent Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Agent Name</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                        />
                    </div>

                    {/* Voice ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Voice ID</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                            value={voiceId}
                            onChange={(e) => setVoiceId(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Enter the 11labs or Provider Voice ID.
                        </p>
                    </div>

                    {/* LLM Settings (if Retell LLM) */}
                    {llmId && (
                        <>
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-base font-medium text-gray-900">LLM Settings</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Configure the underlying Language Model.
                                </p>
                            </div>

                            {fetchingLLM ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading LLM details...
                                </div>
                            ) : (
                                <>
                                    {/* Model */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Model</label>
                                        <select
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                        >
                                            <option value="gpt-4o">GPT-4o</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                            <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                            <option value="claude-3-haiku">Claude 3 Haiku</option>
                                        </select>
                                    </div>

                                    {/* System Prompt */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">System Prompt</label>
                                        <div className="mt-1">
                                            <textarea
                                                rows={10}
                                                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                                                value={systemPrompt}
                                                onChange={(e) => setSystemPrompt(e.target.value)}
                                                placeholder="You are a helpful assistant..."
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Define the personality and instructions for your agent.
                                        </p>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading || fetchingLLM}
                        className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
