'use server';

import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import WorkspaceMember from '@/models/WorkspaceMember';
import Workspace from '@/models/Workspace';
import Agent from '@/models/Agent';
import { decrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

import { getWorkspace } from './workspace';


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

export async function getAgent(agentId: string) {
    const workspace = await getWorkspace();
    if (!workspace.retellApiKey) throw new Error('Retell API Key not configured');
    const apiKey = decrypt(workspace.retellApiKey);

    try {
        const response = await fetch(`https://api.retellai.com/get-agent/${agentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Retell API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching agent:', error);
        throw new Error('Failed to fetch agent');
    }
}

export async function updateAgent(agentId: string, data: any) {
    const workspace = await getWorkspace();
    if (!workspace.retellApiKey) throw new Error('Retell API Key not configured');
    const apiKey = decrypt(workspace.retellApiKey);

    try {
        const response = await fetch(`https://api.retellai.com/update-agent/${agentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Retell API Error: ${response.statusText}`);
        }

        const updatedAgent = await response.json();

        // Sync to DB
        await connectDB();
        await Agent.findOneAndUpdate(
            { retellAgentId: agentId, workspaceId: workspace._id },
            {
                name: updatedAgent.agent_name,
                config: updatedAgent
            }
        );

        revalidatePath('/dashboard/agents');
        return updatedAgent;
    } catch (error: any) {
        console.error('Error updating agent:', error);
        throw new Error(error.message || 'Failed to update agent');
    }
}

export async function getRetellLLM(llmId: string) {
    const workspace = await getWorkspace();
    if (!workspace.retellApiKey) throw new Error('Retell API Key not configured');
    const apiKey = decrypt(workspace.retellApiKey);

    try {
        const response = await fetch(`https://api.retellai.com/get-retell-llm/${llmId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Retell API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching LLM:', error);
        throw new Error('Failed to fetch LLM');
    }
}

export async function updateRetellLLM(llmId: string, data: any) {
    const workspace = await getWorkspace();
    if (!workspace.retellApiKey) throw new Error('Retell API Key not configured');
    const apiKey = decrypt(workspace.retellApiKey);

    try {
        const response = await fetch(`https://api.retellai.com/update-retell-llm/${llmId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Retell API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error('Error updating LLM:', error);
        throw new Error(error.message || 'Failed to update LLM');
    }
}

export async function createWebCall(agentId: string) {
    console.log(`[createWebCall] Starting for agentId: ${agentId}`);
    try {
        console.log('[createWebCall] Fetching workspace...');
        const workspace = await getWorkspace();
        console.log(`[createWebCall] Workspace found: ${workspace._id}`);

        if (!workspace.retellApiKey) {
            console.error('[createWebCall] Retell API Key missing in workspace');
            throw new Error('Retell API Key not configured');
        }

        console.log('[createWebCall] Decrypting API key...');
        const apiKey = decrypt(workspace.retellApiKey);
        console.log('[createWebCall] API key decrypted (length: ' + apiKey.length + ')');

        console.log('[createWebCall] Calling Retell API...');
        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_id: agentId,
            }),
        });

        console.log(`[createWebCall] Retell API response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[createWebCall] Retell API failed: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Retell API Error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[createWebCall] Success');
        return data;
    } catch (error: any) {
        console.error('[createWebCall] Critical Error:', error);
        throw new Error(error.message || 'Failed to create web call');
    }
}

export async function createPublicWebCall(agentId: string) {
    // No auth check - public access
    await connectDB();
    const Agent = (await import('@/models/Agent')).default;
    const agent = await Agent.findOne({ retellAgentId: agentId });

    if (!agent) throw new Error('Agent not found');

    const Workspace = (await import('@/models/Workspace')).default;
    const workspace = await Workspace.findById(agent.workspaceId);

    if (!workspace || !workspace.retellApiKey) throw new Error('Workspace configuration missing');

    const apiKey = decrypt(workspace.retellApiKey);

    try {
        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_id: agentId,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Retell API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error('Error creating public web call:', error);
        throw new Error(error.message || 'Failed to create web call');
    }
}
