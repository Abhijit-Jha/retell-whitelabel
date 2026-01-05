'use client';

import { useState } from 'react';
import { listRetellAgents, importAgent } from '@/actions/retell';
import { Plus, Loader2, Download } from 'lucide-react';

export function ImportAgentButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [importing, setImporting] = useState<string | null>(null);

    const handleOpen = async () => {
        setIsOpen(true);
        setLoading(true);
        try {
            const data = await listRetellAgents();
            // Retell API returns array of agents directly or { agents: [...] }?
            // Based on docs, usually array. Let's assume array for now.
            setAgents(Array.isArray(data) ? data : (data.agents || []));
        } catch (error) {
            console.error(error);
            alert('Failed to fetch agents. Check your API Key.');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (agent: any) => {
        setImporting(agent.agent_id);
        try {
            await importAgent(agent);
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            alert('Failed to import agent.');
        } finally {
            setImporting(null);
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
                <Plus className="h-4 w-4" />
                Import Agent
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Import from Retell</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="max-h-[60vh] overflow-y-auto">
                                {agents.length === 0 ? (
                                    <p className="text-center text-gray-500">No agents found in your Retell account.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {agents.map((agent) => (
                                            <div key={agent.agent_id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                                                <div>
                                                    <p className="font-medium text-gray-900">{agent.agent_name || 'Unnamed Agent'}</p>
                                                    <p className="text-xs text-gray-500">{agent.agent_id}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleImport(agent)}
                                                    disabled={!!importing}
                                                    className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-white hover:text-black disabled:opacity-50"
                                                >
                                                    {importing === agent.agent_id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Download className="h-3 w-3" />
                                                    )}
                                                    Import
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
