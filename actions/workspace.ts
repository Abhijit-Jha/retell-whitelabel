'use server';

import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Workspace from '@/models/Workspace';
import { auth } from '@clerk/nextjs/server';
import WorkspaceMember from '@/models/WorkspaceMember';

export async function getWorkspace() {
    console.log('[getWorkspace] Starting...');
    try {
        const { userId } = await auth();
        console.log(`[getWorkspace] Auth userId: ${userId}`);
        if (!userId) throw new Error('Unauthorized');

        await connectDB();
        console.log('[getWorkspace] DB Connected');

        const User = (await import('@/models/User')).default;
        const user = await User.findOne({ clerkId: userId });
        console.log(`[getWorkspace] User found: ${user?._id}`);
        if (!user) throw new Error('User not found');

        const membership = await WorkspaceMember.findOne({ userId: user._id }).populate('workspaceId');
        console.log(`[getWorkspace] Membership found: ${membership?._id}, Workspace: ${membership?.workspaceId?._id}`);
        if (!membership) throw new Error('No workspace found');

        // Convert to plain object to ensure we can modify it and it serializes correctly
        let workspace = JSON.parse(JSON.stringify(membership.workspaceId));

        // Patch: Generate slug if missing (for existing workspaces)
        if (!workspace.slug) {
            console.log('--- Patching Workspace Slug ---');
            const slug = workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
            console.log(`Generated slug: ${slug} for workspace: ${workspace._id}`);

            // Force update using NATIVE MongoDB driver to bypass Mongoose schema/validation completely
            console.log('Attempting native update for slug...');
            const result = await mongoose.connection.db?.collection('workspaces').updateOne(
                { _id: membership.workspaceId._id }, // Use the ID from the populated doc
                { $set: { slug: slug } }
            );

            console.log('Native update result:', result);

            if (result?.modifiedCount || result?.matchedCount) {
                console.log('Slug successfully saved to DB (native).');
                workspace.slug = slug;
            } else {
                console.error('FAILED TO SAVE SLUG TO DB (Native)');
                // Fallback: set it on the object anyway so the UI works for this request
                workspace.slug = slug;
            }
        }

        console.log('[getWorkspace] Returning workspace');
        return workspace;
    } catch (error) {
        console.error('[getWorkspace] Error:', error);
        throw error;
    }
}

export async function getWorkspaceBySlug(slug: string) {
    console.log(`--- getWorkspaceBySlug: ${slug} ---`);
    await connectDB();
    const WorkspaceModel = (await import('@/models/Workspace')).default; // Ensure fresh import

    // Debug: Check if any workspace exists
    const count = await WorkspaceModel.countDocuments();
    console.log(`Total workspaces in DB: ${count}`);

    const workspace = await WorkspaceModel.findOne({ slug });
    console.log('Found workspace:', workspace?._id);

    if (!workspace) {
        // Debug: list all slugs
        const all = await WorkspaceModel.find({}, 'slug name');
        console.log('Available workspaces:', all.map(w => ({ id: w._id, slug: w.slug, name: w.name })));
        throw new Error('Workspace not found');
    }
    return JSON.parse(JSON.stringify(workspace));
}
