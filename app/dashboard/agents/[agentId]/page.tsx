import { getAgent } from "@/actions/retell";
import { getWorkspace } from "@/actions/workspace";
import AgentForm from "./agent-form";
import AgentTester from "./agent-tester";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import AgentTabs from "./agent-tabs";
import ShareButton from "./share-button";

export default async function AgentDetailPage({ params }: { params: Promise<{ agentId: string }> }) {
    const { agentId } = await params;

    let agent;
    let workspace;
    try {
        agent = await getAgent(agentId);
        workspace = await getWorkspace();
    } catch (error) {
        return (
            <div className="p-6">
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    Error loading agent: {(error as Error).message}
                </div>
                <Link href="/dashboard/agents" className="mt-4 inline-block text-sm font-medium text-gray-600 hover:text-gray-900">
                    &larr; Back to Agents
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/agents" className="rounded-full p-2 hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{agent.agent_name || 'Unnamed Agent'}</h1>
                        <p className="text-sm text-gray-500">ID: {agent.agent_id}</p>
                    </div>
                </div>
                <ShareButton slug={workspace.slug} agentId={agent.agent_id || agent.retellAgentId} />
            </div>

            <AgentTabs agent={agent} />
        </div>
    );
}
