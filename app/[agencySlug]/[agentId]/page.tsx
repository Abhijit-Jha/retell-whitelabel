import { getWorkspaceBySlug } from '@/actions/workspace';
import connectDB from '@/lib/db';
import PublicAgentTester from './public-agent-tester';
import { notFound } from 'next/navigation';

export default async function PublicAgentPage({ params }: { params: Promise<{ agencySlug: string; agentId: string }> }) {
    const { agencySlug, agentId } = await params;

    console.log('--- Public Agent Page Debug ---');
    console.log('Params:', { agencySlug, agentId });

    // 1. Fetch Workspace
    let workspace;
    try {
        workspace = await getWorkspaceBySlug(agencySlug);
        console.log('Workspace found:', workspace?._id);
    } catch (error) {
        console.error('Workspace fetch error:', error);
        notFound();
    }

    // 2. Fetch Agent and Verify
    await connectDB();
    const Agent = (await import('@/models/Agent')).default;

    console.log('Querying Agent with:', {
        retellAgentId: agentId,
        workspaceId: workspace._id
    });

    const agent = await Agent.findOne({
        retellAgentId: agentId,
        workspaceId: workspace._id
    });

    console.log('Agent found:', agent?._id);

    if (!agent) {
        console.error('Agent not found in DB');
        notFound();
    }

    return (
        <PublicAgentTester
            agentId={agent.retellAgentId}
            agentName={agent.name || 'AI Assistant'}
        />
    );
}
