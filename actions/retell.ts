'use server';

import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import WorkspaceMember from '@/models/WorkspaceMember';
import Workspace from '@/models/Workspace';
import Agent from '@/models/Agent';
import { decrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

async function getWorkspace() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await connectDB();
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error('User not found');

    const membership = await WorkspaceMember.findOne({ userId: user._id }).populate('workspaceId');
    if (!membership) throw new Error('No workspace found');

    return membership.workspaceId as any;
}

export async function listRetellAgents() {
    const workspace = await getWorkspace();

    if (!workspace.retellApiKey) {
        throw new Error('Retell API Key not configured');
    }

    const apiKey = decrypt(workspace.retellApiKey);

    try {
        const response = await fetch('https://api.retellai.com/list-agents', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Retell API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data; // Assuming data is an array of agents or has a property with agents
    } catch (error) {
        console.error('Error fetching Retell agents:', error);
        throw new Error('Failed to fetch agents from Retell');
    }
}

export async function importAgent(agentData: any) {
    const workspace = await getWorkspace();

    // Check if already imported
    const existing = await Agent.findOne({
        workspaceId: workspace._id,
        retellAgentId: agentData.agent_id
    });

    if (existing) {
        return { success: false, message: 'Agent already imported' };
    }

    await Agent.create({
        workspaceId: workspace._id,
        retellAgentId: agentData.agent_id,
        name: agentData.agent_name || 'Unnamed Agent',
        status: 'active', // Default to active or fetch actual status
        config: agentData,
    });

    revalidatePath('/dashboard/agents');
    return { success: true };
}
